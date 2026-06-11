export interface RenderableTemplate {
  subject: string;
  body: string; // HTML, {{var}} placeholder'ları içerir
}

export const DEFAULT_ROUTING_TEMPLATE: RenderableTemplate = {
  subject: 'Yeni lead: {{full_name}} — {{city}}',
  body:
    '<h2>Yeni lead atandı</h2>' +
    '<p><b>Ad Soyad:</b> {{full_name}}</p>' +
    '<p><b>Telefon:</b> {{phone}}</p>' +
    '<p><b>E-posta:</b> {{email}}</p>' +
    '<p><b>Şehir:</b> {{city}}</p>' +
    '<p><b>Kaynak:</b> {{source}}</p>',
};

export type LeadLike = {
  full_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  email?: string | null;
  city?: string | null;
  company?: string | null;
  source_platform?: string | null;
  campaign_name?: string | null;
};

export function leadToVars(lead: LeadLike): Record<string, string> {
  return {
    full_name: lead.full_name || [lead.first_name, lead.last_name].filter(Boolean).join(' ') || '-',
    first_name: lead.first_name || '-',
    last_name: lead.last_name || '-',
    phone: lead.phone || '-',
    email: lead.email || '-',
    city: lead.city || '-',
    company: lead.company || '-',
    source: lead.source_platform || '-',
    campaign: lead.campaign_name || '-',
  };
}

export function renderTemplate(
  tpl: RenderableTemplate,
  vars: Record<string, string>
): { subject: string; html: string } {
  const sub = (s: string) => s.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => vars[k] ?? '-');
  return { subject: sub(tpl.subject), html: sub(tpl.body) };
}
