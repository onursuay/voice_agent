'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Building2, Check, FileSpreadsheet } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore, DEFAULT_HIDDEN_COLUMNS } from '@/lib/store';
import { computeImportJobView } from '@/lib/lead-import-columns';
import { useTranslations } from 'next-intl';

/**
 * Account dropdown filter for the lead area. Lists two kinds of "accounts":
 *  1. Connected Meta pages   → filters leads server-side by `meta_page_id`.
 *  2. Imported lists (import jobs) → filters by `import_job_id` and shapes the
 *     visible columns to the import's mapped fields.
 * Selecting one clears the other (mutually exclusive — a Meta-page filter ANDed
 * with an import filter would always return zero). "All accounts" clears both.
 * Renders nothing when there is neither a Meta page nor an import to filter by.
 */
export function AccountFilter() {
  const t = useTranslations('leads');
  const connectedPages = useAppStore((s) => s.connectedPages);
  const importJobs = useAppStore((s) => s.importJobs);
  const pageFilter = useAppStore((s) => s.pageFilter);
  const setPageFilter = useAppStore((s) => s.setPageFilter);
  const importJobFilter = useAppStore((s) => s.importJobFilter);
  const setImportJobFilter = useAppStore((s) => s.setImportJobFilter);
  const setFormFilter = useAppStore((s) => s.setFormFilter);
  const setHiddenColumns = useAppStore((s) => s.setHiddenColumns);
  const setColumnLabelOverrides = useAppStore((s) => s.setColumnLabelOverrides);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  // Nothing to filter by → render nothing.
  if (connectedPages.length === 0 && importJobs.length === 0) return null;

  // Reset grid columns/labels back to baseline (used when leaving an import view).
  const resetColumns = () => {
    setHiddenColumns(new Set(DEFAULT_HIDDEN_COLUMNS));
    setColumnLabelOverrides({});
  };

  const selectAll = () => {
    setPageFilter(null);
    setImportJobFilter(null);
    setFormFilter(null);
    resetColumns();
    setOpen(false);
  };

  const selectPage = (pageId: string) => {
    setPageFilter(pageId);
    setImportJobFilter(null);
    setFormFilter(null);
    resetColumns();
    setOpen(false);
  };

  const selectImport = (job: typeof importJobs[number]) => {
    const view = computeImportJobView(job);
    setImportJobFilter({ id: job.id, name: job.file_name, columns: view.columns });
    setPageFilter(null);
    setFormFilter(null);
    setHiddenColumns(view.hidden);
    setColumnLabelOverrides(view.labels);
    setOpen(false);
  };

  const activePage = pageFilter ? connectedPages.find((p) => p.page_id === pageFilter) : null;
  const activeLabel = importJobFilter
    ? importJobFilter.name
    : activePage
    ? (activePage.page_name || activePage.page_id)
    : t('allAccounts');
  const hasSelection = !!pageFilter || !!importJobFilter;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-colors',
          hasSelection
            ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
            : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
        )}
        title={t('account')}
      >
        {importJobFilter ? (
          <FileSpreadsheet className="h-4 w-4 shrink-0 opacity-70" />
        ) : (
          <Building2 className="h-4 w-4 shrink-0 opacity-70" />
        )}
        <span className="acc-name max-w-[160px] truncate">{activeLabel}</span>
        <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1.5 max-h-80 w-64 overflow-y-auto overflow-x-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
          <button
            onClick={selectAll}
            className={cn(
              'flex w-full items-center justify-between gap-2 px-3 py-2 text-sm transition-colors',
              !hasSelection ? 'bg-emerald-50 font-medium text-emerald-700' : 'text-gray-700 hover:bg-gray-50'
            )}
          >
            <span className="truncate">{t('allAccounts')}</span>
            {!hasSelection && <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600" />}
          </button>

          {connectedPages.length > 0 && (
            <>
              <div className="mt-1 border-t border-gray-100 px-3 pb-1 pt-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">{t('metaAccounts')}</p>
              </div>
              {connectedPages.map((page) => {
                const selected = pageFilter === page.page_id;
                return (
                  <button
                    key={page.page_id}
                    onClick={() => selectPage(page.page_id)}
                    className={cn(
                      'flex w-full items-center justify-between gap-2 px-3 py-2 text-sm transition-colors',
                      selected ? 'bg-emerald-50 font-medium text-emerald-700' : 'text-gray-700 hover:bg-gray-50'
                    )}
                  >
                    <span className="truncate">{page.page_name || page.page_id}</span>
                    {selected && <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600" />}
                  </button>
                );
              })}
            </>
          )}

          {importJobs.length > 0 && (
            <>
              <div className="mt-1 border-t border-gray-100 px-3 pb-1 pt-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">{t('importLists')}</p>
              </div>
              {importJobs.map((job) => {
                const selected = importJobFilter?.id === job.id;
                return (
                  <button
                    key={job.id}
                    onClick={() => selectImport(job)}
                    className={cn(
                      'flex w-full items-start justify-between gap-2 px-3 py-2 text-sm transition-colors',
                      selected ? 'bg-emerald-50 font-medium text-emerald-700' : 'text-gray-700 hover:bg-gray-50'
                    )}
                  >
                    <span className="flex min-w-0 flex-col items-start">
                      <span className="truncate">{job.file_name}</span>
                      <span className="text-xs font-normal text-gray-400">
                        {(job.created_rows ?? job.total_rows)} · {new Date(job.created_at).toLocaleDateString()}
                      </span>
                    </span>
                    {selected && <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />}
                  </button>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}
