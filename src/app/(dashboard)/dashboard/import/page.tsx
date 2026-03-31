'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/loading';
import { cn, formatRelativeTime } from '@/lib/utils';
import {
  LEAD_FIELD_OPTIONS,
  SOURCE_PLATFORM_LABELS,
  STAGE_LABELS,
  type ImportJob,
} from '@/lib/types';
import { useAppStore } from '@/lib/store';

// ============================================
// Step indicator
// ============================================

const STEPS = [
  { num: 1, label: 'Dosya Yukle' },
  { num: 2, label: 'Sutun Eslestirme' },
  { num: 3, label: 'Onizleme' },
  { num: 4, label: 'Sonuc' },
];

function StepIndicator({ current }: { current: number }) {
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
  email: 'email',
  'e-posta': 'email',
  eposta: 'email',
  mail: 'email',
  telefon: 'phone',
  phone: 'phone',
  tel: 'phone',
  cep: 'phone',
  gsm: 'phone',
  ad: 'first_name',
  first_name: 'first_name',
  firstname: 'first_name',
  isim: 'first_name',
  soyad: 'last_name',
  last_name: 'last_name',
  lastname: 'last_name',
  'ad soyad': 'full_name',
  'adsoyad': 'full_name',
  full_name: 'full_name',
  fullname: 'full_name',
  name: 'full_name',
  sirket: 'company',
  'şirket': 'company',
  company: 'company',
  firma: 'company',
  unvan: 'job_title',
  'ünvan': 'job_title',
  title: 'job_title',
  job_title: 'job_title',
  sehir: 'city',
  'şehir': 'city',
  city: 'city',
  il: 'city',
  ulke: 'country',
  'ülke': 'country',
  country: 'country',
  kampanya: 'campaign_name',
  campaign: 'campaign_name',
  campaign_name: 'campaign_name',
  kaynak: 'source_platform',
  source: 'source_platform',
  source_platform: 'source_platform',
  etiket: 'tags',
  tags: 'tags',
  tag: 'tags',
  skor: 'score',
  score: 'score',
  puan: 'score',
  utm_source: 'utm_source',
  utm_medium: 'utm_medium',
  utm_campaign: 'utm_campaign',
  utm_content: 'utm_content',
  utm_term: 'utm_term',
};

