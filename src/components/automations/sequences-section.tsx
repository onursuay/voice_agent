'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Bot, Plus, Trash2, Edit3, ToggleLeft, ToggleRight, Phone, Mail, Clock, ArrowDown, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { IL_LIST } from '@/lib/leads/turkeyProvinces.data';

// Şehir "Değer" alanı için 81 il (Türkçe sıralı) — yönlendirme kuralıyla aynı dropdown.
const IL_SELECT_OPTIONS = [
  { value: '', label: '—' },
  ...[...IL_LIST].sort((a, b) => a.localeCompare(b, 'tr')).map((il) => ({ value: il, label: il })),
];

// AI Orkestra Senaryoları: lead düşünce plana göre AI arama + funnel mail zinciri.
// Owner burada kurar: tetik koşulu, arama penceresi, adımlar (Ara/Mail + gecikme + koşul).

interface StepForm {
  step_type: 'ai_call' | 'email';
  delay_minutes: number;
  only_if: 'always' | 'not_reached' | 'reached';
  email_template_id: string | null;
}

interface SequenceRow {
  id: string;
  name: string;
  is_active: boolean;
  priority: number;
  trigger_config: { conditions?: Array<{ field: string; operator: string; value: string | string[] }> };
  call_window: { start_hour?: number; end_hour?: number };
  steps: Array<{ step_type: string; delay_minutes: number; only_if: string; config: { email_template_id?: string | null } }>;
  enrollment_counts?: { active: number; completed: number };
}

interface EmailTemplate { id: string; name: string }
interface PageRef { page_id: string; page_name: string | null }

const EMPTY_STEP: StepForm = { step_type: 'ai_call', delay_minutes: 0, only_if: 'always', email_template_id: null };

