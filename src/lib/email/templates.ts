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

// Manuel atama bildirimi (lead tablosu/detayından "Atanan" değişince)
export const ASSIGNMENT_TEMPLATE: RenderableTemplate = {
  subject: 'Size lead atandı: {{full_name}}',
  body:
    '<h2>Size yeni bir lead atandı</h2>' +
    '<p><b>Ad Soyad:</b> {{full_name}}</p>' +
    '<p><b>Telefon:</b> {{phone}}</p>' +
    '<p><b>E-posta:</b> {{email}}</p>' +
    '<p><b>Şehir:</b> {{city}}</p>' +
    '<p><b>Kaynak:</b> {{source}}</p>' +
    '<p>Lütfen en kısa sürede iletişime geçin.</p>',
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

// Lead değerleri dış kaynaktan gelir (güvenilmez). Şablonun KENDİ HTML'i korunur;
// yalnızca {{değişken}} ile gömülen değerler kaçışlanır (HTML/e-posta injection'a karşı).
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function renderTemplate(
  tpl: RenderableTemplate,
  vars: Record<string, string>
): { subject: string; html: string } {
  // Subject düz metin: CR/LF temizle (header injection'a karşı). Body: HTML-escape.
  const subjectSub = (s: string) =>
    s.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => (vars[k] ?? '-').replace(/[\r\n]+/g, ' '));
  const bodySub = (s: string) =>
    s.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => escapeHtml(vars[k] ?? '-'));
  return { subject: subjectSub(tpl.subject), html: bodySub(tpl.body) };
}
