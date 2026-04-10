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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { LeadFilters } from './lead-filters';
import { LeadCreateModal } from './lead-create-modal';
import { LEAD_COLUMNS } from './lead-grid';
import { useTranslations } from 'next-intl';

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
                    ? 'text-indigo-600 bg-indigo-50'
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
                    ? 'text-indigo-600 bg-indigo-50'
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
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              {col.label}
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

export function BulkActionBar() {
  const t = useTranslations('leads');
  const selectedLeadIds = useAppStore((s) => s.selectedLeadIds);
  const clearSelection = useAppStore((s) => s.clearSelection);
  const deleteLeads = useAppStore((s) => s.deleteLeads);
  const triggerLeadsRefresh = useAppStore((s) => s.triggerLeadsRefresh);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  if (selectedLeadIds.size === 0) return null;

  const handleDeleteClick = () => {
    setDeleteError(null);
    setConfirmOpen(true);
  };

  const handleConfirm = async () => {
    if (deleting) return;
    const ids = Array.from(selectedLeadIds);
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
      setConfirmOpen(false);
      triggerLeadsRefresh();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : t('deleteError', { status: '?' }));
    } finally {
      setDeleting(false);
    }
  };

  const handleCancel = () => {
    if (deleting) return;
    setConfirmOpen(false);
    setDeleteError(null);
  };

  return (
    <>
      {confirmOpen && (
        <DeleteConfirmModal
          count={selectedLeadIds.size}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
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
            <Button variant="secondary" size="sm" icon={<GitBranch className="h-4 w-4" />}>
              {t('changeStage')}
            </Button>
            <Button variant="secondary" size="sm" icon={<UserPlus className="h-4 w-4" />}>
              {t('assign')}
            </Button>
            <Button variant="secondary" size="sm" icon={<Tag className="h-4 w-4" />}>
              {t('addTag')}
            </Button>
            <Button variant="danger" size="sm" icon={<Trash2 className="h-4 w-4" />} onClick={handleDeleteClick}>
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

// ── Main Toolbar ────────────────────────────────────────

export function LeadToolbar() {
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
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative min-w-[240px] flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={localSearch}
            onChange={handleSearchChange}
            className={cn(
              'block w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-3.5 text-sm text-gray-900',
              'placeholder:text-gray-400 transition-colors',
              'focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20'
            )}
          />
        </div>

        <LeadFilters />
        <SortDropdown />
        <ColumnVisibilityDropdown />

        <div className="flex-1" />

        <Button
          variant="secondary"
          size="sm"
          icon={<Upload className="h-4 w-4" />}
          onClick={() => (window.location.href = '/dashboard/import')}
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
