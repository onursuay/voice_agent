'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Users } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { LeadGrid } from '@/components/leads/lead-grid';
import { LeadToolbar, BulkActionBar } from '@/components/leads/lead-toolbar';
import { LeadDetailDrawer } from '@/components/leads/lead-detail-drawer';
import { EmptyState } from '@/components/ui/empty-state';
import { Spinner } from '@/components/ui/loading';
import { Button } from '@/components/ui/button';

export default function LeadsPage() {
  const leads = useAppStore(s => s.leads);
  const setLeads = useAppStore(s => s.setLeads);
  const searchQuery = useAppStore(s => s.searchQuery);
  const filters = useAppStore(s => s.filters);
  const sort = useAppStore(s => s.sort);
  const activeLeadId = useAppStore(s => s.activeLeadId);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

      const res = await fetch(`/api/leads?${params.toString()}`);
      if (!res.ok) throw new Error('Lead\'ler yüklenemedi.');

      const data = await res.json();
      setLeads(Array.isArray(data) ? data : data.leads || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filters, sort, setLeads]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3">
        <LeadToolbar />
      </div>

      <div className="relative flex-1 min-h-0">
        {loading && leads.length === 0 ? (
          <div className="flex h-64 items-center justify-center"><Spinner size="lg" /></div>
        ) : error ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3">
            <p className="text-sm text-red-500">{error}</p>
            <Button variant="secondary" size="sm" onClick={fetchLeads}>Tekrar Dene</Button>
          </div>
        ) : leads.length === 0 ? (
          <EmptyState icon={<Users className="h-6 w-6" />} title="Henüz lead yok" description="Yeni bir lead ekleyin veya dışarıdan içe aktarın." />
        ) : (
          <LeadGrid />
        )}
        {loading && leads.length > 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50"><Spinner size="md" /></div>
        )}
      </div>

      {leads.length > 0 && (
        <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3 text-sm text-gray-500">
          <span>{leads.length} lead</span>
        </div>
      )}

      {activeLeadId && <LeadDetailDrawer />}
    </div>
  );
}
