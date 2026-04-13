'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { AlertCircle, Check, RefreshCw, Trash2, Plus } from 'lucide-react';

type MetaConnection = {
  id: string;
  page_id: string | null;
  page_name: string | null;
  connected_at: string | null;
  expires_at: string | null;
  is_expired: boolean;
  webhook_subscribed: boolean;
};

type LeadEvent = {
  id: string;
  event_type: string;
  external_id: string | null;
  status: string;
  error_message: string | null;
  created_at: string;
};

/* ── Main Page ───────────────────────────────────────────── */
export default function IntegrationsPage() {
  const t = useTranslations('settings');
  const router = useRouter();
  const searchParams = useSearchParams();

  const metaConnected = searchParams.get('meta_connected');
  const metaError = searchParams.get('meta_error');

  const [connections, setConnections] = useState<MetaConnection[]>([]);
  const [metaLoading, setMetaLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [disconnectingAll, setDisconnectingAll] = useState(false);
  const [recentEvents, setRecentEvents] = useState<LeadEvent[]>([]);

  const hasConnections = connections.length > 0;

  const loadMetaStatus = useCallback(async () => {
    setMetaLoading(true);
    try {
      const [statusRes, eventsRes] = await Promise.all([
        fetch('/api/integrations/meta/status'),
        fetch('/api/integrations/meta/events'),
      ]);
      if (statusRes.ok) {
        const data = await statusRes.json() as { connections: MetaConnection[] };
        setConnections(data.connections ?? []);
      }
      if (eventsRes.ok) {
        const data = await eventsRes.json() as { events: LeadEvent[] };
        setRecentEvents(data.events);
      }
    } catch { /* ignore */ } finally {
      setMetaLoading(false);
    }
  }, []);

  useEffect(() => { loadMetaStatus(); }, [loadMetaStatus]);

  const disconnectPage = async (id: string) => {
    setDisconnecting(id);
    try {
      await fetch(`/api/integrations/meta/disconnect?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      setConnections((prev) => prev.filter((c) => c.id !== id));
    } catch { /* ignore */ } finally {
      setDisconnecting(null);
    }
  };

  const disconnectAll = async () => {
    setDisconnectingAll(true);
    try {
      await fetch('/api/integrations/meta/disconnect', { method: 'DELETE' });
      setConnections([]);
    } catch { /* ignore */ } finally {
      setDisconnectingAll(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('integrations.title')}</h1>
        <p className="mt-1 text-sm text-muted">{t('integrations.desc')}</p>
      </div>

      {/* Feedback banners */}
      {metaConnected && (
        <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <Check className="h-4 w-4 shrink-0" />
          {t('integrations.metaSuccess')}
        </div>
      )}
      {metaError && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span className="flex-1">
            {metaError === 'access_denied' && 'Meta hesabına erişim reddedildi. İzinleri onaylayarak tekrar deneyin.'}
            {metaError === 'cancelled' && t('integrations.metaCancelled')}
            {metaError === 'no_pages' && t('integrations.metaNoPage')}
            {metaError === 'token_exchange_failed' && t('integrations.metaTokenError')}
            {!['access_denied', 'cancelled', 'no_pages', 'token_exchange_failed'].includes(metaError) && `Hata: ${metaError}`}
          </span>
          <button
            onClick={() => router.push('/dashboard/meta-connect')}
            className="shrink-0 rounded-lg bg-red-100 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-200 transition-colors"
          >
            Tekrar Dene
          </button>
        </div>
      )}

      {/* Integration Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">

        {/* ── Meta Lead Ads ─────────────────────────────────── */}
        <div className={`rounded-2xl border-2 bg-white p-5 transition-all duration-300 ${hasConnections ? 'border-indigo-500 shadow-md shadow-indigo-100' : 'border-gray-200'}`}>
          {/* Header */}
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-600">
              <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Meta Lead Ads</p>
              {metaLoading ? (
                <span className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                  <RefreshCw className="h-3 w-3 animate-spin" /> Kontrol ediliyor...
                </span>
              ) : hasConnections ? (
                <span className="flex items-center gap-1.5 text-xs font-medium text-green-600 mt-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                  Bağlı · {connections.length} sayfa
                </span>
              ) : (
                <span className="text-xs text-gray-400 mt-0.5">Bağlı değil</span>
              )}
            </div>
          </div>

          <p className="text-xs text-gray-500 mb-4">
            {t('integrations.metaDesc')}
          </p>

          {/* ── Connected state ── */}
          {!metaLoading && hasConnections && (
            <>
              {/* Page list */}
              <div className="mb-3 space-y-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-2">
                  Bağlı Sayfalar ({connections.length})
                </p>
                {connections.map((conn) => (
                  <div
                    key={conn.id}
                    className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 group"
                  >
                    <span className={`h-2 w-2 shrink-0 rounded-full transition-colors ${conn.webhook_subscribed ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                    <span className="flex-1 min-w-0 text-xs font-medium text-gray-700 truncate">
                      {conn.page_name || conn.page_id}
                    </span>
                    <button
                      onClick={() => disconnectPage(conn.id)}
                      disabled={disconnecting === conn.id}
                      title="Bağlantıyı kes"
                      className="shrink-0 rounded p-1 text-gray-300 hover:text-red-400 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                    >
                      {disconnecting === conn.id
                        ? <RefreshCw className="h-3 w-3 animate-spin" />
                        : <Trash2 className="h-3 w-3" />}
                    </button>
                  </div>
                ))}
              </div>

              {/* Add page */}
              <button
                onClick={() => router.push('/dashboard/meta-connect')}
                className="mb-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-indigo-300 py-2 text-xs font-medium text-indigo-600 hover:bg-indigo-50 hover:border-indigo-400 transition-all"
              >
                <Plus className="h-3.5 w-3.5" />
                Sayfa Ekle
              </button>

              {/* Disconnect all */}
              <button
                onClick={disconnectAll}
                disabled={disconnectingAll}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 py-2.5 text-xs font-medium text-red-500 hover:bg-red-50 hover:border-red-300 transition-all disabled:opacity-50"
              >
                {disconnectingAll
                  ? <><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Kesiliyor...</>
                  : <><AlertTriangle className="h-3.5 w-3.5" /> Tüm Bağlantıları Kes</>
                }
              </button>
            </>
          )}

          {/* ── Not connected state ── */}
          {!metaLoading && !hasConnections && (
            <button
              onClick={() => router.push('/dashboard/meta-connect')}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 active:scale-[0.98] transition-all"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Hesap Bağla
            </button>
          )}

          {/* Loading skeleton */}
          {metaLoading && (
            <div className="space-y-2">
              <div className="h-8 rounded-lg bg-gray-100 animate-pulse" />
              <div className="h-8 rounded-lg bg-gray-100 animate-pulse w-3/4" />
            </div>
          )}
        </div>

        {/* ── Google Ads ────────────────────────────────────── */}
        <div className="rounded-2xl border-2 border-gray-200 bg-white p-5 opacity-60">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white">
              <svg className="h-6 w-6" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Google Ads</p>
              <span className="text-xs text-gray-400">Yakında</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mb-4">Google Ads lead formlarından gelen verileri otomatik olarak sisteme aktar.</p>
          <div className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 py-2.5 text-xs font-medium text-gray-400 cursor-not-allowed">
            Yakında
          </div>
        </div>

        {/* ── TikTok Ads ───────────────────────────────────── */}
        <div className="rounded-2xl border-2 border-gray-200 bg-white p-5 opacity-60">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-black">
              <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.73a8.19 8.19 0 004.76 1.52v-3.4a4.85 4.85 0 01-1-.16z"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">TikTok Ads</p>
              <span className="text-xs text-gray-400">Yakında</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mb-4">TikTok reklam formlarından gelen lead'leri otomatik olarak sisteme aktar.</p>
          <div className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 py-2.5 text-xs font-medium text-gray-400 cursor-not-allowed">
            Yakında
          </div>
        </div>

      </div>

      {/* Recent Webhook Events */}
      {hasConnections && recentEvents.length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Son Webhook Olayları</h3>
          <div className="space-y-2">
            {recentEvents.map((event) => (
              <div key={event.id} className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className={`inline-block h-2 w-2 rounded-full ${event.status === 'processed' ? 'bg-green-500' : event.status === 'failed' ? 'bg-red-500' : 'bg-yellow-400'}`} />
                  <span className="text-xs font-medium text-gray-700">leadgen</span>
                  {event.external_id && (
                    <span className="text-xs font-mono text-gray-400 truncate max-w-[100px]">{event.external_id}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium ${event.status === 'processed' ? 'text-green-600' : event.status === 'failed' ? 'text-red-500' : 'text-yellow-600'}`}>
                    {event.status === 'processed' ? 'İşlendi' : event.status === 'failed' ? 'Hata' : event.status}
                  </span>
                  <span className="text-xs text-gray-400">{new Date(event.created_at).toLocaleString('tr-TR')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
