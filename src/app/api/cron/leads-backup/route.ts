import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';

export const maxDuration = 60;

// Org başına TÜM lead'leri (aktif + çöptekiler dahil) sayfalı çeker.
async function fetchAllLeads(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
  orgId: string
) {
  const PAGE = 1000;
  const all: Record<string, unknown>[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
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

// Vercel Cron (günde 1) — her org'un tüm lead'lerinin tam JSON anlık görüntüsünü
// lead_backups'a yazar. Felaket/kötü-niyet senaryosunda buradan geri yüklenir.
// Eski "daily" yedekler 60 günden sonra budanır (kaynak veri etkilenmez; bunlar
// türetilmiş kopyalar). "manual" yedekler süresiz saklanır.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminSupabaseClient();

  // Tek-şirket: DEFAULT_ORG_ID set ise yalnız o org; değilse tüm org'lar.
  const defaultOrg = process.env.DEFAULT_ORG_ID?.trim();
  let orgIds: string[] = [];
  if (defaultOrg) {
    orgIds = [defaultOrg];
  } else {
    const { data: orgs } = await supabase.from('organizations').select('id');
    orgIds = (orgs || []).map((o: { id: string }) => o.id);
  }

  let backedUp = 0;
  let totalLeads = 0;
  const errors: Array<{ org: string; message: string }> = [];

  for (const orgId of orgIds) {
    try {
      const leads = await fetchAllLeads(supabase, orgId);
      // Boş org için de yedek almak gereksiz değil — silme sonrası "0 lead" durumu
      // da meşru bir anlık görüntü; ancak hiç lead'i olmamış org'ları atla.
      if (leads.length === 0) continue;

      const { error: insErr } = await supabase.from('lead_backups').insert({
        organization_id: orgId,
        reason: 'daily',
        lead_count: leads.length,
        payload: leads,
      });
      if (insErr) throw new Error(insErr.message);

      backedUp++;
      totalLeads += leads.length;

      // Retention: 60 günden eski "daily" yedekleri buda.
      const cutoff = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
      await supabase
        .from('lead_backups')
        .delete()
        .eq('organization_id', orgId)
        .eq('reason', 'daily')
        .lt('taken_at', cutoff);
    } catch (e) {
      errors.push({ org: orgId, message: e instanceof Error ? e.message : String(e) });
    }
  }

  return NextResponse.json({ ok: true, orgs: orgIds.length, backedUp, totalLeads, errors });
}
