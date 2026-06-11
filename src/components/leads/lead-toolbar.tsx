'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Search,
  ArrowUpDown,
  Columns3,
  Upload,
  Plus,
  ChevronDown,
  UserPlus,
  Tag,
  Trash2,
  GitBranch,
  X,
  AlertTriangle,
  Loader2,
  Play,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore, DEFAULT_HIDDEN_COLUMNS } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { LeadFilters } from './lead-filters';
import { AccountFilter } from './account-filter';
import { LeadCreateModal } from './lead-create-modal';
import { LEAD_COLUMNS } from './lead-grid';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';

// ── Sort Dropdown ───────────────────────────────────────

function SortDropdown() {
  const t = useTranslations('leads');
  const [open, setOpen] = useState(false);
  const sort = useAppStore((s) => s.sort);
  const setSort = useAppStore((s) => s.setSort);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const sortableColumns = LEAD_COLUMNS.filter((c) => c.sortable);
  const currentLabel = sort
    ? `${sortableColumns.find((c) => c.key === sort.column)?.label || sort.column} ${sort.direction === 'asc' ? '(A-Z)' : '(Z-A)'}`
    : t('sort');

  return (
    <div ref={ref} className="relative">
      <Button
        variant="secondary"
        size="sm"
        icon={<ArrowUpDown className="h-4 w-4" />}
        onClick={() => setOpen(!open)}
      >
        {currentLabel}
        <ChevronDown className="ml-1 h-3 w-3" />
      </Button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1.5 w-56 rounded-lg border border-gray-200 bg-white py-1 shadow-xl">
          {sort && (
            <button
              onClick={() => {
                setSort(null);
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50"
            >
              <X className="h-3.5 w-3.5" />
              {t('removeSorting')}
            </button>
          )}
          <div className="border-b border-gray-100 my-1" />
          {sortableColumns.map((col) => (
            <React.Fragment key={col.key}>
              <button
                onClick={() => {
                  setSort({ column: col.key, direction: 'asc' });
                  setOpen(false);
                }}
                className={cn(
                  'flex w-full items-center justify-between px-3 py-1.5 text-sm hover:bg-gray-50',
                  sort?.column === col.key && sort?.direction === 'asc'
                    ? 'text-emerald-600 bg-emerald-50'
                    : 'text-gray-700'
                )}
              >
                <span>{col.label}</span>
                <span className="text-xs text-gray-400">A-Z</span>
              </button>
              <button
                onClick={() => {
                  setSort({ column: col.key, direction: 'desc' });
                  setOpen(false);
                }}
                className={cn(
                  'flex w-full items-center justify-between px-3 py-1.5 text-sm hover:bg-gray-50',
                  sort?.column === col.key && sort?.direction === 'desc'
                    ? 'text-emerald-600 bg-emerald-50'
                    : 'text-gray-700'
                )}
              >
                <span>{col.label}</span>
                <span className="text-xs text-gray-400">Z-A</span>
              </button>
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Column Visibility ───────────────────────────────────

function ColumnVisibilityDropdown() {
  const t = useTranslations('leads');
  const [open, setOpen] = useState(false);
  const hiddenColumns = useAppStore((s) => s.hiddenColumns);
  const toggleColumn = useAppStore((s) => s.toggleColumn);
  const columnLabelOverrides = useAppStore((s) => s.columnLabelOverrides);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const toggleableColumns = LEAD_COLUMNS.filter((c) => c.key !== '_select' && c.key !== '_row_num');

  const getLabel = (col: typeof LEAD_COLUMNS[number]) => {
    if (columnLabelOverrides[col.key]) return columnLabelOverrides[col.key];
    try { return t(`colLabels.${col.key}` as Parameters<typeof t>[0]); } catch { return col.label; }
  };

  return (
    <div ref={ref} className="relative">
      <Button
        variant="secondary"
        size="sm"
        icon={<Columns3 className="h-4 w-4" />}
        onClick={() => setOpen(!open)}
      >
        {t('columns')}
      </Button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-52 rounded-lg border border-gray-200 bg-white py-2 shadow-xl">
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
            {t('visibleColumns')}
          </p>
          {toggleableColumns.map((col) => (
            <label
              key={col.key}
              className="flex cursor-pointer items-center gap-2.5 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              <input
                type="checkbox"
                checked={!hiddenColumns.has(col.key)}
                onChange={() => toggleColumn(col.key)}
                className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              {getLabel(col)}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Delete Confirmation Modal ───────────────────────────

function DeleteConfirmModal({
  count,
  onConfirm,
  onCancel,
  loading,
  error,
}: {
  count: number;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
  error: string | null;
}) {
  const t = useTranslations('leads');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={!loading ? onCancel : undefined} />
      <div className="relative w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-2xl">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-gray-900">{t('deleteConfirmTitle')}</h3>
            <p className="mt-1.5 text-sm text-gray-600">
              {t('deleteConfirmDesc', { count })}
            </p>
            {error && (
              <p className="mt-2 text-sm font-medium text-red-600">{error}</p>
            )}
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" size="sm" onClick={onCancel} disabled={loading}>
            {t('cancel')}
          </Button>
          <Button
            variant="danger"
            size="sm"
            icon={loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? t('deleting') : t('deleteConfirmBtn')}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Bulk Action Bar ─────────────────────────────────────

type BulkModal = 'stage' | 'assign' | 'tag' | 'delete' | null;

export function BulkActionBar() {
  const t = useTranslations('leads');
  const tRouting = useTranslations('routing');
  const selectedLeadIds = useAppStore((s) => s.selectedLeadIds);
  const clearSelection = useAppStore((s) => s.clearSelection);
  const deleteLeads = useAppStore((s) => s.deleteLeads);
  const triggerLeadsRefresh = useAppStore((s) => s.triggerLeadsRefresh);
  const stages = useAppStore((s) => s.stages);
  const members = useAppStore((s) => s.members);
  const bulkActionModal = useAppStore((s) => s.bulkActionModal);
  const setBulkActionModal = useAppStore((s) => s.setBulkActionModal);
  const setSyncNotice = useAppStore((s) => s.setSyncNotice);

  const [modal, setModal] = useState<BulkModal>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStageId, setSelectedStageId] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [runningRules, setRunningRules] = useState(false);
  const [runRulesResult, setRunRulesResult] = useState<string | null>(null);

  const openModal = useCallback((m: BulkModal) => {
    setError(null);
    setDeleteError(null);
    setSelectedStageId('');
    setSelectedUserId('');
    setTagInput('');
    setModal(m);
  }, []);

  // Sync external trigger (e.g. from context menu)
  useEffect(() => {
    if (bulkActionModal) {
      openModal(bulkActionModal);
      setBulkActionModal(null);
    }
  }, [bulkActionModal, openModal, setBulkActionModal]);
  if (selectedLeadIds.size === 0) return null;

  const ids = Array.from(selectedLeadIds);

  const bulkApi = async (action: string, extra: Record<string, unknown>) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/leads/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, lead_ids: ids, data: extra }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'An error occurred');
      }
      const data = await res.json().catch(() => ({}));
      clearSelection();
      setModal(null);
      triggerLeadsRefresh();

      // Surface the stage→Meta audience sync summary (best-effort, never blocks).
      const m = action === 'stage' ? data?.meta_sync : null;
      if (m) {
        if (m.pending) {
          setSyncNotice({ message: t('sync.pending'), variant: 'info' });
        } else if (m.synced > 0 && m.failed === 0 && m.skipped === 0) {
          setSyncNotice({ message: t('sync.bulkOk', { count: m.synced }), variant: 'ok' });
        } else if (m.synced > 0 || m.skipped > 0 || m.failed > 0) {
          setSyncNotice({
            message: t('sync.bulkMixed', { synced: m.synced, skipped: m.skipped, failed: m.failed }),
            variant: m.failed > 0 ? 'warn' : 'info',
          });
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch('/api/leads/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', lead_ids: ids }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || t('deleteError', { status: res.status }));
      }
      deleteLeads(ids);
      clearSelection();
      setModal(null);
      triggerLeadsRefresh();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : t('deleteError', { status: '?' }));
    } finally {
      setDeleting(false);
    }
  };

  const handleRunRules = async () => {
    setRunningRules(true);
    setRunRulesResult(null);
    try {
      const res = await fetch('/api/leads/route-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_ids: ids }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'An error occurred');
      }
      const data = await res.json().catch(() => ({}));
      const count: number = data.count ?? (Array.isArray(data.results) ? data.results.length : ids.length);
      setRunRulesResult(tRouting('runDone', { count }));
      clearSelection();
      triggerLeadsRefresh();
    } catch (err) {
      setRunRulesResult(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setRunningRules(false);
    }
  };

  return (
    <>
      {/* Stage Modal */}
      {modal === 'stage' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setModal(null)} />
          <div className="relative w-full max-w-sm rounded-xl border border-gray-200 bg-white p-6 shadow-2xl">
            <h3 className="mb-4 text-base font-semibold text-gray-900">{t('changeStage')} ({ids.length} lead)</h3>
            <select
              value={selectedStageId}
              onChange={(e) => setSelectedStageId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            >
              <option value="">Select...</option>
              {stages.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setModal(null)} disabled={loading}>{t('cancel')}</Button>
              <Button variant="primary" size="sm" disabled={!selectedStageId || loading}
                icon={loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GitBranch className="h-4 w-4" />}
                onClick={() => bulkApi('stage', { stage_id: selectedStageId })}>
                {loading ? 'Saving...' : t('changeStage')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {modal === 'assign' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setModal(null)} />
          <div className="relative w-full max-w-sm rounded-xl border border-gray-200 bg-white p-6 shadow-2xl">
            <h3 className="mb-4 text-base font-semibold text-gray-900">{t('assign')} ({ids.length} lead)</h3>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            >
              <option value="">Select...</option>
              {members.map((m) => (
                <option key={m.user_id} value={m.user_id}>
                  {m.profile?.full_name || m.profile?.email || m.user_id}
                </option>
              ))}
            </select>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setModal(null)} disabled={loading}>{t('cancel')}</Button>
              <Button variant="primary" size="sm" disabled={!selectedUserId || loading}
                icon={loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                onClick={() => bulkApi('assign', { assigned_to: selectedUserId })}>
                {loading ? 'Saving...' : t('assign')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Tag Modal */}
      {modal === 'tag' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setModal(null)} />
          <div className="relative w-full max-w-sm rounded-xl border border-gray-200 bg-white p-6 shadow-2xl">
            <h3 className="mb-4 text-base font-semibold text-gray-900">{t('addTag')} ({ids.length} lead)</h3>
            <input
              type="text"
              placeholder="Add tag (comma-separated)"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              onKeyDown={(e) => { if (e.key === 'Enter' && tagInput.trim()) bulkApi('tag', { tags: tagInput.split(',').map(t => t.trim()).filter(Boolean) }); }}
            />
            <p className="mt-1 text-xs text-gray-400">Separate multiple tags with commas</p>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setModal(null)} disabled={loading}>{t('cancel')}</Button>
              <Button variant="primary" size="sm" disabled={!tagInput.trim() || loading}
                icon={loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Tag className="h-4 w-4" />}
                onClick={() => bulkApi('tag', { tags: tagInput.split(',').map(tg => tg.trim()).filter(Boolean) })}>
                {loading ? 'Kaydediliyor...' : t('addTag')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {modal === 'delete' && (
        <DeleteConfirmModal
          count={selectedLeadIds.size}
          onConfirm={handleDelete}
          onCancel={() => setModal(null)}
          loading={deleting}
          error={deleteError}
        />
      )}

      <div className="absolute bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white px-6 py-3 shadow-lg">
        <div className="mx-auto flex max-w-7xl items-center gap-4">
          <span className="text-sm font-medium text-gray-700">
            {t('selected', { count: selectedLeadIds.size })}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" icon={<GitBranch className="h-4 w-4" />} onClick={() => openModal('stage')}>
              {t('changeStage')}
            </Button>
            <Button variant="secondary" size="sm" icon={<UserPlus className="h-4 w-4" />} onClick={() => openModal('assign')}>
              {t('assign')}
            </Button>
            <Button variant="secondary" size="sm" icon={<Tag className="h-4 w-4" />} onClick={() => openModal('tag')}>
              {t('addTag')}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={runningRules ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              onClick={handleRunRules}
              disabled={runningRules}
            >
              {runningRules ? tRouting('running') : tRouting('runRules')}
            </Button>
            {runRulesResult && (
              <span className="text-xs text-gray-600">{runRulesResult}</span>
            )}
            <Button variant="danger" size="sm" icon={<Trash2 className="h-4 w-4" />} onClick={() => openModal('delete')}>
              {t('delete')}
            </Button>
          </div>
          <div className="ml-auto">
            <Button variant="ghost" size="sm" onClick={clearSelection}>
              {t('clearSelection')}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Source Filter Dropdown ──────────────────────────────

const SOURCE_FILTER_OPTIONS = [
  { value: 'meta_lead_form', label: 'Meta Lead Form' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'instagram_dm', label: 'Instagram DM' },
  { value: 'messenger', label: 'Messenger' },
  { value: 'website', label: 'Website' },
  { value: 'manual', label: 'Manual' },
  { value: 'import', label: 'Import' },
  { value: 'other', label: 'Other' },
];

function SourceFilterDropdown() {
  const t = useTranslations('leads');
  const sourceFilter = useAppStore((s) => s.sourceFilter);
  const setSourceFilter = useAppStore((s) => s.setSourceFilter);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const activeLabel = SOURCE_FILTER_OPTIONS.find((o) => o.value === sourceFilter)?.label;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-colors',
          sourceFilter
            ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
            : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
        )}
      >
        <span>{activeLabel || t('source')}</span>
        {sourceFilter ? (
          <X
            className="h-3.5 w-3.5 text-emerald-400 hover:text-emerald-700"
            onClick={(e) => { e.stopPropagation(); setSourceFilter(''); setOpen(false); }}
          />
        ) : (
          <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1.5 w-44 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
          {sourceFilter && (
            <button
              onClick={() => { setSourceFilter(''); setOpen(false); }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50"
            >
              <X className="h-3.5 w-3.5" />
              {t('clearFilter')}
            </button>
          )}
          {SOURCE_FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { setSourceFilter(opt.value); setOpen(false); }}
              className={cn(
                'flex w-full items-center justify-between px-3 py-2 text-sm transition-colors',
                sourceFilter === opt.value ? 'bg-emerald-50 font-medium text-emerald-700' : 'text-gray-700 hover:bg-gray-50'
              )}
            >
              {opt.label}
              {sourceFilter === opt.value && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Table (Import Job) Filter ────────────────────────────

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

// Mapping from import field names to lead grid column keys
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

// Columns that are always visible regardless of import mapping.
// Core identity + CRM system columns. score/campaign_name/tags are intentionally
// left out so they stay hidden-by-default (see DEFAULT_HIDDEN_COLUMNS); the user
// can still re-enable them from the "Kolonlar" menu.
const ALWAYS_VISIBLE = new Set([
  '_select', '_row_num',
  'full_name', 'phone', 'email',
  'stage', 'assigned_to', 'first_seen_at', 'last_activity_at',
]);

type ImportJobSummary = {
  id: string;
  file_name: string;
  status: string;
  total_rows: number;
  created_rows: number;
  created_at: string;
  column_mapping?: Record<string, string>;
};

function TableFilterDropdown() {
  const t = useTranslations('leads');
  const importJobFilter = useAppStore((s) => s.importJobFilter);
  const setImportJobFilter = useAppStore((s) => s.setImportJobFilter);
  const setFormFilter = useAppStore((s) => s.setFormFilter);
  const setHiddenColumns = useAppStore((s) => s.setHiddenColumns);
  const setColumnLabelOverrides = useAppStore((s) => s.setColumnLabelOverrides);
  const [open, setOpen] = useState(false);
  const [jobs, setJobs] = useState<ImportJobSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const loadJobs = async () => {
    if (jobs.length > 0) return;
    setLoading(true);
    try {
      const res = await fetch('/api/leads/import');
      if (res.ok) {
        const data = await res.json();
        setJobs(data.imports || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setOpen((o) => !o);
    if (!open) loadJobs();
  };

  const selectJob = (job: ImportJobSummary) => {
    // Derive which grid columns are relevant from this import's column_mapping
    const mappedFields = new Set<string>();
    const labelOverrides: Record<string, string> = {};

    if (job.column_mapping) {
      // column_mapping is now Record<crmField, fileCol>
      Object.entries(job.column_mapping).forEach(([crmField, fileCol]) => {
        if (crmField && crmField !== '_skip' && fileCol && fileCol !== '_skip') {
          const gridCol = FIELD_TO_COLUMN[crmField];
          if (gridCol) {
            mappedFields.add(gridCol);
            // Use title-cased file column name as the grid column label
            if (!labelOverrides[gridCol]) {
              labelOverrides[gridCol] = toTitleCase(fileCol);
            }
          }
        }
      });
    }
    // Always include essential columns
    ALWAYS_VISIBLE.forEach((c) => mappedFields.add(c));

    // Hide all LEAD_COLUMNS not in mappedFields
    const allColKeys = ['full_name', 'phone', 'email', 'source_platform', 'stage', 'score', 'assigned_to', 'campaign_name', 'city', 'company', 'tags', 'first_seen_at', 'last_activity_at'];
    const newHidden = new Set<string>();
    allColKeys.forEach((k) => {
      if (!mappedFields.has(k)) newHidden.add(k);
    });

    setFormFilter(null); // mutually exclusive with the form filter
    setImportJobFilter({ id: job.id, name: job.file_name, columns: [...mappedFields] });
    setHiddenColumns(newHidden);
    setColumnLabelOverrides(labelOverrides);
    setOpen(false);
  };

  const clearFilter = () => {
    setImportJobFilter(null);
    setHiddenColumns(new Set(DEFAULT_HIDDEN_COLUMNS));
    setColumnLabelOverrides({});
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleOpen}
        className={cn(
          'flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-colors',
          importJobFilter
            ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
            : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
        )}
      >
        <span className="max-w-[120px] truncate">{importJobFilter ? importJobFilter.name : t('table')}</span>
        {importJobFilter ? (
          <X
            className="h-3.5 w-3.5 text-emerald-400 hover:text-emerald-700"
            onClick={(e) => { e.stopPropagation(); clearFilter(); }}
          />
        ) : (
          <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1.5 w-64 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
          <div className="border-b border-gray-100 px-3 py-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{t('recentImports')}</p>
          </div>
          {loading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            </div>
          )}
          {!loading && jobs.length === 0 && (
            <p className="px-3 py-3 text-sm text-gray-400">{t('noImports')}</p>
          )}
          {!loading && importJobFilter && (
            <button
              onClick={clearFilter}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50"
            >
              <X className="h-3.5 w-3.5" />
              {t('clearFilter')}
            </button>
          )}
          {!loading && jobs.map((job) => (
            <button
              key={job.id}
              onClick={() => selectJob(job)}
              className={cn(
                'flex w-full flex-col items-start px-3 py-2.5 text-left transition-colors hover:bg-gray-50',
                importJobFilter?.id === job.id ? 'bg-emerald-50' : ''
              )}
            >
              <span className={cn('truncate text-sm font-medium', importJobFilter?.id === job.id ? 'text-emerald-700' : 'text-gray-800')}>
                {job.file_name}
              </span>
              <span className="text-xs text-gray-400">
                {job.created_rows ?? job.total_rows} rows · {new Date(job.created_at).toLocaleDateString()}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Meta Lead Form Filter (dynamic columns) ─────────────

// Columns always shown in form mode (identity + CRM-system columns). The
// form's collected fields (email/phone/city/company…) are added on top.
const FORM_CORE_VISIBLE = ['full_name', 'stage', 'source_platform', 'assigned_to', 'first_seen_at', 'last_activity_at'];
const ALL_DATA_COLUMNS = ['full_name', 'phone', 'email', 'source_platform', 'stage', 'score', 'assigned_to', 'campaign_name', 'city', 'company', 'tags', 'first_seen_at', 'last_activity_at'];

type FormItem = { id: string; name: string; pageId: string; pageName: string | null };

function FormFilterDropdown() {
  const t = useTranslations('leads');
  const connectedPages = useAppStore((s) => s.connectedPages);
  const formFilter = useAppStore((s) => s.formFilter);
  const setFormFilter = useAppStore((s) => s.setFormFilter);
  const setImportJobFilter = useAppStore((s) => s.setImportJobFilter);
  const setHiddenColumns = useAppStore((s) => s.setHiddenColumns);
  const setColumnLabelOverrides = useAppStore((s) => s.setColumnLabelOverrides);
  const [open, setOpen] = useState(false);
  const [forms, setForms] = useState<FormItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const loadForms = async () => {
    if (loaded || connectedPages.length === 0) return;
    setLoading(true);
    try {
      const results = await Promise.all(
        connectedPages.map(async (p) => {
          try {
            const res = await fetch(`/api/integrations/meta/forms?page_id=${encodeURIComponent(p.page_id)}`);
            if (!res.ok) return [] as FormItem[];
            const data = await res.json();
            return ((data.forms || []) as { id: string; name?: string }[]).map((f) => ({
              id: f.id,
              name: f.name || f.id,
              pageId: p.page_id,
              pageName: p.page_name,
            }));
          } catch {
            return [] as FormItem[];
          }
        })
      );
      setForms(results.flat());
      setLoaded(true);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setOpen((o) => !o);
    if (!open) loadForms();
  };

  const selectForm = async (form: FormItem) => {
    // Resolve which grid columns this form actually collects.
    let columns: string[] = ['full_name', 'phone', 'email']; // safe fallback
    try {
      const res = await fetch(
        `/api/integrations/meta/forms?page_id=${encodeURIComponent(form.pageId)}&form_id=${encodeURIComponent(form.id)}`
      );
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.columns) && data.columns.length > 0) columns = data.columns;
      }
    } catch { /* keep fallback */ }

    const visible = new Set<string>([...FORM_CORE_VISIBLE, ...columns]);
    const newHidden = new Set<string>();
    ALL_DATA_COLUMNS.forEach((k) => { if (!visible.has(k)) newHidden.add(k); });

    setImportJobFilter(null); // mutually exclusive with the import filter
    setFormFilter({ id: form.id, name: form.name, pageId: form.pageId });
    setHiddenColumns(newHidden);
    setColumnLabelOverrides({});
    setOpen(false);
  };

  const clearFilter = () => {
    setFormFilter(null);
    setHiddenColumns(new Set(DEFAULT_HIDDEN_COLUMNS));
    setColumnLabelOverrides({});
    setOpen(false);
  };

  // Hide entirely when no Meta pages are connected (nothing to pick from).
  if (connectedPages.length === 0) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleOpen}
        className={cn(
          'flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-colors',
          formFilter
            ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
            : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
        )}
      >
        <span className="max-w-[120px] truncate">{formFilter ? formFilter.name : t('formFilter')}</span>
        {formFilter ? (
          <X
            className="h-3.5 w-3.5 text-emerald-400 hover:text-emerald-700"
            onClick={(e) => { e.stopPropagation(); clearFilter(); }}
          />
        ) : (
          <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1.5 w-72 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
          <div className="border-b border-gray-100 px-3 py-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{t('forms')}</p>
          </div>
          {loading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            </div>
          )}
          {!loading && forms.length === 0 && (
            <p className="px-3 py-3 text-sm text-gray-400">{t('noForms')}</p>
          )}
          {!loading && formFilter && (
            <button
              onClick={clearFilter}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50"
            >
              <X className="h-3.5 w-3.5" />
              {t('clearFilter')}
            </button>
          )}
          {!loading && forms.map((form) => (
            <button
              key={`${form.pageId}:${form.id}`}
              onClick={() => selectForm(form)}
              className={cn(
                'flex w-full flex-col items-start px-3 py-2.5 text-left transition-colors hover:bg-gray-50',
                formFilter?.id === form.id ? 'bg-emerald-50' : ''
              )}
            >
              <span className={cn('truncate text-sm font-medium', formFilter?.id === form.id ? 'text-emerald-700' : 'text-gray-800')}>
                {form.name}
              </span>
              {form.pageName && <span className="truncate text-xs text-gray-400">{form.pageName}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Per-page Dropdown ────────────────────────────────────

function PerPageDropdown() {
  const perPage = useAppStore((s) => s.perPage);
  const setPerPage = useAppStore((s) => s.setPerPage);
  const total = useAppStore((s) => s.total);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Lead sayısına göre 25'er artan dinamik seçenekler (kullanıcı tüm leadleri görebilsin)
  const cap = Math.min(Math.max(Math.ceil((total || 0) / 25) * 25, 50), 1000);
  const perPageOptions: number[] = [];
  for (let n = 25; n <= cap; n += 25) perPageOptions.push(n);
  if (perPage > cap && !perPageOptions.includes(perPage)) perPageOptions.push(perPage);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <span>{perPage}{total > 0 && <span className="text-gray-400"> / {total}</span>}</span>
        <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1.5 w-24 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
          {perPageOptions.map(n => (
            <button
              key={n}
              onClick={() => { setPerPage(n); setOpen(false); }}
              className={`flex w-full items-center justify-between px-4 py-2 text-sm transition-colors ${
                perPage === n ? 'bg-emerald-50 font-medium text-emerald-700' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {n}
              {perPage === n && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Toolbar ────────────────────────────────────────

export function LeadToolbar() {
  const router = useRouter();
  const t = useTranslations('leads');
  const tNav = useTranslations('nav');
  const searchQuery = useAppStore((s) => s.searchQuery);
  const setSearchQuery = useAppStore((s) => s.setSearchQuery);
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [createOpen, setCreateOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setLocalSearch(val);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        setSearchQuery(val);
      }, 300);
    },
    [setSearchQuery]
  );

  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, []);

  return (
    <>
      <div className="flex flex-nowrap items-center gap-2 [&>*]:shrink-0">
        {/* Search — the only item allowed to shrink so the row stays on one line */}
        <div className="relative min-w-[150px] max-w-md flex-1 !shrink">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={localSearch}
            onChange={handleSearchChange}
            className={cn(
              'block w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-3.5 text-sm text-gray-900',
              'placeholder:text-gray-400 transition-colors',
              'focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20'
            )}
          />
        </div>

        <AccountFilter />
        <LeadFilters />
        <SourceFilterDropdown />
        <FormFilterDropdown />
        <TableFilterDropdown />
        <SortDropdown />
        <ColumnVisibilityDropdown />
        <PerPageDropdown />

        <div className="flex-1 !shrink" />

        <Button
          variant="secondary"
          size="sm"
          icon={<Upload className="h-4 w-4" />}
          onClick={() => router.push('/import')}
        >
          {tNav('import')}
        </Button>

        <Button
          variant="primary"
          size="sm"
          icon={<Plus className="h-4 w-4" />}
          onClick={() => setCreateOpen(true)}
        >
          {t('newLead')}
        </Button>
      </div>

      <LeadCreateModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </>
  );
}