export function SequencesSection() {
  const t = useTranslations('sequences');
  const tR = useTranslations('routing');
  const tCommon = useTranslations('common');

  const [sequences, setSequences] = useState<SequenceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [customFieldKeys, setCustomFieldKeys] = useState<string[]>([]);
  const [connectedPages, setConnectedPages] = useState<PageRef[]>([]);

  const [form, setForm] = useState({
    name: '',
    field: '',            // boş = koşulsuz (tüm yeni lead'ler)
    operator: 'equals',
    value: '',
    start_hour: 11,
    end_hour: 18,
    priority: 0,
    is_active: true,
    steps: [{ ...EMPTY_STEP }] as StepForm[],
  });

  const FIELD_OPTIONS = [
    { value: '', label: t('triggerAll') },
    { value: 'city', label: tR('fieldCity') },
    { value: 'country', label: tR('fieldCountry') },
    { value: 'source_platform', label: tR('fieldSource') },
    { value: 'meta_page_id', label: tR('fieldPage') },
    { value: 'form_name', label: tR('fieldFormName') },
    { value: 'campaign_name', label: tR('fieldCampaign') },
    ...customFieldKeys.map((k) => ({ value: `custom.${k}`, label: `${tR('fieldCustomPrefix')}: ${k}` })),
  ];
  const OPERATOR_OPTIONS = [
    { value: 'equals', label: tR('opEquals') },
    { value: 'not_equals', label: tR('opNotEquals') },
    { value: 'contains', label: tR('opContains') },
    { value: 'in', label: tR('opIn') },
  ];
  const ONLY_IF_OPTIONS = [
    { value: 'always', label: t('onlyIfAlways') },
    { value: 'not_reached', label: t('onlyIfNotReached') },
    { value: 'reached', label: t('onlyIfReached') },
  ];
  const STEP_TYPE_OPTIONS = [
    { value: 'ai_call', label: t('stepCall') },
    { value: 'email', label: t('stepEmail') },
  ];

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/sequences');
      if (res.ok) {
        const d = await res.json();
        setSequences((d.sequences || []) as SequenceRow[]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    fetch('/api/email/templates').then(r => r.json()).then(d => setTemplates(d.templates || [])).catch(() => {});
    fetch('/api/leads/custom-fields').then(r => (r.ok ? r.json() : { keys: [] })).then(d => setCustomFieldKeys(d.keys || [])).catch(() => {});
    fetch('/api/integrations/meta/pages').then(r => (r.ok ? r.json() : { pages: [] })).then(d => setConnectedPages(d.pages || [])).catch(() => {});
  }, [load]);

  const openCreate = () => {
    setEditingId(null);
    setForm({
      name: '', field: '', operator: 'equals', value: '',
      start_hour: 11, end_hour: 18, priority: 0, is_active: true,
      // Önerilen başlangıç: Ara → görüşüldüyse teşekkür maili → ulaşılamadıysa funnel maili
      steps: [
        { step_type: 'ai_call', delay_minutes: 5, only_if: 'always', email_template_id: null },
        { step_type: 'email', delay_minutes: 10, only_if: 'reached', email_template_id: null },
        { step_type: 'email', delay_minutes: 60, only_if: 'not_reached', email_template_id: null },
      ],
    });
    setModalOpen(true);
  };

  const openEdit = (seq: SequenceRow) => {
    const c = seq.trigger_config?.conditions?.[0];
    setEditingId(seq.id);
    setForm({
      name: seq.name,
      field: c?.field || '',
      operator: c?.operator || 'equals',
      value: Array.isArray(c?.value) ? c.value.join(', ') : (c?.value || ''),
      start_hour: seq.call_window?.start_hour ?? 11,
      end_hour: seq.call_window?.end_hour ?? 18,
      priority: seq.priority ?? 0,
      is_active: seq.is_active,
      steps: (seq.steps || []).map((s) => ({
        step_type: (s.step_type === 'email' ? 'email' : 'ai_call'),
        delay_minutes: s.delay_minutes ?? 0,
        only_if: (['always', 'not_reached', 'reached'].includes(s.only_if) ? s.only_if : 'always') as StepForm['only_if'],
        email_template_id: s.config?.email_template_id ?? null,
      })),
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const conditionValue = form.operator === 'in'
        ? form.value.split(',').map(v => v.trim()).filter(Boolean)
        : form.value;
      const payload = {
        name: form.name,
        is_active: form.is_active,
        priority: form.priority,
        trigger_config: form.field
          ? { conditions: [{ field: form.field, operator: form.operator, value: conditionValue }], match: 'all' }
          : {},
        call_window: { start_hour: form.start_hour, end_hour: form.end_hour },
        steps: form.steps.map(s => ({
          step_type: s.step_type,
          delay_minutes: s.delay_minutes,
          only_if: s.only_if,
          config: { email_template_id: s.email_template_id },
        })),
      };
      if (editingId) {
        await fetch(`/api/sequences/${editingId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      } else {
        await fetch('/api/sequences', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      }
      setModalOpen(false);
      setEditingId(null);
      await load();
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (seq: SequenceRow) => {
    await fetch(`/api/sequences/${seq.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_active: !seq.is_active }) }).catch(() => {});
    await load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('deleteConfirm'))) return;
    await fetch(`/api/sequences/${id}`, { method: 'DELETE' }).catch(() => {});
    await load();
  };

  const setStep = (i: number, patch: Partial<StepForm>) => {
    setForm(f => ({ ...f, steps: f.steps.map((s, idx) => (idx === i ? { ...s, ...patch } : s)) }));
  };

  const triggerSummary = (seq: SequenceRow): string => {
    const c = seq.trigger_config?.conditions?.[0];
    if (!c) return t('triggerAll');
    const fieldLabel = FIELD_OPTIONS.find(o => o.value === c.field)?.label || (c.field.startsWith('custom.') ? c.field.slice(7) : c.field);
    let valueStr = Array.isArray(c.value) ? c.value.join(', ') : c.value;
    if (c.field === 'meta_page_id') valueStr = connectedPages.find(p => p.page_id === valueStr)?.page_name || valueStr;
    return `${fieldLabel}: ${valueStr}`;
  };

  const stepBadge = (s: SequenceRow['steps'][number], i: number) => {
    const icon = s.step_type === 'ai_call' ? <Phone className="h-3 w-3" /> : <Mail className="h-3 w-3" />;
    const onlyIf = s.only_if === 'not_reached' ? ` · ${t('onlyIfNotReachedShort')}` : s.only_if === 'reached' ? ` · ${t('onlyIfReachedShort')}` : '';
    const delay = s.delay_minutes ? ` +${s.delay_minutes}${t('minuteSuffix')}` : '';
    return (
      <span key={i} className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-700">
        {icon}{s.step_type === 'ai_call' ? t('stepCall') : t('stepEmail')}{delay}{onlyIf}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      <div className="border-t border-gray-200 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <Bot className="h-5 w-5 text-emerald-600" /> {t('title')}
            </h2>
            <p className="mt-0.5 text-sm text-gray-500">{t('desc')}</p>
          </div>
          <Button icon={<Plus className="h-4 w-4" />} onClick={openCreate}>{t('newSequence')}</Button>
        </div>
      </div>

      {loading ? (
        <div className="h-20 animate-pulse rounded-xl bg-gray-100" />
      ) : sequences.length === 0 ? (
        <EmptyState icon={<Bot className="h-6 w-6" />} title={t('empty')} description={t('emptyDesc')} />
      ) : (
        <div className="space-y-3">
          {sequences.map((seq) => (
            <div key={seq.id} className={`rounded-xl border bg-white p-5 transition-all ${seq.is_active ? 'border-gray-200' : 'border-gray-100 opacity-60'}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex items-center gap-3">
                    <h3 className="font-semibold text-gray-900">{seq.name}</h3>
                    <Badge color={seq.is_active ? 'green' : 'gray'} size="sm">{seq.is_active ? t('active') : t('passive')}</Badge>
                    <span className="text-xs text-gray-400">
                      {t('window')}: {seq.call_window?.start_hour ?? 11}:00–{seq.call_window?.end_hour ?? 18}:00
                    </span>
                  </div>
                  <div className="mb-2 flex flex-wrap items-center gap-1.5">
                    <Badge color="blue" size="sm">{triggerSummary(seq)}</Badge>
                    <ArrowDown className="h-3 w-3 rotate-[-90deg] text-gray-300" />
                    {(seq.steps || []).map((s, i) => stepBadge(s, i))}
                  </div>
                  <p className="text-xs text-gray-400">
                    {t('enrollmentSummary', { active: seq.enrollment_counts?.active ?? 0, completed: seq.enrollment_counts?.completed ?? 0 })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleToggle(seq)} className="text-gray-400 hover:text-gray-600" aria-label={t('active')}>
                    {seq.is_active ? <ToggleRight className="h-6 w-6 text-green-500" /> : <ToggleLeft className="h-6 w-6" />}
                  </button>
                  <button onClick={() => openEdit(seq)} className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600" aria-label={tCommon('save')}>
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDelete(seq.id)} className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500" aria-label={t('deleteConfirm')}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <Modal open={modalOpen} title={editingId ? t('editSequence') : t('newSequence')} onClose={() => setModalOpen(false)} size="lg">
          <div className="space-y-4">
            <Input label={t('name')} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder={t('namePlaceholder')} />

            {/* Tetik koşulu */}
            <div className="space-y-3 rounded-lg border border-blue-100 bg-blue-50/50 p-4">
              <p className="text-sm font-semibold text-blue-800">{t('trigger')}</p>
              <div className="grid grid-cols-3 gap-3">
                <Select label={tR('field')} value={form.field} onChange={e => setForm({ ...form, field: e.target.value })} options={FIELD_OPTIONS} />
                {form.field && (
                  <>
                    <Select label={tR('operator')} value={form.operator} onChange={e => setForm({ ...form, operator: e.target.value })} options={OPERATOR_OPTIONS} />
                    {form.field === 'meta_page_id' ? (
                      <Select label={tR('value')} value={form.value} onChange={e => setForm({ ...form, value: e.target.value })}
                        options={[{ value: '', label: '—' }, ...connectedPages.map(p => ({ value: p.page_id, label: p.page_name || p.page_id }))]} />
                    ) : (
                      <Input label={tR('value')} value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} placeholder={tR('valuePlaceholder')} />
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Arama penceresi */}
            <div className="grid grid-cols-2 gap-3 rounded-lg border border-amber-100 bg-amber-50/50 p-4">
              <Input label={t('windowStart')} type="number" value={String(form.start_hour)}
                onChange={e => setForm({ ...form, start_hour: Math.max(0, Math.min(23, Number(e.target.value) || 0)) })} />
              <Input label={t('windowEnd')} type="number" value={String(form.end_hour)}
                onChange={e => setForm({ ...form, end_hour: Math.max(1, Math.min(24, Number(e.target.value) || 0)) })} />
            </div>

            {/* Adımlar */}
            <div className="space-y-2 rounded-lg border border-emerald-100 bg-emerald-50/40 p-4">
              <p className="text-sm font-semibold text-emerald-800">{t('steps')}</p>
              {form.steps.map((s, i) => (
                <div key={i} className="flex flex-wrap items-end gap-2 rounded-lg border border-gray-100 bg-white p-3">
                  <span className="mb-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">{i + 1}</span>
                  <div className="w-36">
                    <Select label={t('stepType')} value={s.step_type} onChange={e => setStep(i, { step_type: e.target.value as StepForm['step_type'] })} options={STEP_TYPE_OPTIONS} />
                  </div>
                  <div className="w-32">
                    <Input label={t('delay')} type="number" value={String(s.delay_minutes)}
                      onChange={e => setStep(i, { delay_minutes: Math.max(0, Number(e.target.value) || 0) })} />
                  </div>
                  <div className="w-44">
                    <Select label={t('condition')} value={s.only_if} onChange={e => setStep(i, { only_if: e.target.value as StepForm['only_if'] })} options={ONLY_IF_OPTIONS} />
                  </div>
                  {s.step_type === 'email' && (
                    <div className="w-48">
                      <Select label={tR('template')} value={s.email_template_id || ''}
                        onChange={e => setStep(i, { email_template_id: e.target.value || null })}
                        options={[{ value: '', label: t('templateAuto') }, ...templates.map(tp => ({ value: tp.id, label: tp.name }))]} />
                    </div>
                  )}
                  {form.steps.length > 1 && (
                    <button onClick={() => setForm(f => ({ ...f, steps: f.steps.filter((_, idx) => idx !== i) }))}
                      className="mb-2 rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500" aria-label={tCommon('cancel')}>
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              <button onClick={() => setForm(f => ({ ...f, steps: [...f.steps, { ...EMPTY_STEP, delay_minutes: 60 }] }))}
                className="flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-emerald-300 py-2 text-xs font-medium text-emerald-600 transition-colors hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300">
                <Plus className="h-3.5 w-3.5" /> {t('addStep')}
              </button>
              <p className="flex items-center gap-1 text-[11px] text-gray-400"><Clock className="h-3 w-3" /> {t('stepHint')}</p>
            </div>

            {/* Öncelik + Aktif */}
            <div className="grid grid-cols-2 items-end gap-3">
              <Input label={tR('priority')} type="number" value={String(form.priority)} onChange={e => setForm({ ...form, priority: Number(e.target.value) || 0 })} />
              <label className="flex cursor-pointer select-none items-center gap-2 pb-2">
                <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} className="h-4 w-4 rounded border-gray-300 text-emerald-600" />
                <span className="text-sm font-medium text-gray-700">{t('active')}</span>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setModalOpen(false)}>{tCommon('cancel')}</Button>
              <Button onClick={handleSave} disabled={!form.name || saving || form.steps.length === 0}>
                {saving ? '…' : tCommon('save')}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