function autoMapHeader(header: string): string {
  const normalized = header.trim().toLowerCase().replace(/[_\- ]+/g, ' ').trim();
  // Direct match
  if (AUTO_MAP[normalized]) return AUTO_MAP[normalized];
  // Underscore/collapsed
  const collapsed = normalized.replace(/\s+/g, '_');
  if (AUTO_MAP[collapsed]) return AUTO_MAP[collapsed];
  const noSpace = normalized.replace(/\s+/g, '');
  if (AUTO_MAP[noSpace]) return AUTO_MAP[noSpace];
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

function statusBadge(status: string) {
  switch (status) {
    case 'completed':
      return <Badge color="green">Tamamlandi</Badge>;
    case 'processing':
      return <Badge color="blue">Isleniyor</Badge>;
    case 'failed':
      return <Badge color="red">Hata</Badge>;
    default:
      return <Badge color="gray">Beklemede</Badge>;
  }
}

// ============================================
// Source platform options for default selector
// ============================================

const SOURCE_OPTIONS = Object.entries(SOURCE_PLATFORM_LABELS).map(([value, label]) => ({
  value,
  label,
}));

// ============================================
// Main Page Component
// ============================================

export default function ImportPage() {
  const router = useRouter();
  const stages = useAppStore((s) => s.stages);
  const setStages = useAppStore((s) => s.setStages);

  // Wizard state
  const [step, setStep] = useState(1);

  // Step 1 - File upload
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [parseError, setParseError] = useState('');
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Recent imports
  const [recentImports, setRecentImports] = useState<ImportJob[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Step 2 - Column mapping
  const [mapping, setMapping] = useState<Record<string, string>>({});

  // Step 3 - Options
  const [dedupeUpdate, setDedupeUpdate] = useState(true);
  const [defaultStageId, setDefaultStageId] = useState('');
  const [defaultSource, setDefaultSource] = useState<string>('import');

  // Step 4 - Processing & result
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    created: number;
    updated: number;
    skipped: number;
    errors: Array<{ row: number; message: string }>;
  } | null>(null);
  const [importError, setImportError] = useState('');

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
            setParseError('CSV dosyasi okunurken hata olustu.');
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
          setParseError('CSV dosyasi okunurken hata olustu.');
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
            setParseError('Dosya bos gorunuyor.');
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
          setParseError('Excel dosyasi okunurken hata olustu.');
        }
      };
      reader.onerror = () => {
        setParseError('Dosya okunamadi.');
      };
      reader.readAsArrayBuffer(f);
    } else {
      setParseError('Desteklenmeyen dosya formati. Lutfen .csv, .xlsx veya .xls dosyasi yukleyin.');
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
  LEAD_FIELD_OPTIONS.forEach((o) => {
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
        file_name: file?.name || 'import.csv',
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
        throw new Error(errData.error || `Sunucu hatasi (${res.status})`);
      }

      const data = await res.json();
      setImportResult({
        created: data.created_rows ?? data.created ?? 0,
        updated: data.updated_rows ?? data.updated ?? 0,
        skipped: data.skipped_rows ?? data.skipped ?? 0,
        errors: data.errors ?? [],
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Bilinmeyen bir hata olustu.';
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

  const canProceedStep1 = file && headers.length > 0 && rows.length > 0 && !parseError;
  const canProceedStep2 = uniqueMappedFields.length > 0;

  // ============================================
  // STEP 1: File Upload
  // ============================================

  function renderStep1() {
    return (
      <div className="space-y-8">
        {/* Drop zone */}
        <div
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
                Dosyanizi surukleyip birakin
              </p>
              <p className="mb-4 text-sm text-gray-500">
                veya bilgisayarinizdan secin
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                icon={<FileUp className="h-4 w-4" />}
              >
                Dosya Sec
              </Button>
              <p className="mt-4 text-xs text-gray-400">
                Desteklenen formatlar: CSV, XLSX, XLS
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
                  {formatFileSize(file.size)} &middot; {rows.length} satir, {headers.length} sutun
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
                title="Dosyayi kaldir"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {parseError && (
          <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
            <p className="text-sm text-red-700">{parseError}</p>
          </div>
        )}

        {/* Recent imports */}
        <div>
          <h3 className="mb-3 text-sm font-semibold text-gray-700">Son İçe Aktarmalar</h3>
          {loadingHistory ? (
            <div className="flex items-center justify-center py-8">
              <Spinner size="sm" />
            </div>
          ) : recentImports.length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-white p-6 text-center">
              <Clock className="mx-auto mb-2 h-8 w-8 text-gray-300" />
              <p className="text-sm text-gray-500">Henuz ice aktarma yapilmamis.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="px-4 py-2.5 text-left font-medium text-gray-600">Dosya</th>
                    <th className="px-4 py-2.5 text-left font-medium text-gray-600">Durum</th>
                    <th className="px-4 py-2.5 text-right font-medium text-gray-600">Satir</th>
                    <th className="px-4 py-2.5 text-right font-medium text-gray-600">Tarih</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentImports.slice(0, 5).map((imp) => (
                    <tr key={imp.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5 font-medium text-gray-800">{imp.file_name}</td>
                      <td className="px-4 py-2.5">{statusBadge(imp.status)}</td>
                      <td className="px-4 py-2.5 text-right text-gray-600">
                        {imp.total_rows}
                      </td>
                      <td className="px-4 py-2.5 text-right text-gray-500">
                        {formatRelativeTime(imp.created_at)}
                      </td>
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
            Devam
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
            <h3 className="text-sm font-semibold text-gray-700">Sutun Eslestirme</h3>
            <p className="mt-0.5 text-xs text-gray-500">
              Dosyadaki her sutunu ilgili lead alanina eslestirin. Kullanmak istemediginiz sutunlari &quot;Atla&quot; olarak birakin.
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
                        {row[header] || <span className="italic text-gray-400">bos</span>}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Arrow */}
                <ArrowRight className="hidden h-4 w-4 shrink-0 text-gray-400 sm:block" />

                {/* Target field select */}
                <div className="w-full sm:w-56">
                  <Select
                    options={LEAD_FIELD_OPTIONS}
                    value={mapping[header] || '_skip'}
                    onChange={(e) =>
                      setMapping((prev) => ({
                        ...prev,
                        [header]: e.target.value,
                      }))
                    }
                    placeholder="Alan secin..."
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
            {uniqueMappedFields.length} alan eslesti, {headers.length - uniqueMappedFields.length} sutun atlanacak
          </span>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button variant="secondary" onClick={() => setStep(1)} icon={<ArrowLeft className="h-4 w-4" />}>
            Geri
          </Button>
          <Button
            disabled={!canProceedStep2}
            onClick={() => setStep(3)}
            icon={<ArrowRight className="h-4 w-4" />}
          >
            Devam
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
            <h3 className="text-sm font-semibold text-gray-700">Veri Onizleme</h3>
            <p className="mt-0.5 text-xs text-gray-500">
              Ilk 10 satirin eslesmis hali
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

        {/* Options */}
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <h3 className="mb-4 text-sm font-semibold text-gray-700">İçe Aktarma Ayarları</h3>
          <div className="space-y-5">
            {/* Dedupe */}
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={dedupeUpdate}
                onChange={(e) => setDedupeUpdate(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-500 focus:ring-indigo-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-700">
                  Mevcut kayitlarla eslesmenleri guncelle
                </span>
                <p className="text-xs text-gray-500">
                  E-posta veya telefon numarasi eslesirse mevcut lead guncellenir.
                </p>
              </div>
            </label>

            {/* Default stage */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="Varsayılan Aşama"
                options={stageOptions}
                placeholder="Aşama seçin..."
                value={defaultStageId}
                onChange={(e) => setDefaultStageId(e.target.value)}
              />

              <Select
                label="Varsayilan Kaynak"
                options={SOURCE_OPTIONS}
                value={defaultSource}
                onChange={(e) => setDefaultSource(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Row count */}
        <div className="flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm">
          <FileSpreadsheet className="h-4 w-4 text-indigo-500" />
          <span className="font-medium text-indigo-800">
            Toplam {rows.length} satir ice aktarilacak
          </span>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button variant="secondary" onClick={() => setStep(2)} icon={<ArrowLeft className="h-4 w-4" />}>
            Geri
          </Button>
          <Button onClick={() => setStep(4)} icon={<ArrowRight className="h-4 w-4" />}>
            İçe Aktar
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
          <h3 className="mb-2 text-lg font-semibold text-gray-800">Ice aktariliyor...</h3>
          <p className="text-sm text-gray-500">
            {rows.length} satir isleniyor. Lutfen bekleyin.
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
          <h3 className="mb-2 text-lg font-semibold text-gray-800">Ice aktarma basarisiz</h3>
          <p className="mb-6 max-w-md text-center text-sm text-gray-500">{importError}</p>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => { setImportError(''); setStep(3); }}>
              Geri Don
            </Button>
            <Button
              onClick={() => {
                setImportError('');
                executeImport();
              }}
            >
              Tekrar Dene
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
            <h3 className="mb-1 text-lg font-semibold text-gray-800">Ice aktarma tamamlandi</h3>
            <p className="text-sm text-gray-500">
              Toplam {totalProcessed} satir islendi.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{importResult.created}</p>
              <p className="mt-1 text-xs font-medium text-gray-500">Olusturulan</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{importResult.updated}</p>
              <p className="mt-1 text-xs font-medium text-gray-500">Guncellenen</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
              <p className="text-2xl font-bold text-gray-600">{importResult.skipped}</p>
              <p className="mt-1 text-xs font-medium text-gray-500">Atlanan</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
              <p className={cn('text-2xl font-bold', totalErrors > 0 ? 'text-red-600' : 'text-gray-600')}>
                {totalErrors}
              </p>
              <p className="mt-1 text-xs font-medium text-gray-500">Hata</p>
            </div>
          </div>

          {/* Error rows */}
          {totalErrors > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50">
              <div className="border-b border-red-200 px-4 py-3">
                <h4 className="text-sm font-semibold text-red-700">
                  Hatali Satirlar ({totalErrors})
                </h4>
              </div>
              <div className="max-h-60 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-red-200">
                      <th className="px-4 py-2 text-left text-xs font-medium text-red-600">Satir</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-red-600">Hata</th>
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
              Lead&apos;lere Git
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
        <h1 className="text-xl font-bold text-gray-900">Lead İçe Aktarma</h1>
        <p className="mt-1 text-sm text-gray-500">
          CSV veya Excel dosyanizdan lead verilerini sisteme aktarin.
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
