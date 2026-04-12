'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { AlertCircle, Check, RefreshCw, Trash2 } from 'lucide-react';

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

/* ── Toggle ─────────────────────────────────────────────── */
function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${checked ? 'bg-green-500' : 'bg-gray-200'}`}
    >
      <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  );
}

/* ── Integration Card ────────────────────────────────────── */
function IntegrationCard({
  icon,
  name,
  description,
  connected,
  badge,
  accountLabel,
  onToggle,
  onConnect,
  onChangeAccount,
  loading,
  comingSoon,
  children,
}: {
  icon: React.ReactNode;
  name: string;
  description: string;
  connected: boolean;
  badge?: React.ReactNode;
  accountLabel?: string | null;
  onToggle?: () => void;
  onConnect?: () => void;
  onChangeAccount?: () => void;
  loading?: boolean;
  comingSoon?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className={`rounded-2xl border-2 bg-white p-5 transition-all ${connected ? 'border-indigo-500' : 'border-gray-200'} ${comingSoon ? 'opacity-60' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl overflow-hidden">
            {icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-900">{name}</span>
              {badge}
            </div>
            {loading ? (
              <span className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                <RefreshCw className="h-3 w-3 animate-spin" /> Kontrol ediliyor...
              </span>
            ) : connected ? (
              <span className="flex items-center gap-1.5 text-xs font-medium text-green-600 mt-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> Bağlı
              </span>
            ) : (
              <span className="text-xs text-gray-400 mt-0.5">{comingSoon ? 'Yakında' : 'Bağlı değil'}</span>
            )}
          </div>
        </div>
        <Toggle
          checked={connected}
          onChange={onToggle || (() => {})}
          disabled={loading || comingSoon}
        />
      </div>

      <p className="text-xs text-gray-500 mb-4">{description}</p>

      {/* Connected account display */}
      {connected && accountLabel && (
        <div className="mb-4 rounded-lg bg-green-50 px-3 py-2">
          <p className="text-xs text-green-700 font-medium">Hesap</p>
          <p className="text-sm text-green-800 font-semibold truncate">{accountLabel}</p>
        </div>
      )}

      {/* Sub-accounts slot */}
      {children}

      {/* Action button */}
      {!comingSoon && (
        <button
          onClick={connected ? onChangeAccount : onConnect}
          disabled={loading}
          className={`mt-2 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 ${
            connected
              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
          }`}
        >
          {connected ? (
            <>
              <RefreshCw className="h-4 w-4" />
              Hesabı Değiştir
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Hesap Bağla
            </>
          )}
        </button>
      )}
    </div>
  );
}

/* ── Main Page ───────────────────────────────────────────── */
export default function IntegrationsPage() {
  const t = useTranslations('settings');
  const router = useRouter();
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

  const disconnectPage = async (id: string) => {
    setDisconnecting(id);
    try {
      await fetch(`/api/integrations/meta/disconnect?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      setConnections((prev) => prev.filter((c) => c.id !== id));
    } catch { /* ignore */ } finally {
      setDisconnecting(null);
    }
  };

  const handleMetaConnect = () => router.push('/dashboard/meta-connect');
  const handleMetaToggleOff = async () => {
    for (const c of connections) await disconnectPage(c.id);
  };

  // Account label: first connected page name
  const primaryPageName = connections[0]?.page_name ?? null;

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
            onClick={handleMetaConnect}
            className="shrink-0 rounded-lg bg-red-100 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-200 transition-colors"
          >
            Tekrar Dene
          </button>
        </div>
      )}

      {/* Integration Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">

        {/* Meta */}
        <IntegrationCard
          icon={
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-600">
              <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z"/>
              </svg>
            </div>
          }
          name="Meta Lead Ads"
          description={t('integrations.metaDesc')}
          connected={hasConnections}
          loading={metaLoading}
          accountLabel={primaryPageName}
          onToggle={hasConnections ? handleMetaToggleOff : handleMetaConnect}
          onConnect={handleMetaConnect}
          onChangeAccount={handleMetaConnect}
        >
          {/* Connected pages sub-list */}
          {!metaLoading && connections.length > 0 && (
            <div className="mb-3 space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                Bağlı Sayfalar ({connections.length})
              </p>
              {connections.map((conn) => (
                <div key={conn.id} className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${conn.webhook_subscribed ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                  <span className="flex-1 min-w-0 text-xs font-medium text-gray-700 truncate">
                    {conn.page_name || conn.page_id}
                  </span>
                  <button
                    onClick={() => disconnectPage(conn.id)}
                    disabled={disconnecting === conn.id}
                    title="Bağlantıyı kes"
                    className="shrink-0 rounded p-1 text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    {disconnecting === conn.id
                      ? <RefreshCw className="h-3 w-3 animate-spin" />
                      : <Trash2 className="h-3 w-3" />}
                  </button>
                </div>
              ))}
              {/* Add more pages */}
              <button
                onClick={handleMetaConnect}
                className="mt-1 flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-indigo-300 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 transition-colors"
              >
                + Sayfa Ekle
              </button>
            </div>
          )}
        </IntegrationCard>

        {/* Google Ads */}
        <IntegrationCard
          icon={
            <div className="flex h-full w-full items-center justify-center bg-white border border-gray-200 rounded-xl">
              <svg className="h-6 w-6" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            </div>
          }
          name="Google Ads"
          description="Google Ads lead formlarından gelen verileri otomatik olarak sisteme aktar."
          connected={false}
          comingSoon
        />

        {/* TikTok Ads */}
        <IntegrationCard
          icon={
            <div className="flex h-full w-full items-center justify-center bg-black rounded-xl">
              <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.73a8.19 8.19 0 004.76 1.52v-3.4a4.85 4.85 0 01-1-.16z"/>
              </svg>
            </div>
          }
          name="TikTok Ads"
          description="TikTok reklam formlarından gelen lead'leri otomatik olarak sisteme aktar."
          connected={false}
          comingSoon
        />

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
