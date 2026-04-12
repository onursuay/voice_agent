'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  AlertCircle,
  Check,
  RefreshCw,
  Trash2,
  Settings2,
} from 'lucide-react';

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

export default function IntegrationsPage() {
  const t = useTranslations('settings');
  const tCommon = useTranslations('common');
  const searchParams = useSearchParams();

  const metaConnected = searchParams.get('meta_connected');
  const metaError = searchParams.get('meta_error');

  const [connections, setConnections] = useState<MetaConnection[]>([]);
  const [metaLoading, setMetaLoading] = useState(false);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [recentEvents, setRecentEvents] = useState<LeadEvent[]>([]);

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

  const disconnectPage = async (id: string) => {
    setDisconnecting(id);
    try {
      await fetch(`/api/integrations/meta/disconnect?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      setConnections((prev) => prev.filter((c) => c.id !== id));
    } catch { /* ignore */ } finally {
      setDisconnecting(null);
    }
  };

  // Toggle the entire Meta connection on/off
  const handleMetaToggle = () => {
    if (connections.length > 0) {
      // Disconnect all — confirm via the existing per-page disconnect for each
      // For now redirect to manage pages (could add bulk disconnect)
      window.location.href = '/api/integrations/meta/connect';
    } else {
      window.location.href = '/api/integrations/meta/connect';
    }
  };

  useEffect(() => {
    loadMetaStatus();
  }, [loadMetaStatus]);

  const hasConnections = connections.length > 0;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('integrations.title')}</h1>
        <p className="mt-1 text-sm text-muted">{t('integrations.desc')}</p>
      </div>

      {/* OAuth feedback banners */}
      {metaConnected && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <Check className="h-4 w-4 shrink-0" />
          {t('integrations.metaSuccess')}
        </div>
      )}
      {metaError && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <div className="flex-1">
            {metaError === 'no_pages' && t('integrations.metaNoPage')}
            {metaError === 'cancelled' && t('integrations.metaCancelled')}
            {metaError === 'access_denied' && 'Meta hesabına erişim reddedildi. İzinleri onaylayarak tekrar deneyin.'}
            {metaError === 'token_exchange_failed' && t('integrations.metaTokenError')}
            {!['no_pages', 'cancelled', 'access_denied', 'token_exchange_failed'].includes(metaError) && `${t('integrations.metaConnectError')}${metaError}`}
          </div>
          {(metaError === 'access_denied' || metaError === 'cancelled') && (
            <button
              onClick={() => { window.location.href = '/api/integrations/meta/connect'; }}
              className="shrink-0 rounded-md bg-red-100 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-200 transition-colors"
            >
              Tekrar Dene
            </button>
          )}
        </div>
      )}

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

        {/* ── Meta Lead Ads ────────────────────────────────── */}
        <div className={`rounded-xl border-2 p-5 transition-all ${hasConnections ? 'border-blue-400 bg-blue-50/20' : 'border-gray-200 bg-white'}`}>

          {/* Card header: logo + name + toggle */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600">
                <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z"/>
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Meta Lead Ads</h3>
                {metaLoading ? (
                  <span className="flex items-center gap-1 text-xs text-muted">
                    <RefreshCw className="h-3 w-3 animate-spin" />{tCommon('checking')}
                  </span>
                ) : hasConnections ? (
                  <span className="text-xs font-medium text-green-600">
                    {connections.length} sayfa bağlı
                  </span>
                ) : (
                  <span className="text-xs text-muted">{tCommon('notConnected')}</span>
                )}
              </div>
            </div>

            {/* Toggle switch */}
            <button
              onClick={handleMetaToggle}
              disabled={metaLoading}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                hasConnections ? 'bg-blue-600' : 'bg-gray-200'
              }`}
              title={hasConnections ? 'Hesap bağlı — yeni sayfa ekle' : 'Hesap bağla'}
            >
              <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${hasConnections ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          <p className="text-xs text-muted mb-4">{t('integrations.metaDesc')}</p>

          {/* Connected pages list */}
          {!metaLoading && hasConnections && (
            <div className="space-y-2 mb-4">
              {connections.map((conn) => (
                <div
                  key={conn.id}
                  className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2.5"
                >
                  {/* Status dot */}
                  <span className={`h-2 w-2 shrink-0 rounded-full ${conn.webhook_subscribed ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />

                  {/* Page info */}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-gray-800 truncate">
                      {conn.page_name || conn.page_id || 'Bilinmeyen sayfa'}
                    </p>
                    <p className="text-[10px] text-muted">
                      {conn.is_expired
                        ? '⚠ Token süresi doldu'
                        : conn.webhook_subscribed
                          ? 'Webhook aktif'
                          : 'Webhook pasif'}
                    </p>
                  </div>

                  {/* Disconnect button */}
                  <button
                    onClick={() => disconnectPage(conn.id)}
                    disabled={disconnecting === conn.id}
                    title="Bağlantıyı kes"
                    className="shrink-0 rounded p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    {disconnecting === conn.id
                      ? <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      : <Trash2 className="h-3.5 w-3.5" />}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => { window.location.href = '/api/integrations/meta/connect'; }}
              disabled={metaLoading}
              className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              + Sayfa Ekle
            </button>
            {hasConnections && (
              <button
                onClick={() => window.location.href = '/dashboard/meta-select'}
                title="Sayfaları yönet"
                className="rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors"
              >
                <Settings2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* ── Google Ads — Coming Soon ─────────────────────── */}
        <div className="rounded-xl border-2 border-gray-200 bg-white p-5 opacity-60">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white border border-gray-200">
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Google Ads</h3>
                <span className="text-xs text-muted">{tCommon('notConnected')}</span>
              </div>
            </div>
            <div className="relative inline-flex h-6 w-11 rounded-full bg-gray-200 cursor-not-allowed">
              <span className="pointer-events-none inline-block h-5 w-5 translate-x-0 transform rounded-full bg-white shadow mt-0.5 ml-0.5" />
            </div>
          </div>
          <p className="text-xs text-muted mb-4">Google Ads lead formlarından gelen verileri otomatik olarak sisteme aktar.</p>
          <div className="pt-3 border-t border-gray-100">
            <span className="text-xs font-medium text-gray-400">Yakında</span>
          </div>
        </div>

        {/* ── TikTok Ads — Coming Soon ────────────────────── */}
        <div className="rounded-xl border-2 border-gray-200 bg-white p-5 opacity-60">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-black">
                <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.73a8.19 8.19 0 004.76 1.52v-3.4a4.85 4.85 0 01-1-.16z"/>
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">TikTok Ads</h3>
                <span className="text-xs text-muted">{tCommon('notConnected')}</span>
              </div>
            </div>
            <div className="relative inline-flex h-6 w-11 rounded-full bg-gray-200 cursor-not-allowed">
              <span className="pointer-events-none inline-block h-5 w-5 translate-x-0 transform rounded-full bg-white shadow mt-0.5 ml-0.5" />
            </div>
          </div>
          <p className="text-xs text-muted mb-4">TikTok reklam formlarından gelen lead&apos;leri otomatik olarak sisteme aktar.</p>
          <div className="pt-3 border-t border-gray-100">
            <span className="text-xs font-medium text-gray-400">Yakında</span>
          </div>
        </div>

      </div>

      {/* Recent Webhook Events */}
      {hasConnections && recentEvents.length > 0 && (
        <div className="rounded-xl border border-card-border bg-card-bg p-5">
          <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Son Webhook Olayları</h3>
          <div className="space-y-2">
            {recentEvents.map((event) => (
              <div key={event.id} className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className={`inline-block h-2 w-2 rounded-full ${event.status === 'processed' ? 'bg-green-500' : event.status === 'failed' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                  <span className="text-xs font-medium text-gray-700">leadgen</span>
                  {event.external_id && (
                    <span className="text-xs text-gray-400 font-mono truncate max-w-[120px]">{event.external_id}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium ${event.status === 'processed' ? 'text-green-600' : event.status === 'failed' ? 'text-red-600' : 'text-yellow-600'}`}>
                    {event.status === 'processed' ? 'işlendi' : event.status === 'failed' ? 'hata' : event.status}
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
