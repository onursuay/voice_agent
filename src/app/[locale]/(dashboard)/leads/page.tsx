'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useAppStore } from '@/lib/store';
import { computeImportJobView } from '@/lib/lead-import-columns';
import { LeadGrid, SyncToast } from '@/components/leads/lead-grid';
import { LeadToolbar, BulkActionBar } from '@/components/leads/lead-toolbar';
import { LeadDetailDrawer } from '@/components/leads/lead-detail-drawer';
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
  const setTotal = useAppStore(s => s.setTotal);
  const sourceFilter = useAppStore(s => s.sourceFilter);
  const showSynced = useAppStore(s => s.showSynced);
  const importJobFilter = useAppStore(s => s.importJobFilter);
  const setImportJobFilter = useAppStore(s => s.setImportJobFilter);
  const formFilter = useAppStore(s => s.formFilter);
  const pageFilter = useAppStore(s => s.pageFilter);
  const setPageFilter = useAppStore(s => s.setPageFilter);
  const setConnectedPages = useAppStore(s => s.setConnectedPages);
  const setImportJobs = useAppStore(s => s.setImportJobs);
  const setHiddenColumns = useAppStore(s => s.setHiddenColumns);
  const setColumnLabelOverrides = useAppStore(s => s.setColumnLabelOverrides);

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
      if (formFilter) params.set('meta_form_id', formFilter.id);
      if (pageFilter) params.set('meta_page_id', pageFilter);
      // Sayfalama yok — tüm leadler tek listede; yeni gelenler created_at artan ile alta eklenir.
      params.set('per_page', '1000');
      // Meta Custom Audience'e başarıyla senkronize tamamlanmış leadleri varsayılan gizle.
      if (showSynced) params.set('hide_synced', 'false');

      const res = await fetch(`/api/leads?${params.toString()}`);
      if (!res.ok) throw new Error(t('loadError'));

      const data = await res.json();
      const arr = Array.isArray(data) ? data : data.leads || [];
      setLeads(arr);
      setTotal(typeof data.total === 'number' ? data.total : arr.length);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('loadError'));
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filters, sort, setLeads, setTotal, t, sourceFilter, importJobFilter, formFilter, pageFilter, showSynced]);

  useEffect(() => { if (pagesReady) fetchLeads(); }, [fetchLeads, pagesReady]);

  // Load the account dropdown's two sources (connected Meta pages + import lists)
  // and restore the saved account selection. The saved account is either a Meta
  // page ({type:'page'}) or an import list ({type:'import'}); whichever it is, we
  // re-apply it (an import selection also re-shapes the visible columns). Drops the
  // selection if its page/import no longer exists, so a stale account never filters
  // the list silently to zero. Flips `pagesReady` last (always), releasing the
  // gated first fetch with the correct account already applied.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      let pages: { page_id: string; page_name: string | null }[] = [];
      let jobs: { id: string; file_name: string; status: string; total_rows: number; created_rows: number; created_at: string; column_mapping?: Record<string, string> }[] = [];
      try {
        const [pagesRes, jobsRes] = await Promise.all([
          fetch('/api/integrations/meta/pages'),
          fetch('/api/leads/import'),
        ]);
        if (pagesRes.ok) pages = (await pagesRes.json())?.pages || [];
        if (jobsRes.ok) jobs = (await jobsRes.json())?.imports || [];
      } catch { /* ignore */ }
      if (cancelled) return;

      setConnectedPages(pages);
      setImportJobs(jobs);

      // Restore saved account selection (Meta page OR import list).
      let saved: { type?: string; id?: string } | null = null;
      try {
        const raw = window.localStorage.getItem('leads.account');
        if (raw) saved = JSON.parse(raw);
      } catch { /* unavailable */ }

      let restored = false;
      if (saved?.type === 'page' && saved.id && pages.some((p) => p.page_id === saved.id)) {
        setPageFilter(saved.id);
        restored = true;
      } else if (saved?.type === 'import' && saved.id) {
        const job = jobs.find((j) => j.id === saved.id);
        if (job) {
          const view = computeImportJobView(job);
          setImportJobFilter({ id: job.id, name: job.file_name, columns: view.columns });
          setHiddenColumns(view.hidden);
          setColumnLabelOverrides(view.labels);
          restored = true;
        }
      }
      if (!restored) {
        try {
          window.localStorage.removeItem('leads.account');
          window.localStorage.removeItem('leads.pageFilter'); // legacy key cleanup
        } catch { /* unavailable */ }
      }

      hydratedRef.current = true;
      setPagesReady(true);
    })();
    return () => { cancelled = true; };
  }, [setConnectedPages, setImportJobs, setPageFilter, setImportJobFilter, setHiddenColumns, setColumnLabelOverrides]);

  // Persist the active account selection across reloads (only after restore ran).
  // Mutually exclusive: an import-list selection takes precedence over a page one.
  useEffect(() => {
    if (typeof window === 'undefined' || !hydratedRef.current) return;
    try {
      if (importJobFilter) {
        window.localStorage.setItem('leads.account', JSON.stringify({ type: 'import', id: importJobFilter.id }));
      } else if (pageFilter) {
        window.localStorage.setItem('leads.account', JSON.stringify({ type: 'page', id: pageFilter }));
      } else {
        window.localStorage.removeItem('leads.account');
      }
    } catch { /* localStorage unavailable */ }
  }, [pageFilter, importJobFilter]);

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
        {error ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3">
            <p className="text-sm text-red-500">{error}</p>
            <Button variant="secondary" size="sm" onClick={fetchLeads}>{t('retry')}</Button>
          </div>
        ) : (
          <LeadGrid loading={loading} />
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
