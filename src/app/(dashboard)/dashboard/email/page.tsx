'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Mail, Send, FileText, Clock, Plus, Trash2, Edit3, Search, Loader2, CheckCircle, XCircle, Users } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Tabs } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { EmptyState } from '@/components/ui/empty-state';
import { Spinner } from '@/components/ui/loading';
import { formatDateTime } from '@/lib/utils';
import { SOURCE_PLATFORM_LABELS } from '@/lib/types';
import type { Lead } from '@/lib/types';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
  created_at: string;
}

interface SendResult {
  sent: number;
  failed: number;
  mock?: boolean;
}

const VARIABLE_OPTIONS = ['{{full_name}}', '{{first_name}}', '{{last_name}}', '{{email}}', '{{phone}}', '{{company}}', '{{city}}'];

export default function EmailPage() {
  const t = useTranslations('email');
  const EMAIL_TABS = [
    { key: 'compose', label: t('send'), icon: <Send className="h-4 w-4" /> },
    { key: 'templates', label: t('templates'), icon: <FileText className="h-4 w-4" /> },
    { key: 'history', label: t('history'), icon: <Clock className="h-4 w-4" /> },
  ];
  const [activeTab, setActiveTab] = useState('compose');

  return (
    <div className="flex h-full flex-col">
      <Tabs items={EMAIL_TABS} activeKey={activeTab} onChange={setActiveTab} />
      <div className="mt-4 flex-1 min-h-0">
        {activeTab === 'compose' && <ComposeTab />}
        {activeTab === 'templates' && <TemplatesTab />}
        {activeTab === 'history' && <HistoryTab />}
      </div>
    </div>
  );
}

