'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import {
  Plug,
  AlertCircle,
  Check,
  ExternalLink,
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

  useEffect(() => {
    loadMetaStatus();
  }, [loadMetaStatus]);

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

      {/* Integrations section header */}
      <div className="rounded-xl border border-card-border bg-card-bg">
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <Plug className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">{t('integrations.title')}</h2>
              <p className="text-sm text-muted">{t('integrations.desc')}</p>
            </div>
          </div>

          {/* Meta Lead Ads Card */}
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <div className="flex items-start justify-between p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold text-lg">
                  M
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{t('integrations.metaTitle')}</h3>
                  <p className="mt-0.5 text-xs text-muted">{t('integrations.metaDesc')}</p>

                  {metaLoading ? (
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-muted">
                      <RefreshCw className="h-3 w-3 animate-spin" />
                      {tCommon('checking')}
                    </div>
                  ) : metaStatus?.connected ? (
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
                        <span className="text-xs font-medium text-green-700">{tCommon('connected')}</span>
                        {metaStatus.webhook_subscribed && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                            <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                            Webhook Aktif
                          </span>
                        )}
                        {metaStatus.is_expired && (
                          <Badge color="red" size="sm">{t('integrations.tokenExpired')}</Badge>
                        )}
                      </div>
                      {metaStatus.page_name && (
                        <p className="text-xs text-muted">
                          {t('integrations.pageLabel')}<span className="font-medium text-foreground">{metaStatus.page_name}</span>
                        </p>
                      )}
                      {metaStatus.connected_at && (
                        <p className="text-xs text-muted">
                          {t('integrations.connectedAt')}{new Date(metaStatus.connected_at).toLocaleDateString()}
                        </p>
                      )}
                      {metaStatus.expires_at && (
                        <p className="text-xs text-muted">
                          {t('integrations.tokenExpiry')}{new Date(metaStatus.expires_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="mt-2 flex items-center gap-1.5">
                      <span className="inline-block h-2 w-2 rounded-full bg-gray-300" />
                      <span className="text-xs text-muted">{tCommon('notConnected')}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                {metaStatus?.connected ? (
                  <>
                    <Button
                      variant="primary"
                      size="sm"
                      icon={<ExternalLink className="h-3.5 w-3.5" />}
                      onClick={() => window.location.href = '/api/integrations/meta/connect'}
                    >
                      {t('integrations.reconnect')}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={disconnectMeta}
                      loading={metaDisconnecting}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                      {tCommon('disconnect')}
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<ExternalLink className="h-3.5 w-3.5" />}
                    onClick={() => window.location.href = '/api/integrations/meta/connect'}
                  >
                    {t('integrations.connectMeta')}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
