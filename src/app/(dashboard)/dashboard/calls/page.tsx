'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Phone, Plus, Play, Square, RotateCcw, Trash2, Clock, CheckCircle, XCircle, PhoneOff, PhoneIncoming, Settings2, Wifi, WifiOff, Mic, Brain, ChevronDown, Search, FileText } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Tabs } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { EmptyState } from '@/components/ui/empty-state';
import { Spinner } from '@/components/ui/loading';
import { formatDateTime, formatRelativeTime } from '@/lib/utils';
import type { Lead } from '@/lib/types';
import { useTranslations } from 'next-intl';

interface CallLog {
  id: string;
  lead_id: string;
  phone_number: string;
  direction: string;
  duration_seconds: number | null;
  status: string;
  transcript: string | null;
  summary: string | null;
  result_classification: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  lead?: { id: string; full_name: string; phone: string; company: string };
}

function useCallTranslations() {
  const t = useTranslations('calls');
  const CALL_TABS = [
    { key: 'queue', label: t('queue'), icon: <Phone className="h-4 w-4" /> },
    { key: 'history', label: t('history'), icon: <Clock className="h-4 w-4" /> },
    { key: 'config', label: t('config'), icon: <Settings2 className="h-4 w-4" /> },
  ];
  const STATUS_MAP: Record<string, { label: string; color: 'gray' | 'blue' | 'green' | 'red' | 'yellow' }> = {
    pending: { label: t('statusWaiting'), color: 'gray' },
    calling: { label: t('statusCalling'), color: 'blue' },
    completed: { label: t('statusCompleted'), color: 'green' },
    failed: { label: t('statusFailed'), color: 'red' },
    cancelled: { label: t('statusCancelled'), color: 'yellow' },
  };
  const RESULT_MAP: Record<string, { label: string; color: 'green' | 'red' | 'yellow' | 'gray' | 'blue' }> = {
    interested: { label: t('resultInterested'), color: 'green' },
    not_interested: { label: t('resultNotInterested'), color: 'red' },
    busy: { label: t('resultBusy'), color: 'yellow' },
    no_answer: { label: t('resultNoAnswer'), color: 'gray' },
    callback: { label: t('resultCallback'), color: 'blue' },
  };
  return { t, CALL_TABS, STATUS_MAP, RESULT_MAP };
}

const MOCK_CALLS: CallLog[] = [
  { id: 'call-1', lead_id: 'lead-01', phone_number: '+905321234567', direction: 'outbound', duration_seconds: 145, status: 'completed', transcript: 'Merhaba Ahmet Bey, Yo Dijital\'den arıyorum. Dijital pazarlama hizmetlerimiz hakkında bilgi vermek isterdik. Ahmet: Evet, ilgileniyorum. Özellikle sosyal medya yönetimi konusunda destek arıyoruz. Tamam, size detaylı bir teklif hazırlayalım.', summary: 'Ahmet Bey sosyal medya yönetimi ile ilgileniyor. Detaylı teklif gönderilecek.', result_classification: 'interested', metadata: { voice_profile: 'erkek-formal', lead_name: 'Ahmet Yılmaz' }, created_at: '2026-03-28T14:30:00Z', lead: { id: 'lead-01', full_name: 'Ahmet Yılmaz', phone: '+905321234567', company: 'Yılmaz Teknoloji' } },
  { id: 'call-2', lead_id: 'lead-02', phone_number: '+905551112233', direction: 'outbound', duration_seconds: null, status: 'pending', transcript: null, summary: null, result_classification: null, metadata: { voice_profile: 'kadın-casual', lead_name: 'Elif Kaya' }, created_at: '2026-03-30T09:00:00Z', lead: { id: 'lead-02', full_name: 'Elif Kaya', phone: '+905551112233', company: 'Kaya Danışmanlık' } },
  { id: 'call-3', lead_id: 'lead-03', phone_number: '+905443217890', direction: 'outbound', duration_seconds: 30, status: 'completed', transcript: 'Merhaba, Mehmet Bey\'i arıyorum. Şu an müsait değilim, daha sonra arayabilir misiniz?', summary: 'Mehmet Bey müsait değildi, geri aranacak.', result_classification: 'callback', metadata: { voice_profile: 'erkek-formal', lead_name: 'Mehmet Demir' }, created_at: '2026-03-27T11:00:00Z', lead: { id: 'lead-03', full_name: 'Mehmet Demir', phone: '+905443217890', company: 'Demir İnşaat' } },
  { id: 'call-4', lead_id: 'lead-07', phone_number: '+905551234890', direction: 'outbound', duration_seconds: 0, status: 'failed', transcript: null, summary: null, result_classification: 'no_answer', metadata: { voice_profile: 'erkek-formal', lead_name: 'Burak Şahin' }, created_at: '2026-03-26T16:00:00Z', lead: { id: 'lead-07', full_name: 'Burak Şahin', phone: '+905551234890', company: 'Şahin Otomotiv' } },
];

