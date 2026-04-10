'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Zap, Plus, Trash2, Edit3, ToggleLeft, ToggleRight, ArrowRight, ChevronDown } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Spinner } from '@/components/ui/loading';
import { useTranslations } from 'next-intl';

interface AutomationRule {
  id: string;
  name: string;
  trigger_type: string;
  trigger_config: Record<string, unknown>;
  action_type: string;
  action_config: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
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

  // Mock rules for local mode
  const mockRules: AutomationRule[] = [
    { id: 'auto-1', name: 'Yeni lead → Satış ekibine ata', trigger_type: 'lead_created', trigger_config: {}, action_type: 'assign', action_config: { round_robin: true }, is_active: true, created_at: '2026-03-20T10:00:00Z' },
    { id: 'auto-2', name: '3 gün hareketsiz → Hatırlatıcı', trigger_type: 'inactivity', trigger_config: { days: 3 }, action_type: 'create_reminder', action_config: { message: 'Lead ile iletişime geç' }, is_active: true, created_at: '2026-03-18T10:00:00Z' },
    { id: 'auto-3', name: 'Kazanıldı aşaması → Tebrik maili', trigger_type: 'stage_changed', trigger_config: { to_stage: 'won' }, action_type: 'send_email', action_config: { template: 'congratulations' }, is_active: false, created_at: '2026-03-15T10:00:00Z' },
  ];

