// Import-job → lead-grid kolon görünümü hesaplama.
// Bir içe aktarma listesi "hesap" olarak seçildiğinde (account dropdown) yalnızca o
// import'un eşleştirdiği alanlara karşılık gelen grid kolonlarını göster; başlıkları
// dosyadaki orijinal sütun adıyla etiketle. Hem AccountFilter (tıklama) hem leads
// sayfası (kayıtlı seçimi geri yükleme) bu tek kaynaktan beslenir.

export type ImportJobSummary = {
  id: string;
  file_name: string;
  status: string;
  total_rows: number;
  created_rows: number;
  created_at: string;
  column_mapping?: Record<string, string>;
  active_count?: number; // çöpte olmayan (aktif) lead sayısı — hesap menüsü filtresi
};

// CRM alan adından lead grid kolon anahtarına eşleme.
const FIELD_TO_COLUMN: Record<string, string> = {
  full_name: 'full_name',
  first_name: 'full_name',
  last_name: 'full_name',
  phone: 'phone',
  email: 'email',
  source_platform: 'source_platform',
  campaign_name: 'campaign_name',
  city: 'city',
  company: 'company',
  tags: 'tags',
  score: 'score',
  assigned_to: 'assigned_to',
};

// İçe aktarma eşleşmesinden bağımsız, her zaman görünür çekirdek kolonlar.
// score/campaign_name/tags bilinçli dışarıda → varsayılan gizli kalsınlar
// (DEFAULT_HIDDEN_COLUMNS); kullanıcı "Kolonlar" menüsünden açabilir.
const ALWAYS_VISIBLE = new Set([
  '_select', '_row_num',
  'full_name', 'phone', 'email',
  'stage', 'assigned_to', 'first_seen_at', 'last_activity_at',
]);

// Görünürlüğü import eşleşmesine göre belirlenen tüm veri kolonları.
const ALL_DATA_COLUMNS = [
  'full_name', 'phone', 'email', 'source_platform', 'stage', 'score',
  'assigned_to', 'campaign_name', 'city', 'company', 'tags',
  'first_seen_at', 'last_activity_at',
];

function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map((word) => {
      if (!word) return word;
      const first = word[0];
      const upper =
        first === 'i' ? 'İ' :
        first === 'ı' ? 'I' :
        first.toUpperCase();
      return upper + word.slice(1);
    })
    .join(' ');
}

export type ImportJobView = {
  columns: string[];
  hidden: Set<string>;
  labels: Record<string, string>;
};

/**
 * Bir import job için lead grid kolon görünümünü (hangi kolonlar görünür/gizli ve
 * dosya başlığına göre etiket override'ları) hesaplar.
 */
export function computeImportJobView(job: Pick<ImportJobSummary, 'column_mapping'>): ImportJobView {
  const mappedFields = new Set<string>();
  const labels: Record<string, string> = {};

  if (job.column_mapping) {
    // column_mapping: Record<crmField, fileCol>
    Object.entries(job.column_mapping).forEach(([crmField, fileCol]) => {
      if (crmField && crmField !== '_skip' && fileCol && fileCol !== '_skip') {
        const gridCol = FIELD_TO_COLUMN[crmField];
        if (gridCol) {
          mappedFields.add(gridCol);
          if (!labels[gridCol]) labels[gridCol] = toTitleCase(fileCol);
        }
      }
    });
  }

  ALWAYS_VISIBLE.forEach((c) => mappedFields.add(c));

  const hidden = new Set<string>();
  ALL_DATA_COLUMNS.forEach((k) => { if (!mappedFields.has(k)) hidden.add(k); });

  return { columns: [...mappedFields], hidden, labels };
}
