'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useAppStore } from '@/lib/store';
import { LeadGrid, SyncToast } from '@/components/leads/lead-grid';
import { LeadToolbar, BulkActionBar } from '@/components/leads/lead-toolbar';
import { LeadDetailDrawer } from '@/components/leads/lead-detail-drawer';
import { EmptyState } from '@/components/ui/empty-state';
import { Spinner } from '@/components/ui/loading';
import { Button } from '@/components/ui/button';

export default function LeadsPage() {
  const t = useTranslations('leads');
  const leads = useAppStore(s => s.leads);
  const setLeads = useAppStore(s => s.setLeads);
  const searchQuery = useAppStore(s => s.searchQuery);
  const filters = useAppStore(s => s.filters);
  const sort = useAppStore(s => s.sort);
  const activeLeadId = useAppStore(s => s.activeLeadId);
  const leadsNeedRefresh = useAppStore(s => s.leadsNeedRefresh);
  const perPage = useAppStore(s => s.perPage);
  const sourceFilter = useAppStore(s => s.sourceFilter);
  const importJobFilter = useAppStore(s => s.importJobFilter);
  const pageFilter = useAppStore(s => s.pageFilter);
  const setPageFilter = useAppStore(s => s.setPageFilter);
  const setConnectedPages = useAppStore(s => s.setConnectedPages);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // Only persist pageFilter after the saved value has been restored, so the
  // initial null state doesn't wipe localStorage before restore reads it.
  const hydratedRef = useRef(false);
  // Gate the first fetch until the saved account selection is restored, so a
  // refresh never flashes the previous (or all-accounts) data before swapping
  // to the actually-selected account.
  const [pagesReady, setPagesReady] = useState(false);

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      if (sort) {
        params.set('sort_by', sort.column);
        params.set('sort_dir', sort.direction);
      }
      if (filters.length > 0) params.set('filters', JSON.stringify(filters));
      if (sourceFilter) params.set('source_platform', sourceFilter);
      if (importJobFilter) params.set('import_job_id', importJobFilter.id);
      if (pageFilter) params.set('meta_page_id', pageFilter);
      params.set('per_page', String(perPage));

      const res = await fetch(`/api/leads?${params.toString()}`);
      if (!res.ok) throw new Error(t('loadError'));

      const data = await res.json();
      setLeads(Array.isArray(data) ? data : data.leads || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('loadError'));
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filters, sort, setLeads, t, perPage, sourceFilter, importJobFilter, pageFilter]);

  useEffect(() => { if (pagesReady) fetchLeads(); }, [fetchLeads, pagesReady]);

  // Load connected Meta pages for the account dropdown; restore saved selection.
  // Resets the filter (and clears storage) when the saved page no longer exists,
  // so a disconnected page never silently filters the list down to zero leads.
  // Flips `pagesReady` last (always), which releases the gated first fetch with
  // the correct account already applied.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/integrations/meta/pages');
        if (res.ok) {
          const data = await res.json() as { pages?: { page_id: string; page_name: string | null }[] };
          const pages = data.pages || [];
          if (cancelled) return;
          setConnectedPages(pages);
          let stored: string | null = null;
          try { stored = window.localStorage.getItem('leads.pageFilter'); } catch { /* unavailable */ }
          const validId = stored && pages.some((p) => p.page_id === stored) ? stored : null;
          setPageFilter(validId);
          if (!validId) { try { window.localStorage.removeItem('leads.pageFilter'); } catch { /* unavailable */ } }
        }
      } catch { /* ignore */ }
      finally {
        if (!cancelled) {
          hydratedRef.current = true;
          setPagesReady(true);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [setConnectedPages, setPageFilter]);

  // Persist the active page selection across reloads (only after restore ran).
  useEffect(() => {
    if (typeof window === 'undefined' || !hydratedRef.current) return;
    try {
      if (pageFilter) window.localStorage.setItem('leads.pageFilter', pageFilter);
      else window.localStorage.removeItem('leads.pageFilter');
    } catch { /* localStorage unavailable */ }
  }, [pageFilter]);

  useEffect(() => {
    if (leadsNeedRefresh > 0) fetchLeads();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadsNeedRefresh]);

  return (
    <div className="relative flex h-full flex-col">
      <div className="mb-3">
        <LeadToolbar />
      </div>

      <div className="relative flex-1 min-h-0">
        {loading && leads.length === 0 ? (
          <div className="flex h-64 items-center justify-center"><Spinner size="lg" /></div>
        ) : error ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3">
            <p className="text-sm text-red-500">{error}</p>
            <Button variant="secondary" size="sm" onClick={fetchLeads}>{t('retry')}</Button>
          </div>
        ) : leads.length === 0 ? (
          <EmptyState icon={<Users className="h-6 w-6" />} title={t('emptyTitle')} description={t('emptyDesc')} />
        ) : (
          <LeadGrid />
        )}
        {loading && leads.length > 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50"><Spinner size="md" /></div>
        )}
      </div>

      {activeLeadId && <LeadDetailDrawer />}
      <BulkActionBar />
      <SyncToast />
    </div>
  );
}
