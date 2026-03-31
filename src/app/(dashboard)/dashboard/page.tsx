'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store';
import { formatRelativeTime } from '@/lib/utils';
import { Users, UserPlus, TrendingUp, GitBranch, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import type { Lead } from '@/lib/types';

export default function DashboardPage() {
  const { session, stages, leads, setLeads } = useAppStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) return;
    const supabase = createClient();
    const orgId = session.organization.id;

    async function fetchData() {
      const { data } = await supabase
        .from('leads')
        .select('*, stage:crm_stages(*), assigned_user:profiles!leads_assigned_to_fkey(*)')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });
      setLeads((data || []) as Lead[]);
      setLoading(false);
    }
    fetchData();
  }, [session, setLeads]);

  const recentLeads = useMemo(() => leads.slice(0, 5), [leads]);

  const stats = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weeklyNew = leads.filter(l => new Date(l.created_at) >= weekAgo).length;
    const wonLeads = leads.filter(l => l.stage?.is_won).length;
    const closedLeads = leads.filter(l => l.stage?.is_won || l.stage?.is_lost).length;
    const conversionRate = closedLeads > 0 ? Math.round((wonLeads / closedLeads) * 100) : 0;
    const activePipeline = leads.filter(l => l.stage && !l.stage.is_won && !l.stage.is_lost).length;
    return { totalLeads: leads.length, weeklyNewLeads: weeklyNew, conversionRate, activePipeline };
  }, [leads]);

  const stageCounts = useMemo(() => {
    if (stages.length === 0) return [];
    return stages.map(stage => ({ stage, count: leads.filter(l => l.stage_id === stage.id).length }));
  }, [stages, leads]);

  const maxStageCount = Math.max(...stageCounts.map(s => s.count), 1);

  const statCards = [
    { label: 'Toplam Lead', value: stats.totalLeads, icon: Users, iconBg: 'bg-indigo-100', iconColor: 'text-indigo-600' },
    { label: 'Bu Hafta Yeni', value: stats.weeklyNewLeads, icon: UserPlus, iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', trend: stats.weeklyNewLeads > 0 ? 'up' : undefined },
    { label: 'Dönüşüm Oranı', value: `%${stats.conversionRate}`, icon: TrendingUp, iconBg: 'bg-amber-100', iconColor: 'text-amber-600' },
    { label: 'Aktif Pipeline', value: stats.activePipeline, icon: GitBranch, iconBg: 'bg-violet-100', iconColor: 'text-violet-600' },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="skeleton h-28 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map(card => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-xl border border-gray-200 bg-white p-5 transition-shadow hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">{card.label}</span>
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.iconBg}`}>
                  <Icon className={`h-5 w-5 ${card.iconColor}`} />
                </div>
              </div>
              <div className="mt-3 flex items-end gap-2">
                <span className="text-3xl font-bold text-gray-900">{card.value}</span>
                {card.trend === 'up' && (
                  <span className="mb-1 flex items-center gap-0.5 text-xs font-medium text-emerald-600">
                    <ArrowUpRight className="h-3 w-3" /> Artış
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <h2 className="text-base font-semibold text-gray-900">Son Lead&apos;ler</h2>
            <Link href="/dashboard/leads" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">Tümünü Gör</Link>
          </div>
          <div className="overflow-x-auto">
            {recentLeads.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="h-10 w-10 text-gray-300 mb-3" />
                <p className="text-sm text-gray-500">Henüz lead bulunmuyor.</p>
                <Link href="/dashboard/import" className="mt-2 text-sm font-medium text-indigo-600 hover:underline">Lead içe aktar</Link>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-xs font-medium uppercase tracking-wider text-gray-400">
                    <th className="px-5 py-3 text-left">Ad Soyad</th>
                    <th className="px-5 py-3 text-left">E-posta</th>
                    <th className="px-5 py-3 text-left">Aşama</th>
                    <th className="px-5 py-3 text-left">Tarih</th>
                  </tr>
                </thead>
                <tbody>
                  {recentLeads.map(lead => (
                    <tr key={lead.id} className="cursor-pointer border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-gray-900">{lead.full_name || `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || '-'}</p>
                        {lead.company && <p className="text-xs text-gray-500">{lead.company}</p>}
                      </td>
                      <td className="px-5 py-3.5 text-gray-500">{lead.email || '-'}</td>
                      <td className="px-5 py-3.5">
                        {lead.stage ? (
                          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ backgroundColor: `${lead.stage.color}15`, color: lead.stage.color }}>
                            {lead.stage.name}
                          </span>
                        ) : <span className="text-xs text-gray-400">-</span>}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-gray-500">{formatRelativeTime(lead.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-5 py-4">
            <h2 className="text-base font-semibold text-gray-900">Pipeline Özeti</h2>
          </div>
          <div className="p-5 space-y-4">
            {stageCounts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <GitBranch className="h-10 w-10 text-gray-300 mb-3" />
                <p className="text-sm text-gray-500">Pipeline aşaması bulunamadı.</p>
              </div>
            ) : (
              stageCounts.map(({ stage, count }) => (
                <div key={stage.id}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">{stage.name}</span>
                    <span className="text-sm font-semibold text-gray-900">{count}</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.max((count / maxStageCount) * 100, count > 0 ? 4 : 0)}%`, backgroundColor: stage.color || '#6366f1' }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
