import { NextRequest, NextResponse } from 'next/server';
import { ingestLead, resolveLeadIngestionOrganization, type IngestionLeadSource } from '@/lib/leads/ingest';

type ZapierLeadPayload = {
  full_name?: string;
  email?: string;
  phone?: string;
  form_name?: string;
  meta_lead_id?: string;
  meta_form_id?: string;
  meta_page_id?: string;
  meta_ad_id?: string;
  source?: string;
  raw_payload?: unknown;
};

function mapZapierSource(source: string | undefined): IngestionLeadSource {
  if (source === 'meta_lead_form' || source === 'manual') return source;
  return 'zapier';
}

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-zapier-secret');
  if (!process.env.ZAPIER_INGEST_SECRET || secret !== process.env.ZAPIER_INGEST_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: ZapierLeadPayload;
  try {
    body = (await request.json()) as ZapierLeadPayload;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const organizationId = await resolveLeadIngestionOrganization('zapier_leads');
  if (!organizationId) {
    return NextResponse.json({ error: 'Lead ingestion organization is not configured' }, { status: 500 });
  }

  try {
    const result = await ingestLead({
      organizationId,
      provider: 'zapier_leads',
      eventType: 'lead_forwarded',
      eventExternalId: body.meta_lead_id || body.email || body.phone || null,
      payload: body,
      source: mapZapierSource(body.source),
      metaLeadId: body.meta_lead_id || null,
      metaFormId: body.meta_form_id || null,
      metaPageId: body.meta_page_id || null,
      metaAdId: body.meta_ad_id || null,
      fullName: body.full_name || null,
      email: body.email || null,
      phone: body.phone || null,
      formName: body.form_name || null,
      rawPayload: body.raw_payload ?? body,
    });

    return NextResponse.json({
      success: true,
      action: result.action,
      lead_id: result.lead.id,
    });
  } catch (error) {
    console.error('[zapier_leads] Ingestion failed', error);
    return NextResponse.json({ error: 'Lead ingestion failed' }, { status: 500 });
  }
}
