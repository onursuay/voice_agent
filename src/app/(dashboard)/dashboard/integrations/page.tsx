'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { useTranslations } from 'next-intl';
import {
  Plug,
  AlertCircle,
  Check,
  RefreshCw,
} from 'lucide-react';

type MetaStatus = {
  connected: boolean;
  page_id?: string;
  page_name?: string;
  connected_at?: string;
  expires_at?: string;
  is_expired?: boolean;
  webhook_subscribed?: boolean;
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

  const [metaStatus, setMetaStatus] = useState<MetaStatus | null>(null);
  const [metaLoading, setMetaLoading] = useState(false);
  const [metaDisconnecting, setMetaDisconnecting] = useState(false);
  const [recentEvents, setRecentEvents] = useState<LeadEvent[]>([]);

  const loadMetaStatus = useCallback(async () => {
    setMetaLoading(true);
    try {
      const [statusRes, eventsRes] = await Promise.all([
        fetch('/api/integrations/meta/status'),
        fetch('/api/integrations/meta/events'),
      ]);
      if (statusRes.ok) setMetaStatus(await statusRes.json());
      if (eventsRes.ok) {
        const data = await eventsRes.json() as { events: LeadEvent[] };
        setRecentEvents(data.events);
      }
    } catch { /* ignore */ } finally {
      setMetaLoading(false);
    }
  }, []);

  const disconnectMeta = async () => {
    setMetaDisconnecting(true);
    try {
      await fetch('/api/integrations/meta/disconnect', { method: 'DELETE' });
      setMetaStatus({ connected: false });
    } catch { /* ignore */ } finally {
      setMetaDisconnecting(false);
    }
  };

  const handleToggleMeta = () => {
    if (metaStatus?.connected) {
      disconnectMeta();
    } else {
      window.location.href = '/api/integrations/meta/connect';
    }
  };

  useEffect(() => {
    loadMetaStatus();
  }, [loadMetaStatus]);

  const isMetaConnected = metaStatus?.connected ?? false;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('integrations.title')}</h1>
        <p className="mt-1 text-sm text-muted">{t('integrations.desc')}</p>
      </div>

      {/* OAuth redirect feedback */}
      {metaConnected && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <Check className="h-4 w-4 shrink-0" />
          {t('integrations.metaSuccess')}
        </div>
      )}
      {metaError && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {metaError === 'no_pages' && t('integrations.metaNoPage')}
          {metaError === 'cancelled' && t('integrations.metaCancelled')}
          {metaError === 'token_exchange_failed' && t('integrations.metaTokenError')}
          {!['no_pages', 'cancelled', 'token_exchange_failed'].includes(metaError) && `${t('integrations.metaConnectError')}${metaError}`}
        </div>
      )}

      {/* Section header */}
      <div className="rounded-xl border border-card-border bg-card-bg p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
            <Plug className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">{t('integrations.title')}</h2>
            <p className="text-sm text-muted">{t('integrations.desc')}</p>
          </div>
        </div>

        {/* Integration Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

          {/* Meta Lead Ads Card */}
          <div className={`relative rounded-xl border-2 p-5 transition-all ${isMetaConnected ? 'border-blue-500 bg-blue-50/30' : 'border-gray-200 bg-white'}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600">
                  <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Meta Lead Ads</h3>
                  {isMetaConnected ? (
                    <span className="text-xs font-medium text-green-600">{tCommon('connected')}</span>
                  ) : (
                    <span className="text-xs text-muted">{tCommon('notConnected')}</span>
                  )}
                </div>
              </div>

              {/* Toggle Switch */}
              <button
                onClick={handleToggleMeta}
                disabled={metaLoading || metaDisconnecting}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  isMetaConnected ? 'bg-blue-600' : 'bg-gray-200'
                } ${(metaLoading || metaDisconnecting) ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    isMetaConnected ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <p className="text-xs text-muted mb-3">{t('integrations.metaDesc')}</p>

            {metaLoading ? (
              <div className="flex items-center gap-1.5 text-xs text-muted">
                <RefreshCw className="h-3 w-3 animate-spin" />
                {tCommon('checking')}
              </div>
            ) : isMetaConnected && (
              <div className="space-y-2 pt-3 border-t border-gray-200/60">
                {metaStatus?.webhook_subscribed && (
                  <div className="flex items-center gap-1.5">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs font-medium text-green-600">Webhook Aktif</span>
                  </div>
                )}
                {metaStatus?.is_expired && (
                  <Badge color="red" size="sm">{t('integrations.tokenExpired')}</Badge>
                )}
                {metaStatus?.page_name && (
                  <div className="text-xs text-muted">
                    {t('integrations.pageLabel')}<span className="font-medium text-foreground">{metaStatus.page_name}</span>
                  </div>
                )}
                {metaStatus?.connected_at && (
                  <div className="text-xs text-muted">
                    {t('integrations.connectedAt')}{new Date(metaStatus.connected_at).toLocaleDateString()}
                  </div>
                )}
                {metaStatus?.expires_at && (
                  <div className="text-xs text-muted">
                    {t('integrations.tokenExpiry')}{new Date(metaStatus.expires_at).toLocaleDateString()}
                  </div>
                )}
                <button
                  onClick={() => window.location.href = '/api/integrations/meta/connect'}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium mt-1"
                >
                  {t('integrations.reconnect')}
                </button>
              </div>
            )}
          </div>

          {/* Google Ads Card — Coming Soon */}
          <div className="relative rounded-xl border-2 border-gray-200 bg-white p-5 opacity-60">
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
            <p className="text-xs text-muted">Google Ads lead formlarından gelen verileri otomatik olarak sisteme aktar.</p>
            <div className="mt-3 pt-3 border-t border-gray-100">
              <span className="text-xs font-medium text-gray-400">Yakında</span>
            </div>
          </div>

          {/* TikTok Ads Card — Coming Soon */}
          <div className="relative rounded-xl border-2 border-gray-200 bg-white p-5 opacity-60">
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
            <p className="text-xs text-muted">TikTok reklam formlarından gelen lead&apos;leri otomatik olarak sisteme aktar.</p>
            <div className="mt-3 pt-3 border-t border-gray-100">
              <span className="text-xs font-medium text-gray-400">Yakında</span>
            </div>
          </div>

        </div>

        {/* Recent Webhook Events */}
        {isMetaConnected && recentEvents.length > 0 && (
          <div className="mt-6">
            <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Son Webhook Olayları</h3>
            <div className="space-y-2">
              {recentEvents.map((event) => (
                <div key={event.id} className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className={`inline-block h-2 w-2 rounded-full ${event.status === 'processed' ? 'bg-green-500' : event.status === 'failed' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                    <span className="text-xs font-medium text-gray-700">leadgen webhook received</span>
                    {event.external_id && (
                      <span className="text-xs text-gray-400 font-mono truncate max-w-[120px]">{event.external_id}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium ${event.status === 'processed' ? 'text-green-600' : event.status === 'failed' ? 'text-red-600' : 'text-yellow-600'}`}>
                      {event.status === 'processed' ? 'işlendi' : event.status === 'failed' ? 'hata' : 'alındı'}
                    </span>
                    <span className="text-xs text-gray-400">{new Date(event.created_at).toLocaleString('tr-TR')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
