'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Check, Loader2, Plus, Trash2, Link2, X } from 'lucide-react';
import { CHANNEL_VISUAL } from '@/components/inbox/channel-meta';
import type { MessagingChannelAccount } from '@/lib/types';

type PageRef = { page_id: string; page_name: string | null };

export function MessagingCard() {
  const t = useTranslations('inbox');
  const [channels, setChannels] = useState<MessagingChannelAccount[]>([]);
  const [pages, setPages] = useState<PageRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [waOpen, setWaOpen] = useState(false);
  const [waBusy, setWaBusy] = useState(false);
  const [enabling, setEnabling] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [wa, setWa] = useState({ phone_number_id: '', waba_id: '', display_number: '', access_token: '' });

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/integrations/messaging/status');
      if (res.ok) {
        const d = await res.json();
        setChannels((d.channels || []) as MessagingChannelAccount[]);
        setPages((d.pages || []) as PageRef[]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const waChannels = channels.filter((c) => c.channel === 'whatsapp');
  const messengerPages = new Set(channels.filter((c) => c.channel === 'messenger').map((c) => c.channel_account_id));
  const instagramPages = new Set(channels.filter((c) => c.channel === 'instagram').map((c) => c.page_id));

  const addWhatsApp = async () => {
    if (!wa.phone_number_id.trim() || !wa.access_token.trim()) return;
    setWaBusy(true);
    try {
      const res = await fetch('/api/integrations/messaging/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(wa),
      });
      if (res.ok) {
        setWa({ phone_number_id: '', waba_id: '', display_number: '', access_token: '' });
        setWaOpen(false);
        await load();
      }
    } finally {
      setWaBusy(false);
    }
  };

  const enablePage = async (pageId: string) => {
    setEnabling(pageId);
    try {
      await fetch('/api/integrations/messaging/enable-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page_id: pageId }),
      });
      await load();
    } finally {
      setEnabling(null);
    }
  };

  const removeChannel = async (id: string) => {
    setRemoving(id);
    try {
      await fetch(`/api/integrations/messaging/disconnect?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      await load();
    } finally {
      setRemoving(null);
    }
  };

  return (
    <div className="rounded-2xl border-2 border-gray-200 bg-white p-5">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex -space-x-1.5">
          {(['whatsapp', 'instagram', 'messenger'] as const).map((ch) => {
            const v = CHANNEL_VISUAL[ch];
            return (
              <span key={ch} className={`flex h-9 w-9 items-center justify-center rounded-xl ring-2 ring-white ${v.badge}`}>
                <v.Icon className="h-4 w-4" />
              </span>
            );
          })}
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">{t('connect.title')}</p>
          <p className="text-xs text-gray-500">{t('connect.subtitle')}</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          <div className="h-10 animate-pulse rounded-lg bg-gray-100" />
          <div className="h-10 w-3/4 animate-pulse rounded-lg bg-gray-100" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* ── WhatsApp ── */}
          <section className="rounded-xl border border-gray-100 bg-gray-50/50 p-4">
            <div className="mb-2 flex items-center gap-2">
              <CHANNEL_VISUAL.whatsapp.Icon className="h-4 w-4 text-[#25D366]" />
              <span className="text-sm font-semibold text-gray-800">{t('filters.whatsapp')}</span>
            </div>
            <div className="space-y-1.5">
              {waChannels.map((c) => (
                <div key={c.id} className="flex items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 px-2.5 py-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span className="flex-1 truncate text-xs font-medium text-emerald-800">{c.display_name || c.channel_account_id}</span>
                  <button onClick={() => removeChannel(c.id)} disabled={removing === c.id} className="text-emerald-500 hover:text-red-500">
                    {removing === c.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                  </button>
                </div>
              ))}
            </div>

            {waOpen ? (
              <div className="mt-2 space-y-1.5">
                <WaInput placeholder={t('connect.phoneNumberId')} value={wa.phone_number_id} onChange={(v) => setWa({ ...wa, phone_number_id: v })} />
                <WaInput placeholder={t('connect.wabaId')} value={wa.waba_id} onChange={(v) => setWa({ ...wa, waba_id: v })} />
                <WaInput placeholder={t('connect.displayNumber')} value={wa.display_number} onChange={(v) => setWa({ ...wa, display_number: v })} />
                <WaInput placeholder={t('connect.accessToken')} value={wa.access_token} onChange={(v) => setWa({ ...wa, access_token: v })} />
                <div className="flex gap-1.5">
                  <button onClick={addWhatsApp} disabled={waBusy || !wa.phone_number_id.trim() || !wa.access_token.trim()}
                    className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-emerald-600 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 active:scale-[0.98] disabled:opacity-40">
                    {waBusy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />} {t('connect.save')}
                  </button>
                  <button onClick={() => setWaOpen(false)} className="rounded-lg border border-gray-200 px-2 py-1.5 text-gray-500 hover:bg-gray-100">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setWaOpen(true)}
                className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-emerald-300 py-1.5 text-xs font-medium text-emerald-600 transition-colors hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 active:scale-[0.98]">
                <Plus className="h-3 w-3" /> {t('connect.addNumber')}
              </button>
            )}
            <p className="mt-2 text-[10px] leading-relaxed text-gray-400">{t('connect.whatsappHint')}</p>
          </section>

          {/* ── Messenger + Instagram (sayfa bazlı) ── */}
          <section className="lg:col-span-2 rounded-xl border border-gray-100 bg-gray-50/50 p-4">
            <div className="mb-2 flex items-center gap-2">
              <CHANNEL_VISUAL.messenger.Icon className="h-4 w-4 text-[#0084FF]" />
              <CHANNEL_VISUAL.instagram.Icon className="h-4 w-4 text-[#d62976]" />
              <span className="text-sm font-semibold text-gray-800">{t('connect.pageChannels')}</span>
            </div>

            {pages.length === 0 ? (
              <p className="rounded-lg bg-white px-3 py-4 text-center text-xs text-gray-400">{t('connect.noPages')}</p>
            ) : (
              <div className="space-y-1.5">
                {pages.map((p) => {
                  const messengerOn = messengerPages.has(p.page_id);
                  const instagramOn = instagramPages.has(p.page_id);
                  const on = messengerOn || instagramOn;
                  return (
                    <div key={p.page_id} className="flex items-center gap-2 rounded-lg border border-gray-100 bg-white px-3 py-2">
                      <span className="flex-1 truncate text-xs font-medium text-gray-700">{p.page_name || p.page_id}</span>
                      {messengerOn && <span className="rounded-full bg-sky-50 px-1.5 py-0.5 text-[9px] font-medium text-sky-700">Messenger</span>}
                      {instagramOn && <span className="rounded-full bg-rose-50 px-1.5 py-0.5 text-[9px] font-medium text-rose-700">Instagram</span>}
                      <button onClick={() => enablePage(p.page_id)} disabled={enabling === p.page_id}
                        className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 active:scale-[0.97] disabled:opacity-50 ${
                          on ? 'text-gray-400 hover:bg-gray-100' : 'bg-gray-900 text-white hover:bg-gray-700'
                        }`}>
                        {enabling === p.page_id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Link2 className="h-3 w-3" />}
                        {on ? t('connect.refresh') : t('connect.enable')}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
            <p className="mt-2 text-[10px] leading-relaxed text-gray-400">{t('connect.pagesHint')}</p>
          </section>
        </div>
      )}
    </div>
  );
}

function WaInput({ placeholder, value, onChange }: { placeholder: string; value: string; onChange: (v: string) => void }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-800 outline-none placeholder:text-gray-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
    />
  );
}
