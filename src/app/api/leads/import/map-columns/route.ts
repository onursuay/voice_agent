import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import OpenAI from 'openai';

const CRM_FIELDS = [
  { value: 'first_name', label: 'First Name / Ad' },
  { value: 'last_name', label: 'Last Name / Soyad' },
  { value: 'full_name', label: 'Full Name / Ad Soyad' },
  { value: 'email', label: 'Email / E-posta' },
  { value: 'phone', label: 'Phone / Telefon' },
  { value: 'company', label: 'Company / Şirket' },
  { value: 'job_title', label: 'Job Title / Ünvan' },
  { value: 'city', label: 'City / Şehir' },
  { value: 'country', label: 'Country / Ülke' },
  { value: 'source_platform', label: 'Source Platform / Kaynak' },
  { value: 'campaign_name', label: 'Campaign Name / Kampanya' },
  { value: 'ad_set_name', label: 'Ad Set Name / Reklam Seti' },
  { value: 'ad_name', label: 'Ad Name / Reklam' },
  { value: 'form_name', label: 'Form Name / Form Adı' },
  { value: 'utm_source', label: 'UTM Source' },
  { value: 'utm_medium', label: 'UTM Medium' },
  { value: 'utm_campaign', label: 'UTM Campaign' },
  { value: 'tags', label: 'Tags / Etiketler' },
  { value: 'score', label: 'Score / Skor' },
  { value: 'date', label: 'Date / Tarih' },
  { value: 'external_id', label: 'External ID / Dış ID' },
];

// Basic AUTO_MAP for common patterns (avoid unnecessary AI calls)
const AUTO_MAP: Record<string, string> = {
  email: 'email', 'e-posta': 'email', 'e posta': 'email', eposta: 'email', mail: 'email',
  telefon: 'phone', phone: 'phone', tel: 'phone', gsm: 'phone', cep: 'phone',
  'telefon numarasi': 'phone', 'cep telefonu': 'phone', 'phone number': 'phone', mobile: 'phone',
  ad: 'first_name', adi: 'first_name', isim: 'first_name', first_name: 'first_name', firstname: 'first_name', 'first name': 'first_name',
  soyad: 'last_name', soyadi: 'last_name', last_name: 'last_name', lastname: 'last_name', surname: 'last_name',
  'ad soyad': 'full_name', full_name: 'full_name', fullname: 'full_name', name: 'full_name',
  sirket: 'company', company: 'company', firma: 'company',
  unvan: 'job_title', title: 'job_title', job_title: 'job_title', pozisyon: 'job_title',
  sehir: 'city', city: 'city', il: 'city',
  ulke: 'country', country: 'country',
  kampanya: 'campaign_name', campaign: 'campaign_name', campaign_name: 'campaign_name',
  kaynak: 'source_platform', source: 'source_platform',
  etiket: 'tags', tags: 'tags', etiketler: 'tags',
  skor: 'score', score: 'score', puan: 'score',
  tarih: 'date', date: 'date', 'created at': 'date', created_at: 'date', 'created time': 'date',
  id: 'external_id', 'lead id': 'external_id', external_id: 'external_id',
  utm_source: 'utm_source', utm_medium: 'utm_medium', utm_campaign: 'utm_campaign',
};

