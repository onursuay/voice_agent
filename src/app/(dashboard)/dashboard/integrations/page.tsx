'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { AlertCircle, Check, RefreshCw, Plus, Trash2 } from 'lucide-react';

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

/* ─── small helper components ───────────────────────────────────── */

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? 'bg-green-500' : 'bg-gray-200'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

/* ─── main page ──────────────────────────────────────────────────── */

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

  const connectMeta = () => { window.location.href = '/api/integrations/meta/connect'; };

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
    for (const c of connections) await disconnectPage(c.id);
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('integrations.title')}</h1>
        <p className="mt-1 text-sm text-muted">{t('integrations.desc')}</p>
      </div>

      {/* Feedback banners */}
      {metaConnected && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <Check className="h-4 w-4 shrink-0" />
          {t('integrations.metaSuccess')}
        </div>
      )}
      {metaError && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span className="flex-1">
            {metaError === 'access_denied' && 'Meta hesabına erişim reddedildi. İzinleri onaylayarak tekrar deneyin.'}
            {metaError === 'cancelled' && t('integrations.metaCancelled')}
            {metaError === 'no_pages' && t('integrations.metaNoPage')}
            {metaError === 'token_exchange_failed' && t('integrations.metaTokenError')}
            {!['access_denied', 'cancelled', 'no_pages', 'token_exchange_failed'].includes(metaError) && `Hata: ${metaError}`}
          </span>
          <button
            onClick={connectMeta}
            className="shrink-0 rounded-md bg-red-100 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-200 transition-colors"
          >
            Tekrar Dene
          </button>
        </div>
      )}

      {/* ── Integration Cards Grid ─────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">

      {/* ── Meta Integration Block ────────────────────────────── */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">

        {/* Account-level row */}
        <div className="flex items-center gap-4 px-5 py-4 border-b border-gray-100">
          {/* Logo */}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600">
            <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z"/>
            </svg>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-900">Meta Hesabı</span>
              {metaLoading ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                  <RefreshCw className="h-3 w-3 animate-spin" /> Kontrol ediliyor
                </span>
              ) : hasConnections ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  Bağlı
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                  Bağlı değil
                </span>
              )}
            </div>
            <p className="text-xs text-muted mt-0.5">
              {hasConnections
                ? `${connections.length} Facebook sayfası bağlı · ${connections[0]?.expires_at ? Math.max(0, Math.ceil((new Date(connections[0].expires_at).getTime() - Date.now()) / 86400000)) + ' gün kaldı' : ''}`
                : 'Facebook sayfalarınızdan lead toplamak için bağlayın'}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {hasConnections && (
              <button
                onClick={connectMeta}
                className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                Yeniden Bağla
              </button>
            )}
            <Toggle
              checked={hasConnections}
              onChange={hasConnections ? disconnectAll : connectMeta}
              disabled={metaLoading}
            />
          </div>
        </div>

        {/* Connected pages section */}
        <div className="px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">
              Bağlı Facebook Sayfaları
            </span>
            <button
              onClick={connectMeta}
              className="flex items-center gap-1 rounded-md bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Sayfa Ekle
            </button>
          </div>

          {metaLoading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="h-14 animate-pulse rounded-lg bg-gray-100" />
              ))}
            </div>
          ) : connections.length > 0 ? (
            <div className="space-y-2">
              {connections.map((conn) => (
                <div
                  key={conn.id}
                  className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-3"
                >
                  {/* Page icon */}
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100">
                    <svg className="h-4 w-4 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z"/>
                    </svg>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {conn.page_name || conn.page_id || 'Bilinmeyen sayfa'}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`flex items-center gap-1 text-xs ${conn.webhook_subscribed ? 'text-green-600' : 'text-gray-400'}`}>
                        <span className={`inline-block h-1.5 w-1.5 rounded-full ${conn.webhook_subscribed ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                        {conn.webhook_subscribed ? 'Webhook aktif' : 'Webhook pasif'}
                      </span>
                      {conn.is_expired && (
                        <span className="text-xs text-red-500">· Token süresi doldu</span>
                      )}
                      {conn.connected_at && (
                        <span className="text-xs text-gray-400">
                          · {new Date(conn.connected_at).toLocaleDateString('tr-TR')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Disconnect */}
                  <button
                    onClick={() => disconnectPage(conn.id)}
                    disabled={disconnecting === conn.id}
                    title="Bağlantıyı kes"
                    className="shrink-0 rounded-lg p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    {disconnecting === conn.id
                      ? <RefreshCw className="h-4 w-4 animate-spin" />
                      : <Trash2 className="h-4 w-4" />}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-gray-200 py-8 text-center">
              <p className="text-sm text-muted">Henüz sayfa eklenmemiş</p>
              <button
                onClick={connectMeta}
                className="flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                İlk Sayfayı Bağla
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Google Ads ─────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white opacity-60">
        <div className="flex items-center gap-4 px-5 py-4 border-b border-gray-100">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white border border-gray-200">
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-900">Google Ads</span>
              <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">Yakında</span>
            </div>
            <p className="text-xs text-muted mt-0.5">Google Ads lead formlarından otomatik lead toplama</p>
          </div>
          <Toggle checked={false} onChange={() => {}} disabled />
        </div>
        <div className="px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">Bağlı Hesaplar</span>
            <button disabled className="flex items-center gap-1 rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-400 cursor-not-allowed">
              <Plus className="h-3.5 w-3.5" />Hesap Ekle
            </button>
          </div>
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-gray-200 py-6 text-center">
            <p className="text-xs text-muted">Bu entegrasyon henüz kullanılamıyor</p>
          </div>
        </div>
      </div>

      {/* ── TikTok Ads ─────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white opacity-60">
        <div className="flex items-center gap-4 px-5 py-4 border-b border-gray-100">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-black">
            <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.73a8.19 8.19 0 004.76 1.52v-3.4a4.85 4.85 0 01-1-.16z"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-900">TikTok Ads</span>
              <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">Yakında</span>
            </div>
            <p className="text-xs text-muted mt-0.5">TikTok reklam formlarından otomatik lead toplama</p>
          </div>
          <Toggle checked={false} onChange={() => {}} disabled />
        </div>
        <div className="px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">Bağlı Hesaplar</span>
            <button disabled className="flex items-center gap-1 rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-400 cursor-not-allowed">
              <Plus className="h-3.5 w-3.5" />Hesap Ekle
            </button>
          </div>
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-gray-200 py-6 text-center">
            <p className="text-xs text-muted">Bu entegrasyon henüz kullanılamıyor</p>
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