export default function CallsPage() {
  const { CALL_TABS } = useCallTranslations();
  const [activeTab, setActiveTab] = useState('queue');

  return (
    <div className="flex h-full flex-col">
      <Tabs items={CALL_TABS} activeKey={activeTab} onChange={setActiveTab} />
      <div className="mt-4 flex-1 min-h-0">
        {activeTab === 'queue' && <QueueTab />}
        {activeTab === 'history' && <HistoryTab />}
        {activeTab === 'config' && <ConfigTab />}
      </div>
    </div>
  );
}

// ============================================
// QUEUE TAB
// ============================================
function QueueTab() {
  const { t } = useCallTranslations();
  const tCommon = useTranslations('common');
  const leads = useAppStore(s => s.leads);
  const stages = useAppStore(s => s.stages);
  const [calls, setCalls] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [script, setScript] = useState('Merhaba {{full_name}}, Yo Dijital\'den arıyorum. Dijital pazarlama hizmetlerimiz hakkında kısa bilgi vermek istiyorum. Uygun musunuz?');
  const [voiceProfile, setVoiceProfile] = useState('erkek-formal');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetch('/api/calls').then(r => r.json()).then(d => setCalls(d.calls?.length > 0 ? d.calls : MOCK_CALLS.filter(c => c.status === 'pending'))).catch(() => setCalls(MOCK_CALLS.filter(c => c.status === 'pending'))).finally(() => setLoading(false));
  }, []);

  const filteredLeads = leads.filter(l => {
    if (!l.phone) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return l.full_name?.toLowerCase().includes(q) || l.phone.includes(q);
    }
    return true;
  });

  const toggleLead = (id: string) => setSelectedLeadIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const handleCreateJob = async () => {
    const newCalls: CallLog[] = selectedLeadIds.map(id => {
      const lead = leads.find(l => l.id === id);
      return {
        id: `call-${Date.now()}-${id}`, lead_id: id, phone_number: lead?.phone || '', direction: 'outbound',
        duration_seconds: null, status: 'pending', transcript: null, summary: null, result_classification: null,
        metadata: { script, voice_profile: voiceProfile, lead_name: lead?.full_name },
        created_at: new Date().toISOString(),
        lead: lead ? { id: lead.id, full_name: lead.full_name || '', phone: lead.phone || '', company: lead.company || '' } : undefined,
      };
    });
    setCalls(prev => [...newCalls, ...prev]);
    try { await fetch('/api/calls', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lead_ids: selectedLeadIds, script, voice_profile: voiceProfile }) }); } catch {}
    setModalOpen(false);
    setSelectedLeadIds([]);
  };

  const handleCancel = async (callId: string) => {
    setCalls(prev => prev.filter(c => c.id !== callId));
    try { await fetch(`/api/calls/${callId}`, { method: 'DELETE' }); } catch {}
  };

  const pendingCalls = calls.filter(c => c.status === 'pending');

  if (loading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{t('queue')}</h2>
          <p className="text-sm text-gray-500">{t('queueSubtitle', { count: pendingCalls.length })}</p>
        </div>
        <Button icon={<Plus className="h-4 w-4" />} onClick={() => setModalOpen(true)}>{t('newCallJob')}</Button>
      </div>

      {pendingCalls.length === 0 ? (
        <EmptyState icon={<Phone className="h-6 w-6" />} title={t('noQueue')} description={t('noQueueDesc')} />
      ) : (
        <div className="space-y-3">
          {pendingCalls.map(call => (
            <div key={call.id} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50"><Phone className="h-5 w-5 text-indigo-600" /></div>
                <div>
                  <p className="font-medium text-gray-900">{(call.metadata?.lead_name as string) || call.phone_number}</p>
                  <p className="text-sm text-gray-500">{call.phone_number}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge color="gray" size="sm">{t('waiting')}</Badge>
                <Button size="sm" variant="secondary" icon={<Play className="h-3.5 w-3.5" />} onClick={() => {}}>{t('start')}</Button>
                <button onClick={() => handleCancel(call.id)} className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Call Job Modal */}
      {modalOpen && (
        <Modal open={modalOpen} title={t('newCallJob')} onClose={() => setModalOpen(false)} size="lg">
          <div className="space-y-4">
            <div>
              <Input placeholder={t('searchLead')} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} icon={<Search className="h-4 w-4" />} />
              <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-white divide-y divide-gray-100">
                {filteredLeads.slice(0, 20).map(l => (
                  <label key={l.id} className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer">
                    <input type="checkbox" checked={selectedLeadIds.includes(l.id)} onChange={() => toggleLead(l.id)} className="rounded border-gray-300 text-indigo-600" />
                    <span className="font-medium">{l.full_name}</span>
                    <span className="text-gray-500">{l.phone}</span>
                    {l.company && <span className="text-gray-400">· {l.company}</span>}
                  </label>
                ))}
              </div>
              <p className="mt-1 text-sm text-gray-500">{t('selectedLeads', { count: selectedLeadIds.length })}</p>
            </div>

            <Select label={t('voiceProfile')} value={voiceProfile} onChange={e => setVoiceProfile(e.target.value)} options={[
              { value: 'erkek-formal', label: t('voiceMaleFormal') },
              { value: 'erkek-casual', label: t('voiceMaleCasual') },
              { value: 'kadın-formal', label: t('voiceFemaleFormal') },
              { value: 'kadın-casual', label: t('voiceFemaleCasual') },
            ]} />

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">{t('callScript')}</label>
              <textarea value={script} onChange={e => setScript(e.target.value)} rows={5} className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm" placeholder={t('callScriptPlaceholder')} />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setModalOpen(false)}>{tCommon('cancel')}</Button>
              <Button onClick={handleCreateJob} disabled={selectedLeadIds.length === 0 || !script} icon={<Phone className="h-4 w-4" />}>
                {t('addToQueue', { count: selectedLeadIds.length })}
              </Button>
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
  const { t, STATUS_MAP, RESULT_MAP } = useCallTranslations();
  const [calls, setCalls] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/calls').then(r => r.json()).then(d => setCalls(d.calls?.length > 0 ? d.calls : MOCK_CALLS)).catch(() => setCalls(MOCK_CALLS)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;

  const completedCalls = calls.filter(c => c.status !== 'pending');

  if (completedCalls.length === 0) {
    return <EmptyState icon={<Clock className="h-6 w-6" />} title={t('noHistory')} description={t('noHistoryDesc')} />;
  }

  return (
    <div className="space-y-3">
      {completedCalls.map(call => {
        const status = STATUS_MAP[call.status] || STATUS_MAP.pending;
        const result = call.result_classification ? RESULT_MAP[call.result_classification] : null;
        const isExpanded = expandedId === call.id;

        return (
          <div key={call.id} className="rounded-lg border border-gray-200 bg-white overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50" onClick={() => setExpandedId(isExpanded ? null : call.id)}>
              <div className="flex items-center gap-4">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${call.status === 'completed' ? 'bg-green-50' : call.status === 'failed' ? 'bg-red-50' : 'bg-gray-50'}`}>
                  {call.status === 'completed' ? <CheckCircle className="h-5 w-5 text-green-600" /> : call.status === 'failed' ? <XCircle className="h-5 w-5 text-red-500" /> : <Phone className="h-5 w-5 text-gray-400" />}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{call.lead?.full_name || call.phone_number}</p>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>{call.phone_number}</span>
                    {call.duration_seconds && <span>· {Math.floor(call.duration_seconds / 60)}:{String(call.duration_seconds % 60).padStart(2, '0')}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {result && <Badge color={result.color} size="sm">{result.label}</Badge>}
                <Badge color={status.color} size="sm">{status.label}</Badge>
                <span className="text-xs text-gray-400">{formatRelativeTime(call.created_at)}</span>
                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
              </div>
            </div>

            {isExpanded && (call.transcript || call.summary) && (
              <div className="border-t border-gray-100 px-4 py-3 bg-gray-50/50 space-y-3">
                {call.summary && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{t('aiSummary')}</p>
                    <p className="text-sm text-gray-700">{call.summary}</p>
                  </div>
                )}
                {call.transcript && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{t('transcript')}</p>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap bg-white rounded-lg p-3 border border-gray-200">{call.transcript}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ============================================
// CONFIG TAB
// ============================================
function ConfigTab() {
  const hasNetgsm = !!process.env.NEXT_PUBLIC_NETGSM_USER;
  const hasElevenLabs = !!process.env.NEXT_PUBLIC_ELEVENLABS_KEY;
  const hasOpenAI = !!process.env.NEXT_PUBLIC_OPENAI_KEY;

  const [config, setConfig] = useState({
    max_duration: 180,
    work_hours_start: '09:00',
    work_hours_end: '18:00',
    max_retries: 2,
    system_prompt: 'Sen Yo Dijital adına arayan profesyonel bir satış asistanısın. Nazik, kısa ve öz konuş. Amacın müşterinin ilgisini ölçmek ve uygunsa toplantı planlamak.',
  });

  const services = [
    { name: 'Netgsm', desc: 'Telefon altyapısı', connected: hasNetgsm, icon: <Phone className="h-5 w-5" /> },
    { name: 'ElevenLabs', desc: 'Ses sentezi', connected: hasElevenLabs, icon: <Mic className="h-5 w-5" /> },
    { name: 'OpenAI', desc: 'Yapay zeka konuşma', connected: hasOpenAI, icon: <Brain className="h-5 w-5" /> },
  ];

  return (
    <div className="max-w-3xl space-y-6">
      {/* Service Status */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Servis Durumu</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {services.map(s => (
            <div key={s.name} className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${s.connected ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-400'}`}>{s.icon}</div>
                <div>
                  <p className="font-medium text-gray-900">{s.name}</p>
                  <p className="text-xs text-gray-500">{s.desc}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {s.connected ? <><Wifi className="h-3.5 w-3.5 text-green-500" /><span className="text-xs text-green-600">Bağlı</span></> : <><WifiOff className="h-3.5 w-3.5 text-gray-400" /><span className="text-xs text-gray-500">Bağlı Değil</span></>}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-gray-400">API key&apos;leri .env.local dosyasında tanımlayın: NETGSM_USER, ELEVENLABS_API_KEY, OPENAI_API_KEY</p>
      </div>

      {/* Call Settings */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Arama Ayarları</h2>
        <div className="rounded-lg border border-gray-200 bg-white p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Maks. Arama Süresi (sn)" type="number" value={String(config.max_duration)} onChange={e => setConfig({ ...config, max_duration: Number(e.target.value) })} />
            <Input label="Maks. Tekrar Deneme" type="number" value={String(config.max_retries)} onChange={e => setConfig({ ...config, max_retries: Number(e.target.value) })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Çalışma Saati Başlangıç" type="time" value={config.work_hours_start} onChange={e => setConfig({ ...config, work_hours_start: e.target.value })} />
            <Input label="Çalışma Saati Bitiş" type="time" value={config.work_hours_end} onChange={e => setConfig({ ...config, work_hours_end: e.target.value })} />
          </div>
        </div>
      </div>

      {/* AI Prompt */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">AI Sistem Prompt&apos;u</h2>
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <textarea value={config.system_prompt} onChange={e => setConfig({ ...config, system_prompt: e.target.value })} rows={5} className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm" />
          <p className="mt-2 text-xs text-gray-400">Bu prompt, AI araması sırasında konuşma yönlendirmesi için kullanılır.</p>
        </div>
      </div>

      <Button>Ayarları Kaydet</Button>
    </div>
  );
}
