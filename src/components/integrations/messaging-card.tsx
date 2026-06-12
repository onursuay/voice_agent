'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Check, Loader2, Plus, Trash2, Link2, X, RefreshCw } from 'lucide-react';
import { CHANNEL_VISUAL } from '@/components/inbox/channel-meta';
import type { MessagingChannelAccount } from '@/lib/types';

// Omnichannel mesajlaşma bağlama — canli_chatbot deseni:
// 1) Meta hesabını OAuth ile bağla  2) kanal kartlarından hesap seç (available → select)

type WaNumber = { phone_number_id: string; display_number: string; verified_name: string | null; quality: string | null; waba_id: string };
type PageRef = { page_id: string; page_name: string };
type IgRef = { ig_id: string; username: string | null; page_id: string; page_name: string };

interface AvailableState {
  connected: boolean;
  expires_at?: string | null;
  whatsapp: WaNumber[];
  pages: PageRef[];
  instagram: IgRef[];
  selections: MessagingChannelAccount[];
}

type ModalChannel = 'whatsapp' | 'messenger' | 'instagram' | null;

export function MessagingCard() {
  const t = useTranslations('inbox');
  const tCommon = useTranslations('common');
  const [data, setData] = useState<AvailableState | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null); // platform_id işlemde
  const [modal, setModal] = useState<ModalChannel>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/integrations/messaging/available');
      if (res.ok) setData((await res.json()) as AvailableState);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const connectOAuth = () => { window.location.href = '/api/integrations/messaging/connect'; };

  const select = async (channel: 'whatsapp' | 'messenger' | 'instagram', payload: Record<string, unknown>, platformId: string) => {
    setBusy(platformId);
    try {
      await fetch('/api/integrations/messaging/select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel, platform_id: platformId, enabled: true, ...payload }),
      });
      setModal(null);
      setLoading(true);
      await load();
    } finally {
      setBusy(null);
    }
  };

  const remove = async (channel: 'whatsapp' | 'messenger' | 'instagram', platformId: string) => {
    setBusy(platformId);
    try {
      await fetch('/api/integrations/messaging/select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel, platform_id: platformId, enabled: false }),
      });
      await load();
    } finally {
      setBusy(null);
    }
  };

  const selections = data?.selections || [];
  const active = (ch: 'whatsapp' | 'messenger' | 'instagram') => selections.filter((s) => s.channel === ch);
  const isSelected = (ch: 'whatsapp' | 'messenger' | 'instagram', id: string) =>
    active(ch).some((s) => s.channel_account_id === id);

  const daysLeft = data?.expires_at
    ? Math.max(0, Math.ceil((new Date(data.expires_at).getTime() - Date.now()) / 86400000))
    : null;

  return (
    <div className="rounded-2xl border-2 border-gray-200 bg-white p-5">
      {/* ── Meta hesabı bağlantı kartı ── */}
      <div className={`mb-4 flex items-center justify-between gap-3 rounded-xl border p-4 ${data?.connected ? 'border-emerald-200 bg-emerald-50/50' : 'border-gray-200 bg-gray-50/50'}`}>
        <div className="flex min-w-0 items-center gap-3">
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${data?.connected ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
            <Link2 className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900">{t('connect.metaAccount')}</p>
            {loading ? (
              <span className="flex items-center gap-1 text-xs text-gray-400"><RefreshCw className="h-3 w-3 animate-spin" /> {t('connect.checking')}</span>
            ) : data?.connected ? (
              <span className="text-xs font-medium text-emerald-600">
                {t('connect.connected')}{daysLeft !== null ? ` · ${t('connect.daysLeft', { days: daysLeft })}` : ''}
              </span>
            ) : (
              <span className="text-xs text-gray-400">{t('connect.notConnected')}</span>
            )}
          </div>
        </div>
        {!loading && (
          <button
            onClick={connectOAuth}
            className={`shrink-0 rounded-xl px-4 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 active:scale-[0.98] ${
              data?.connected
                ? 'border border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                : 'bg-emerald-600 text-white hover:bg-emerald-700'
            }`}
          >
            {data?.connected ? t('connect.reconnect') : t('connect.connectAccount')}
          </button>
        )}
      </div>

      {/* ── Kanal kartları grid ── */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {(['whatsapp', 'instagram', 'messenger'] as const).map((ch) => {
          const v = CHANNEL_VISUAL[ch];
          const actives = active(ch);
          const subtitle = ch === 'whatsapp' ? t('connect.whatsappSub') : ch === 'instagram' ? t('connect.instagramSub') : t('connect.messengerSub');
          return (
            <section key={ch} className="overflow-hidden rounded-xl border border-gray-200">
              {/* Kart başlığı (kanal rengi) */}
              <div className="flex items-center gap-3 p-4 pb-3">
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-md ${v.badge}`}>
                  <v.Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{t(`filters.${ch}`)}</p>
                  <p className="text-[11px] text-gray-400">{subtitle}</p>
                </div>
              </div>

              <div className="space-y-1.5 px-4 pb-4">
                {actives.length === 0 ? (
                  <p className="flex items-center gap-1.5 text-xs text-gray-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-gray-300" /> {t('connect.noAccount')}
                  </p>
                ) : (
                  <>
                    <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                      <span className={`h-1.5 w-1.5 rounded-full ${v.dot}`} /> {t('connect.activeCount', { count: actives.length })}
                    </p>
                    {actives.map((s) => (
                      <div key={s.id} className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 px-2.5 py-2">
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-xs font-medium text-gray-800">{s.display_name || s.channel_account_id}</span>
                        </span>
                        <button
                          onClick={() => remove(ch, s.channel_account_id)}
                          disabled={busy === s.channel_account_id}
                          className="shrink-0 rounded p-1 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                          aria-label={t('connect.remove')}
                        >
                          {busy === s.channel_account_id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    ))}
                  </>
                )}

                <button
                  onClick={() => (data?.connected ? setModal(ch) : connectOAuth())}
                  disabled={loading}
                  className="mt-1 flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-gray-300 py-2 text-xs font-medium text-gray-600 transition-colors hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 active:scale-[0.98] disabled:opacity-40"
                >
                  <Plus className="h-3.5 w-3.5" /> {actives.length ? t('connect.addAccount') : t('connect.selectAccount')}
                </button>
              </div>
            </section>
          );
        })}
      </div>

      {/* ── Hesap seçim modali ── */}
      {modal && data && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setModal(null)} />
          <div className="relative w-full max-w-md rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900">
                {t('connect.modalTitle', { channel: t(`filters.${modal}`) })}
              </h3>
              <button onClick={() => setModal(null)} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600" aria-label={tCommon('close')}>
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-80 space-y-1.5 overflow-y-auto">
              {modal === 'whatsapp' && (
                data.whatsapp.length === 0
                  ? <p className="rounded-lg bg-gray-50 px-3 py-4 text-center text-xs text-gray-400">{t('connect.noneAvailable')}</p>
                  : data.whatsapp.map((n) => {
                      const sel = isSelected('whatsapp', n.phone_number_id);
                      return (
                        <button key={n.phone_number_id} disabled={sel || busy === n.phone_number_id}
                          onClick={() => select('whatsapp', { waba_id: n.waba_id }, n.phone_number_id)}
                          className="flex w-full items-center gap-3 rounded-xl border border-gray-200 px-3 py-2.5 text-left transition-colors hover:border-emerald-300 hover:bg-emerald-50/50 disabled:cursor-default disabled:opacity-60">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-gray-900">{n.verified_name || n.display_number}</p>
                            <p className="text-xs text-gray-500">{n.display_number}{n.quality ? ` · ${t('connect.quality')}: ${n.quality}` : ''}</p>
                          </div>
                          {sel ? <span className="flex items-center gap-1 text-xs font-medium text-emerald-600"><Check className="h-3.5 w-3.5" /> {t('connect.activeLabel')}</span>
                               : busy === n.phone_number_id ? <Loader2 className="h-4 w-4 animate-spin text-gray-400" /> : null}
                        </button>
                      );
                    })
              )}
              {modal === 'messenger' && (
                data.pages.length === 0
                  ? <p className="rounded-lg bg-gray-50 px-3 py-4 text-center text-xs text-gray-400">{t('connect.noneAvailable')}</p>
                  : data.pages.map((p) => {
                      const sel = isSelected('messenger', p.page_id);
                      return (
                        <button key={p.page_id} disabled={sel || busy === p.page_id}
                          onClick={() => select('messenger', {}, p.page_id)}
                          className="flex w-full items-center gap-3 rounded-xl border border-gray-200 px-3 py-2.5 text-left transition-colors hover:border-emerald-300 hover:bg-emerald-50/50 disabled:cursor-default disabled:opacity-60">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-gray-900">{p.page_name}</p>
                            <p className="text-xs text-gray-500">ID: {p.page_id}</p>
                          </div>
                          {sel ? <span className="flex items-center gap-1 text-xs font-medium text-emerald-600"><Check className="h-3.5 w-3.5" /> {t('connect.activeLabel')}</span>
                               : busy === p.page_id ? <Loader2 className="h-4 w-4 animate-spin text-gray-400" /> : null}
                        </button>
                      );
                    })
              )}
              {modal === 'instagram' && (
                data.instagram.length === 0
                  ? <p className="rounded-lg bg-gray-50 px-3 py-4 text-center text-xs text-gray-400">{t('connect.noneAvailableIg')}</p>
                  : data.instagram.map((ig) => {
                      const sel = isSelected('instagram', ig.ig_id);
                      return (
                        <button key={ig.ig_id} disabled={sel || busy === ig.ig_id}
                          onClick={() => select('instagram', { page_id: ig.page_id }, ig.ig_id)}
                          className="flex w-full items-center gap-3 rounded-xl border border-gray-200 px-3 py-2.5 text-left transition-colors hover:border-emerald-300 hover:bg-emerald-50/50 disabled:cursor-default disabled:opacity-60">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-gray-900">{ig.username ? `@${ig.username}` : ig.ig_id}</p>
                            <p className="text-xs text-gray-500">{ig.page_name}</p>
                          </div>
                          {sel ? <span className="flex items-center gap-1 text-xs font-medium text-emerald-600"><Check className="h-3.5 w-3.5" /> {t('connect.activeLabel')}</span>
                               : busy === ig.ig_id ? <Loader2 className="h-4 w-4 animate-spin text-gray-400" /> : null}
                        </button>
                      );
                    })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
