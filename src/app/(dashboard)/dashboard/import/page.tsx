'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import * as Papa from 'papaparse';
import * as XLSX from 'xlsx';
import {
  Upload,
  FileSpreadsheet,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Trash2,
  Clock,
  FileUp,
  ExternalLink,
  Table2,
  ChevronDown,
  Search,
  Link2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/loading';
import { cn, formatRelativeTime } from '@/lib/utils';
import {
  type ImportJob,
} from '@/lib/types';
import { useAppStore } from '@/lib/store';

// ============================================
// Step indicator
// ============================================

// STEPS is now built inside StepIndicator using translations

function StepIndicator({ current }: { current: number }) {
  const t = useTranslations('import');
  const STEPS = [
    { num: 1, label: t('stepUpload') },
    { num: 2, label: t('stepMapping') },
    { num: 3, label: t('stepPreview') },
    { num: 4, label: t('stepResult') },
  ];
  return (
    <nav className="mb-8">
      <ol className="flex items-center">
        {STEPS.map((step, idx) => {
          const isActive = step.num === current;
          const isDone = step.num < current;
          return (
            <React.Fragment key={step.num}>
              <li className="flex items-center gap-2">
                <span
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors',
                    isDone && 'bg-indigo-500 text-white',
                    isActive && 'bg-indigo-500 text-white ring-4 ring-indigo-100',
                    !isDone && !isActive && 'bg-gray-200 text-gray-500'
                  )}
                >
                  {isDone ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    step.num
                  )}
                </span>
                <span
                  className={cn(
                    'hidden text-sm font-medium sm:inline',
                    isActive ? 'text-indigo-700' : isDone ? 'text-gray-700' : 'text-gray-400'
                  )}
                >
                  {step.label}
                </span>
              </li>
              {idx < STEPS.length - 1 && (
                <div
                  className={cn(
                    'mx-3 h-px flex-1',
                    step.num < current ? 'bg-indigo-400' : 'bg-gray-200'
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
}

// ============================================
// Auto-mapping logic
// ============================================

const AUTO_MAP: Record<string, string> = {
  // email
  email: 'email',
  'e-posta': 'email',
  'e posta': 'email',
  eposta: 'email',
  mail: 'email',
  'mail adresi': 'email',
  'e-posta adresi': 'email',
  'eposta adresi': 'email',
  'email adresi': 'email',
  'e-mail': 'email',
  // phone
  telefon: 'phone',
  phone: 'phone',
  tel: 'phone',
  cep: 'phone',
  gsm: 'phone',
  'telefon numarasi': 'phone',
  'telefon no': 'phone',
  'cep telefonu': 'phone',
  'cep no': 'phone',
  'gsm no': 'phone',
  'phone number': 'phone',
  'mobile': 'phone',
  'mobile number': 'phone',
  // first name
  ad: 'first_name',
  adi: 'first_name',
  'adı': 'first_name',
  first_name: 'first_name',
  firstname: 'first_name',
  'first name': 'first_name',
  isim: 'first_name',
  // last name
  soyad: 'last_name',
  soyadi: 'last_name',
  'soyadı': 'last_name',
  last_name: 'last_name',
  lastname: 'last_name',
  'last name': 'last_name',
  surname: 'last_name',
  // full name
  'ad soyad': 'full_name',
  'adsoyad': 'full_name',
  'adı soyadı': 'full_name',
  'adi soyadi': 'full_name',
  full_name: 'full_name',
  fullname: 'full_name',
  'full name': 'full_name',
  name: 'full_name',
  'musteri adi': 'full_name',
  'müşteri adı': 'full_name',
  'isim soyisim': 'full_name',
  'isim soyad': 'full_name',
  // company
  sirket: 'company',
  'şirket': 'company',
  'sirket adi': 'company',
  'şirket adı': 'company',
  company: 'company',
  firma: 'company',
  'firma adi': 'company',
  'firma adı': 'company',
  // job title
  unvan: 'job_title',
  'ünvan': 'job_title',
  'gorev': 'job_title',
  'görев': 'job_title',
  title: 'job_title',
  job_title: 'job_title',
  'job title': 'job_title',
  pozisyon: 'job_title',
  // city
  sehir: 'city',
  'şehir': 'city',
  city: 'city',
  il: 'city',
  'il ilce': 'city',
  // country
  ulke: 'country',
  'ülke': 'country',
  country: 'country',
  // campaign
  kampanya: 'campaign_name',
  campaign: 'campaign_name',
  campaign_name: 'campaign_name',
  'kampanya adi': 'campaign_name',
  'kampanya adı': 'campaign_name',
  // source
  kaynak: 'source_platform',
  source: 'source_platform',
  source_platform: 'source_platform',
  // tags
  etiket: 'tags',
  tags: 'tags',
  tag: 'tags',
  etiketler: 'tags',
  // score
  skor: 'score',
  score: 'score',
  puan: 'score',
  // date
  tarih: 'date',
  date: 'date',
  'created at': 'date',
  created_at: 'date',
  'olusturma tarihi': 'date',
  // external id
  id: 'external_id',
  'external id': 'external_id',
  external_id: 'external_id',
  'dis id': 'external_id',
  'lead id': 'external_id',
  // utm
  utm_source: 'utm_source',
  utm_medium: 'utm_medium',
  utm_campaign: 'utm_campaign',
  utm_content: 'utm_content',
  utm_term: 'utm_term',
};

function normalizeTr(s: string): string {
  return s
    .toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[_\-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function autoMapHeader(header: string): string {
  // Try original lowercase first
  const raw = header.trim().toLowerCase().replace(/[_\-]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (AUTO_MAP[raw]) return AUTO_MAP[raw];

  // Try with Türkçe char normalization
  const normalized = normalizeTr(header);
  if (AUTO_MAP[normalized]) return AUTO_MAP[normalized];

  // Collapsed variants
  const collapsed = normalized.replace(/\s+/g, '_');
  if (AUTO_MAP[collapsed]) return AUTO_MAP[collapsed];
  const noSpace = normalized.replace(/\s+/g, '');
  if (AUTO_MAP[noSpace]) return AUTO_MAP[noSpace];

  // Contains-based fallback for critical fields
  if (normalized.includes('email') || normalized.includes('e posta') || normalized.includes('eposta') || normalized === 'mail') return 'email';
  if (normalized.includes('telefon') || normalized.includes('phone') || normalized.includes('gsm') || normalized.includes('cep no') || normalized.includes('mobile')) return 'phone';
  if ((normalized.includes('soyad') || normalized === 'surname' || normalized === 'lastname')) return 'last_name';
  if ((normalized === 'ad' || normalized === 'adi' || normalized === 'isim') && !normalized.includes('soyad')) return 'first_name';
  if (normalized.includes('ulke') || normalized === 'country') return 'country';

  return '_skip';
}

// ============================================
// Helpers
// ============================================

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function StatusBadge({ status }: { status: string }) {
  const t = useTranslations('import');
  switch (status) {
    case 'completed': return <Badge color="green">{t('statusCompleted')}</Badge>;
    case 'processing': return <Badge color="blue">{t('statusProcessing')}</Badge>;
    case 'failed': return <Badge color="red">{t('statusFailed')}</Badge>;
    default: return <Badge color="gray">{t('statusPending')}</Badge>;
  }
}

// ============================================
// Source platform options for default selector
// ============================================

const SOURCE_OPTIONS = [
  { value: 'meta_lead_form', label: 'Lead Form' },
  { value: 'zapier', label: 'Zapier' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'instagram_dm', label: 'Instagram DM' },
  { value: 'messenger', label: 'Messenger' },
  { value: 'website', label: 'Website' },
  { value: 'manual', label: 'Manual' },
  { value: 'import', label: 'Import' },
  { value: 'other', label: 'Other' },
];

// ============================================
// Main Page Component
// ============================================

type SheetFile = { id: string; name: string; modifiedTime: string };
type SheetTab = { id: number; title: string; index: number };

export default function ImportPage() {
  const t = useTranslations('import');
  const router = useRouter();
  const searchParams = useSearchParams();

  // Build translated field options
  const LEAD_FIELD_OPTIONS_I18N = [
    { value: 'first_name', label: t('fieldFirstName') },
    { value: 'last_name', label: t('fieldLastName') },
    { value: 'full_name', label: t('fieldFullName') },
    { value: 'email', label: t('fieldEmail') },
    { value: 'phone', label: t('fieldPhone') },
    { value: 'company', label: t('fieldCompany') },
    { value: 'job_title', label: t('fieldJobTitle') },
    { value: 'city', label: t('fieldCity') },
    { value: 'country', label: t('fieldCountry') },
    { value: 'source_platform', label: t('fieldSource') },
    { value: 'campaign_name', label: t('fieldCampaign') },
    { value: 'ad_set_name', label: t('fieldAdSet') },
    { value: 'ad_name', label: t('fieldAd') },
    { value: 'form_name', label: t('fieldFormName') },
    { value: 'utm_source', label: t('fieldUtmSource') },
    { value: 'utm_medium', label: t('fieldUtmMedium') },
    { value: 'utm_campaign', label: t('fieldUtmCampaign') },
    { value: 'tags', label: t('fieldTags') },
    { value: 'score', label: t('fieldScore') },
    { value: 'date', label: t('fieldDate') },
    { value: 'external_id', label: t('fieldExternalId') },
    { value: '_skip', label: t('fieldSkip') },
  ];
  const stages = useAppStore((s) => s.stages);
  const setStages = useAppStore((s) => s.setStages);

  // Wizard state
  const [step, setStep] = useState(1);

  // Step 1 - source tab
  const [sourceTab, setSourceTab] = useState<'file' | 'sheets'>('file');

  // Step 1 - File upload
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [parseError, setParseError] = useState('');
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 1 - Google Sheets
  const [googleConnected, setGoogleConnected] = useState(false);
  const [sheetsFiles, setSheetsFiles] = useState<SheetFile[]>([]);
  const [sheetsSearch, setSheetsSearch] = useState('');
  const [loadingSheets, setLoadingSheets] = useState(false);
  const [sheetsError, setSheetsError] = useState('');
  const [selectedSpreadsheet, setSelectedSpreadsheet] = useState<SheetFile | null>(null);
  const [spreadsheetTabs, setSpreadsheetTabs] = useState<SheetTab[]>([]);
  const [selectedTab, setSelectedTab] = useState<string>('');
  const [loadingSheetData, setLoadingSheetData] = useState(false);
  const [sheetDataError, setSheetDataError] = useState('');
  const [sourceFileName, setSourceFileName] = useState('');

  // Recent imports
  const [recentImports, setRecentImports] = useState<ImportJob[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [selectedImportIds, setSelectedImportIds] = useState<Set<string>>(new Set());
  const [deletingImports, setDeletingImports] = useState(false);

  // Step 2 - Column mapping
  const [mapping, setMapping] = useState<Record<string, string>>({});

  // Step 3 - Options
  const [dedupeUpdate, setDedupeUpdate] = useState(true);
  const [defaultStageId, setDefaultStageId] = useState('');
  const [defaultSource, setDefaultSource] = useState<string>('import');

  // Google Sheets dropdown UI state
  const [sheetsDropdownOpen, setSheetsDropdownOpen] = useState(false);
  const [tabDropdownOpen, setTabDropdownOpen] = useState(false);

  // Step 4 - Processing & result
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    created: number;
    updated: number;
    skipped: number;
    errors: Array<{ row: number; message: string }>;
  } | null>(null);
  const [importError, setImportError] = useState('');

  // ---- Check Google connection on mount (and after redirect) ----
  useEffect(() => {
    const googleParam = searchParams.get('google');
    const googleError = searchParams.get('google_error');

    if (googleError) {
      setSheetsError(`${t('googleConnectError')} ${googleError}`);
      setSourceTab('sheets');
    }

    // Check if token cookie exists by probing the API
    fetch('/api/integrations/google/sheets')
      .then((r) => {
        if (r.ok) {
          setGoogleConnected(true);
          return r.json();
        }
        return null;
      })
      .catch(() => {});

    if (googleParam === 'connected') {
      setGoogleConnected(true);
      setSourceTab('sheets');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  // ---- Search Google Sheets files ----
  useEffect(() => {
    if (!googleConnected) return;
    setLoadingSheets(true);
    setSheetsError('');
    const url = sheetsSearch
      ? `/api/integrations/google/sheets?q=${encodeURIComponent(sheetsSearch)}`
      : '/api/integrations/google/sheets';
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (data.error === 'google_not_connected' || data.error === 'google_token_expired') {
          setGoogleConnected(false);
          setSheetsFiles([]);
        } else {
          setSheetsFiles(data.files || []);
        }
      })
      .catch(() => setSheetsError(t('sheetsLoadError')))
      .finally(() => setLoadingSheets(false));
  }, [googleConnected, sheetsSearch]);

  // ---- Fetch sheet tabs when spreadsheet selected ----
  useEffect(() => {
    if (!selectedSpreadsheet) return;
    setSpreadsheetTabs([]);
    setSelectedTab('');
    fetch(`/api/integrations/google/sheets/${selectedSpreadsheet.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.tabs) {
          setSpreadsheetTabs(data.tabs);
          if (data.tabs.length === 1) setSelectedTab(data.tabs[0].title);
        }
      })
      .catch(() => {});
  }, [selectedSpreadsheet]);

  // ---- Load sheet data when tab selected ----
  const loadSheetData = useCallback(async () => {
    if (!selectedSpreadsheet || !selectedTab) return;
    setLoadingSheetData(true);
    setSheetDataError('');
    try {
      const res = await fetch(
        `/api/integrations/google/sheets/${selectedSpreadsheet.id}?sheet=${encodeURIComponent(selectedTab)}`
      );
      const data = await res.json();
      if (!res.ok || data.error) {
        setSheetDataError(data.error || t('sheetDataError'));
        return;
      }
      setHeaders(data.headers || []);
      setRows(data.rows || []);
      setSourceFileName(`${selectedSpreadsheet.name} / ${selectedTab}`);
      // Auto-map columns
      const autoMap: Record<string, string> = {};
      (data.headers || []).forEach((col: string) => {
        autoMap[col] = autoMapHeader(col);
      });
      setMapping(autoMap);
    } catch {
      setSheetDataError(t('sheetDataError'));
    } finally {
      setLoadingSheetData(false);
    }
  }, [selectedSpreadsheet, selectedTab]);

  // ---- Fetch stages if needed ----
  useEffect(() => {
    if (stages.length === 0) {
      fetch('/api/stages')
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) setStages(data);
          else if (data?.stages) setStages(data.stages);
        })
        .catch(() => {});
    }
  }, [stages.length, setStages]);

  // ---- Fetch recent import history ----
  useEffect(() => {
    setLoadingHistory(true);
    fetch('/api/leads/import?recent=true')
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data) => {
        if (Array.isArray(data)) setRecentImports(data);
        else if (data?.imports) setRecentImports(data.imports);
      })
      .catch(() => {
        setRecentImports([]);
      })
      .finally(() => setLoadingHistory(false));
  }, []);

  // ---- Stage options ----
  const stageOptions = stages.map((s) => ({ value: s.id, label: s.name }));

  // ============================================
  // File parsing
  // ============================================

  const parseFile = useCallback((f: File) => {
    setFile(f);
    setParseError('');
    setHeaders([]);
    setRows([]);

    const ext = f.name.split('.').pop()?.toLowerCase();

    if (ext === 'csv') {
      Papa.parse(f, {
        header: true,
        skipEmptyLines: true,
        complete(results) {
          if (results.errors.length > 0 && results.data.length === 0) {
            setParseError(t('csvError'));
            return;
          }
          const data = results.data as Record<string, string>[];
          const h = results.meta.fields || [];
          setHeaders(h);
          setRows(data);
          // Auto-map
          const autoMap: Record<string, string> = {};
          h.forEach((col) => {
            autoMap[col] = autoMapHeader(col);
          });
          setMapping(autoMap);
        },
        error() {
          setParseError(t('csvError'));
        },
      });
    } else if (ext === 'xlsx' || ext === 'xls') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const wb = XLSX.read(data, { type: 'array' });
          const sheetName = wb.SheetNames[0];
          const ws = wb.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: '' });
          if (json.length === 0) {
            setParseError(t('fileEmpty'));
            return;
          }
          const h = Object.keys(json[0]);
          setHeaders(h);
          // Convert all values to string
          const cleaned = json.map((row) => {
            const r: Record<string, string> = {};
            h.forEach((k) => {
              r[k] = row[k] != null ? String(row[k]) : '';
            });
            return r;
          });
          setRows(cleaned);
          // Auto-map
          const autoMap: Record<string, string> = {};
          h.forEach((col) => {
            autoMap[col] = autoMapHeader(col);
          });
          setMapping(autoMap);
        } catch {
          setParseError(t('xlsxError'));
        }
      };
      reader.onerror = () => {
        setParseError(t('fileReadError'));
      };
      reader.readAsArrayBuffer(f);
    } else {
      setParseError(t('unsupportedFormat'));
    }
  }, []);

  // ============================================
  // Drag & Drop handlers
  // ============================================

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragging(false);
      const f = e.dataTransfer.files?.[0];
      if (f) parseFile(f);
    },
    [parseFile]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) parseFile(f);
    },
    [parseFile]
  );

  // ============================================
  // Mapped preview data (Step 3)
  // ============================================

  const mappedPreviewRows = rows.slice(0, 10).map((row) => {
    const mapped: Record<string, string> = {};
    Object.entries(mapping).forEach(([srcCol, targetField]) => {
      if (targetField && targetField !== '_skip') {
        mapped[targetField] = row[srcCol] || '';
      }
    });
    return mapped;
  });

  const activeMappedFields = Object.values(mapping).filter((v) => v && v !== '_skip');
  const uniqueMappedFields = [...new Set(activeMappedFields)];
  const fieldLabels: Record<string, string> = {};
  LEAD_FIELD_OPTIONS_I18N.forEach((o) => {
    fieldLabels[o.value] = o.label;
  });

  // ============================================
  // Import execution (Step 4)
  // ============================================

  const executeImport = useCallback(async () => {
    setImporting(true);
    setImportError('');
    setImportResult(null);

    try {
      // Build payload
      const mappedRows = rows.map((row) => {
        const lead: Record<string, string> = {};
        Object.entries(mapping).forEach(([srcCol, targetField]) => {
          if (targetField && targetField !== '_skip') {
            lead[targetField] = row[srcCol] || '';
          }
        });
        return lead;
      });

      const payload = {
        file_name: sourceTab === 'sheets' ? sourceFileName : (file?.name || 'import.csv'),
        column_mapping: mapping,
        rows: mappedRows,
        options: {
          dedupe_update: dedupeUpdate,
          default_stage_id: defaultStageId || null,
          default_source: defaultSource,
        },
      };

      const res = await fetch('/api/leads/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server error (${res.status})`);
      }

      const data = await res.json();
      setImportResult({
        created: data.created_rows ?? data.created ?? 0,
        updated: data.updated_rows ?? data.updated ?? 0,
        skipped: data.skipped_rows ?? data.skipped ?? 0,
        errors: data.errors ?? [],
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unknown error occurred.';
      setImportError(message);
    } finally {
      setImporting(false);
    }
  }, [rows, mapping, file, dedupeUpdate, defaultStageId, defaultSource]);

  // Auto-start import when reaching step 4
  useEffect(() => {
    if (step === 4 && !importResult && !importError && !importing) {
      executeImport();
    }
  }, [step, importResult, importError, importing, executeImport]);

  // ============================================
  // Render helpers
  // ============================================

  const canProceedStep1 =
    (sourceTab === 'file' && file && headers.length > 0 && rows.length > 0 && !parseError) ||
    (sourceTab === 'sheets' && headers.length > 0 && rows.length > 0 && !loadingSheetData);
  const canProceedStep2 = uniqueMappedFields.length > 0;

  // ============================================
  // STEP 1: File Upload
  // ============================================

  // ============================================
  // Google Sheets panel (inside Step 1)
  // ============================================

  function renderGoogleSheetsPanel() {
    if (!googleConnected) {
      return (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-12 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
            <Table2 className="h-6 w-6 text-green-600" />
          </div>
          <p className="mb-1 text-base font-semibold text-gray-700">{t('googleSheetsTitle')}</p>
          <p className="mb-6 text-sm text-gray-500">
            {t('googleSheetsDesc')}
          </p>
          {sheetsError && (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              {sheetsError}
            </div>
          )}
          <a
            href="/api/integrations/google/connect"
            className="inline-flex items-center gap-2 rounded-lg bg-white border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
          >
            <Link2 className="h-4 w-4 text-green-600" />
            {t('connectGoogle')}
          </a>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {sheetsError && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            {sheetsError}
          </div>
        )}

        {/* Spreadsheet dropdown */}
        <div className="relative">
          <button
            onClick={() => setSheetsDropdownOpen(prev => !prev)}
            className={cn(
              'flex w-full items-center justify-between gap-3 rounded-xl border bg-white px-4 py-3 text-sm transition-all shadow-sm',
              sheetsDropdownOpen ? 'border-green-400 ring-2 ring-green-100' : 'border-gray-200 hover:border-green-300'
            )}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', selectedSpreadsheet ? 'bg-green-100' : 'bg-gray-100')}>
                <FileSpreadsheet className={cn('h-4 w-4', selectedSpreadsheet ? 'text-green-600' : 'text-gray-400')} />
              </div>
              <div className="min-w-0 text-left">
                {selectedSpreadsheet ? (
                  <>
                    <p className="font-semibold text-gray-800 truncate">{selectedSpreadsheet.name}</p>
                    <p className="text-xs text-gray-400">{new Date(selectedSpreadsheet.modifiedTime).toLocaleDateString('tr-TR')}</p>
                  </>
                ) : (
                  <p className="text-gray-400">{t('sheetsSearchPlaceholder')}</p>
                )}
              </div>
            </div>
            <ChevronDown className={cn('h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200', sheetsDropdownOpen && 'rotate-180')} />
          </button>

          {sheetsDropdownOpen && (
            <div className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
              {/* Search inside dropdown */}
              <div className="border-b border-gray-100 p-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder={t('sheetsSearchPlaceholder')}
                    value={sheetsSearch}
                    onChange={(e) => setSheetsSearch(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm focus:border-green-400 focus:outline-none focus:ring-1 focus:ring-green-100"
                    autoFocus
                  />
                </div>
              </div>

              <div className="max-h-52 overflow-y-auto">
                {loadingSheets ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                    <span className="ml-2 text-sm text-gray-400">{t('sheetsLoading')}</span>
                  </div>
                ) : sheetsFiles.length === 0 ? (
                  <div className="py-6 text-center text-sm text-gray-400">{t('sheetsNotFound')}</div>
                ) : (
                  sheetsFiles.map((sf) => (
                    <button
                      key={sf.id}
                      onClick={() => {
                        setSelectedSpreadsheet(sf);
                        setHeaders([]);
                        setRows([]);
                        setSelectedTab('');
                        setSheetsDropdownOpen(false);
                      }}
                      className={cn(
                        'flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors',
                        selectedSpreadsheet?.id === sf.id
                          ? 'bg-green-50 text-green-700'
                          : 'hover:bg-gray-50 text-gray-700'
                      )}
                    >
                      <FileSpreadsheet className={cn('h-4 w-4 shrink-0', selectedSpreadsheet?.id === sf.id ? 'text-green-500' : 'text-gray-400')} />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{sf.name}</p>
                        <p className="text-xs text-gray-400">{new Date(sf.modifiedTime).toLocaleDateString('tr-TR')}</p>
                      </div>
                      {selectedSpreadsheet?.id === sf.id && <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sheet tab dropdown */}
        {selectedSpreadsheet && spreadsheetTabs.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setTabDropdownOpen(prev => !prev)}
              className={cn(
                'flex w-full items-center justify-between gap-3 rounded-xl border bg-white px-4 py-3 text-sm transition-all shadow-sm',
                tabDropdownOpen ? 'border-green-400 ring-2 ring-green-100' : 'border-gray-200 hover:border-green-300'
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', selectedTab ? 'bg-green-100' : 'bg-gray-100')}>
                  <Table2 className={cn('h-4 w-4', selectedTab ? 'text-green-600' : 'text-gray-400')} />
                </div>
                <span className={selectedTab ? 'font-semibold text-gray-800' : 'text-gray-400'}>
                  {selectedTab || t('sheetsSelectTab')}
                </span>
              </div>
              <ChevronDown className={cn('h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200', tabDropdownOpen && 'rotate-180')} />
            </button>

            {tabDropdownOpen && (
              <div className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
                {spreadsheetTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => { setSelectedTab(tab.title); setTabDropdownOpen(false); }}
                    className={cn(
                      'flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors',
                      selectedTab === tab.title
                        ? 'bg-green-50 text-green-700 font-medium'
                        : 'hover:bg-gray-50 text-gray-700'
                    )}
                  >
                    <Table2 className={cn('h-4 w-4 shrink-0', selectedTab === tab.title ? 'text-green-500' : 'text-gray-400')} />
                    {tab.title}
                    {selectedTab === tab.title && <CheckCircle2 className="ml-auto h-4 w-4 text-green-500" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Load Data / result */}
        {selectedTab && (
          <div>
            {sheetDataError && (
              <div className="mb-2 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                {sheetDataError}
              </div>
            )}
            {rows.length > 0 && !loadingSheetData ? (
              <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="font-medium text-green-700">
                  {t('sheetsDataLoaded', { rows: rows.length, cols: headers.length })}
                </span>
              </div>
            ) : (
              <button
                onClick={loadSheetData}
                disabled={loadingSheetData}
                className={cn(
                  'relative w-full overflow-hidden rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 active:scale-[0.98]',
                  loadingSheetData
                    ? 'bg-green-400 cursor-not-allowed'
                    : 'bg-green-500 hover:bg-green-600 hover:shadow-md'
                )}
              >
                {/* Shimmer sweep animation */}
                {!loadingSheetData && (
                  <span className="pointer-events-none absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                )}
                <span className="relative flex items-center justify-center gap-2">
                  {loadingSheetData && <Loader2 className="h-4 w-4 animate-spin" />}
                  {t('sheetsLoadData')}
                </span>
              </button>
            )}
          </div>
        )}

        {/* Disconnect */}
        <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-2.5">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <div className="h-2 w-2 rounded-full bg-green-400" />
            <span>{t('sheetsConnected')}</span>
          </div>
          <button
            onClick={async () => {
              await fetch('/api/integrations/google/disconnect', { method: 'DELETE' });
              setGoogleConnected(false);
              setSheetsFiles([]);
              setSelectedSpreadsheet(null);
              setSpreadsheetTabs([]);
              setSelectedTab('');
              setHeaders([]);
              setRows([]);
            }}
            className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 transition-colors"
          >
            {t('sheetsDisconnect')}
          </button>
        </div>
      </div>
    );
  }

  function renderStep1() {
    return (
      <div className="space-y-8">
        {/* Source tab switcher */}
        <div className="flex rounded-xl border border-gray-200 bg-gray-100 p-1 gap-1">
          <button
            onClick={() => setSourceTab('file')}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-colors',
              sourceTab === 'file'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            <FileUp className="h-4 w-4" />
            {t('fileUpload')}
          </button>
          <button
            onClick={() => setSourceTab('sheets')}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-colors',
              sourceTab === 'sheets'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            <Table2 className="h-4 w-4" />
            {t('googleSheets')}
          </button>
        </div>

        {/* Google Sheets panel */}
        {sourceTab === 'sheets' && renderGoogleSheetsPanel()}

        {/* Drop zone (only for file tab) */}
        {sourceTab === 'file' && <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            'relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 text-center transition-colors',
            dragging
              ? 'border-indigo-400 bg-indigo-50'
              : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileSelect}
            className="hidden"
          />

          {!file ? (
            <>
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100">
                <Upload className="h-6 w-6 text-indigo-500" />
              </div>
              <p className="mb-1 text-base font-semibold text-gray-700">
                {t('dragDrop')}
              </p>
              <p className="mb-4 text-sm text-gray-500">
                {t('orSelect')}
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                icon={<FileUp className="h-4 w-4" />}
              >
                {t('selectFile')}
              </Button>
              <p className="mt-4 text-xs text-gray-400">
                {t('supportedFormats')}
              </p>
            </>
          ) : (
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100">
                <FileSpreadsheet className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-800">{file.name}</p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(file.size)} &middot; {t('fileInfo', { rows: rows.length, cols: headers.length })}
                </p>
              </div>
              <button
                onClick={() => {
                  setFile(null);
                  setHeaders([]);
                  setRows([]);
                  setParseError('');
                  setMapping({});
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="ml-2 rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600"
                title={t('fileRemove')}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>}

        {sourceTab === 'file' && parseError && (
          <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
            <p className="text-sm text-red-700">{parseError}</p>
          </div>
        )}

        {/* Recent imports */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">{t('recentImports')}</h3>
            {selectedImportIds.size > 0 && (
              <button
                onClick={async () => {
                  setDeletingImports(true);
                  const ids = Array.from(selectedImportIds);
                  try {
                    await Promise.all(ids.map(id =>
                      fetch(`/api/leads/import/${id}`, { method: 'DELETE' })
                    ));
                    setRecentImports(prev => prev.filter(imp => !selectedImportIds.has(imp.id)));
                    setSelectedImportIds(new Set());
                  } catch {}
                  setDeletingImports(false);
                }}
                disabled={deletingImports}
                className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                {deletingImports ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
                {selectedImportIds.size} {t('deleteSelected')}
              </button>
            )}
          </div>
          {loadingHistory ? (
            <div className="flex items-center justify-center py-8">
              <Spinner size="sm" />
            </div>
          ) : recentImports.length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-white p-6 text-center">
              <Clock className="mx-auto mb-2 h-8 w-8 text-gray-300" />
              <p className="text-sm text-gray-500">{t('noRecentImports')}</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="w-10 px-3 py-2.5">
                      <input
                        type="checkbox"
                        checked={selectedImportIds.size === recentImports.length}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedImportIds(new Set(recentImports.map(i => i.id)));
                          else setSelectedImportIds(new Set());
                        }}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-500 focus:ring-indigo-500"
                      />
                    </th>
                    <th className="px-4 py-2.5 text-left font-medium text-gray-600">{t('fileName')}</th>
                    <th className="px-4 py-2.5 text-left font-medium text-gray-600">{t('statusColHeader')}</th>
                    <th className="px-4 py-2.5 text-right font-medium text-gray-600">{t('rowCount')}</th>
                    <th className="px-4 py-2.5 text-right font-medium text-gray-600">{t('importedAt')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentImports.map((imp) => (
                    <tr
                      key={imp.id}
                      className={cn('hover:bg-gray-50 transition-colors', selectedImportIds.has(imp.id) && 'bg-red-50 hover:bg-red-50')}
                    >
                      <td className="px-3 py-2.5">
                        <input
                          type="checkbox"
                          checked={selectedImportIds.has(imp.id)}
                          onChange={(e) => {
                            const next = new Set(selectedImportIds);
                            if (e.target.checked) next.add(imp.id);
                            else next.delete(imp.id);
                            setSelectedImportIds(next);
                          }}
                          className="h-4 w-4 rounded border-gray-300 text-indigo-500 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="px-4 py-2.5 font-medium text-gray-800">{imp.file_name}</td>
                      <td className="px-4 py-2.5"><StatusBadge status={imp.status} /></td>
                      <td className="px-4 py-2.5 text-right text-gray-600">{imp.total_rows}</td>
                      <td className="px-4 py-2.5 text-right text-gray-500">{formatRelativeTime(imp.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Continue button */}
        <div className="flex justify-end">
          <Button
            disabled={!canProceedStep1}
            onClick={() => setStep(2)}
            icon={<ArrowRight className="h-4 w-4" />}
          >
            {t('continueBtn')}
          </Button>
        </div>
      </div>
    );
  }

  // ============================================
  // STEP 2: Column Mapping
  // ============================================

  function renderStep2() {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-5 py-3">
            <h3 className="text-sm font-semibold text-gray-700">{t('mappingTitle')}</h3>
            <p className="mt-0.5 text-xs text-gray-500">
              {t('mappingDesc')}
            </p>
          </div>
          <div className="divide-y divide-gray-100">
            {headers.map((header) => (
              <div
                key={header}
                className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:gap-6"
              >
                {/* Source column */}
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="text-sm font-medium text-gray-800">{header}</span>
                  {/* Preview first 3 values */}
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {rows.slice(0, 3).map((row, i) => (
                      <span
                        key={i}
                        className="inline-block max-w-[180px] truncate rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                      >
                        {row[header] || <span className="italic text-gray-400">{t('emptyValue')}</span>}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Arrow */}
                <ArrowRight className="hidden h-4 w-4 shrink-0 text-gray-400 sm:block" />

                {/* Target field select */}
                <div className="w-full sm:w-56">
                  <Select
                    options={LEAD_FIELD_OPTIONS_I18N}
                    value={mapping[header] || '_skip'}
                    onChange={(e) =>
                      setMapping((prev) => ({
                        ...prev,
                        [header]: e.target.value,
                      }))
                    }
                    placeholder={t('selectFieldPlaceholder')}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <CheckCircle2 className="h-4 w-4 text-indigo-500" />
          <span>
            {t('fieldsMapped', { mapped: uniqueMappedFields.length, skipped: headers.length - uniqueMappedFields.length })}
          </span>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button variant="secondary" onClick={() => setStep(1)} icon={<ArrowLeft className="h-4 w-4" />}>
            {t('back')}
          </Button>
          <Button
            disabled={!canProceedStep2}
            onClick={() => setStep(3)}
            icon={<ArrowRight className="h-4 w-4" />}
          >
            {t('continueBtn')}
          </Button>
        </div>
      </div>
    );
  }

  // ============================================
  // STEP 3: Preview & Options
  // ============================================

  function renderStep3() {
    return (
      <div className="space-y-6">
        {/* Preview table */}
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-5 py-3">
            <h3 className="text-sm font-semibold text-gray-700">{t('previewTitle')}</h3>
            <p className="mt-0.5 text-xs text-gray-500">
              {t('previewRowInfo')}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500">#</th>
                  {uniqueMappedFields.map((field) => (
                    <th
                      key={field}
                      className="px-3 py-2.5 text-left text-xs font-medium text-gray-600"
                    >
                      {fieldLabels[field] || field}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {mappedPreviewRows.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-xs text-gray-400">{i + 1}</td>
                    {uniqueMappedFields.map((field) => (
                      <td key={field} className="max-w-[200px] truncate px-3 py-2 text-gray-700">
                        {row[field] || <span className="text-gray-300">-</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button variant="secondary" onClick={() => setStep(2)} icon={<ArrowLeft className="h-4 w-4" />}>
            {t('back')}
          </Button>
          <Button onClick={() => setStep(4)} icon={<ArrowRight className="h-4 w-4" />}>
            {t('startImport')}
          </Button>
        </div>
      </div>
    );
  }

  // ============================================
  // STEP 4: Processing & Result
  // ============================================

  function renderStep4() {
    // Still importing
    if (importing) {
      return (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-gray-800">{t('importing')}</h3>
          <p className="text-sm text-gray-500">
            {t('importingWait', { count: rows.length })}
          </p>
          <div className="mt-6 h-2 w-64 overflow-hidden rounded-full bg-gray-200">
            <div className="h-full animate-pulse rounded-full bg-indigo-500" style={{ width: '60%' }} />
          </div>
        </div>
      );
    }

    // Error
    if (importError) {
      return (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <XCircle className="h-8 w-8 text-red-500" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-gray-800">{t('importFailed')}</h3>
          <p className="mb-6 max-w-md text-center text-sm text-gray-500">{importError}</p>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => { setImportError(''); setStep(3); }}>
              {t('goBack')}
            </Button>
            <Button
              onClick={() => {
                setImportError('');
                executeImport();
              }}
            >
              {t('retry')}
            </Button>
          </div>
        </div>
      );
    }

    // Success
    if (importResult) {
      const totalErrors = importResult.errors.length;
      const totalProcessed = importResult.created + importResult.updated + importResult.skipped + totalErrors;

      return (
        <div className="space-y-6">
          {/* Success header */}
          <div className="flex flex-col items-center py-8">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
            <h3 className="mb-1 text-lg font-semibold text-gray-800">{t('importResultTitle')}</h3>
            <p className="text-sm text-gray-500">
              {t('totalProcessed', { count: totalProcessed })}
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{importResult.created}</p>
              <p className="mt-1 text-xs font-medium text-gray-500">{t('createdLabel')}</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{importResult.updated}</p>
              <p className="mt-1 text-xs font-medium text-gray-500">{t('updatedLabel')}</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
              <p className="text-2xl font-bold text-gray-600">{importResult.skipped}</p>
              <p className="mt-1 text-xs font-medium text-gray-500">{t('skippedLabel')}</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
              <p className={cn('text-2xl font-bold', totalErrors > 0 ? 'text-red-600' : 'text-gray-600')}>
                {totalErrors}
              </p>
              <p className="mt-1 text-xs font-medium text-gray-500">{t('errorLabel')}</p>
            </div>
          </div>

          {/* Error rows */}
          {totalErrors > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50">
              <div className="border-b border-red-200 px-4 py-3">
                <h4 className="text-sm font-semibold text-red-700">
                  {t('errorRowsTitle', { count: totalErrors })}
                </h4>
              </div>
              <div className="max-h-60 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-red-200">
                      <th className="px-4 py-2 text-left text-xs font-medium text-red-600">{t('rowLabel')}</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-red-600">{t('errorLabel')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-red-100">
                    {importResult.errors.map((err, i) => (
                      <tr key={i}>
                        <td className="px-4 py-2 font-medium text-red-700">#{err.row}</td>
                        <td className="px-4 py-2 text-red-600">{err.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Action */}
          <div className="flex justify-center pt-2">
            <Button
              onClick={() => router.push('/dashboard/leads')}
              icon={<ExternalLink className="h-4 w-4" />}
            >
              {t('viewLeads')}
            </Button>
          </div>
        </div>
      );
    }

    return null;
  }

  // ============================================
  // Main render
  // ============================================

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">{t('pageTitle')}</h1>
        <p className="mt-1 text-sm text-gray-500">
          {t('subtitle')}
        </p>
      </div>

      {/* Step indicator */}
      <StepIndicator current={step} />

      {/* Step content */}
      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
      {step === 4 && renderStep4()}
    </div>
  );
}
