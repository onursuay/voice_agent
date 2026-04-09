'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store';
import { formatRelativeTime } from '@/lib/utils';
import {
  Users, UserPlus, TrendingUp, GitBranch, ArrowUpRight, ArrowDownRight,
  Upload, Phone, Mail, Zap, ChevronRight, Sparkles, BarChart3
} from 'lucide-react';
import Link from 'next/link';
import type { Lead } from '@/lib/types';
import { useTranslations } from 'next-intl';

const GRADIENTS = [
  'linear-gradient(135deg, #047857 0%, #10b981 50%, #047857 100%)',
  'linear-gradient(135deg, #dc2626 0%, #f87171 50%, #dc2626 100%)',
  'linear-gradient(135deg, #b45309 0%, #f59e0b 50%, #b45309 100%)',
  'linear-gradient(135deg, #1d4ed8 0%, #60a5fa 50%, #1d4ed8 100%)',
];

export default function DashboardPage() {
  const { session, stages, leads, setLeads } = useAppStore();
  const [loading, setLoading] = useState(true);
  const t = useTranslations('dashboard');

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
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const weeklyNew = leads.filter(l => new Date(l.created_at) >= weekAgo).length;
    const prevWeekNew = leads.filter(l => {
      const d = new Date(l.created_at);
      return d >= twoWeeksAgo && d < weekAgo;
    }).length;
    const weeklyTrend = prevWeekNew > 0 ? Math.round(((weeklyNew - prevWeekNew) / prevWeekNew) * 100) : weeklyNew > 0 ? 100 : 0;
    const wonLeads = leads.filter(l => l.stage?.is_won).length;
    const closedLeads = leads.filter(l => l.stage?.is_won || l.stage?.is_lost).length;
    const conversionRate = closedLeads > 0 ? Math.round((wonLeads / closedLeads) * 100) : 0;
    const activePipeline = leads.filter(l => l.stage && !l.stage.is_won && !l.stage.is_lost).length;
    return { totalLeads: leads.length, weeklyNewLeads: weeklyNew, weeklyTrend, conversionRate, activePipeline };
  }, [leads]);

  const stageCounts = useMemo(() => {
    if (stages.length === 0) return [];
    return stages.map(stage => ({ stage, count: leads.filter(l => l.stage_id === stage.id).length }));
  }, [stages, leads]);

  const totalStageLeads = stageCounts.reduce((sum, s) => sum + s.count, 0);

  const statCards = [
    { label: t('totalLeads'), value: stats.totalLeads, icon: Users, gradient: GRADIENTS[0], subtitle: t('stagesUnit', { count: stages.length }) },
    { label: t('weeklyNew'), value: stats.weeklyNewLeads, icon: UserPlus, gradient: GRADIENTS[1], trend: stats.weeklyTrend, subtitle: t('last7Days') },
    { label: t('conversionRate'), value: `%${stats.conversionRate}`, icon: TrendingUp, gradient: GRADIENTS[2], subtitle: t('closedLeads') },
    { label: t('activePipeline'), value: stats.activePipeline, icon: GitBranch, gradient: GRADIENTS[3], subtitle: t('ongoing') },
  ];

  const quickActions = [
    { label: t('importLeads'), icon: Upload, href: '/dashboard/import', color: '#6366f1', bg: '#eef2ff' },
    { label: t('aiCall'), icon: Phone, href: '/dashboard/calls', color: '#059669', bg: '#ecfdf5' },
    { label: t('sendEmail'), icon: Mail, href: '/dashboard/email', color: '#d97706', bg: '#fffbeb' },
    { label: t('setupAutomation'), icon: Zap, href: '/dashboard/automations', color: '#7c3aed', bg: '#f5f3ff' },
  ];

  const firstName = session?.user?.full_name?.split(' ')[0] || '';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? t('greetingMorning') : hour < 18 ? t('greetingDay') : t('greetingEvening');

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-16 rounded-2xl" />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="skeleton h-32 rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 skeleton h-80 rounded-2xl" />
          <div className="skeleton h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {greeting}{firstName ? `, ${firstName}` : ''} <span className="inline-block animate-[count-pulse_2s_ease-in-out_infinite]">👋</span>
          </h1>
          <p className="mt-1 text-sm text-gray-500">{t('subtitle')}</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400">
          <Sparkles className="h-3.5 w-3.5" />
          <span>{t('lastUpdated')}</span>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="stat-card" style={{ background: card.gradient }}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-white/80">{card.label}</span>
                <div className="stat-icon">
                  <Icon className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-4xl font-extrabold tracking-tight">{card.value}</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-white/60">{card.subtitle}</span>
                {card.trend !== undefined && card.trend !== 0 && (
                  <span className="trend-badge">
                    {card.trend > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {Math.abs(card.trend)}%
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {quickActions.map(action => {
          const Icon = action.icon;
          return (
            <Link key={action.label} href={action.href} className="quick-action">
              <div className="quick-action-icon" style={{ background: action.bg }}>
                <Icon className="h-5 w-5" style={{ color: action.color }} />
              </div>
              <span className="text-xs font-medium text-gray-700">{action.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Leads */}
        <div className="lg:col-span-2 premium-card">
          <div className="premium-card-header">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">
                <Users className="h-4 w-4 text-indigo-600" />
              </div>
              <h2 className="text-sm font-semibold text-gray-900">{t('recentLeads')}</h2>
            </div>
            <Link href="/dashboard/leads" className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors">
              {t('viewAll')} <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            {recentLeads.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50 mb-4">
                  <Users className="h-7 w-7 text-gray-300" />
                </div>
                <p className="text-sm font-medium text-gray-400">{t('noLeadsYet')}</p>
                <Link href="/dashboard/import" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:underline">
                  <Upload className="h-3.5 w-3.5" /> {t('importLeadsAction')}
                </Link>
              </div>
            ) : (
              <table className="premium-table w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">{t('colName')}</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">{t('colEmail')}</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">{t('colStage')}</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">{t('colDate')}</th>
                  </tr>
                </thead>
                <tbody>
                  {recentLeads.map((lead, i) => (
                    <tr key={lead.id} className="border-b border-gray-50/80 cursor-pointer" style={{ animationDelay: `${i * 60}ms` }}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 text-xs font-bold text-white">
                            {(lead.full_name || lead.first_name || '?')[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{lead.full_name || `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || '-'}</p>
                            {lead.company && <p className="text-xs text-gray-400">{lead.company}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-500">{lead.email || '-'}</td>
                      <td className="px-6 py-4">
                        {lead.stage ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: `${lead.stage.color}12`, color: lead.stage.color }}>
                            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: lead.stage.color }} />
                            {lead.stage.name}
                          </span>
                        ) : <span className="text-xs text-gray-400">-</span>}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-400">{formatRelativeTime(lead.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Pipeline Summary */}
        <div className="premium-card">
          <div className="premium-card-header">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50">
                <BarChart3 className="h-4 w-4 text-violet-600" />
              </div>
              <h2 className="text-sm font-semibold text-gray-900">{t('pipelineSummary')}</h2>
            </div>
            {totalStageLeads > 0 && (
              <span className="text-xs font-medium text-gray-400">{totalStageLeads} {t('leadsUnit')}</span>
            )}
          </div>
          <div className="p-5 space-y-5">
            {stageCounts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50 mb-4">
                  <GitBranch className="h-7 w-7 text-gray-300" />
                </div>
                <p className="text-sm font-medium text-gray-400">{t('noPipelineStages')}</p>
              </div>
            ) : (
              stageCounts.map(({ stage, count }) => {
                const pct = totalStageLeads > 0 ? Math.round((count / totalStageLeads) * 100) : 0;
                const maxCount = Math.max(...stageCounts.map(s => s.count), 1);
                return (
                  <div key={stage.id} className="group">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: stage.color || '#6366f1' }} />
                        <span className="text-sm font-medium text-gray-700">{stage.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">{pct}%</span>
                        <span className="min-w-[24px] text-right text-sm font-bold text-gray-900">{count}</span>
                      </div>
                    </div>
                    <div className="stage-bar-track">
                      <div
                        className="stage-bar-fill"
                        style={{
                          width: `${Math.max((count / maxCount) * 100, count > 0 ? 4 : 0)}%`,
                          backgroundColor: stage.color || '#6366f1',
                        }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
          {stageCounts.length > 0 && (
            <div className="border-t border-gray-100 px-5 py-3">
              <Link href="/dashboard/pipeline" className="flex items-center justify-center gap-1 text-xs font-medium text-violet-600 hover:text-violet-700 transition-colors">
                {t('viewPipeline')} <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
