'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store';
import { Tabs } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ROLE_LABELS } from '@/lib/types';
import type { Organization, Profile, OrganizationMember, CrmStage, UserRole } from '@/lib/types';
import { useTranslations } from 'next-intl';
import {
  Building2,
  Users,
  GitBranch,
  User,
  Save,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Upload,
  UserPlus,
  AlertCircle,
  Check,
  ScrollText,
} from 'lucide-react';

type SettingsTab = 'organization' | 'members' | 'pipeline' | 'profile' | 'logs';

type LeadEvent = {
  id: string;
  event_type: string;
  external_id: string | null;
  status: string;
  error_message: string | null;
  created_at: string;
};

const ROLE_COLORS: Record<UserRole, 'indigo' | 'purple' | 'blue' | 'green' | 'yellow' | 'gray'> = {
  owner: 'indigo',
  admin: 'purple',
  sales_manager: 'blue',
  sales_rep: 'green',
  analyst: 'yellow',
  readonly: 'gray',
};

const STAGE_COLOR_OPTIONS = [
  '#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#f97316',
  '#22c55e', '#ef4444', '#ec4899', '#14b8a6', '#6b7280',
];

export default function SettingsPage() {
  const { session, stages, setStages } = useAppStore();
  const searchParams = useSearchParams();
  const t = useTranslations('settings');
  const tCommon = useTranslations('common');
  const initialTab = (searchParams.get('tab') as SettingsTab) || 'organization';
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);

  const TABS = [
    { key: 'organization', label: t('tabs.organization'), icon: <Building2 className="h-4 w-4" /> },
    { key: 'members', label: t('tabs.members'), icon: <Users className="h-4 w-4" /> },
    { key: 'pipeline', label: t('tabs.pipeline'), icon: <GitBranch className="h-4 w-4" /> },
    { key: 'profile', label: t('tabs.profile'), icon: <User className="h-4 w-4" /> },
    { key: 'logs', label: t('tabs.logs'), icon: <ScrollText className="h-4 w-4" /> },
  ];

  // Org state
  const [org, setOrg] = useState<Organization | null>(null);
  const [orgName, setOrgName] = useState('');
  const [orgSaving, setOrgSaving] = useState(false);
  const [orgSuccess, setOrgSuccess] = useState(false);

  // Members state
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);

  // Pipeline state
  const [localStages, setLocalStages] = useState<CrmStage[]>([]);
  const [newStageName, setNewStageName] = useState('');
  const [newStageColor, setNewStageColor] = useState('#10b981');
  const [pipelineSaving, setPipelineSaving] = useState(false);
  const [pipelineSuccess, setPipelineSuccess] = useState(false);
  const [stageLeadCounts, setStageLeadCounts] = useState<Record<string, number>>({});

  // Profile state
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Logs state
  const [logEvents, setLogEvents] = useState<LeadEvent[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // Feedback messages
  const [error, setError] = useState('');

  const supabase = createClient();

  // Load org data
  useEffect(() => {
    if (!session) return;
    setOrg(session.organization);
    setOrgName(session.organization.name);
  }, [session]);

  // Load profile
  useEffect(() => {
    if (!session) return;
    setProfile(session.user);
    setProfileName(session.user.full_name);
    setProfilePhone(session.user.phone || '');
  }, [session]);

  // Load stages
  useEffect(() => {
    setLocalStages([...stages].sort((a, b) => a.position - b.position));
  }, [stages]);

  // Load members
  const loadMembers = useCallback(async () => {
    if (!session) return;
    setMembersLoading(true);
    try {
      const res = await fetch('/api/members');
      if (res.ok) {
        const data = await res.json();
        setMembers(data);
      }
    } catch (err) {
      console.error('Members fetch error:', err);
    } finally {
      setMembersLoading(false);
    }
  }, [session]);

  // Load lead counts per stage
  const loadStageLeadCounts = useCallback(async () => {
    if (!session) return;
    try {
      const { data: leads } = await supabase
        .from('leads')
        .select('stage_id')
        .eq('organization_id', session.organization.id);

      if (leads) {
        const counts: Record<string, number> = {};
        leads.forEach((l) => {
          if (l.stage_id) {
            counts[l.stage_id] = (counts[l.stage_id] || 0) + 1;
          }
        });
        setStageLeadCounts(counts);
      }
    } catch (err) {
      console.error('Stage lead counts error:', err);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const loadLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const res = await fetch('/api/integrations/meta/events');
      if (res.ok) {
        const data = await res.json() as { events: LeadEvent[] };
        setLogEvents(data.events ?? []);
      }
    } catch { /* ignore */ } finally {
      setLogsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'members') loadMembers();
    if (activeTab === 'pipeline') loadStageLeadCounts();
    if (activeTab === 'logs') loadLogs();
  }, [activeTab, loadMembers, loadStageLeadCounts, loadLogs]);

  // Clear feedback messages after delay
  useEffect(() => {
    if (orgSuccess || profileSuccess || pipelineSuccess) {
      const timer = setTimeout(() => {
        setOrgSuccess(false);
        setProfileSuccess(false);
        setPipelineSuccess(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [orgSuccess, profileSuccess, pipelineSuccess]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // ========================
  // SAVE HANDLERS
  // ========================

  const saveOrganization = async () => {
    if (!session || !orgName.trim()) return;
    setOrgSaving(true);
    setError('');
    try {
      const { error: updateErr } = await supabase
        .from('organizations')
        .update({ name: orgName.trim() })
        .eq('id', session.organization.id);

      if (updateErr) throw new Error(updateErr.message);
      setOrgSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.organizationUpdateFailed'));
    } finally {
      setOrgSaving(false);
    }
  };

  const saveProfile = async () => {
    if (!session || !profileName.trim()) return;
    setProfileSaving(true);
    setError('');
    try {
      const { error: updateErr } = await supabase
        .from('profiles')
        .update({
          full_name: profileName.trim(),
          phone: profilePhone.trim() || null,
        })
        .eq('id', session.user.id);

      if (updateErr) throw new Error(updateErr.message);
      setProfileSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.profileUpdateFailed'));
    } finally {
      setProfileSaving(false);
    }
  };

  // Pipeline operations
  const moveStage = (index: number, direction: 'up' | 'down') => {
    const updated = [...localStages];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= updated.length) return;

    [updated[index], updated[targetIndex]] = [updated[targetIndex], updated[index]];
    updated.forEach((s, i) => (s.position = i));
    setLocalStages(updated);
  };

  const addStage = async () => {
    if (!newStageName.trim()) return;
    setError('');
    try {
      const res = await fetch('/api/stages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newStageName.trim(),
          color: newStageColor,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || t('errors.stageAddFailed'));
      }
      const newStage = await res.json();
      setLocalStages([...localStages, newStage]);
      setStages([...stages, newStage]);
      setNewStageName('');
      setNewStageColor('#10b981');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.stageAddFailed'));
    }
  };

  const deleteStage = async (stageId: string) => {
    if (stageLeadCounts[stageId] > 0) {
      setError(t('errors.stageHasLeads'));
      return;
    }
    setError('');
    try {
      const { error: deleteErr } = await supabase
        .from('crm_stages')
        .delete()
        .eq('id', stageId);

      if (deleteErr) throw new Error(deleteErr.message);
      const updated = localStages.filter((s) => s.id !== stageId);
      updated.forEach((s, i) => (s.position = i));
      setLocalStages(updated);
      setStages(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Aşama silinemedi');
    }
  };

  const savePipelineOrder = async () => {
    setPipelineSaving(true);
    setError('');
    try {
      const res = await fetch('/api/stages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stages: localStages.map((s, i) => ({ id: s.id, position: i })),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Sıralama kaydedilemedi');
      }
      const updatedStages = await res.json();
      setStages(updatedStages);
      setPipelineSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sıralama kaydedilemedi');
    } finally {
      setPipelineSaving(false);
    }
  };

  if (!session) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
        <p className="mt-1 text-sm text-muted">
          {t('subtitle')}
        </p>
      </div>

      {/* Error toast */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Tabs */}
      <Tabs items={TABS} activeKey={activeTab} onChange={(key) => setActiveTab(key as SettingsTab)} />

      {/* Tab content */}
      <div className="rounded-xl border border-card-border bg-card-bg">
        {/* ============================== */}
        {/* ORGANIZASYON */}
        {/* ============================== */}
        {activeTab === 'organization' && (
          <div className="p-6 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                <Building2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">{t('org.title')}</h2>
                <p className="text-sm text-muted">{t('org.desc')}</p>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Input
                label={t('org.nameLabel')}
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder={t('org.namePlaceholder')}
              />
              <Input
                label={t('org.slugLabel')}
                value={org?.slug || ''}
                disabled
                className="bg-gray-50"
              />
            </div>

            {/* Logo placeholder */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">{t('org.logoLabel')}</label>
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50">
                  {org?.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={org.logo_url} alt="Logo" className="h-full w-full rounded-xl object-cover" />
                  ) : (
                    <Upload className="h-6 w-6 text-gray-400" />
                  )}
                </div>
                <div>
                  <Button variant="secondary" size="sm" disabled>
                    <Upload className="h-3.5 w-3.5" />
                    {t('org.uploadLogo')}
                  </Button>
                  <p className="mt-1 text-xs text-muted">{t('org.logoHelp')}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-5">
              {orgSuccess && (
                <span className="flex items-center gap-1.5 text-sm font-medium text-green-600">
                  <Check className="h-4 w-4" />
                  {t('org.saved')}
                </span>
              )}
              <Button onClick={saveOrganization} loading={orgSaving} icon={<Save className="h-4 w-4" />}>
                {tCommon('save')}
              </Button>
            </div>
          </div>
        )}

        {/* ============================== */}
        {/* UYELER */}
        {/* ============================== */}
        {activeTab === 'members' && (
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-foreground">{t('members.title')}</h2>
                  <p className="text-sm text-muted">{t('members.desc')}</p>
                </div>
              </div>
              <Button
                variant="secondary"
                size="sm"
                icon={<UserPlus className="h-4 w-4" />}
                onClick={async () => {
                  try {
                    const res = await fetch('/api/members', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ email: '' }),
                    });
                    const data = await res.json();
                    if (data.message) {
                      setError(data.message);
                    }
                  } catch {
                    setError(t('members.invite'));
                  }
                }}
              >
                {t('members.invite')}
              </Button>
            </div>

            {membersLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="skeleton h-16 rounded-lg" />
                ))}
              </div>
            ) : members.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="h-10 w-10 text-gray-300 mb-3" />
                <p className="text-sm text-muted">{t('members.noMembers')}</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 rounded-lg border border-gray-200">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between px-4 py-3.5 transition-colors hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-sm font-bold">
                        {member.profile?.full_name
                          ? member.profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                          : 'U'}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {member.profile?.full_name || 'Bilinmeyen Kullanıcı'}
                        </p>
                        <p className="text-xs text-muted">{member.profile?.email || '-'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge color={ROLE_COLORS[member.role as UserRole] || 'gray'} size="sm">
                        {ROLE_LABELS[member.role as UserRole] || member.role}
                      </Badge>
                      {!member.is_active && (
                        <Badge color="red" size="sm">Pasif</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============================== */}
        {/* PIPELINE ASAMALARI */}
        {/* ============================== */}
        {activeTab === 'pipeline' && (
          <div className="p-6 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                <GitBranch className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">{t('pipeline.title')}</h2>
                <p className="text-sm text-muted">{t('pipeline.desc')}</p>
              </div>
            </div>

            {/* Stage list */}
            <div className="space-y-2">
              {localStages.map((stage, index) => (
                <div
                  key={stage.id}
                  className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 transition-shadow hover:shadow-sm"
                >
                  {/* Color dot */}
                  <div
                    className="h-4 w-4 shrink-0 rounded-full border border-gray-200"
                    style={{ backgroundColor: stage.color }}
                  />

                  {/* Name */}
                  <span className="flex-1 text-sm font-medium text-foreground">{stage.name}</span>

                  {/* Badges */}
                  {stage.is_won && <Badge color="green" size="sm">{t('pipeline.won')}</Badge>}
                  {stage.is_lost && <Badge color="red" size="sm">{t('pipeline.lost')}</Badge>}

                  {/* Lead count */}
                  <span className="text-xs text-muted">
                    {stageLeadCounts[stage.id] || 0} {t('pipeline.leadsUnit')}
                  </span>

                  {/* Reorder buttons */}
                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={() => moveStage(index, 'up')}
                      disabled={index === 0}
                      className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title={t('pipeline.moveUp')}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => moveStage(index, 'down')}
                      disabled={index === localStages.length - 1}
                      className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title={t('pipeline.moveDown')}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={() => deleteStage(stage.id)}
                    disabled={(stageLeadCounts[stage.id] || 0) > 0}
                    className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title={
                      (stageLeadCounts[stage.id] || 0) > 0
                        ? t('pipeline.cannotDelete')
                        : t('pipeline.deleteStage')
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add new stage */}
            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4">
              <p className="mb-3 text-sm font-medium text-gray-700">{t('pipeline.addTitle')}</p>
              <div className="flex flex-wrap items-end gap-3">
                <div className="flex-1 min-w-[200px]">
                  <Input
                    label={t('pipeline.stageNameLabel')}
                    value={newStageName}
                    onChange={(e) => setNewStageName(e.target.value)}
                    placeholder={t('pipeline.stageNamePlaceholder')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') addStage();
                    }}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">{t('pipeline.colorLabel')}</label>
                  <div className="flex items-center gap-1.5">
                    {STAGE_COLOR_OPTIONS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setNewStageColor(c)}
                        className={`h-7 w-7 rounded-full border-2 transition-transform hover:scale-110 ${
                          newStageColor === c ? 'border-gray-800 scale-110' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
                <Button onClick={addStage} size="md" icon={<Plus className="h-4 w-4" />}>
                  {tCommon('add')}
                </Button>
              </div>
            </div>

            {/* Save order */}
            <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-5">
              {pipelineSuccess && (
                <span className="flex items-center gap-1.5 text-sm font-medium text-green-600">
                  <Check className="h-4 w-4" />
                  {t('pipeline.sortingSaved')}
                </span>
              )}
              <Button
                onClick={savePipelineOrder}
                loading={pipelineSaving}
                icon={<Save className="h-4 w-4" />}
              >
                {t('pipeline.saveSorting')}
              </Button>
            </div>
          </div>
        )}

        {/* ============================== */}
        {/* PROFIL */}
        {/* ============================== */}
        {activeTab === 'profile' && (
          <div className="p-6 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                <User className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">{t('profile.title')}</h2>
                <p className="text-sm text-muted">{t('profile.desc')}</p>
              </div>
            </div>

            {/* Avatar placeholder */}
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-xl font-bold">
                {profile?.full_name
                  ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                  : 'U'}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{profile?.full_name}</p>
                <p className="text-xs text-muted">{profile?.email}</p>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Input
                label={t('profile.fullNameLabel')}
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                placeholder={t('profile.fullNamePlaceholder')}
              />
              <Input
                label={t('profile.emailLabel')}
                value={profile?.email || ''}
                disabled
                className="bg-gray-50"
              />
              <Input
                label={t('profile.phoneLabel')}
                value={profilePhone}
                onChange={(e) => setProfilePhone(e.target.value)}
                placeholder={t('profile.phonePlaceholder')}
              />
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">{t('profile.roleLabel')}</label>
                <div className="flex h-[38px] items-center">
                  <Badge
                    color={ROLE_COLORS[session?.membership?.role as UserRole] || 'gray'}
                    size="md"
                  >
                    {ROLE_LABELS[session?.membership?.role as UserRole] || '-'}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-5">
              {profileSuccess && (
                <span className="flex items-center gap-1.5 text-sm font-medium text-green-600">
                  <Check className="h-4 w-4" />
                  {t('profile.saved')}
                </span>
              )}
              <Button onClick={saveProfile} loading={profileSaving} icon={<Save className="h-4 w-4" />}>
                {tCommon('save')}
              </Button>
            </div>
          </div>
        )}

        {/* ============================== */}
        {/* LOG KAYITLARI */}
        {/* ============================== */}
        {activeTab === 'logs' && (
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                  <ScrollText className="h-5 w-5 text-slate-600" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-foreground">{t('logs.title')}</h2>
                  <p className="text-sm text-muted">{t('logs.desc')}</p>
                </div>
              </div>
              <button
                onClick={loadLogs}
                disabled={logsLoading}
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                <ScrollText className={`h-3.5 w-3.5 ${logsLoading ? 'animate-spin' : ''}`} />
                {t('logs.refresh')}
              </button>
            </div>

            {logsLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-12 rounded-lg bg-gray-100 animate-pulse" />
                ))}
              </div>
            ) : logEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <ScrollText className="h-10 w-10 text-gray-300 mb-3" />
                <p className="text-sm text-muted">{t('logs.empty')}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {logEvents.map((event) => (
                  <div key={event.id} className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${
                          event.status === 'processed' ? 'bg-green-500' :
                          event.status === 'failed' ? 'bg-red-500' :
                          event.status === 'ignored_sample_payload' ? 'bg-gray-400' :
                          'bg-yellow-400'
                        }`} />
                        <span className="text-xs font-medium text-gray-700">leadgen</span>
                        {event.external_id && (
                          <span className="text-xs font-mono text-gray-400 truncate max-w-[140px]">{event.external_id}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`text-xs font-medium ${
                          event.status === 'processed' ? 'text-green-600' :
                          event.status === 'failed' ? 'text-red-500' :
                          event.status === 'ignored_sample_payload' ? 'text-gray-400' :
                          'text-yellow-600'
                        }`}>
                          {event.status === 'processed' ? t('logs.statusProcessed') :
                           event.status === 'failed' ? t('logs.statusFailed') :
                           event.status === 'ignored_sample_payload' ? t('logs.statusSample') :
                           event.status}
                        </span>
                        <span className="text-xs text-gray-400">{new Date(event.created_at).toLocaleString('tr-TR')}</span>
                      </div>
                    </div>
                    {event.error_message && (
                      <p className="mt-1.5 text-xs text-red-500 pl-4.5">{event.error_message}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
