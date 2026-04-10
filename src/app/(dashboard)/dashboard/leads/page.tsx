'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Users, ChevronDown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useAppStore } from '@/lib/store';
import { LeadGrid } from '@/components/leads/lead-grid';
import { LeadToolbar, BulkActionBar } from '@/components/leads/lead-toolbar';
import { LeadDetailDrawer } from '@/components/leads/lead-detail-drawer';
import { EmptyState } from '@/components/ui/empty-state';
import { Spinner } from '@/components/ui/loading';
import { Button } from '@/components/ui/button';

const PER_PAGE_OPTIONS = [25, 50, 100, 150, 200, 250, 300, 350, 400, 450, 500];

export default function LeadsPage() {
  const t = useTranslations('leads');
  const leads = useAppStore(s => s.leads);
  const setLeads = useAppStore(s => s.setLeads);
  const searchQuery = useAppStore(s => s.searchQuery);
  const filters = useAppStore(s => s.filters);
  const sort = useAppStore(s => s.sort);
  const activeLeadId = useAppStore(s => s.activeLeadId);
  const leadsNeedRefresh = useAppStore(s => s.leadsNeedRefresh);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [perPage, setPerPage] = useState(25);
  const [perPageOpen, setPerPageOpen] = useState(false);

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
  }, [searchQuery, filters, sort, setLeads, t, perPage]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

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

      {/* Per-page selector */}
      <div className="mt-3 flex items-center justify-end border-t border-gray-100 pt-3">
        <div className="relative">
          <button
            onClick={() => setPerPageOpen(o => !o)}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-colors"
          >
            <span>{perPage} / page</span>
            <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform duration-150 ${perPageOpen ? 'rotate-180' : ''}`} />
          </button>

          {perPageOpen && (
            <div className="absolute bottom-full right-0 mb-1.5 w-32 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg z-50">
              {PER_PAGE_OPTIONS.map(n => (
                <button
                  key={n}
                  onClick={() => { setPerPage(n); setPerPageOpen(false); }}
                  className={`flex w-full items-center justify-between px-4 py-2 text-sm transition-colors ${
                    perPage === n
                      ? 'bg-indigo-50 font-medium text-indigo-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {n}
                  {perPage === n && <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {activeLeadId && <LeadDetailDrawer />}
      <BulkActionBar />
    </div>
  );
}
