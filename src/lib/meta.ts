// ============================================
// DijiGrow - Meta Lead Form Helpers
// ============================================

export interface ParsedLeadFields {
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  company: string | null;
  job_title: string | null;
  custom_fields: Record<string, string>;
}

type MappedKey = keyof Omit<ParsedLeadFields, 'custom_fields'>;

/**
 * Normalize a Meta field name for matching: lowercase, trim, and collapse all
 * separators (spaces, hyphens, dots, slashes) into single underscores.
 * e.g. "E-posta Adresi" -> "e_posta_adresi", "telefon-numarasi" -> "telefon_numarasi"
 */
function normalizeFieldName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    // Fold Turkish characters to ASCII so "Adınız"/"Şehir" match map keys
    .replace(/ı/g, 'i')
    .replace(/ş/g, 's')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[\s\-./]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

/**
 * Field name mapping for Meta Lead Form fields.
 * Maps both English and Turkish field names (in normalized form) to lead keys.
 * Keys MUST be in normalizeFieldName() form (lowercase, underscore-separated).
 */
const FIELD_NAME_MAP: Record<string, MappedKey> = {
  // Full name
  full_name: 'full_name',
  fullname: 'full_name',
  name: 'full_name',
  ad_soyad: 'full_name',
  adsoyad: 'full_name',
  ad_ve_soyad: 'full_name',
  isim_soyisim: 'full_name',
  isim_soyad: 'full_name',
  // First name
  first_name: 'first_name',
  firstname: 'first_name',
  ad: 'first_name',
  adi: 'first_name',
  adiniz: 'first_name',
  isim: 'first_name',
  isminiz: 'first_name',
  // Last name
  last_name: 'last_name',
  lastname: 'last_name',
  surname: 'last_name',
  soyad: 'last_name',
  soyadi: 'last_name',
  soyadiniz: 'last_name',
  soyisim: 'last_name',
  soyisminiz: 'last_name',
  // Email
  email: 'email',
  e_mail: 'email',
  mail: 'email',
  e_posta: 'email',
  eposta: 'email',
  email_adresi: 'email',
  e_posta_adresi: 'email',
  eposta_adresi: 'email',
  mail_adresi: 'email',
  // Phone
  phone_number: 'phone',
  phone: 'phone',
  telefon: 'phone',
  tel: 'phone',
  telefon_numarasi: 'phone',
  telefon_no: 'phone',
  telefon_numaraniz: 'phone',
  gsm: 'phone',
  gsm_no: 'phone',
  cep: 'phone',
  cep_telefonu: 'phone',
  cep_no: 'phone',
  mobil: 'phone',
  mobil_telefon: 'phone',
  mobile: 'phone',
  mobile_number: 'phone',
  // City
  city: 'city',
  sehir: 'city',
  il: 'city',
  // Company
  company_name: 'company',
  company: 'company',
  sirket: 'company',
  firma: 'company',
  // Job title
  job_title: 'job_title',
  unvan: 'job_title',
  pozisyon: 'job_title',
};

/**
 * Fallback classifier for field names not present in FIELD_NAME_MAP.
 * Uses ordered substring/pattern matching so future custom Meta forms with
 * unexpected field names still land in the right column instead of being lost.
 * Order matters: more specific / collision-prone checks come first.
 */
function fuzzyClassifyField(normalized: string): MappedKey | null {
  const n = normalized;
  if (/mail|eposta|e_posta/.test(n)) return 'email';
  if (/telefon|phone|gsm|cep|mobil|^tel$|_tel$|^tel_/.test(n)) return 'phone';
  if (/ad_?soyad|adsoyad|full_?name|isim_?soy|ad_ve_soyad/.test(n)) return 'full_name';
  if (/soyad|soyisim|surname|last_?name/.test(n)) return 'last_name';
  if (/^ad$|^adi|adiniz|^isim|isminiz|first_?name|^ad_/.test(n)) return 'first_name';
  if (/sehir|^il$|city/.test(n)) return 'city';
  if (/sirket|firma|company/.test(n)) return 'company';
  if (/unvan|pozisyon|job|title/.test(n)) return 'job_title';
  return null;
}

/**
 * Parse Meta Lead Form field_data array into a structured object.
 */
export function parseMetaLeadFields(
  field_data: Array<{ name: string; values: string[] }>
): ParsedLeadFields {
  const result: ParsedLeadFields = {
    first_name: null,
    last_name: null,
    full_name: null,
    email: null,
    phone: null,
    city: null,
    company: null,
    job_title: null,
    custom_fields: {},
  };

  for (const field of field_data) {
    const value = field.values?.[0]?.trim() || '';
    if (!value) continue;

    const normalizedName = normalizeFieldName(field.name);
    const mappedKey = FIELD_NAME_MAP[normalizedName] ?? fuzzyClassifyField(normalizedName);

    if (mappedKey) {
      // First non-empty value wins; don't let a later field clobber it
      if (!result[mappedKey]) result[mappedKey] = value;
    } else {
      result.custom_fields[field.name] = value;
    }
  }

  // If full_name is not set but first_name/last_name are, compose it
  if (!result.full_name && (result.first_name || result.last_name)) {
    result.full_name = [result.first_name, result.last_name].filter(Boolean).join(' ');
  }

  // If full_name is set but first/last are not, try to split
  if (result.full_name && !result.first_name && !result.last_name) {
    const parts = result.full_name.split(/\s+/);
    if (parts.length >= 2) {
      result.first_name = parts[0];
      result.last_name = parts.slice(1).join(' ');
    } else {
      result.first_name = result.full_name;
    }
  }

  return result;
}
