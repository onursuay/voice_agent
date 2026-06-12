export type Operator = 'equals' | 'not_equals' | 'contains' | 'in';

export interface Condition {
  field: string;        // örn. 'city'
  operator: Operator;
  value: string | string[];
}

export interface TriggerConfig {
  conditions?: Condition[];
  match?: 'all' | 'any';
}

// Türkçe-duyarlı normalize: küçük harf + trim + boşluk sadeleştir + aksan kaldır
export function normalizeValue(v: unknown): string {
  if (v == null) return '';
  let s = String(v).toLocaleLowerCase('tr-TR').trim().replace(/\s+/g, ' ');
  // Türkçe karakter sadeleştirme (İstanbul/Istanbul toleransı)
  s = s
    .replace(/ı/g, 'i').replace(/İ/g, 'i')
    .replace(/ş/g, 's').replace(/ğ/g, 'g')
    .replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c');
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function leadFieldValue(lead: Record<string, unknown>, field: string): string {
  // 'custom.X' → lead.custom_fields[X] (form sorularından gelen dinamik alanlar:
  // amac, butce, konum, zaman vb. — Meta form başlıklarına göre kural kurulabilir)
  if (field.startsWith('custom.')) {
    const cf = lead.custom_fields as Record<string, unknown> | null | undefined;
    return normalizeValue(cf?.[field.slice(7)]);
  }
  const direct = lead[field];
  if (direct !== undefined && direct !== null && direct !== '') return normalizeValue(direct);
  // Düz kolon boşsa aynı isimli form alanına düş (eski kurallarla geriye uyumlu)
  const cf = lead.custom_fields as Record<string, unknown> | null | undefined;
  if (cf && typeof cf === 'object' && field in cf) return normalizeValue(cf[field]);
  return normalizeValue(direct);
}

export function evaluateCondition(cond: Condition, lead: Record<string, unknown>): boolean {
  const left = leadFieldValue(lead, cond.field);
  if (cond.operator === 'in') {
    const arr = (Array.isArray(cond.value) ? cond.value : [cond.value]).map(normalizeValue);
    return arr.includes(left);
  }
  const right = normalizeValue(Array.isArray(cond.value) ? cond.value[0] : cond.value);
  switch (cond.operator) {
    case 'equals': return left === right;
    case 'not_equals': return left !== right;
    case 'contains': return left.includes(right);
    default: return false;
  }
}

export function evaluateConditions(cfg: TriggerConfig, lead: Record<string, unknown>): boolean {
  const conditions = cfg.conditions || [];
  if (conditions.length === 0) return true; // koşulsuz = catch-all
  const match = cfg.match || 'all';
  return match === 'any'
    ? conditions.some((c) => evaluateCondition(c, lead))
    : conditions.every((c) => evaluateCondition(c, lead));
}