// ============================================
// COMPOSE TAB
// ============================================
function ComposeTab() {
  const t = useTranslations('email');
  const tCommon = useTranslations('common');
  const leads = useAppStore(s => s.leads);
  const stages = useAppStore(s => s.stages);
  const [mode, setMode] = useState<'single' | 'bulk'>('single');
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<SendResult | null>(null);
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [stageFilter, setStageFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');

  useEffect(() => {
    fetch('/api/email/templates').then(r => r.json()).then(d => setTemplates(d.templates || [])).catch(() => {});
  }, []);

  const applyTemplate = (templateId: string) => {
    const t = templates.find(x => x.id === templateId);
    if (t) { setSubject(t.subject); setBody(t.body); }
    setSelectedTemplate(templateId);
  };

  const filteredLeads = leads.filter(l => {
    if (stageFilter && l.stage_id !== stageFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return l.full_name?.toLowerCase().includes(q) || l.email?.toLowerCase().includes(q);
    }
    return true;
  });

  const toggleLead = (id: string) => {
    setSelectedLeadIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSend = async () => {
    setSending(true);
    setResult(null);
    try {
      const recipients = mode === 'single' ? [to] : selectedLeadIds.map(id => leads.find(l => l.id === id)?.email).filter(Boolean) as string[];
      const leadIds = mode === 'single' ? leads.filter(l => l.email === to).map(l => l.id) : selectedLeadIds;

      const res = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: recipients, subject, body, lead_ids: leadIds }),
      });
      const data = await res.json();
      setResult({ sent: data.sent || recipients.length, failed: data.failed || 0, mock: data.mock });
    } catch {
      setResult({ sent: 0, failed: 1 });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Mode toggle */}
      <div className="flex gap-2">
        <button onClick={() => setMode('single')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'single' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          {t('singleSend')}
        </button>
        <button onClick={() => setMode('bulk')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'bulk' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          {t('bulkSend')}
        </button>
      </div>

      {/* Template selector */}
      {templates.length > 0 && (
        <Select label={t('selectTemplate')} value={selectedTemplate} onChange={e => applyTemplate(e.target.value)} options={[{ value: '', label: t('templateSelectPlaceholder') }, ...templates.map(tmpl => ({ value: tmpl.id, label: tmpl.name }))]} />
      )}

      {/* Recipient */}
      {mode === 'single' ? (
        <div>
          <Input label={t('recipient')} placeholder={t('recipientPlaceholder')} value={to} onChange={e => setTo(e.target.value)} icon={<Mail className="h-4 w-4" />} />
          {to && !to.includes('@') && (
            <div className="mt-2 max-h-32 overflow-y-auto rounded-lg border border-gray-200 bg-white">
              {leads.filter(l => l.full_name?.toLowerCase().includes(to.toLowerCase()) || l.email?.toLowerCase().includes(to.toLowerCase())).slice(0, 5).map(l => (
                <button key={l.id} onClick={() => setTo(l.email || '')} className="flex w-full items-center gap-3 px-3 py-2 text-sm hover:bg-gray-50">
                  <span className="font-medium">{l.full_name}</span>
                  <span className="text-gray-500">{l.email}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex gap-3">
            <div className="flex-1"><Input placeholder="Lead ara..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} icon={<Search className="h-4 w-4" />} /></div>
            <Select value={stageFilter} onChange={e => setStageFilter(e.target.value)} options={[{ value: '', label: 'Tüm aşamalar' }, ...stages.map(s => ({ value: s.id, label: s.name }))]} />
          </div>
          <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-white divide-y divide-gray-100">
            {filteredLeads.filter(l => l.email).map(l => (
              <label key={l.id} className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer">
                <input type="checkbox" checked={selectedLeadIds.includes(l.id)} onChange={() => toggleLead(l.id)} className="rounded border-gray-300 text-indigo-600" />
                <span className="font-medium">{l.full_name}</span>
                <span className="text-gray-500">{l.email}</span>
                {l.stage && <Badge color="blue" size="sm">{l.stage.name}</Badge>}
              </label>
            ))}
          </div>
          <p className="text-sm text-gray-500">{selectedLeadIds.length} lead seçili</p>
        </div>
      )}

      {/* Subject & Body */}
      <Input label="Konu" value={subject} onChange={e => setSubject(e.target.value)} placeholder="E-posta konusu..." />
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">İçerik</label>
        <textarea value={body} onChange={e => setBody(e.target.value)} rows={10} className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" placeholder="E-posta içeriğini yazın... Değişkenler: {{full_name}}, {{company}} vb." />
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {VARIABLE_OPTIONS.map(v => (
            <button key={v} onClick={() => setBody(prev => prev + ' ' + v)} className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-600 hover:bg-gray-200">{v}</button>
          ))}
        </div>
      </div>
      <p className="text-xs text-gray-400">Gönderici: info@yodijital.com</p>

      {/* Send */}
      <div className="flex items-center gap-3">
        <Button onClick={handleSend} loading={sending} disabled={!subject || !body || (mode === 'single' ? !to : selectedLeadIds.length === 0)} icon={<Send className="h-4 w-4" />}>
          {mode === 'single' ? 'Gönder' : `${selectedLeadIds.length} Lead'e Gönder`}
        </Button>
        {result && (
          <div className="flex items-center gap-2 text-sm">
            {result.sent > 0 && <span className="flex items-center gap-1 text-green-600"><CheckCircle className="h-4 w-4" />{result.sent} gönderildi</span>}
            {result.failed > 0 && <span className="flex items-center gap-1 text-red-500"><XCircle className="h-4 w-4" />{result.failed} başarısız</span>}
            {result.mock && <Badge color="yellow" size="sm">Mock Mode</Badge>}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// TEMPLATES TAB
// ============================================
function TemplatesTab() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', subject: '', body: '', variables: '' });

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetch('/api/email/templates');
      const data = await res.json();
      setTemplates(data.templates || []);
    } catch {
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  const handleSave = async () => {
    const payload = { name: form.name, subject: form.subject, body: form.body, variables: form.variables.split(',').map(v => v.trim()).filter(Boolean) };
    if (editingId) {
      await fetch(`/api/email/templates/${editingId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    } else {
      await fetch('/api/email/templates', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    }
    setModalOpen(false);
    setEditingId(null);
    setForm({ name: '', subject: '', body: '', variables: '' });
    fetchTemplates();
  };

  const handleEdit = (t: EmailTemplate) => {
    setEditingId(t.id);
    setForm({ name: t.name, subject: t.subject, body: t.body, variables: (t.variables || []).join(', ') });
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/email/templates/${id}`, { method: 'DELETE' });
    fetchTemplates();
  };

  if (loading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">E-posta Şablonları</h2>
        <Button size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => { setEditingId(null); setForm({ name: '', subject: '', body: '', variables: '' }); setModalOpen(true); }}>
          Yeni Şablon
        </Button>
      </div>

      {templates.length === 0 ? (
        <EmptyState icon={<FileText className="h-6 w-6" />} title="Henüz şablon yok" description="E-posta şablonu oluşturarak tekrar eden gönderimlerinizi hızlandırın." />
      ) : (
        <div className="space-y-3">
          {templates.map(t => (
            <div key={t.id} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3">
              <div className="min-w-0">
                <p className="font-medium text-gray-900">{t.name}</p>
                <p className="text-sm text-gray-500 truncate">Konu: {t.subject}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => handleEdit(t)} className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"><Edit3 className="h-4 w-4" /></button>
                <button onClick={() => handleDelete(t.id)} className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <Modal open={modalOpen} title={editingId ? 'Şablonu Düzenle' : 'Yeni Şablon'} onClose={() => setModalOpen(false)} size="lg">
          <div className="space-y-4">
            <Input label="Şablon Adı" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ör: Karşılama E-postası" />
            <Input label="Konu" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="E-posta konusu..." />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">İçerik</label>
              <textarea value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} rows={8} className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm" placeholder="Merhaba {{full_name}},&#10;&#10;..." />
            </div>
            <Input label="Değişkenler (virgülle ayır)" value={form.variables} onChange={e => setForm({ ...form, variables: e.target.value })} placeholder="full_name, company, city" />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setModalOpen(false)}>İptal</Button>
              <Button onClick={handleSave} disabled={!form.name || !form.subject}>Kaydet</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ============================================
// HISTORY TAB
// ============================================
function HistoryTab() {
  const [history, setHistory] = useState<Array<{ id: string; title: string; description: string; metadata: Record<string, unknown>; created_at: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/email/history').then(r => r.json()).then(d => setHistory(d.history || d || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;

  if (history.length === 0) {
    return <EmptyState icon={<Clock className="h-6 w-6" />} title="Henüz gönderim yok" description="E-posta gönderdiğinizde burada görünecektir." />;
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50/50 text-xs font-medium uppercase tracking-wider text-gray-500">
            <th className="px-4 py-3 text-left">Alıcı</th>
            <th className="px-4 py-3 text-left">Konu</th>
            <th className="px-4 py-3 text-left">Durum</th>
            <th className="px-4 py-3 text-left">Tarih</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {history.map(h => (
            <tr key={h.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-gray-900">{(h.metadata?.to as string) || '-'}</td>
              <td className="px-4 py-3 text-gray-700">{(h.metadata?.subject as string) || h.description || '-'}</td>
              <td className="px-4 py-3">
                <Badge color={(h.metadata?.status as string) === 'sent' ? 'green' : 'red'} size="sm">
                  {(h.metadata?.status as string) === 'sent' ? 'Gönderildi' : 'Başarısız'}
                </Badge>
              </td>
              <td className="px-4 py-3 text-gray-500">{formatDateTime(h.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