function normalizeTr(s: string): string {
  return s.toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[_\-]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function tryAutoMap(header: string): string | null {
  const raw = header.trim().toLowerCase().replace(/[_\-]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (AUTO_MAP[raw]) return AUTO_MAP[raw];
  const norm = normalizeTr(header);
  if (AUTO_MAP[norm]) return AUTO_MAP[norm];
  const collapsed = norm.replace(/\s+/g, '_');
  if (AUTO_MAP[collapsed]) return AUTO_MAP[collapsed];
  const noSpace = norm.replace(/\s+/g, '');
  if (AUTO_MAP[noSpace]) return AUTO_MAP[noSpace];
  return null;
}

function detectFromValues(values: string[]): string | null {
  const samples = values.filter(Boolean);
  if (!samples.length) return null;
  const threshold = Math.ceil(samples.length * 0.5);
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const dateRe = /^\d{4}[-\/]\d{2}[-\/]\d{2}/;
  if (samples.filter(v => emailRe.test(v.trim())).length >= threshold) return 'email';
  if (samples.filter(v => dateRe.test(v.trim())).length >= threshold) return 'date';
  const phoneCount = samples.filter(v => {
    const clean = v.replace(/[\s\-\(\)]/g, '');
    return /^\+?[\d]{7,15}$/.test(clean);
  }).length;
  if (phoneCount >= threshold) return 'phone';
  const largeNum = samples.filter(v => /^\d{8,}$/.test(v.replace(/\s/g, ''))).length;
  if (largeNum >= threshold) {
    const phonePrefix = samples.filter(v => /^(90|1|44|49|33|7)\d{9,11}$/.test(v.replace(/\s/g, ''))).length;
    return phonePrefix >= threshold ? 'phone' : 'external_id';
  }
  return null;
}

export async function POST(request: NextRequest) {
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
    const orgId = membership.organization_id;

    const body = await request.json();
    const { headers, sampleRows } = body as {
      headers: string[];
      sampleRows: Record<string, string>[];
    };

    const admin = createAdminSupabaseClient();

    // Load org's learned mappings
    const { data: learnedRows } = await admin
      .from('column_learnings')
      .select('header_normalized, crm_field')
      .eq('organization_id', orgId);

    const learnedMap: Record<string, string> = {};
    (learnedRows || []).forEach((r: { header_normalized: string; crm_field: string }) => {
      learnedMap[r.header_normalized] = r.crm_field;
    });

    // Phase 1: classify each header
    const result: Record<string, { crmField: string; source: 'auto' | 'learned' | 'ai' | 'skip' }> = {};
    const needsAI: string[] = [];

    for (const header of headers) {
      const norm = normalizeTr(header);

      // Check learned mappings first
      if (learnedMap[norm]) {
        result[header] = { crmField: learnedMap[norm], source: 'learned' };
        continue;
      }

      // Try rule-based auto map
      const auto = tryAutoMap(header);
      if (auto) {
        result[header] = { crmField: auto, source: 'auto' };
        continue;
      }

      // Try content-based detection
      const samples = sampleRows.map(r => r[header]).filter(Boolean);
      const fromValues = detectFromValues(samples);
      if (fromValues) {
        result[header] = { crmField: fromValues, source: 'auto' };
        continue;
      }

      // Needs AI
      needsAI.push(header);
      result[header] = { crmField: '_skip', source: 'skip' };
    }

    // Phase 2: ask OpenAI for unknowns
    if (needsAI.length > 0 && process.env.OPENAI_API_KEY) {
      try {
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

        const headerDetails = needsAI.map(h => {
          const samples = sampleRows.slice(0, 3).map(r => r[h]).filter(Boolean);
          return `- "${h}" → sample values: [${samples.map(s => `"${s}"`).join(', ')}]`;
        }).join('\n');

        const fieldList = CRM_FIELDS.map(f => `${f.value} (${f.label})`).join(', ');

        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          temperature: 0,
          messages: [
            {
              role: 'system',
              content: `You are a CRM data mapping expert. Map spreadsheet column headers to CRM fields.
Available CRM fields: ${fieldList}, _skip (if no match).
Return ONLY a valid JSON object like: {"COLUMN_NAME": "crm_field_value"}
No explanation, no markdown, just the JSON.`,
            },
            {
              role: 'user',
              content: `Map these columns to CRM fields:\n${headerDetails}`,
            },
          ],
        });

        const raw = completion.choices[0]?.message?.content?.trim() || '{}';
        // Strip markdown code blocks if present
        const cleaned = raw.replace(/^```json?\n?/, '').replace(/\n?```$/, '').trim();
        const aiMapping: Record<string, string> = JSON.parse(cleaned);

        const newLearnings: Array<{ organization_id: string; header_normalized: string; crm_field: string }> = [];

        for (const header of needsAI) {
          const mapped = aiMapping[header];
          if (mapped && mapped !== '_skip' && CRM_FIELDS.find(f => f.value === mapped)) {
            result[header] = { crmField: mapped, source: 'ai' };
            const norm = normalizeTr(header);
            if (!learnedMap[norm]) {
              newLearnings.push({ organization_id: orgId, header_normalized: norm, crm_field: mapped });
            }
          }
        }

        // Save new learnings
        if (newLearnings.length > 0) {
          await admin.from('column_learnings').upsert(newLearnings, {
            onConflict: 'organization_id,header_normalized',
          });
        }
      } catch (aiErr) {
        console.error('AI mapping error:', aiErr);
        // Continue without AI — already have partial results
      }
    }

    return NextResponse.json({ mapping: result });
  } catch (err) {
    console.error('map-columns error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