  const fetchRules = useCallback(async () => {
    try {
      const res = await fetch('/api/automations');
      if (!res.ok) throw new Error();
      const data = await res.json();
      setRules(data.rules?.length > 0 ? data.rules : mockRules);
    } catch {
      setRules(mockRules);
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
      const newRule: AutomationRule = { id: `auto-${Date.now()}`, ...payload, is_active: true, created_at: new Date().toISOString() };
      try { const res = await fetch('/api/automations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); const d = await res.json(); if (d.rule) newRule.id = d.rule.id; } catch {}
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

  if (loading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('pageTitle')}</h1>
          <p className="mt-1 text-sm text-gray-500">{t('subtitle')}</p>
        </div>
        <Button icon={<Plus className="h-4 w-4" />} onClick={() => { setEditingId(null); setForm({ name: '', trigger_type: '', trigger_config: {}, action_type: '', action_config: {} }); setModalOpen(true); }}>
          {t('newAutomation')}
        </Button>
      </div>

      {rules.length === 0 ? (
        <EmptyState icon={<Zap className="h-6 w-6" />} title="Henüz otomasyon yok" description="İlk otomasyonunuzu oluşturun." />
      ) : (
        <div className="space-y-3">
          {rules.map(rule => (
            <div key={rule.id} className={`rounded-xl border bg-white p-5 transition-all ${rule.is_active ? 'border-gray-200' : 'border-gray-100 opacity-60'}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-gray-900">{rule.name}</h3>
                    {rule.is_active ? <Badge color="green" size="sm">Aktif</Badge> : <Badge color="gray" size="sm">Pasif</Badge>}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Badge color="blue" size="sm">{TRIGGER_LABELS[rule.trigger_type] || rule.trigger_type}</Badge>
                    <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
                    <Badge color="purple" size="sm">{ACTION_LABELS[rule.action_type] || rule.action_type}</Badge>
                  </div>
                  {rule.trigger_config && Object.keys(rule.trigger_config).length > 0 && (
                    <p className="mt-2 text-xs text-gray-400">Yapılandırma: {JSON.stringify(rule.trigger_config)}</p>
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

      {/* Create/Edit Modal */}
      {modalOpen && (
        <Modal open={modalOpen} title={editingId ? 'Otomasyonu Düzenle' : 'Yeni Otomasyon'} onClose={() => setModalOpen(false)} size="lg">
          <div className="space-y-5">
            <Input label="Otomasyon Adı" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ör: Yeni lead otomatik atama" />

            <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-4 space-y-3">
              <p className="text-sm font-semibold text-blue-800">Tetikleyici (Ne zaman?)</p>
              <Select label="Olay" value={form.trigger_type} onChange={e => setForm({ ...form, trigger_type: e.target.value })} options={[{ value: '', label: 'Seçin...' }, ...TRIGGER_OPTIONS]} />
              {form.trigger_type === 'stage_changed' && (
                <Select label="Hedef Aşama" value={(form.trigger_config.to_stage as string) || ''} onChange={e => setForm({ ...form, trigger_config: { ...form.trigger_config, to_stage: e.target.value } })} options={[{ value: '', label: 'Seçin...' }, ...stages.map(s => ({ value: s.slug, label: s.name }))]} />
              )}
              {form.trigger_type === 'inactivity' && (
                <Input label="Gün sayısı" type="number" value={String(form.trigger_config.days || '')} onChange={e => setForm({ ...form, trigger_config: { ...form.trigger_config, days: Number(e.target.value) } })} placeholder="3" />
              )}
              {form.trigger_type === 'score_changed' && (
                <div className="flex gap-3">
                  <Select label="Koşul" value={(form.trigger_config.condition as string) || ''} onChange={e => setForm({ ...form, trigger_config: { ...form.trigger_config, condition: e.target.value } })} options={[{ value: 'above', label: 'Üstünde' }, { value: 'below', label: 'Altında' }]} />
                  <Input label="Skor" type="number" value={String(form.trigger_config.threshold || '')} onChange={e => setForm({ ...form, trigger_config: { ...form.trigger_config, threshold: Number(e.target.value) } })} placeholder="70" />
                </div>
              )}
              {form.trigger_type === 'tag_added' && (
                <Input label="Etiket" value={(form.trigger_config.tag as string) || ''} onChange={e => setForm({ ...form, trigger_config: { ...form.trigger_config, tag: e.target.value } })} placeholder="VIP" />
              )}
            </div>

            <div className="rounded-lg border border-purple-100 bg-purple-50/50 p-4 space-y-3">
              <p className="text-sm font-semibold text-purple-800">Aksiyon (Ne yapılsın?)</p>
              <Select label="Aksiyon" value={form.action_type} onChange={e => setForm({ ...form, action_type: e.target.value })} options={[{ value: '', label: 'Seçin...' }, ...ACTION_OPTIONS]} />
              {form.action_type === 'assign' && (
                <Select label="Atanacak Kişi" value={(form.action_config.user_id as string) || ''} onChange={e => setForm({ ...form, action_config: { ...form.action_config, user_id: e.target.value } })} options={[{ value: '', label: 'Seçin...' }, ...members.map(m => ({ value: m.user_id, label: m.profile?.full_name || m.user_id }))]} />
              )}
              {form.action_type === 'change_stage' && (
                <Select label="Hedef Aşama" value={(form.action_config.stage_id as string) || ''} onChange={e => setForm({ ...form, action_config: { ...form.action_config, stage_id: e.target.value } })} options={[{ value: '', label: 'Seçin...' }, ...stages.map(s => ({ value: s.id, label: s.name }))]} />
              )}
              {form.action_type === 'add_tag' && (
                <Input label="Etiket" value={(form.action_config.tag as string) || ''} onChange={e => setForm({ ...form, action_config: { ...form.action_config, tag: e.target.value } })} placeholder="takip-edilecek" />
              )}
              {form.action_type === 'add_note' && (
                <Input label="Not İçeriği" value={(form.action_config.content as string) || ''} onChange={e => setForm({ ...form, action_config: { ...form.action_config, content: e.target.value } })} placeholder="Otomatik not..." />
              )}
              {form.action_type === 'create_reminder' && (
                <div className="flex gap-3">
                  <Input label="Gecikme (saat)" type="number" value={String(form.action_config.delay_hours || '')} onChange={e => setForm({ ...form, action_config: { ...form.action_config, delay_hours: Number(e.target.value) } })} placeholder="24" />
                  <Input label="Mesaj" value={(form.action_config.message as string) || ''} onChange={e => setForm({ ...form, action_config: { ...form.action_config, message: e.target.value } })} placeholder="Hatırlatıcı mesajı" />
                </div>
              )}
              {form.action_type === 'change_score' && (
                <div className="flex gap-3">
                  <Select label="İşlem" value={(form.action_config.operation as string) || ''} onChange={e => setForm({ ...form, action_config: { ...form.action_config, operation: e.target.value } })} options={[{ value: 'set', label: 'Değer Ata' }, { value: 'increment', label: 'Artır' }, { value: 'decrement', label: 'Azalt' }]} />
                  <Input label="Değer" type="number" value={String(form.action_config.value || '')} onChange={e => setForm({ ...form, action_config: { ...form.action_config, value: Number(e.target.value) } })} placeholder="10" />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setModalOpen(false)}>İptal</Button>
              <Button onClick={handleSave} disabled={!form.name || !form.trigger_type || !form.action_type}>Kaydet</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
