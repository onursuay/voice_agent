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
    const sortBy = params.get('sort_by') || 'created_at';
    const sortDir = params.get('sort_dir') === 'asc' ? true : false;
    const page = Math.max(1, parseInt(params.get('page') || '1', 10));
    const perPage = Math.min(500, Math.max(1, parseInt(params.get('per_page') || '25', 10)));

    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    let query = supabase
      .from('leads')
      .select('*, stage:crm_stages(*), assigned_user:profiles!leads_assigned_to_fkey(*)', { count: 'exact' })
      .eq('organization_id', orgId);

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%,company.ilike.%${search}%`);
    }
    if (stageId) query = query.eq('stage_id', stageId);
    if (sourcePlatform) query = query.eq('source_platform', sourcePlatform);
    if (assignedTo) query = query.eq('assigned_to', assignedTo);
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

    // Dedupe check within org
    let existingLead = null;
    if (phone) {
      const { data } = await supabase
        .from('leads')
        .select('*')
        .eq('organization_id', orgId)
        .eq('phone', phone)
        .single();
      if (data) existingLead = data;
    }
    if (!existingLead && email) {
      const { data } = await supabase
        .from('leads')
        .select('*')
        .eq('organization_id', orgId)
        .eq('email', email)
        .single();
      if (data) existingLead = data;
    }
    if (!existingLead && externalPlatformId) {
      const { data } = await supabase
        .from('leads')
        .select('*')
        .eq('organization_id', orgId)
        .eq('external_platform_id', externalPlatformId)
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
