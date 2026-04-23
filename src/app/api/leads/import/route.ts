import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: membership } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();
    if (!membership) return NextResponse.json({ error: 'No organization' }, { status: 403 });

    const admin = createAdminSupabaseClient();
    const { data: imports, error } = await admin
      .from('import_jobs')
      .select('id, file_name, status, total_rows, created_rows, updated_rows, skipped_rows, error_rows, created_at, column_mapping')
      .eq('organization_id', membership.organization_id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ imports: imports || [] });
  } catch (err) {
    console.error('GET /api/leads/import error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
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
    const { rows, file_name } = body;

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'rows array is required' }, { status: 400 });
    }

    // Create import job record
    const { data: importJob, error: jobError } = await supabase
      .from('import_jobs')
      .insert({
        organization_id: orgId,
        user_id: user.id,
        file_name: file_name || 'unknown',
        status: 'processing',
        total_rows: rows.length,
        processed_rows: 0,
        created_rows: 0,
        updated_rows: 0,
        skipped_rows: 0,
        error_rows: 0,
        errors: [],
        column_mapping: {},
        started_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (jobError) return NextResponse.json({ error: jobError.message }, { status: 500 });

    let createdRows = 0;
    let updatedRows = 0;
    let skippedRows = 0;
    let errorRows = 0;
    const errors: Array<{ row: number; message: string }> = [];

    for (let i = 0; i < rows.length; i++) {
      try {
        const row = rows[i];
        const phone = normalizePhone(row.phone);
        const email = row.email?.trim().toLowerCase() || null;

        // Must have at least phone or email
        if (!phone && !email) {
          skippedRows++;
          errors.push({ row: i + 1, message: 'Telefon veya e-posta gerekli' });
          continue;
        }

        // Dedupe check
        let existingLead = null;
        if (phone) {
          const { data } = await supabase
            .from('leads')
            .select('id, tags, custom_fields, notes_count, first_name, last_name')
            .eq('organization_id', orgId)
            .eq('phone', phone)
            .single();
          if (data) existingLead = data;
        }
        if (!existingLead && email) {
          const { data } = await supabase
            .from('leads')
            .select('id, tags, custom_fields, notes_count, first_name, last_name')
            .eq('organization_id', orgId)
            .eq('email', email)
            .single();
          if (data) existingLead = data;
        }

        if (existingLead) {
          // Update existing lead with new data (non-null fields only)
          const updateFields: Record<string, unknown> = {};
          const fieldKeys = [
            'first_name', 'last_name', 'full_name', 'company', 'job_title',
            'city', 'country', 'campaign_name', 'ad_set_name', 'ad_name',
            'form_name', 'utm_source', 'utm_medium', 'utm_campaign',
          ];
          for (const key of fieldKeys) {
            if (row[key]) updateFields[key] = row[key];
          }
          if (phone) updateFields.phone = phone;
          if (email) updateFields.email = email;
          if (row.tags) {
            const existingTags: string[] = existingLead.tags || [];
            const newTagsRaw = typeof row.tags === 'string' ? row.tags.split(',').map((t: string) => t.trim()) : row.tags;
            updateFields.tags = [...new Set([...existingTags, ...newTagsRaw])];
          }
          if (row.score !== undefined) updateFields.score = Number(row.score);
          if (!row.full_name && (row.first_name || row.last_name)) {
            updateFields.full_name = [updateFields.first_name || existingLead.first_name, updateFields.last_name || existingLead.last_name].filter(Boolean).join(' ') || undefined;
          }
          updateFields.updated_at = new Date().toISOString();

          await supabase.from('leads').update(updateFields).eq('id', existingLead.id);

          await supabase.from('lead_activities').insert({
            lead_id: existingLead.id,
            organization_id: orgId,
            user_id: user.id,
            activity_type: 'imported',
            title: 'Updated via import',
            description: `File: ${file_name || 'unknown'}`,
            metadata: { import_job_id: importJob.id, row_index: i },
          });

          updatedRows++;
        } else {
          // Create new lead
          const tags = row.tags
            ? (typeof row.tags === 'string' ? row.tags.split(',').map((t: string) => t.trim()) : row.tags)
            : [];

          const { data: newLead, error: leadError } = await supabase
            .from('leads')
            .insert({
              organization_id: orgId,
              phone,
              email,
              first_name: row.first_name || null,
              last_name: row.last_name || null,
              full_name: row.full_name || [row.first_name, row.last_name].filter(Boolean).join(' ') || null,
              company: row.company || null,
              job_title: row.job_title || null,
              city: row.city || null,
              country: row.country || null,
              source_platform: row.source_platform || 'import',
              campaign_name: row.campaign_name || null,
              ad_set_name: row.ad_set_name || null,
              ad_name: row.ad_name || null,
              form_name: row.form_name || null,
              utm_source: row.utm_source || null,
              utm_medium: row.utm_medium || null,
              utm_campaign: row.utm_campaign || null,
              tags,
              score: row.score ? Number(row.score) : 0,
              custom_fields: {},
              notes_count: 0,
              activities_count: 0,
              first_seen_at: new Date().toISOString(),
            })
            .select('id')
            .single();

          if (leadError) {
            errorRows++;
            errors.push({ row: i + 1, message: leadError.message });
            continue;
          }

          await supabase.from('lead_activities').insert({
            lead_id: newLead.id,
            organization_id: orgId,
            user_id: user.id,
            activity_type: 'imported',
            title: 'Import ile oluşturuldu',
            description: `Dosya: ${file_name || 'unknown'}`,
            metadata: { import_job_id: importJob.id, row_index: i },
          });

          createdRows++;
        }
      } catch (rowErr) {
        errorRows++;
        errors.push({ row: i + 1, message: String(rowErr) });
      }
    }

    // Update import job with final stats
    const { data: finalJob } = await supabase
      .from('import_jobs')
      .update({
        status: errorRows === rows.length ? 'failed' : 'completed',
        processed_rows: rows.length,
        created_rows: createdRows,
        updated_rows: updatedRows,
        skipped_rows: skippedRows,
        error_rows: errorRows,
        errors,
        completed_at: new Date().toISOString(),
      })
      .eq('id', importJob.id)
      .select()
      .single();

    return NextResponse.json(finalJob);
  } catch (err) {
    console.error('POST /api/leads/import error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
