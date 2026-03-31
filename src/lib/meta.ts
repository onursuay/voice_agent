// ============================================
// YO DIJITAL - Meta Lead Form Helpers
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

/**
 * Field name mapping for Meta Lead Form fields.
 * Maps both English and Turkish field names to normalized keys.
 */
const FIELD_NAME_MAP: Record<string, keyof Omit<ParsedLeadFields, 'custom_fields'>> = {
  // Full name
  full_name: 'full_name',
  ad_soyad: 'full_name',
  'ad soyad': 'full_name',
  // First name
  first_name: 'first_name',
  ad: 'first_name',
  // Last name
  last_name: 'last_name',
  soyad: 'last_name',
  // Email
  email: 'email',
  'e-posta': 'email',
  e_posta: 'email',
  // Phone
  phone_number: 'phone',
  telefon: 'phone',
  phone: 'phone',
  tel: 'phone',
  // City
  city: 'city',
  sehir: 'city',
  'şehir': 'city',
  il: 'city',
  // Company
  company_name: 'company',
  company: 'company',
  sirket: 'company',
  'şirket': 'company',
  firma: 'company',
  // Job title
  job_title: 'job_title',
  unvan: 'job_title',
  'ünvan': 'job_title',
  pozisyon: 'job_title',
};

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

    const normalizedName = field.name.toLowerCase().trim();
    const mappedKey = FIELD_NAME_MAP[normalizedName];

    if (mappedKey) {
      result[mappedKey] = value;
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
