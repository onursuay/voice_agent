import { IL_LIST, PLATE_TO_IL, DISTRICTS, PROVINCE_ALIASES } from './turkeyProvinces.data';

/**
 * Serbest metin "şehir" girdisini kanonik T.C. iline (81 il) çözer.
 *
 * Kullanıcılar Meta formuna şehri elle yazdığı için veri kirli gelir:
 *   - ilçe yazılır            → "Orhangazi"  → Bursa
 *   - plaka kodu yazılır      → "34"         → İstanbul
 *   - büyük/küçük + TR karakter→ "istanbul"  → İstanbul
 *   - çok kelime              → "Gaziantep Nizip" → Gaziantep
 *   - yazım hatası            → "Istnbul"    → İstanbul
 *   - çöp                     → "x"          → null (çözülemedi, işaretlenir)
 *
 * Çözülemeyen değer `null` döner; asla tahminle yanlış ile atamayız.
 */

/** Türkçe-duyarlı normalize — ruleConditions.normalizeValue ile aynı katlama. */
export function normalizeTr(v: unknown): string {
  if (v == null) return '';
  const s = String(v)
    .toLocaleLowerCase('tr-TR')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/ı/g, 'i')
    .replace(/İ/g, 'i')
    .replace(/ş/g, 's')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c');
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/** Eşleştirme anahtarı: normalize + harf/rakam/boşluk dışını at (nokta, slash vb. erir). */
function normKey(v: unknown): string {
  return normalizeTr(v)
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// --- Lookup tabloları (modül yüklenince bir kez kurulur) ---

const PROVINCE_MAP = new Map<string, string>(); // norm il/alias → kanonik il
const IL_TO_PLATE = new Map<string, number>(); // kanonik il → plaka
const PROVINCE_NORMS: string[] = []; // bulanık eşleşme için il normları

for (const [plate, il] of Object.entries(PLATE_TO_IL)) {
  IL_TO_PLATE.set(il, Number(plate));
}
for (const il of IL_LIST) {
  const k = normKey(il);
  PROVINCE_MAP.set(k, il);
  PROVINCE_NORMS.push(k);
}
for (const [alias, il] of Object.entries(PROVINCE_ALIASES)) {
  PROVINCE_MAP.set(normKey(alias), il);
}

const DISTRICT_MAP = new Map<string, string>(); // norm ilçe → kanonik il (yalnız tekil)
{
  const ambiguous = new Set<string>();
  for (const [district, il] of DISTRICTS) {
    const k = normKey(district);
    if (!k || PROVINCE_MAP.has(k)) continue; // il eşleşmesi öncelikli; atla
    const existing = DISTRICT_MAP.get(k);
    if (existing && existing !== il) {
      ambiguous.add(k); // aynı ilçe adı birden çok ilde → güvenilmez
    } else {
      DISTRICT_MAP.set(k, il);
    }
  }
  for (const k of ambiguous) DISTRICT_MAP.delete(k);
}

function ilToPlate(il: string): number | null {
  return IL_TO_PLATE.get(il) ?? null;
}

// --- Levenshtein (yazım hatası toleransı) ---

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let prev = new Array<number>(n + 1);
  let curr = new Array<number>(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    const ai = a.charCodeAt(i - 1);
    for (let j = 1; j <= n; j++) {
      const cost = ai === b.charCodeAt(j - 1) ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}

/** İl adlarına bulanık eşleşme; yalnız tek ve yeterince yakın aday kabul edilir. */
function fuzzyProvince(norm: string): string | null {
  if (norm.length < 4) return null; // çok kısa girişte tahmin riskli
  const threshold = norm.length <= 6 ? 1 : 2;
  let best = Infinity;
  let bestIl: string | null = null;
  let bestCount = 0;
  for (const pNorm of PROVINCE_NORMS) {
    if (Math.abs(pNorm.length - norm.length) > threshold) continue;
    const dist = levenshtein(norm, pNorm);
    if (dist < best) {
      best = dist;
      bestIl = PROVINCE_MAP.get(pNorm) ?? null;
      bestCount = 1;
    } else if (dist === best) {
      bestCount++;
    }
  }
  if (bestIl && best <= threshold && bestCount === 1) return bestIl;
  return null;
}

export interface ProvinceResolution {
  il: string | null; // kanonik il; çözülemezse null
  plate: number | null;
  method: 'plate' | 'province' | 'district' | 'token' | 'fuzzy' | null;
}

export function resolveProvince(input: unknown): ProvinceResolution {
  const norm = normKey(input);
  if (!norm) return { il: null, plate: null, method: null };

  // 1) Plaka kodu (1..81) — "34", "06"
  if (/^\d{1,2}$/.test(norm)) {
    const code = Number(norm);
    const il = PLATE_TO_IL[code as keyof typeof PLATE_TO_IL];
    return il ? { il, plate: code, method: 'plate' } : { il: null, plate: null, method: null };
  }

  // 2) İl tam eşleşme (alias dahil)
  const prov = PROVINCE_MAP.get(norm);
  if (prov) return { il: prov, plate: ilToPlate(prov), method: 'province' };

  // 3) İlçe tam eşleşme (tekil)
  const dist = DISTRICT_MAP.get(norm);
  if (dist) return { il: dist, plate: ilToPlate(dist), method: 'district' };

  // 4) Çok kelimeli giriş: "Gaziantep Nizip", "İstanbul / Kadıköy", "Bursa Osmangazi"
  const tokens = norm.split(' ').filter(Boolean);
  if (tokens.length > 1) {
    const hits = new Set<string>();
    for (const t of tokens) {
      const pi = PROVINCE_MAP.get(t);
      if (pi) { hits.add(pi); continue; }
      const di = DISTRICT_MAP.get(t);
      if (di) hits.add(di);
    }
    if (hits.size === 1) {
      const il = [...hits][0];
      return { il, plate: ilToPlate(il), method: 'token' };
    }
  }

  // 5) Yazım hatası → il adına bulanık eşleşme
  const fz = fuzzyProvince(norm);
  if (fz) return { il: fz, plate: ilToPlate(fz), method: 'fuzzy' };

  return { il: null, plate: null, method: null };
}

/** İngest/backfill için kısa yol: kanonik il adı veya null. */
export function resolveProvinceName(input: unknown): string | null {
  return resolveProvince(input).il;
}
