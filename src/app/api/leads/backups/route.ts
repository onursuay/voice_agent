import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';

type AdminClient = ReturnType<typeof createAdminSupabaseClient>;

// Snapshot helper — org'un TÜM lead'lerini (aktif + çöp) sayfalı çeker.
async function snapshotLeads(admin: AdminClient, orgId: string) {
  const PAGE = 1000;
  const all: Record<string, unknown>[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await admin
      .from('leads')
      .select('*')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    const rows = data || [];
    all.push(...rows);
    if (rows.length < PAGE) break;
  }
  return all;
}

// FK-güvenli toplu insert: önce olduğu gibi dener; FK hatasında riskli referans
// kolonlarını (stage_id/assigned_to/routing_rule_id) null'layıp tekrar dener, böylece
// silinmiş aşama/kullanıcıya işaret eden eski snapshot satırları yine de geri gelir.
async function insertLeadsFkSafe(admin: AdminClient, rows: Record<string, unknown>[]) {
  let inserted = 0;
  const CHUNK = 200;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    const { error } = await admin.from('leads').insert(chunk);
    if (!error) { inserted += chunk.length; continue; }
    // FK fallback
    const sanitized = chunk.map((r) => ({ ...r, stage_id: null, assigned_to: null, routing_rule_id: null }));
    const { error: err2 } = await admin.from('leads').insert(sanitized);
    if (!err2) { inserted += sanitized.length; continue; }
    // Son çare: satır satır (bir kötü satır tüm chunk'ı düşürmesin)
    for (const r of sanitized) {
      const { error: err3 } = await admin.from('leads').insert(r);
      if (!err3) inserted++;
    }
  }
  return inserted;
}

// GET — org'un yedeklerini listeler (payload HARİÇ, hafif).
export async function GET(_request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: membership } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();
    if (!membership) return NextResponse.json({ error: 'No organization' }, { status: 403 });

    const admin = createAdminSupabaseClient();
    const { data, error } = await admin
      .from('lead_backups')
      .select('id, taken_at, reason, lead_count')
      .eq('organization_id', membership.organization_id)
      .order('taken_at', { ascending: false })
      .limit(120);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ backups: data || [] });
  } catch (err) {
    console.error('GET /api/leads/backups error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST — { action: 'backup' } anında manuel yedek; { action: 'restore', backup_id }
// bir yedekten KAYIP/çöpteki lead'leri geri getirir (mevcut aktif lead'leri EZMEZ).
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: membership } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();
    if (!membership) return NextResponse.json({ error: 'No organization' }, { status: 403 });
    const orgId = membership.organization_id;

    const body = await request.json();
    const action = body?.action;
    const admin = createAdminSupabaseClient();

    if (action === 'backup') {
      const leads = await snapshotLeads(admin, orgId);
      const { error } = await admin.from('lead_backups').insert({
        organization_id: orgId,
        reason: 'manual',
        lead_count: leads.length,
        payload: leads,
      });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true, lead_count: leads.length });
    }

    if (action === 'restore') {
      // Geri yükleme güçlü bir işlem → yalnız owner.
      if (membership.role !== 'owner') {
        return NextResponse.json({ error: 'Only owners can restore backups' }, { status: 403 });
      }
      const backupId = body?.backup_id;
      if (!backupId) return NextResponse.json({ error: 'backup_id is required' }, { status: 400 });

      const { data: backup, error: bErr } = await admin
        .from('lead_backups')
        .select('id, payload')
        .eq('id', backupId)
        .eq('organization_id', orgId)
        .single();
      if (bErr || !backup) return NextResponse.json({ error: 'Backup not found' }, { status: 404 });

      const payload = (backup.payload as Record<string, unknown>[]) || [];

      // Güvenlik: geri yüklemeden ÖNCE mevcut durumun anlık yedeğini al (geri alınabilir).
      const current = await snapshotLeads(admin, orgId);
      await admin.from('lead_backups').insert({
        organization_id: orgId,
        reason: 'pre_restore',
        lead_count: current.length,
        payload: current,
      });

      const currentById = new Map(current.map((l) => [l.id as string, l]));

      const toInsert: Record<string, unknown>[] = [];
      const toUndelete: string[] = [];
      for (const row of payload) {
        const id = row.id as string;
        const existing = currentById.get(id);
        if (!existing) {
          toInsert.push(row); // tamamen kaybolmuş → geri ekle
        } else if (existing.deleted_at && !row.deleted_at) {
          toUndelete.push(id); // çöpteydi ama yedekte aktifti → çöpten çıkar
        }
        // Mevcut + aktif lead'lere DOKUNMA (kullanıcının güncel verisini ezme).
      }

      const inserted = toInsert.length ? await insertLeadsFkSafe(admin, toInsert) : 0;

      let undeleted = 0;
      if (toUndelete.length) {
        const CHUNK = 200;
        for (let i = 0; i < toUndelete.length; i += CHUNK) {
          const ids = toUndelete.slice(i, i + CHUNK);
          const { error } = await admin
            .from('leads')
            .update({ deleted_at: null, deleted_by: null })
            .eq('organization_id', orgId)
            .in('id', ids);
          if (!error) undeleted += ids.length;
        }
      }

      return NextResponse.json({ ok: true, inserted, undeleted, restored: inserted + undeleted });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (err) {
    console.error('POST /api/leads/backups error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
