import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
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

    const params = request.nextUrl.searchParams;
    const search = params.get('search') || '';
    const stageId = params.get('stage_id');
    const sourcePlatform = params.get('source_platform');
    const assignedTo = params.get('assigned_to');
    const tags = params.get('tags'); // comma-separated
    const importJobId = params.get('import_job_id');
    const metaPageId = params.get('meta_page_id'); // filter by connected Meta page/account
    const metaFormId = params.get('meta_form_id'); // filter by Meta Lead Form
    const sortBy = params.get('sort_by') || 'created_at';
    // Default (no explicit sort) = ascending on created_at, so the oldest leads
    // stay on top and newly-arriving leads append BELOW the filled rows instead
    // of jumping to the top. Explicit UI sorting still honours asc/desc.
    const sortDir = params.get('sort_dir') === 'desc' ? false : true;
    const page = Math.max(1, parseInt(params.get('page') || '1', 10));
    const perPage = Math.min(2000, Math.max(1, parseInt(params.get('per_page') || '25', 10)));
    // Varsayılan: Meta Custom Audience'e başarıyla senkronize (tamamlanmış) leadleri gizle.
    // hide_synced=false → hepsini göster.
    const hideSynced = params.get('hide_synced') !== 'false';
    // Çöp Kutusu modu: trash=true → yalnız silinmiş (deleted_at dolu) leadleri göster.
    const trash = params.get('trash') === 'true';

    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    let query = supabase
      .from('leads')
      .select('*, stage:crm_stages(*), assigned_user:profiles!leads_assigned_to_fkey(*)', { count: 'exact' })
      .eq('organization_id', orgId);

    // Soft-delete: normalde silinmişleri gizle; çöp modunda yalnız silinmişleri göster.
    if (trash) query = query.not('deleted_at', 'is', null);
    else query = query.is('deleted_at', null);

    if (search) {
      // PostgREST .or() filtre injection'ı önle: yapısal karakterleri boşlukla değiştir.
      const safe = search.replace(/[,()*:."\\]/g, ' ').trim();
      query = query.or(`full_name.ilike.%${safe}%,email.ilike.%${safe}%,phone.ilike.%${safe}%,company.ilike.%${safe}%`);
    }
    if (stageId) query = query.eq('stage_id', stageId);
    if (metaPageId) query = query.eq('meta_page_id', metaPageId);
    if (metaFormId) query = query.eq('meta_form_id', metaFormId);
    if (sourcePlatform) query = query.eq('source_platform', sourcePlatform);
    if (assignedTo) query = query.eq('assigned_to', assignedTo);
    // Senkronize-tamamlanmış leadleri gizle: meta_synced_at IS NULL OR meta_sync_error IS NOT NULL
    if (hideSynced) query = query.or('meta_synced_at.is.null,meta_sync_error.not.is.null');
    if (tags) {
      const tagList = tags.split(',').map(t => t.trim()).filter(Boolean);
      query = query.overlaps('tags', tagList);
    }
    if (importJobId) {
      const { data: activities } = await supabase
        .from('lead_activities')
        .select('lead_id')
        .eq('organization_id', orgId)
        .contains('metadata', { import_job_id: importJobId });
      const leadIds = [...new Set((activities || []).map((a: { lead_id: string }) => a.lead_id))];
      if (leadIds.length === 0) {
        return NextResponse.json({ leads: [], total: 0, page: 1, per_page: perPage });
      }
      query = query.in('id', leadIds);
    }

    // "Filtrele" panelinden gelen kolon filtreleri (JSON). Daha önce hiç uygulanmıyordu.
    // Grid kolon anahtarı → gerçek DB kolonu. Join/uuid kolonları (stage, assigned_to)
    // serbest-metin değerle güvenilir eşleşmediği için atlanır (sessizce).
    const filtersParam = params.get('filters');
    if (filtersParam) {
      try {
        const filters = JSON.parse(filtersParam) as Array<{ column: string; operator: string; value: string }>;
        const DB_COL: Record<string, string> = {
          full_name: 'full_name', email: 'email', phone: 'phone', company: 'company',
          city: 'city', campaign_name: 'campaign_name', source_platform: 'source_platform',
          routing_status: 'routing_status', score: 'score', tags: 'tags',
        };
        for (const f of (Array.isArray(filters) ? filters : [])) {
          const col = DB_COL[f?.column];
          if (!col) continue;
          const v = String(f.value ?? '').trim();
          if (col === 'tags') {
            if (f.operator === 'is_empty') query = query.eq('tags', '{}');
            else if (f.operator === 'is_not_empty') query = query.neq('tags', '{}');
            else if (!v) continue;
            else if (f.operator === 'not_contains') query = query.not('tags', 'cs', `{${v}}`);
            else if (f.operator === 'in') query = query.overlaps('tags', v.split(',').map(s => s.trim()).filter(Boolean));
            else query = query.overlaps('tags', [v]); // contains / eq → lead bu etikete sahip
            continue;
          }
          if (f.operator === 'is_empty') { query = query.or(`${col}.is.null,${col}.eq.`); continue; }
          if (f.operator === 'is_not_empty') { query = query.not(col, 'is', null).neq(col, ''); continue; }
          if (!v) continue;
          switch (f.operator) {
            case 'contains': query = query.ilike(col, `%${v}%`); break;
            case 'not_contains': query = query.not(col, 'ilike', `%${v}%`); break;
            case 'eq': query = col === 'score' ? query.eq(col, Number(v)) : query.ilike(col, v); break;
            case 'neq': query = query.neq(col, v); break;
            case 'in': query = query.in(col, v.split(',').map(s => s.trim()).filter(Boolean)); break;
            case 'gt': query = query.gt(col, Number(v)); break;
            case 'lt': query = query.lt(col, Number(v)); break;
            case 'gte': query = query.gte(col, Number(v)); break;
            case 'lte': query = query.lte(col, Number(v)); break;
          }
        }
      } catch { /* geçersiz filters paramı → yoksay */ }
    }

    query = query.order(sortBy, { ascending: sortDir }).range(from, to);

    const { data: leads, count, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({
      leads: leads || [],
      total: count || 0,
      page,
      per_page: perPage,
    });
  } catch (err) {
    console.error('GET /api/leads error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  // Strip non-digit except leading +
  const cleaned = phone.replace(/[^\d+]/g, '');
  return cleaned || null;
}

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
    const phone = normalizePhone(body.phone);
    const email = body.email?.trim().toLowerCase() || null;
    const externalPlatformId = body.external_platform_id || null;

    // Dedupe check within org (yalnız AKTİF leadler — çöptekiyle eşleşme yapma,
    // böylece silinip yeniden gelen lead taze/aktif olarak oluşturulur)
    let existingLead = null;
    if (phone) {
      const { data } = await supabase
        .from('leads')
        .select('*')
        .eq('organization_id', orgId)
        .eq('phone', phone)
        .is('deleted_at', null)
        .single();
      if (data) existingLead = data;
    }
    if (!existingLead && email) {
      const { data } = await supabase
        .from('leads')
        .select('*')
        .eq('organization_id', orgId)
        .eq('email', email)
        .is('deleted_at', null)
        .single();
      if (data) existingLead = data;
    }
    if (!existingLead && externalPlatformId) {
      const { data } = await supabase
        .from('leads')
        .select('*')
        .eq('organization_id', orgId)
        .eq('external_platform_id', externalPlatformId)
        .is('deleted_at', null)
        .single();
      if (data) existingLead = data;
    }

    if (existingLead) {
      // Merge: update only non-null new values over null existing values
      const mergeFields: Record<string, unknown> = {};
      const mergeable = [
        'first_name', 'last_name', 'full_name', 'company', 'job_title',
        'city', 'country', 'email', 'phone', 'campaign_name', 'ad_set_name',
        'ad_name', 'form_name', 'utm_source', 'utm_medium', 'utm_campaign',
        'utm_content', 'utm_term',
      ];
      for (const field of mergeable) {
        if (body[field] && !existingLead[field]) {
          mergeFields[field] = field === 'phone' ? phone : field === 'email' ? email : body[field];
        }
      }
      if (body.tags?.length) {
        const existingTags: string[] = existingLead.tags || [];
        const newTags = [...new Set([...existingTags, ...body.tags])];
        mergeFields.tags = newTags;
      }
      if (body.custom_fields) {
        mergeFields.custom_fields = { ...(existingLead.custom_fields || {}), ...body.custom_fields };
      }
      mergeFields.updated_at = new Date().toISOString();

      const { data: updated, error } = await supabase
        .from('leads')
        .update(mergeFields)
        .eq('id', existingLead.id)
        .select('*, stage:crm_stages(*), assigned_user:profiles!leads_assigned_to_fkey(*)')
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      // Activity log for merge
      await supabase.from('lead_activities').insert({
        lead_id: existingLead.id,
        organization_id: orgId,
        user_id: user.id,
        activity_type: 'merged',
        title: 'Lead data merged',
        description: `Duplicate detected and merged with existing lead.`,
        metadata: { merged_fields: Object.keys(mergeFields) },
      });

      return NextResponse.json(updated);
    }

    // Create new lead
    const newLead = {
      organization_id: orgId,
      phone,
      email,
      external_platform_id: externalPlatformId,
      first_name: body.first_name || null,
      last_name: body.last_name || null,
      full_name: body.full_name || null,
      company: body.company || null,
      job_title: body.job_title || null,
      city: body.city || null,
      country: body.country || null,
      stage_id: body.stage_id || null,
      assigned_to: body.assigned_to || null,
      score: body.score || 0,
      source_platform: body.source_platform || 'manual',
      campaign_name: body.campaign_name || null,
      ad_set_name: body.ad_set_name || null,
      ad_name: body.ad_name || null,
      form_name: body.form_name || null,
      utm_source: body.utm_source || null,
      utm_medium: body.utm_medium || null,
      utm_campaign: body.utm_campaign || null,
      utm_content: body.utm_content || null,
      utm_term: body.utm_term || null,
      tags: body.tags || [],
      custom_fields: body.custom_fields || {},
      notes_count: 0,
      activities_count: 0,
      first_seen_at: new Date().toISOString(),
    };

    const { data: created, error } = await supabase
      .from('leads')
      .insert(newLead)
      .select('*, stage:crm_stages(*), assigned_user:profiles!leads_assigned_to_fkey(*)')
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Activity log
    await supabase.from('lead_activities').insert({
      lead_id: created.id,
      organization_id: orgId,
      user_id: user.id,
      activity_type: 'created',
      title: 'Lead created',
      description: null,
      metadata: { source_platform: newLead.source_platform },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error('POST /api/leads error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
