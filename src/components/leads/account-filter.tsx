'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Building2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/store';
import { useTranslations } from 'next-intl';

/**
 * Account/page dropdown filter for the lead area.
 * Lists every connected Meta page; selecting one filters leads by that page
 * (server-side via `meta_page_id`). "All accounts" clears the filter.
 * Renders nothing when no Meta page is connected.
 */
export function AccountFilter() {
  const t = useTranslations('leads');
  const connectedPages = useAppStore((s) => s.connectedPages);
  const pageFilter = useAppStore((s) => s.pageFilter);
  const setPageFilter = useAppStore((s) => s.setPageFilter);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  // No connected pages → nothing to filter by.
  if (connectedPages.length === 0) return null;

  const active = pageFilter
    ? connectedPages.find((p) => p.page_id === pageFilter)
    : null;
  const activeLabel = active ? (active.page_name || active.page_id) : t('allAccounts');

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-colors',
          pageFilter
            ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
            : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
        )}
        title={t('account')}
      >
        <Building2 className="h-4 w-4 shrink-0 opacity-70" />
        <span className="max-w-[160px] truncate">{activeLabel}</span>
        <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1.5 max-h-72 w-60 overflow-y-auto overflow-x-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
          <button
            onClick={() => { setPageFilter(null); setOpen(false); }}
            className={cn(
              'flex w-full items-center justify-between gap-2 px-3 py-2 text-sm transition-colors',
              !pageFilter ? 'bg-emerald-50 font-medium text-emerald-700' : 'text-gray-700 hover:bg-gray-50'
            )}
          >
            <span className="truncate">{t('allAccounts')}</span>
            {!pageFilter && <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600" />}
          </button>
          <div className="my-1 border-b border-gray-100" />
          {connectedPages.map((page) => {
            const selected = pageFilter === page.page_id;
            return (
              <button
                key={page.page_id}
                onClick={() => { setPageFilter(page.page_id); setOpen(false); }}
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
        </div>
      )}
    </div>
  );
}
