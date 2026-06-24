'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Zap, Plus, Trash2, Edit3, ToggleLeft, ToggleRight, ArrowRight, MapPin } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import type { OrganizationMember } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Spinner } from '@/components/ui/loading';
import { useTranslations } from 'next-intl';
import { SequencesSection } from '@/components/automations/sequences-section';
import { IL_LIST } from '@/lib/leads/turkeyProvinces.data';

// Şehir alanı için 81 il (Türkçe alfabetik sıra) — kural "Değer" dropdown'ı.
// Kullanıcı yazmak yerine listeden seçer → kural değeri kanonik il adıyla tutarlı olur.
const IL_SELECT_OPTIONS = [
  { value: '', label: '—' },
  ...[...IL_LIST].sort((a, b) => a.localeCompare(b, 'tr')).map((il) => ({ value: il, label: il })),
];

interface AutomationRule {
  id: string;
  name: string;
  trigger_type: string;
  trigger_config: Record<string, unknown>;
  action_type: string;
  action_config: Record<string, unknown>;
  is_active: boolean;
  priority: number;
  created_at: string;
}

interface EmailTemplate {
  id: string;
  name: string;
}

export default function AutomationsPage() {
  const t = useTranslations('automations');
  const tCommon = useTranslations('common');
  const stages = useAppStore(s => s.stages);
  const members = useAppStore(s => s.members);

  const TRIGGER_OPTIONS = [
    { value: 'lead_created', label: t('triggerLeadCreated') },
    { value: 'stage_changed', label: t('triggerStageChanged') },
    { value: 'lead_assigned', label: t('triggerLeadAssigned') },
    { value: 'inactivity', label: t('triggerInactivity') },
    { value: 'score_changed', label: t('triggerScoreChanged') },
    { value: 'tag_added', label: t('triggerTagAdded') },
  ];

  const ACTION_OPTIONS = [
    { value: 'assign', label: t('actionAssign') },
    { value: 'change_stage', label: t('actionChangeStage') },
    { value: 'send_email', label: t('actionSendEmail') },
    { value: 'add_tag', label: t('actionAddTag') },
    { value: 'create_reminder', label: t('actionReminder') },
    { value: 'add_note', label: t('actionAddNote') },
    { value: 'change_score', label: t('actionChangeScore') },
  ];

  const TRIGGER_LABELS: Record<string, string> = Object.fromEntries(TRIGGER_OPTIONS.map(o => [o.value, o.label]));
  const ACTION_LABELS: Record<string, string> = Object.fromEntries(ACTION_OPTIONS.map(o => [o.value, o.label]));
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    trigger_type: '',
    trigger_config: {} as Record<string, unknown>,
    action_type: '',
    action_config: {} as Record<string, unknown>,
  });

  const fetchRules = useCallback(async () => {
    // Gerçek kurallar (sahte/örnek YOK — kullanıcı yanılmasın).
    try {
      const res = await fetch('/api/automations');
      if (!res.ok) throw new Error();
      const data = await res.json();
      setRules(data.rules || []);
    } catch {
      setRules([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRules(); }, [fetchRules]);

  const handleSave = async () => {
    const payload = { ...form };
    if (editingId) {
      try { await fetch(`/api/automations/${editingId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); } catch {}
      setRules(prev => prev.map(r => r.id === editingId ? { ...r, ...payload } : r));
    } else {
      const newRule: AutomationRule = { id: `auto-${Date.now()}`, ...payload, is_active: true, priority: 0, created_at: new Date().toISOString() };
      try {
        const res = await fetch('/api/automations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        const d = await res.json();
        if (d.rule) newRule.id = d.rule.id;
      } catch {}
      setRules(prev => [newRule, ...prev]);
    }
    setModalOpen(false);
    setEditingId(null);
    setForm({ name: '', trigger_type: '', trigger_config: {}, action_type: '', action_config: {} });
  };

  const handleToggle = async (rule: AutomationRule) => {
    const newActive = !rule.is_active;
    setRules(prev => prev.map(r => r.id === rule.id ? { ...r, is_active: newActive } : r));
    try { await fetch(`/api/automations/${rule.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_active: newActive }) }); } catch {}
  };

  const handleDelete = async (id: string) => {
    setRules(prev => prev.filter(r => r.id !== id));
    try { await fetch(`/api/automations/${id}`, { method: 'DELETE' }); } catch {}
  };

  const handleEdit = (r: AutomationRule) => {
    setEditingId(r.id);
    setForm({ name: r.name, trigger_type: r.trigger_type, trigger_config: r.trigger_config, action_type: r.action_type, action_config: r.action_config });
    setModalOpen(true);
  };

  // Separate route_lead rules from general rules
  const generalRules = rules.filter(r => r.action_type !== 'route_lead');

  if (loading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-8">
      {/* ── General Automations Section ── */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('pageTitle')}</h1>
            <p className="mt-1 text-sm text-gray-500">{t('subtitle')}</p>
          </div>
          <Button
            icon={<Plus className="h-4 w-4" />}
            onClick={() => {
              setEditingId(null);
              setForm({ name: '', trigger_type: '', trigger_config: {}, action_type: '', action_config: {} });
              setModalOpen(true);
            }}
          >
            {t('newAutomation')}
          </Button>
        </div>

        {generalRules.length === 0 ? (
          <EmptyState icon={<Zap className="h-6 w-6" />} title={t('noAutomations')} description={t('noAutomationsDesc')} />
        ) : (
          <div className="space-y-3">
            {generalRules.map(rule => (
              <div key={rule.id} className={`rounded-xl border bg-white p-5 transition-all ${rule.is_active ? 'border-gray-200' : 'border-gray-100 opacity-60'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">{rule.name}</h3>
                      {rule.is_active ? <Badge color="green" size="sm">{t('active')}</Badge> : <Badge color="gray" size="sm">{t('passive')}</Badge>}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Badge color="blue" size="sm">{TRIGGER_LABELS[rule.trigger_type] || rule.trigger_type}</Badge>
                      <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
                      <Badge color="purple" size="sm">{ACTION_LABELS[rule.action_type] || rule.action_type}</Badge>
                    </div>
                    {rule.trigger_config && Object.keys(rule.trigger_config).length > 0 && (
                      <p className="mt-2 text-xs text-gray-400">{t('configLabel')}: {JSON.stringify(rule.trigger_config)}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleToggle(rule)} className="text-gray-400 hover:text-gray-600">
                      {rule.is_active ? <ToggleRight className="h-6 w-6 text-green-500" /> : <ToggleLeft className="h-6 w-6" />}
                    </button>
                    <button onClick={() => handleEdit(rule)} className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"><Edit3 className="h-4 w-4" /></button>
                    <button onClick={() => handleDelete(rule.id)} className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Routing Rules Section ── */}
      <RoutingRulesSection allRules={rules} onRulesChange={setRules} members={members} />

      {/* AI Orkestra: arama + funnel mail senaryoları */}
      <SequencesSection />

      {/* Create/Edit General Automation Modal */}
      {modalOpen && (
        <Modal open={modalOpen} title={editingId ? t('editTitle') : t('newTitle')} onClose={() => setModalOpen(false)} size="lg">
          <div className="space-y-5">
            <Input label={t('automationName')} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder={t('automationNamePlaceholder')} />

            <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-4 space-y-3">
              <p className="text-sm font-semibold text-blue-800">{t('triggerSection')}</p>
              <Select label={t('triggerEvent')} value={form.trigger_type} onChange={e => setForm({ ...form, trigger_type: e.target.value })} options={[{ value: '', label: t('selectPlaceholder') }, ...TRIGGER_OPTIONS]} />
              {form.trigger_type === 'stage_changed' && (
                <Select label={t('targetStage')} value={(form.trigger_config.to_stage as string) || ''} onChange={e => setForm({ ...form, trigger_config: { ...form.trigger_config, to_stage: e.target.value } })} options={[{ value: '', label: t('selectPlaceholder') }, ...stages.map(s => ({ value: s.slug, label: s.name }))]} />
              )}
              {form.trigger_type === 'inactivity' && (
                <Input label={t('daysCount')} type="number" value={String(form.trigger_config.days || '')} onChange={e => setForm({ ...form, trigger_config: { ...form.trigger_config, days: Number(e.target.value) } })} placeholder="3" />
              )}
              {form.trigger_type === 'score_changed' && (
                <div className="flex gap-3">
                  <Select label={t('condition')} value={(form.trigger_config.condition as string) || ''} onChange={e => setForm({ ...form, trigger_config: { ...form.trigger_config, condition: e.target.value } })} options={[{ value: 'above', label: t('conditionAbove') }, { value: 'below', label: t('conditionBelow') }]} />
                  <Input label={t('score')} type="number" value={String(form.trigger_config.threshold || '')} onChange={e => setForm({ ...form, trigger_config: { ...form.trigger_config, threshold: Number(e.target.value) } })} placeholder="70" />
                </div>
              )}
              {form.trigger_type === 'tag_added' && (
                <Input label={t('tag')} value={(form.trigger_config.tag as string) || ''} onChange={e => setForm({ ...form, trigger_config: { ...form.trigger_config, tag: e.target.value } })} placeholder={t('tagTriggerPlaceholder')} />
              )}
            </div>

            <div className="rounded-lg border border-purple-100 bg-purple-50/50 p-4 space-y-3">
              <p className="text-sm font-semibold text-purple-800">{t('actionSection')}</p>
              <Select label={t('actionEvent')} value={form.action_type} onChange={e => setForm({ ...form, action_type: e.target.value })} options={[{ value: '', label: t('selectPlaceholder') }, ...ACTION_OPTIONS]} />
              {form.action_type === 'assign' && (
                <Select label={t('assignTo')} value={(form.action_config.user_id as string) || ''} onChange={e => setForm({ ...form, action_config: { ...form.action_config, user_id: e.target.value } })} options={[{ value: '', label: t('selectPlaceholder') }, ...members.map(m => ({ value: m.user_id, label: m.profile?.full_name || m.user_id }))]} />
              )}
              {form.action_type === 'change_stage' && (
                <Select label={t('targetStage')} value={(form.action_config.stage_id as string) || ''} onChange={e => setForm({ ...form, action_config: { ...form.action_config, stage_id: e.target.value } })} options={[{ value: '', label: t('selectPlaceholder') }, ...stages.map(s => ({ value: s.id, label: s.name }))]} />
              )}
              {form.action_type === 'add_tag' && (
                <Input label={t('tag')} value={(form.action_config.tag as string) || ''} onChange={e => setForm({ ...form, action_config: { ...form.action_config, tag: e.target.value } })} placeholder={t('tagActionPlaceholder')} />
              )}
              {form.action_type === 'add_note' && (
                <Input label={t('noteContent')} value={(form.action_config.content as string) || ''} onChange={e => setForm({ ...form, action_config: { ...form.action_config, content: e.target.value } })} placeholder={t('noteContentPlaceholder')} />
              )}
              {form.action_type === 'create_reminder' && (
                <div className="flex gap-3">
                  <Input label={t('delayHours')} type="number" value={String(form.action_config.delay_hours || '')} onChange={e => setForm({ ...form, action_config: { ...form.action_config, delay_hours: Number(e.target.value) } })} placeholder="24" />
                  <Input label={t('reminderMsg')} value={(form.action_config.message as string) || ''} onChange={e => setForm({ ...form, action_config: { ...form.action_config, message: e.target.value } })} placeholder={t('reminderMsgPlaceholder')} />
                </div>
              )}
              {form.action_type === 'change_score' && (
                <div className="flex gap-3">
                  <Select label={t('operation')} value={(form.action_config.operation as string) || ''} onChange={e => setForm({ ...form, action_config: { ...form.action_config, operation: e.target.value } })} options={[{ value: 'set', label: t('operationSet') }, { value: 'increment', label: t('operationIncrement') }, { value: 'decrement', label: t('operationDecrement') }]} />
                  <Input label={t('value')} type="number" value={String(form.action_config.value || '')} onChange={e => setForm({ ...form, action_config: { ...form.action_config, value: Number(e.target.value) } })} placeholder="10" />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setModalOpen(false)}>{tCommon('cancel')}</Button>
              <Button onClick={handleSave} disabled={!form.name || !form.trigger_type || !form.action_type}>{tCommon('save')}</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Routing Rules Sub-Section ───────────────────────────────────────────────

interface RoutingRulesSectionProps {
  allRules: AutomationRule[];
  onRulesChange: (rules: AutomationRule[]) => void;
  members: OrganizationMember[];
}

function RoutingRulesSection({ allRules, onRulesChange, members }: RoutingRulesSectionProps) {
  const tR = useTranslations('routing');
  const tCommon = useTranslations('common');

  const routeRules = allRules.filter(r => r.action_type === 'route_lead');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  // Dinamik "Alan" kaynakları: form (custom_fields) anahtarları + bağlı Meta sayfaları
  const [customFieldKeys, setCustomFieldKeys] = useState<string[]>([]);
  const [connectedPages, setConnectedPages] = useState<{ page_id: string; page_name: string | null }[]>([]);
  const [form, setForm] = useState({
    name: '',
    field: 'city',
    operator: 'equals',
    value: '',
    assigned_to: '',
    send_email: true,
    email_template_id: null as string | null,
    priority: 0,
    is_active: true,
  });

  const OPERATOR_OPTIONS = [
    { value: 'equals', label: tR('opEquals') },
    { value: 'not_equals', label: tR('opNotEquals') },
    { value: 'contains', label: tR('opContains') },
    { value: 'in', label: tR('opIn') },
  ];

  // Alan listesi tablo başlıkları + form alanlarına göre dinamik:
  // standart lead kolonları + bağlı hesap (sayfa) + lead'lerde görülen form soruları
  const FIELD_OPTIONS = [
    { value: 'city', label: tR('fieldCity') },
    { value: 'country', label: tR('fieldCountry') },
    { value: 'source_platform', label: tR('fieldSource') },
    { value: 'meta_page_id', label: tR('fieldPage') },
    { value: 'form_name', label: tR('fieldFormName') },
    { value: 'campaign_name', label: tR('fieldCampaign') },
    { value: 'company', label: tR('fieldCompany') },
    { value: 'email', label: tR('fieldEmail') },
    { value: 'phone', label: tR('fieldPhone') },
    { value: 'full_name', label: tR('fieldFullName') },
    ...customFieldKeys.map((k) => ({ value: `custom.${k}`, label: `${tR('fieldCustomPrefix')}: ${k}` })),
  ];

  const OP_LABELS: Record<string, string> = Object.fromEntries(OPERATOR_OPTIONS.map(o => [o.value, o.label]));

  // Form alan anahtarları + bağlı sayfalar (best-effort; boşsa dropdown standart kalır)
  useEffect(() => {
    fetch('/api/leads/custom-fields')
      .then(r => (r.ok ? r.json() : { keys: [] }))
      .then(d => setCustomFieldKeys(d.keys || []))
      .catch(() => {});
    fetch('/api/integrations/meta/pages')
      .then(r => (r.ok ? r.json() : { pages: [] }))
      .then(d => setConnectedPages(d.pages || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch('/api/email/templates')
      .then(r => r.json())
      .then(d => setTemplates(d.templates || []))
      .catch(() => {});
  }, []);

  const refetch = useCallback(async () => {
    try {
      const res = await fetch('/api/automations');
      if (!res.ok) throw new Error();
      const data = await res.json();
      onRulesChange(data.rules || []);
    } catch {}
  }, [onRulesChange]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ name: '', field: 'city', operator: 'equals', value: '', assigned_to: '', send_email: true, email_template_id: null, priority: 0, is_active: true });
    setModalOpen(true);
  };

  const openEdit = (rule: AutomationRule) => {
    const conds = (rule.trigger_config?.conditions as Array<{ field: string; operator: string; value: string | string[] }> | undefined) || [];
    const c = conds[0] || { field: 'city', operator: 'equals', value: '' };
    const ac = rule.action_config as { assigned_to?: string; send_email?: boolean; email_template_id?: string | null };
    const rawValue = Array.isArray(c.value) ? c.value.join(', ') : (c.value || '');
    setEditingId(rule.id);
    setForm({
      name: rule.name,
      field: c.field || 'city',
      operator: c.operator || 'equals',
      value: rawValue,
      assigned_to: ac.assigned_to || '',
      send_email: ac.send_email !== false,
      email_template_id: ac.email_template_id || null,
      priority: rule.priority ?? 0,
      is_active: rule.is_active,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    const conditionValue = form.operator === 'in'
      ? form.value.split(',').map(v => v.trim()).filter(Boolean)
      : form.value;

    const payload = {
      name: form.name,
      trigger_type: 'lead_created',
      trigger_config: {
        conditions: [{ field: form.field, operator: form.operator, value: conditionValue }],
        match: 'all',
      },
      action_type: 'route_lead',
      action_config: {
        assigned_to: form.assigned_to,
        send_email: form.send_email,
        email_template_id: form.email_template_id || null,
      },
      priority: form.priority,
      is_active: form.is_active,
    };

    if (editingId) {
      try {
        await fetch(`/api/automations/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } catch {}
    } else {
      try {
        await fetch('/api/automations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } catch {}
    }

    setModalOpen(false);
    setEditingId(null);
    await refetch();
  };

  const handleDelete = async (id: string) => {
    try { await fetch(`/api/automations/${id}`, { method: 'DELETE' }); } catch {}
    await refetch();
  };

  const handleToggle = async (rule: AutomationRule) => {
    const newActive = !rule.is_active;
    try {
      await fetch(`/api/automations/${rule.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: newActive }),
      });
    } catch {}
    await refetch();
  };

  const getAssigneeName = (assignedTo: string): string => {
    const member = members.find(m => m.user_id === assignedTo);
    return member?.profile?.full_name || member?.profile?.email || assignedTo || '—';
  };

  const getConditionSummary = (rule: AutomationRule): string | null => {
    const conditions = rule.trigger_config?.conditions as Array<{ field: string; operator: string; value: string | string[] }> | undefined;
    if (!conditions || conditions.length === 0) return null;
    const c = conditions[0];
    const fieldLabel =
      FIELD_OPTIONS.find((o) => o.value === c.field)?.label ||
      (c.field.startsWith('custom.') ? c.field.slice(7) : c.field);
    const opLabel = OP_LABELS[c.operator] || c.operator;
    let valueStr = Array.isArray(c.value) ? c.value.join(', ') : c.value;
    // Hesap koşulunda ID yerine sayfa adını göster
    if (c.field === 'meta_page_id') {
      valueStr = connectedPages.find((p) => p.page_id === valueStr)?.page_name || valueStr;
    }
    return `${fieldLabel} ${opLabel} ${valueStr}`;
  };

  return (
    <div className="space-y-4">
      {/* Section divider + header */}
      <div className="border-t border-gray-200 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{tR('rulesTitle')}</h2>
            <p className="mt-0.5 text-sm text-gray-500">{tR('rulesDesc')}</p>
          </div>
          <Button icon={<Plus className="h-4 w-4" />} onClick={openCreate}>
            {tR('newRule')}
          </Button>
        </div>
      </div>

      {/* Rules list */}
      {routeRules.length === 0 ? (
        <EmptyState icon={<MapPin className="h-6 w-6" />} title={tR('noRules')} description={tR('noRulesDesc')} />
      ) : (
        <div className="space-y-3">
          {routeRules
            .slice()
            .sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0))
            .map(rule => {
              const ac = rule.action_config as { assigned_to?: string; send_email?: boolean };
              const summary = getConditionSummary(rule);
              return (
                <div
                  key={rule.id}
                  className={`rounded-xl border bg-white p-5 transition-all ${rule.is_active ? 'border-gray-200' : 'border-gray-100 opacity-60'}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">{rule.name}</h3>
                        {rule.is_active
                          ? <Badge color="green" size="sm">{tR('active')}</Badge>
                          : <Badge color="gray" size="sm">{tR('active')}</Badge>
                        }
                        <Badge color="yellow" size="sm">#{rule.priority ?? 0}</Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                        {summary && <Badge color="blue" size="sm">{summary}</Badge>}
                        <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
                        <span className="font-medium text-gray-700">{getAssigneeName(ac.assigned_to || '')}</span>
                        {ac.send_email && <Badge color="purple" size="sm">{tR('sendEmail')}</Badge>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleToggle(rule)} className="text-gray-400 hover:text-gray-600">
                        {rule.is_active
                          ? <ToggleRight className="h-6 w-6 text-green-500" />
                          : <ToggleLeft className="h-6 w-6" />
                        }
                      </button>
                      <button
                        onClick={() => openEdit(rule)}
                        className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(rule.id)}
                        className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* Create/Edit Routing Rule Modal */}
      {modalOpen && (
        <Modal
          open={modalOpen}
          title={editingId ? tR('editRule') : tR('newRule')}
          onClose={() => setModalOpen(false)}
          size="lg"
        >
          <div className="space-y-4">
            {/* Rule name */}
            <Input
              label={tR('ruleName')}
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder={tR('ruleName')}
            />

            {/* Condition block */}
            <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-4 space-y-3">
              <p className="text-sm font-semibold text-blue-800">{tR('field')}</p>
              <div className="grid grid-cols-3 gap-3">
                <Select
                  label={tR('field')}
                  value={form.field}
                  onChange={e => setForm({ ...form, field: e.target.value })}
                  options={FIELD_OPTIONS}
                />
                <Select
                  label={tR('operator')}
                  value={form.operator}
                  onChange={e => setForm({ ...form, operator: e.target.value })}
                  options={OPERATOR_OPTIONS}
                />
                {form.field === 'meta_page_id' ? (
                  <Select
                    label={tR('value')}
                    value={form.value}
                    onChange={e => setForm({ ...form, value: e.target.value })}
                    options={[
                      { value: '', label: '—' },
                      ...connectedPages.map((p) => ({ value: p.page_id, label: p.page_name || p.page_id })),
                    ]}
                  />
                ) : form.field === 'city' && form.operator !== 'in' ? (
                  // Şehir seçilince Değer alanı 81 il'lik açılır liste olur (serbest yazım yerine seçim).
                  // 'in' (birden çok il) operatöründe virgülle çoklu giriş için metin kutusu korunur.
                  <Select
                    label={tR('value')}
                    value={form.value}
                    onChange={e => setForm({ ...form, value: e.target.value })}
                    options={IL_SELECT_OPTIONS}
                  />
                ) : (
                  <Input
                    label={tR('value')}
                    value={form.value}
                    onChange={e => setForm({ ...form, value: e.target.value })}
                    placeholder={form.operator === 'in' ? tR('valuePlaceholderMulti') : tR('valuePlaceholder')}
                  />
                )}
              </div>
            </div>

            {/* Action block */}
            <div className="rounded-lg border border-purple-100 bg-purple-50/50 p-4 space-y-3">
              <p className="text-sm font-semibold text-purple-800">{tR('assignee')}</p>

              <Select
                label={tR('assignee')}
                value={form.assigned_to}
                onChange={e => setForm({ ...form, assigned_to: e.target.value })}
                options={[
                  { value: '', label: '—' },
                  ...members.map(m => ({
                    value: m.user_id,
                    label: m.profile?.full_name || m.profile?.email || m.user_id,
                  })),
                ]}
              />

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.send_email}
                  onChange={e => setForm({ ...form, send_email: e.target.checked })}
                  className="rounded border-gray-300 text-emerald-600 h-4 w-4"
                />
                <span className="text-sm font-medium text-gray-700">{tR('sendEmail')}</span>
              </label>

              {form.send_email && (
                <Select
                  label={tR('template')}
                  value={form.email_template_id || ''}
                  onChange={e => setForm({ ...form, email_template_id: e.target.value || null })}
                  options={[
                    { value: '', label: tR('templateDefault') },
                    ...templates.map(tmpl => ({ value: tmpl.id, label: tmpl.name })),
                  ]}
                />
              )}
            </div>

            {/* Priority & Active */}
            <div className="grid grid-cols-2 gap-3 items-end">
              <Input
                label={tR('priority')}
                type="number"
                value={String(form.priority)}
                onChange={e => setForm({ ...form, priority: Number(e.target.value) })}
                placeholder="0"
              />
              <label className="flex items-center gap-2 pb-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={e => setForm({ ...form, is_active: e.target.checked })}
                  className="rounded border-gray-300 text-emerald-600 h-4 w-4"
                />
                <span className="text-sm font-medium text-gray-700">{tR('active')}</span>
              </label>
            </div>

            {/* Footer actions */}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setModalOpen(false)}>{tCommon('cancel')}</Button>
              <Button
                onClick={handleSave}
                disabled={!form.name || !form.value || !form.assigned_to}
              >
                {tCommon('save')}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
