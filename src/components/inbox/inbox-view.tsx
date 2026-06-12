'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store';
import { getInitials } from '@/lib/utils';
import type { Conversation, InboxChannel, Message } from '@/lib/types';
import { CHANNEL_VISUAL, statusStyle } from '@/components/inbox/channel-meta';
import {
  Search, Send, Loader2, Check, CheckCheck, AlertCircle, Inbox as InboxIcon,
  ExternalLink, User2, Phone, Mail, Megaphone, ChevronDown, MessageSquareDashed,
} from 'lucide-react';

const CHANNEL_TABS: (InboxChannel | 'all')[] = ['all', 'whatsapp', 'instagram', 'messenger'];
const STATUS_OPTIONS = ['new', 'open', 'pending', 'resolved', 'snoozed'] as const;

function leadName(c: Conversation): string {
  return (
    c.lead?.display_name ||
    c.lead?.full_name ||
    c.lead?.instagram_username ||
    c.lead?.phone ||
    c.external_conversation_id ||
    '—'
  );
}

export default function InboxView() {
  const t = useTranslations('inbox');
  const locale = useLocale();
  const { session, members } = useAppStore();
  const orgId = session?.organization?.id ?? null;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [channelFilter, setChannelFilter] = useState<InboxChannel | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [search, setSearch] = useState('');

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingThread, setLoadingThread] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [hasChannels, setHasChannels] = useState(true);

  const selected = useMemo(
    () => conversations.find((c) => c.id === selectedId) ?? null,
    [conversations, selectedId],
  );

  const threadEndRef = useRef<HTMLDivElement>(null);

  /* ── Locale-aware zaman formatı ── */
  const fmtTime = useCallback(
    (iso: string | null) => {
      if (!iso) return '';
      const d = new Date(iso);
      const sameDay = new Date().toDateString() === d.toDateString();
      return new Intl.DateTimeFormat(locale, sameDay
        ? { hour: '2-digit', minute: '2-digit' }
        : { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(d);
    },
    [locale],
  );

  /* ── Konuşma listesini yükle ── */
  const loadConversations = useCallback(async () => {
    if (!orgId) return;
    const params = new URLSearchParams();
    if (channelFilter !== 'all') params.set('channel', channelFilter);
    if (statusFilter) params.set('status', statusFilter);
    if (search.trim()) params.set('search', search.trim());
    try {
      const res = await fetch(`/api/inbox/conversations?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setConversations((data.conversations || []) as Conversation[]);
      }
    } finally {
      setLoadingList(false);
    }
  }, [orgId, channelFilter, statusFilter, search]);

  // loader'ı ref'te tut — realtime her filtre değişiminde yeniden abone olmasın
  const loaderRef = useRef(loadConversations);
  useEffect(() => { loaderRef.current = loadConversations; }, [loadConversations]);

  useEffect(() => {
    setLoadingList(true);
    const tmr = setTimeout(loadConversations, search ? 250 : 0); // arama debounce
    return () => clearTimeout(tmr);
  }, [loadConversations, search]);

  /* ── Bağlı kanal var mı? (boş durum ipucu için) ── */
  useEffect(() => {
    fetch('/api/inbox/channels')
      .then((r) => (r.ok ? r.json() : { channels: [] }))
      .then((d) => setHasChannels((d.channels || []).length > 0))
      .catch(() => {});
  }, []);

  /* ── Konuşma listesi realtime (org geneli) ── */
  useEffect(() => {
    if (!orgId) return;
    const supabase = createClient();
    const channel = supabase
      .channel('inbox-conversations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations', filter: `organization_id=eq.${orgId}` },
        () => loaderRef.current())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [orgId]);

  /* ── Seçili konuşma: mesajları yükle + okundu işaretle ── */
  const openConversation = useCallback(async (id: string) => {
    setSelectedId(id);
    setSendError(null);
    setLoadingThread(true);
    setMessages([]);
    try {
      const res = await fetch(`/api/inbox/conversations/${id}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages((data.messages || []) as Message[]);
      }
      // okundu işaretle (unread sıfırla)
      fetch(`/api/inbox/conversations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read: true }),
      }).then(() => {
        setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, unread_count: 0 } : c)));
      }).catch(() => {});
    } finally {
      setLoadingThread(false);
    }
  }, []);

  /* ── Mesaj thread realtime (seçili konuşma) ── */
  useEffect(() => {
    if (!selectedId) return;
    const supabase = createClient();
    const upsert = (row: Message) =>
      setMessages((prev) => {
        const i = prev.findIndex((m) => m.id === row.id);
        if (i === -1) return [...prev, row];
        const next = [...prev]; next[i] = row; return next;
      });
    const channel = supabase
      .channel(`inbox-messages-${selectedId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${selectedId}` },
        (payload) => upsert(payload.new as Message))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `conversation_id=eq.${selectedId}` },
        (payload) => upsert(payload.new as Message))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedId]);

  // Thread sonuna kaydır
  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /* ── Yanıt gönder ── */
  const sendReply = useCallback(async () => {
    const text = draft.trim();
    if (!text || !selectedId || sending) return;
    setSending(true);
    setSendError(null);
    try {
      const res = await fetch(`/api/inbox/conversations/${selectedId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.message) {
        setMessages((prev) => (prev.some((m) => m.id === data.message.id) ? prev : [...prev, data.message as Message]));
      }
      if (!res.ok || data.sent === false) {
        setSendError(data.error || t('sendError'));
      } else {
        setDraft('');
      }
    } catch {
      setSendError(t('sendError'));
    } finally {
      setSending(false);
    }
  }, [draft, selectedId, sending, t]);

  /* ── Konuşma güncelle (status / atama) ── */
  const patchConversation = useCallback(async (id: string, patch: Record<string, unknown>) => {
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } as Conversation : c)));
    await fetch(`/api/inbox/conversations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    }).catch(() => {});
  }, []);

  if (!orgId) return null;

  return (
    <div className="flex h-[calc(100vh-7rem)] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      {/* ════ SOL: Konuşma listesi ════ */}
      <aside className="flex w-full max-w-[340px] shrink-0 flex-col border-r border-gray-200 bg-gray-50/60">
        <div className="border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold tracking-tight text-gray-900">{t('title')}</h1>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-600">
              {conversations.length}
            </span>
          </div>
          {/* Arama */}
          <div className="relative mt-3">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-800 outline-none transition-shadow placeholder:text-gray-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            />
          </div>
          {/* Kanal sekmeleri */}
          <div className="mt-3 flex items-center gap-1">
            {CHANNEL_TABS.map((tab) => {
              const active = channelFilter === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setChannelFilter(tab)}
                  className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${
                    active ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-200/60'
                  }`}
                >
                  {tab === 'all' ? t('filters.all') : t(`filters.${tab}`)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Liste */}
        <div className="flex-1 overflow-y-auto">
          {loadingList ? (
            <div className="flex h-40 items-center justify-center text-gray-400">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
              <InboxIcon className="h-8 w-8 text-gray-300" />
              <p className="text-sm font-medium text-gray-500">{t('empty.title')}</p>
              <p className="text-xs text-gray-400">{hasChannels ? t('empty.desc') : t('empty.noChannels')}</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {conversations.map((c) => {
                const v = CHANNEL_VISUAL[c.channel];
                const active = c.id === selectedId;
                return (
                  <li key={c.id}>
                    <button
                      onClick={() => openConversation(c.id)}
                      className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors ${
                        active ? 'bg-white shadow-[inset_3px_0_0_0] shadow-emerald-500' : 'hover:bg-white/70'
                      }`}
                    >
                      {/* Avatar + kanal rozeti */}
                      <div className="relative shrink-0">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold text-gray-600">
                          {getInitials(leadName(c))}
                        </div>
                        <span className={`absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full ring-2 ring-gray-50 ${v.badge}`}>
                          <v.Icon className="h-2.5 w-2.5" />
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-sm font-semibold text-gray-900">{leadName(c)}</span>
                          <span className="shrink-0 text-[10px] text-gray-400">{fmtTime(c.last_message_at)}</span>
                        </div>
                        <div className="mt-0.5 flex items-center gap-1.5">
                          <p className="truncate text-xs text-gray-500">{c.last_message_preview || '—'}</p>
                        </div>
                        <div className="mt-1.5 flex items-center gap-1">
                          {c.source === 'click_to_whatsapp' && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-1.5 py-0.5 text-[9px] font-medium text-violet-600">
                              <Megaphone className="h-2.5 w-2.5" /> {t('ctwaBadge')}
                            </span>
                          )}
                          <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-medium ${statusStyle(c.status)}`}>
                            {t(`status.${c.status}`)}
                          </span>
                          {c.unread_count > 0 && (
                            <span className="ml-auto flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-bold text-white">
                              {c.unread_count}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>

      {/* ════ ORTA: Mesaj thread ════ */}
      <section className="flex min-w-0 flex-1 flex-col bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.04),_transparent_55%)]">
        {!selected ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
            <MessageSquareDashed className="h-10 w-10 text-gray-300" />
            <p className="text-sm text-gray-400">{t('emptyThread')}</p>
          </div>
        ) : (
          <>
            {/* Thread başlığı */}
            <header className="flex items-center justify-between gap-3 border-b border-gray-200 bg-white/80 px-5 py-3 backdrop-blur">
              <div className="flex min-w-0 items-center gap-3">
                <div className="relative shrink-0">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold text-gray-600">
                    {getInitials(leadName(selected))}
                  </div>
                  <span className={`absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full ring-2 ring-white ${CHANNEL_VISUAL[selected.channel].badge}`}>
                    <span className={`h-1.5 w-1.5 rounded-full bg-white`} />
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-900">{leadName(selected)}</p>
                  <p className="text-[11px] text-gray-400">{t(`filters.${selected.channel === 'lead_form' ? 'all' : selected.channel}`)} · {t(`source.${selected.source}`)}</p>
                </div>
              </div>
              {/* Durum seçici */}
              <StatusMenu
                value={selected.status}
                onChange={(s) => patchConversation(selected.id, { status: s })}
                label={(s) => t(`status.${s}`)}
              />
            </header>

            {/* Mesajlar */}
            <div className="flex-1 space-y-2 overflow-y-auto px-5 py-4">
              {loadingThread ? (
                <div className="flex h-full items-center justify-center text-gray-400">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : (
                messages.map((m) => <MessageBubble key={m.id} message={m} time={fmtTime(m.sent_at || m.created_at)} youLabel={t('you')} />)
              )}
              <div ref={threadEndRef} />
            </div>

            {/* Composer */}
            <footer className="border-t border-gray-200 bg-white px-4 py-3">
              {sendError && (
                <div className="mb-2 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-1.5 text-xs text-red-600">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{sendError === 'channel_not_connected' ? t('channelNotConnected') : sendError}</span>
                </div>
              )}
              {selected.channel === 'lead_form' ? (
                <p className="rounded-xl bg-gray-50 px-4 py-3 text-center text-xs text-gray-400">{t('notRepliable')}</p>
              ) : (
                <div className="flex items-end gap-2">
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(); }
                    }}
                    rows={1}
                    placeholder={t('composer.placeholder')}
                    className="max-h-32 min-h-[42px] flex-1 resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-800 outline-none transition-shadow placeholder:text-gray-400 focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                  />
                  <button
                    onClick={sendReply}
                    disabled={!draft.trim() || sending}
                    className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white transition-all hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label={t('composer.send')}
                  >
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </button>
                </div>
              )}
            </footer>
          </>
        )}
      </section>

      {/* ════ SAĞ: Lead / kontak kartı ════ */}
      {selected && (
        <aside className="hidden w-[300px] shrink-0 flex-col border-l border-gray-200 bg-gray-50/60 lg:flex">
          <ContactPanel
            conversation={selected}
            members={members}
            onAssign={(uid) => patchConversation(selected.id, { assigned_to: uid })}
            t={t}
          />
        </aside>
      )}
    </div>
  );
}

/* ── Mesaj balonu ── */
function MessageBubble({ message, time, youLabel }: { message: Message; time: string; youLabel: string }) {
  const outbound = message.direction === 'outbound';
  return (
    <div className={`flex ${outbound ? 'justify-end' : 'justify-start'}`}>
      <div className={`group max-w-[78%] rounded-2xl px-3.5 py-2 text-sm shadow-sm ${
        outbound
          ? 'rounded-br-md bg-emerald-600 text-white'
          : 'rounded-bl-md border border-gray-100 bg-white text-gray-800'
      }`}>
        {message.message_text
          ? <p className="whitespace-pre-wrap break-words">{message.message_text}</p>
          : <p className="italic opacity-70">[{message.message_type}]</p>}
        <div className={`mt-0.5 flex items-center justify-end gap-1 text-[10px] ${outbound ? 'text-emerald-100' : 'text-gray-400'}`}>
          {outbound && <span className="mr-0.5">{youLabel}</span>}
          <span>{time}</span>
          {outbound && (
            message.status === 'read' ? <CheckCheck className="h-3 w-3" />
            : message.status === 'delivered' ? <CheckCheck className="h-3 w-3 opacity-70" />
            : message.status === 'failed' ? <AlertCircle className="h-3 w-3 text-red-200" />
            : <Check className="h-3 w-3 opacity-70" />
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Durum menüsü ── */
function StatusMenu({ value, onChange, label }: { value: string; onChange: (s: string) => void; label: (s: string) => string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${statusStyle(value)}`}
      >
        {label(value)}
        <ChevronDown className="h-3 w-3" />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-20 mt-1 w-36 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => { onChange(s); setOpen(false); }}
              className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-gray-50 ${value === s ? 'font-semibold text-gray-900' : 'text-gray-600'}`}
            >
              <span className={`h-2 w-2 rounded-full ${statusStyle(s).split(' ')[0]}`} />
              {label(s)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Lead / kontak kartı ── */
function ContactPanel({
  conversation, members, onAssign, t,
}: {
  conversation: Conversation;
  members: ReturnType<typeof useAppStore.getState>['members'];
  onAssign: (uid: string | null) => void;
  t: ReturnType<typeof useTranslations>;
}) {
  const lead = conversation.lead;
  const name = leadName(conversation);
  const v = CHANNEL_VISUAL[conversation.channel];
  return (
    <div className="flex flex-col gap-4 overflow-y-auto p-5">
      {/* Başlık */}
      <div className="flex flex-col items-center text-center">
        <div className="relative">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-200 text-lg font-bold text-gray-600">
            {getInitials(name)}
          </div>
          <span className={`absolute -bottom-1.5 -right-1.5 flex h-7 w-7 items-center justify-center rounded-full ring-4 ring-gray-50 ${v.badge}`}>
            <v.Icon className="h-3.5 w-3.5" />
          </span>
        </div>
        <p className="mt-3 text-sm font-bold text-gray-900">{name}</p>
        <span className={`mt-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${v.soft}`}>
          {t(`source.${conversation.source}`)}
        </span>
      </div>

      {/* Detaylar */}
      <div className="space-y-2.5 rounded-xl border border-gray-100 bg-white p-3">
        {lead?.phone && <DetailRow icon={<Phone className="h-3.5 w-3.5" />} value={lead.phone} />}
        {lead?.email && <DetailRow icon={<Mail className="h-3.5 w-3.5" />} value={lead.email} />}
        {lead?.instagram_username && <DetailRow icon={<User2 className="h-3.5 w-3.5" />} value={`@${lead.instagram_username}`} />}
        {!lead?.phone && !lead?.email && !lead?.instagram_username && (
          <p className="text-center text-[11px] text-gray-400">{t('contact.noDetails')}</p>
        )}
      </div>

      {/* CTWA attribution */}
      {conversation.ctwa_clid || conversation.ad_source_id ? (
        <div className="space-y-1.5 rounded-xl border border-violet-100 bg-violet-50/50 p-3">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold text-violet-700">
            <Megaphone className="h-3.5 w-3.5" /> {t('contact.adSource')}
          </p>
          {conversation.ad_headline && <p className="text-xs text-violet-900">{conversation.ad_headline}</p>}
          {conversation.ad_source_id && <p className="break-all text-[10px] text-violet-500">ID: {conversation.ad_source_id}</p>}
          {conversation.ad_source_url && (
            <a href={conversation.ad_source_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] font-medium text-violet-600 hover:underline">
              {t('contact.viewAd')} <ExternalLink className="h-2.5 w-2.5" />
            </a>
          )}
        </div>
      ) : null}

      {/* Atama */}
      <div>
        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-gray-400">{t('contact.assignee')}</label>
        <select
          value={conversation.assigned_to || ''}
          onChange={(e) => onAssign(e.target.value || null)}
          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
        >
          <option value="">{t('contact.unassigned')}</option>
          {members.map((m) => (
            <option key={m.user_id} value={m.user_id}>{m.profile?.full_name || m.profile?.email || m.user_id}</option>
          ))}
        </select>
      </div>

      {/* Lead'e git */}
      {lead?.id && (
        <Link
          href="/leads"
          className="flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white py-2.5 text-xs font-medium text-gray-600 transition-colors hover:border-emerald-300 hover:text-emerald-600"
        >
          {t('contact.openLead')} <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}

function DetailRow({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <div className="flex items-center gap-2 text-xs text-gray-700">
      <span className="text-gray-400">{icon}</span>
      <span className="truncate">{value}</span>
    </div>
  );
}
