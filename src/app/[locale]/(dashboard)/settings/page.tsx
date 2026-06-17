'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store';
import { Tabs } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { ROLE_LABELS } from '@/lib/types';
import { NAV_PAGE_KEYS, ROLE_PAGE_PRESETS, resolveAllowedPages } from '@/lib/access';
import type { NavPageKey } from '@/lib/access';
import type { Organization, Profile, OrganizationMember, CrmStage, UserRole } from '@/lib/types';
import { useTranslations } from 'next-intl';
import {
  Building2,
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
  ShieldCheck,
  X,
  Send,
  Bell,
} from 'lucide-react';
import { NotificationsTab } from '@/components/settings/notifications-tab';
import { BackupTab } from '@/components/settings/backup-tab';
import { DatabaseBackup } from 'lucide-react';

type SettingsTab = 'organization' | 'pipeline' | 'profile' | 'logs' | 'access' | 'notifications' | 'backup';

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
  const tAccess = useTranslations('access');
  const tCommon = useTranslations('common');
  const initialTab = (searchParams.get('tab') as SettingsTab) || 'organization';
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);

  const userRole = session?.membership?.role;
  const canManageAccess = userRole === 'owner' || userRole === 'admin';

  const TABS = [
    { key: 'organization', label: t('tabs.organization'), icon: <Building2 className="h-4 w-4" /> },
    { key: 'pipeline', label: t('tabs.pipeline'), icon: <GitBranch className="h-4 w-4" /> },
    { key: 'profile', label: t('tabs.profile'), icon: <User className="h-4 w-4" /> },
    { key: 'logs', label: t('tabs.logs'), icon: <ScrollText className="h-4 w-4" /> },
    ...(canManageAccess ? [{ key: 'access', label: tAccess('title'), icon: <ShieldCheck className="h-4 w-4" /> }] : []),
    ...(userRole === 'owner' ? [{ key: 'notifications', label: t('tabs.notifications'), icon: <Bell className="h-4 w-4" /> }] : []),
    ...(userRole === 'owner' ? [{ key: 'backup', label: t('tabs.backup'), icon: <DatabaseBackup className="h-4 w-4" /> }] : []),
  ];

  // Org state
  const [org, setOrg] = useState<Organization | null>(null);
  const [orgName, setOrgName] = useState('');
  const [orgSaving, setOrgSaving] = useState(false);
  const [orgSuccess, setOrgSuccess] = useState(false);

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

  // Access management state
  const [accessMembers, setAccessMembers] = useState<OrganizationMember[]>([]);
  const [accessLoading, setAccessLoading] = useState(false);
  const [pendingActions, setPendingActions] = useState<Record<string, 'approving' | 'rejecting'>>({});
  const [memberSaving, setMemberSaving] = useState<Record<string, boolean>>({});
  const [memberSavedId, setMemberSavedId] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    full_name: '',
    role: 'sales_rep' as UserRole,
    lead_scope: 'assigned_only',
    allowed_pages: [] as NavPageKey[],
  });
  const [inviting, setInviting] = useState(false);
  const [inviteResult, setInviteResult] = useState<string | null>(null);
  const [memberEdits, setMemberEdits] = useState<Record<string, { role: UserRole; lead_scope: string; allowed_pages: NavPageKey[] }>>({});

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

  // Load lead counts per stage
  const loadStageLeadCounts = useCallback(async () => {
    if (!session) return;
    try {
      const { data: leads } = await supabase
        .from('leads')
        .select('stage_id')
        .eq('organization_id', session.organization.id)
        .is('deleted_at', null);

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

  const loadAccessMembers = useCallback(async () => {
    setAccessLoading(true);
    try {
      const res = await fetch('/api/members');
      if (res.ok) {
        const data: OrganizationMember[] = await res.json();
        setAccessMembers(data);
        // Initialize edits from current member data
        const edits: Record<string, { role: UserRole; lead_scope: string; allowed_pages: NavPageKey[] }> = {};
        data.forEach((m) => {
          edits[m.id] = {
            role: m.role,
            lead_scope: m.lead_scope || 'all',
            allowed_pages: resolveAllowedPages(m.role, m.allowed_pages),
          };
        });
        setMemberEdits(edits);
      }
    } catch (err) {
      console.error('Access members fetch error:', err);
    } finally {
      setAccessLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'pipeline') loadStageLeadCounts();
    if (activeTab === 'logs') loadLogs();
    if (activeTab === 'access') loadAccessMembers();
  }, [activeTab, loadStageLeadCounts, loadLogs, loadAccessMembers]);

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
      setError(err instanceof Error ? err.message : t('errors.stageDeleteFailed'));
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
        throw new Error(data.error || t('errors.stageOrderSaveFailed'));
      }
      const updatedStages = await res.json();
      setStages(updatedStages);
      setPipelineSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.stageOrderSaveFailed'));
    } finally {
      setPipelineSaving(false);
    }
  };

  // ========================
  // ACCESS MANAGEMENT HANDLERS
  // ========================

  const handleApproveReject = async (memberId: string, action: 'approved' | 'rejected') => {
    setPendingActions((prev) => ({ ...prev, [memberId]: action === 'approved' ? 'approving' : 'rejecting' }));
    try {
      const res = await fetch(`/api/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approval_status: action }),
      });
      if (res.ok) await loadAccessMembers();
    } catch (err) {
      console.error('Approve/reject error:', err);
    } finally {
      setPendingActions((prev) => { const n = { ...prev }; delete n[memberId]; return n; });
    }
  };

  const handleSaveMember = async (memberId: string) => {
    const edit = memberEdits[memberId];
    if (!edit) return;
    setMemberSaving((prev) => ({ ...prev, [memberId]: true }));
    try {
      const res = await fetch(`/api/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: edit.role,
          lead_scope: edit.lead_scope,
          allowed_pages: edit.allowed_pages,
        }),
      });
      if (res.ok) {
        setMemberSavedId(memberId);
        setTimeout(() => setMemberSavedId(null), 2000);
        await loadAccessMembers();
      }
    } catch (err) {
      console.error('Save member error:', err);
    } finally {
      setMemberSaving((prev) => { const n = { ...prev }; delete n[memberId]; return n; });
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    setMemberSaving((prev) => ({ ...prev, [memberId]: true }));
    try {
      const res = await fetch(`/api/members/${memberId}`, { method: 'DELETE' });
      if (res.ok) await loadAccessMembers();
    } catch (err) {
      console.error('Delete member error:', err);
    } finally {
      setMemberSaving((prev) => { const n = { ...prev }; delete n[memberId]; return n; });
    }
  };

  const handleInvite = async () => {
    if (!inviteForm.email.trim() || !inviteForm.full_name.trim()) return;
    setInviting(true);
    setInviteResult(null);
    try {
      const res = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteForm.email.trim(),
          full_name: inviteForm.full_name.trim(),
          role: inviteForm.role,
          lead_scope: inviteForm.lead_scope,
          allowed_pages: inviteForm.allowed_pages.length ? inviteForm.allowed_pages : null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setInviteResult(data.emailSent ? tAccess('inviteSuccessEmail') : tAccess('inviteSuccessNoEmail'));
        setInviteForm({ email: '', full_name: '', role: 'sales_rep', lead_scope: 'assigned_only', allowed_pages: [] });
        await loadAccessMembers();
        setTimeout(() => {
          setInviteOpen(false);
          setInviteResult(null);
        }, 2500);
      }
    } catch (err) {
      console.error('Invite error:', err);
    } finally {
      setInviting(false);
    }
  };

  const updateMemberEdit = (memberId: string, patch: Partial<{ role: UserRole; lead_scope: string; allowed_pages: NavPageKey[] }>) => {
    setMemberEdits((prev) => ({
      ...prev,
      [memberId]: { ...prev[memberId], ...patch },
    }));
  };

  const applyPreset = (memberId: string, preset: 'saha' | 'yonetici') => {
    if (preset === 'saha') {
      updateMemberEdit(memberId, {
        role: 'sales_rep',
        allowed_pages: ROLE_PAGE_PRESETS['sales_rep'] as NavPageKey[],
        lead_scope: 'assigned_only',
      });
    } else {
      updateMemberEdit(memberId, {
        role: 'sales_manager',
        allowed_pages: ROLE_PAGE_PRESETS['sales_manager'] as NavPageKey[],
        lead_scope: 'all',
      });
    }
  };

  const toggleInvitePage = (page: NavPageKey) => {
    setInviteForm((prev) => ({
      ...prev,
      allowed_pages: prev.allowed_pages.includes(page)
        ? prev.allowed_pages.filter((p) => p !== page)
        : [...prev.allowed_pages, page],
    }));
  };

  const toggleMemberPage = (memberId: string, page: NavPageKey) => {
    const current = memberEdits[memberId]?.allowed_pages || [];
    const updated = current.includes(page)
      ? current.filter((p) => p !== page)
      : [...current, page];
    updateMemberEdit(memberId, { allowed_pages: updated });
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

        {/* ============================== */}
        {/* ERİŞİM YÖNETİMİ */}
        {/* ============================== */}
        {activeTab === 'access' && (
          <div className="p-6 space-y-6">
            {!canManageAccess ? (
              <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {tAccess('unauthorized')}
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                      <ShieldCheck className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-foreground">{tAccess('title')}</h2>
                      <p className="text-sm text-muted">{tAccess('subtitle')}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    icon={<UserPlus className="h-4 w-4" />}
                    onClick={() => setInviteOpen(true)}
                  >
                    {tAccess('invite')}
                  </Button>
                </div>

                {accessLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-20 animate-pulse rounded-lg bg-gray-100" />
                    ))}
                  </div>
                ) : (
                  <>
                    {/* ---- PENDING SECTION ---- */}
                    {(() => {
                      const pending = accessMembers.filter((m) => m.approval_status === 'pending');
                      return pending.length > 0 ? (
                        <div className="space-y-3">
                          <h3 className="text-sm font-semibold text-gray-700">{tAccess('pendingSectionTitle')}</h3>
                          <div className="divide-y divide-gray-100 rounded-lg border border-amber-200 bg-amber-50/40 overflow-hidden">
                            {pending.map((m) => (
                              <div key={m.id} className="flex items-center justify-between px-4 py-3.5 gap-4">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-200 text-amber-800 text-sm font-bold">
                                    {m.profile?.full_name
                                      ? m.profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                                      : 'U'}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium text-foreground truncate">
                                      {m.profile?.full_name || tCommon('unknownUser')}
                                    </p>
                                    <p className="text-xs text-muted truncate">{m.profile?.email || '-'}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    loading={pendingActions[m.id] === 'rejecting'}
                                    disabled={!!pendingActions[m.id]}
                                    onClick={() => handleApproveReject(m.id, 'rejected')}
                                    className="border-red-200 text-red-600 hover:bg-red-50"
                                  >
                                    {pendingActions[m.id] === 'rejecting' ? tAccess('rejecting') : tAccess('reject')}
                                  </Button>
                                  <Button
                                    size="sm"
                                    loading={pendingActions[m.id] === 'approving'}
                                    disabled={!!pendingActions[m.id]}
                                    onClick={() => handleApproveReject(m.id, 'approved')}
                                  >
                                    {pendingActions[m.id] === 'approving' ? tAccess('approving') : tAccess('approve')}
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-3 text-center">
                          <p className="text-sm text-muted">{tAccess('noPending')}</p>
                        </div>
                      );
                    })()}

                    {/* ---- USERS SECTION ---- */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-gray-700">{tAccess('usersTitle')}</h3>
                      {(() => {
                        const approved = accessMembers.filter((m) => m.approval_status !== 'pending');
                        if (approved.length === 0) {
                          return (
                            <p className="text-sm text-muted text-center py-4">{tAccess('noUsers')}</p>
                          );
                        }
                        return (
                          <div className="space-y-3">
                            {approved.map((m) => {
                              const isOwner = m.role === 'owner';
                              const edit = memberEdits[m.id] || { role: m.role, lead_scope: m.lead_scope || 'all', allowed_pages: resolveAllowedPages(m.role, m.allowed_pages) };
                              const isFullAccess = edit.role === 'owner' || edit.role === 'admin';
                              return (
                                <div key={m.id} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                                  {/* Row header */}
                                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                                    <div className="flex items-center gap-3 min-w-0">
                                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-sm font-bold">
                                        {m.profile?.full_name
                                          ? m.profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                                          : 'U'}
                                      </div>
                                      <div className="min-w-0">
                                        <p className="text-sm font-medium text-foreground truncate">
                                          {m.profile?.full_name || tCommon('unknownUser')}
                                        </p>
                                        <p className="text-xs text-muted truncate">{m.profile?.email || '-'}</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                      {m.approval_status === 'rejected' && (
                                        <Badge color="red" size="sm">{tAccess('statusRejected')}</Badge>
                                      )}
                                      {!m.is_active && (
                                        <Badge color="gray" size="sm">Pasif</Badge>
                                      )}
                                      {isOwner && (
                                        <Badge color="indigo" size="sm">{ROLE_LABELS['owner']}</Badge>
                                      )}
                                      {!isOwner && (
                                        <button
                                          onClick={() => handleDeleteMember(m.id)}
                                          disabled={memberSaving[m.id]}
                                          className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-30 transition-colors"
                                          title={tAccess('removeUser')}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  {/* Edit body */}
                                  {isOwner ? (
                                    <div className="px-4 py-3">
                                      <p className="text-xs text-muted italic">{tAccess('ownerReadOnly')}</p>
                                    </div>
                                  ) : (
                                    <div className="px-4 py-4 space-y-4">
                                      {/* Role + Scope + Presets row */}
                                      <div className="flex flex-wrap items-end gap-3">
                                        <div className="min-w-[160px]">
                                          <Select
                                            label={tAccess('role')}
                                            value={edit.role}
                                            onChange={(e) => {
                                              const newRole = e.target.value as UserRole;
                                              const pages = resolveAllowedPages(newRole, null);
                                              updateMemberEdit(m.id, { role: newRole, allowed_pages: pages });
                                            }}
                                            options={[
                                              { value: 'admin', label: ROLE_LABELS['admin'] },
                                              { value: 'sales_manager', label: ROLE_LABELS['sales_manager'] },
                                              { value: 'sales_rep', label: ROLE_LABELS['sales_rep'] },
                                              { value: 'analyst', label: ROLE_LABELS['analyst'] },
                                              { value: 'readonly', label: ROLE_LABELS['readonly'] },
                                            ]}
                                          />
                                        </div>
                                        <div className="min-w-[180px]">
                                          <Select
                                            label={tAccess('leadScope')}
                                            value={edit.lead_scope}
                                            onChange={(e) => updateMemberEdit(m.id, { lead_scope: e.target.value })}
                                            options={[
                                              { value: 'all', label: tAccess('scopeAll') },
                                              { value: 'assigned_only', label: tAccess('scopeMine') },
                                            ]}
                                          />
                                        </div>
                                        <div className="flex items-end gap-2 pb-0">
                                          <button
                                            onClick={() => applyPreset(m.id, 'saha')}
                                            className="rounded-lg border border-gray-300 bg-white px-2.5 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                                          >
                                            {tAccess('presetSaha')}
                                          </button>
                                          <button
                                            onClick={() => applyPreset(m.id, 'yonetici')}
                                            className="rounded-lg border border-gray-300 bg-white px-2.5 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                                          >
                                            {tAccess('presetYonetici')}
                                          </button>
                                        </div>
                                      </div>

                                      {/* Page toggles */}
                                      <div>
                                        <p className="mb-2 text-xs font-medium text-gray-500 uppercase tracking-wide">{tAccess('pages')}</p>
                                        {isFullAccess ? (
                                          <span className="text-xs text-muted italic">{tAccess('fullAccess')}</span>
                                        ) : (
                                          <div className="flex flex-wrap gap-2">
                                            {NAV_PAGE_KEYS.map((page) => {
                                              const checked = edit.allowed_pages.includes(page);
                                              return (
                                                <button
                                                  key={page}
                                                  type="button"
                                                  onClick={() => toggleMemberPage(m.id, page)}
                                                  className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                                                    checked
                                                      ? 'bg-emerald-600 border-emerald-600 text-white'
                                                      : 'bg-white border-gray-300 text-gray-500 hover:border-emerald-400 hover:text-emerald-600'
                                                  }`}
                                                >
                                                  {checked && <Check className="h-3 w-3" />}
                                                  {tAccess(`pageKeys.${page}`)}
                                                </button>
                                              );
                                            })}
                                          </div>
                                        )}
                                      </div>

                                      {/* Save row */}
                                      <div className="flex items-center justify-end gap-3 pt-1">
                                        {memberSavedId === m.id && (
                                          <span className="flex items-center gap-1.5 text-sm font-medium text-green-600">
                                            <Check className="h-4 w-4" />
                                            {tAccess('saved')}
                                          </span>
                                        )}
                                        <Button
                                          size="sm"
                                          loading={memberSaving[m.id]}
                                          icon={<Save className="h-3.5 w-3.5" />}
                                          onClick={() => handleSaveMember(m.id)}
                                        >
                                          {memberSaving[m.id] ? tAccess('saving') : tAccess('save')}
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  </>
                )}

                {/* INVITE MODAL */}
                <Modal
                  open={inviteOpen}
                  onClose={() => { setInviteOpen(false); setInviteResult(null); }}
                  title={tAccess('inviteTitle')}
                  size="md"
                >
                  <div className="space-y-4">
                    {inviteResult && (
                      <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                        <Check className="h-4 w-4 shrink-0" />
                        {inviteResult}
                      </div>
                    )}
                    <Input
                      label={tAccess('inviteEmail')}
                      type="email"
                      value={inviteForm.email}
                      onChange={(e) => setInviteForm((p) => ({ ...p, email: e.target.value }))}
                      placeholder={tAccess('inviteEmailPlaceholder')}
                    />
                    <Input
                      label={tAccess('inviteName')}
                      value={inviteForm.full_name}
                      onChange={(e) => setInviteForm((p) => ({ ...p, full_name: e.target.value }))}
                      placeholder={tAccess('inviteNamePlaceholder')}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <Select
                        label={tAccess('inviteRole')}
                        value={inviteForm.role}
                        onChange={(e) => {
                          const newRole = e.target.value as UserRole;
                          const pages = resolveAllowedPages(newRole, null);
                          setInviteForm((p) => ({ ...p, role: newRole, allowed_pages: pages }));
                        }}
                        options={[
                          { value: 'admin', label: ROLE_LABELS['admin'] },
                          { value: 'sales_manager', label: ROLE_LABELS['sales_manager'] },
                          { value: 'sales_rep', label: ROLE_LABELS['sales_rep'] },
                          { value: 'analyst', label: ROLE_LABELS['analyst'] },
                          { value: 'readonly', label: ROLE_LABELS['readonly'] },
                        ]}
                      />
                      <Select
                        label={tAccess('inviteLeadScope')}
                        value={inviteForm.lead_scope}
                        onChange={(e) => setInviteForm((p) => ({ ...p, lead_scope: e.target.value }))}
                        options={[
                          { value: 'all', label: tAccess('scopeAll') },
                          { value: 'assigned_only', label: tAccess('scopeMine') },
                        ]}
                      />
                    </div>

                    {/* Page toggles in invite */}
                    {inviteForm.role !== 'admin' && (
                      <div>
                        <p className="mb-2 text-xs font-medium text-gray-500 uppercase tracking-wide">{tAccess('invitePages')}</p>
                        <div className="flex flex-wrap gap-2">
                          {NAV_PAGE_KEYS.map((page) => {
                            const checked = inviteForm.allowed_pages.includes(page);
                            return (
                              <button
                                key={page}
                                type="button"
                                onClick={() => toggleInvitePage(page)}
                                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                                  checked
                                    ? 'bg-emerald-600 border-emerald-600 text-white'
                                    : 'bg-white border-gray-300 text-gray-500 hover:border-emerald-400 hover:text-emerald-600'
                                }`}
                              >
                                {checked && <Check className="h-3 w-3" />}
                                {tAccess(`pageKeys.${page}`)}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end gap-2 pt-2">
                      <Button variant="secondary" onClick={() => setInviteOpen(false)}>
                        {tAccess('cancel')}
                      </Button>
                      <Button
                        loading={inviting}
                        disabled={!inviteForm.email.trim() || !inviteForm.full_name.trim()}
                        icon={<Send className="h-4 w-4" />}
                        onClick={handleInvite}
                      >
                        {inviting ? tAccess('inviting') : tAccess('inviteSubmit')}
                      </Button>
                    </div>
                  </div>
                </Modal>
              </>
            )}
          </div>
        )}

        {/* ============================== */}
        {/* BİLDİRİMLER (owner) */}
        {/* ============================== */}
        {activeTab === 'notifications' && (
          <div className="p-6">
            <NotificationsTab />
          </div>
        )}

        {/* ============================== */}
        {/* YEDEK & GERİ YÜKLEME (owner) */}
        {/* ============================== */}
        {activeTab === 'backup' && (
          <div className="p-6">
            <BackupTab />
          </div>
        )}
      </div>
    </div>
  );
}
