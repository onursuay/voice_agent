'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { AlertCircle, Check, RefreshCw, Trash2, Plus, Link2 } from 'lucide-react';

type MetaConnection = {
  id: string;
  page_id: string | null;
  page_name: string | null;
  connected_at: string | null;
  expires_at: string | null;
  is_expired: boolean;
  webhook_subscribed: boolean;
};

type MetaAccountStatus = {
  connected: boolean;
  connected_at?: string | null;
  expires_at?: string | null;
  is_expired?: boolean;
  page_count?: number;
};

/* ── Main Page ───────────────────────────────────────────── */
export default function IntegrationsPage() {
  const t = useTranslations('settings');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const searchParams = useSearchParams();

  const metaConnected = searchParams.get('meta_connected');
  const metaAccountConnected = searchParams.get('meta_account_connected');
  const metaError = searchParams.get('meta_error');

  const [accountStatus, setAccountStatus] = useState<MetaAccountStatus>({ connected: false });
  const [connections, setConnections] = useState<MetaConnection[]>([]);
  const [metaLoading, setMetaLoading] = useState(true);
  const [accountBusy, setAccountBusy] = useState(false);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [resubscribing, setResubscribing] = useState<string | null>(null);

  const hasConnections = connections.length > 0;
  const isAccountConnected = accountStatus.connected;

  const loadMetaStatus = useCallback(async () => {
    setMetaLoading(true);
    try {
      const [accountRes, statusRes] = await Promise.all([
        fetch('/api/integrations/meta/account/status'),
        fetch('/api/integrations/meta/status'),
      ]);
      if (accountRes.ok) {
        const data = await accountRes.json() as MetaAccountStatus;
        setAccountStatus(data);
      }
      if (statusRes.ok) {
        const data = await statusRes.json() as { connections: MetaConnection[] };
        setConnections(data.connections ?? []);
      }
    } catch { /* ignore */ } finally {
      setMetaLoading(false);
    }
  }, []);

  useEffect(() => { loadMetaStatus(); }, [loadMetaStatus]);

  const connectAccount = () => {
    setAccountBusy(true);
    window.location.href = '/api/integrations/meta/connect';
  };

  const disconnectAccount = async () => {
    if (!confirm(t('integrations.metaAccountDisconnectConfirm'))) return;
    setAccountBusy(true);
    try {
      await fetch('/api/integrations/meta/account/disconnect', { method: 'DELETE' });
      setAccountStatus({ connected: false });
      setConnections([]);
    } catch { /* ignore */ } finally {
      setAccountBusy(false);
    }
  };

  const disconnectPage = async (id: string) => {
    setDisconnecting(id);
    try {
      await fetch(`/api/integrations/meta/disconnect?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      setConnections((prev) => prev.filter((c) => c.id !== id));
    } catch { /* ignore */ } finally {
      setDisconnecting(null);
    }
  };

  const resubscribePage = async (id: string) => {
    setResubscribing(id);
    try {
      await fetch(`/api/integrations/meta/resubscribe?id=${encodeURIComponent(id)}`, { method: 'POST' });
      await loadMetaStatus();
    } catch { /* ignore */ } finally {
      setResubscribing(null);
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
      {metaAccountConnected && !metaConnected && (
        <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <Check className="h-4 w-4 shrink-0" />
          {t('integrations.metaAccountConnected')}
        </div>
      )}
      {metaError && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span className="flex-1">
            {metaError === 'access_denied' && t('integrations.metaAccessDenied')}
            {metaError === 'cancelled' && t('integrations.metaCancelled')}
            {metaError === 'no_pages' && t('integrations.metaNoPage')}
            {metaError === 'token_exchange_failed' && t('integrations.metaTokenError')}
            {!['access_denied', 'cancelled', 'no_pages', 'token_exchange_failed'].includes(metaError) && t('integrations.errorPrefix', { error: metaError })}
          </span>
          <button
            onClick={() => router.push('/meta-connect')}
            className="shrink-0 rounded-lg bg-red-100 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-200 transition-colors"
          >
            {t('integrations.retry')}
          </button>
        </div>
      )}

      {/* Integration Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">

        {/* ── Meta Lead Ads ─────────────────────────────────── */}
        <div className={`rounded-2xl border-2 bg-white p-5 transition-all duration-300 ${isAccountConnected ? 'border-emerald-500 shadow-md shadow-emerald-100' : 'border-gray-200'}`}>
          {/* Header — with account toggle in top-right */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl overflow-hidden bg-gradient-to-br from-blue-500 to-blue-700">
                <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z"/>
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900">Meta Lead Ads</p>
                {metaLoading ? (
                  <span className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                    <RefreshCw className="h-3 w-3 animate-spin" /> {t('integrations.metaChecking')}
                  </span>
                ) : isAccountConnected ? (
                  hasConnections ? (
                    <span className="flex items-center gap-1.5 text-xs font-medium text-green-600 mt-0.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                      {t('integrations.metaAccountConnected2')} · {connections.length} {t('integrations.metaPagesLabel')}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 mt-0.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      {t('integrations.metaAccountConnected2')}
                    </span>
                  )
                ) : (
                  <span className="text-xs text-gray-400 mt-0.5">{t('integrations.metaAccountNotConnected')}</span>
                )}
              </div>
            </div>

            {/* Account connect/disconnect toggle */}
            {!metaLoading && (
              <button
                type="button"
                role="switch"
                aria-checked={isAccountConnected}
                aria-label={isAccountConnected ? t('integrations.metaAccountDisconnect') : t('integrations.metaAccountConnect')}
                title={isAccountConnected ? t('integrations.metaAccountDisconnect') : t('integrations.metaAccountConnect')}
                disabled={accountBusy}
                onClick={isAccountConnected ? disconnectAccount : connectAccount}
                className={`relative inline-flex h-7 w-12 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${
                  isAccountConnected ? 'bg-emerald-500' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    isAccountConnected ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            )}
          </div>

          <p className="text-xs text-gray-500 mb-4">
            {t('integrations.metaDesc')}
          </p>

          {/* ── Account connected: show page list + add button ── */}
          {!metaLoading && isAccountConnected && (
            <>
              {hasConnections ? (
                <div className="mb-3 space-y-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-2">
                    {t('integrations.metaConnectedPages')} ({connections.length})
                  </p>
                  {connections.map((conn) => (
                    <div
                      key={conn.id}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${conn.webhook_subscribed ? 'border-gray-100 bg-gray-50' : 'border-orange-200 bg-orange-50'}`}
                    >
                      <span className={`h-2 w-2 shrink-0 rounded-full transition-colors ${conn.webhook_subscribed ? 'bg-green-500 animate-pulse' : 'bg-orange-400'}`} />
                      <span className="flex-1 min-w-0 text-xs font-medium text-gray-700 truncate">
                        {conn.page_name || conn.page_id}
                      </span>
                      {!conn.webhook_subscribed && (
                        <button
                          onClick={() => resubscribePage(conn.id)}
                          disabled={resubscribing === conn.id}
                          title={t('integrations.metaResubscribeTitle')}
                          className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium text-orange-600 hover:bg-orange-100 transition-all disabled:opacity-50"
                        >
                          {resubscribing === conn.id ? <RefreshCw className="h-3 w-3 animate-spin" /> : t('integrations.metaRefresh')}
                        </button>
                      )}
                      <button
                        onClick={() => disconnectPage(conn.id)}
                        disabled={disconnecting === conn.id}
                        title={t('integrations.metaDisconnectPage')}
                        className="shrink-0 rounded p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-50"
                      >
                        {disconnecting === conn.id
                          ? <RefreshCw className="h-3 w-3 animate-spin" />
                          : <Trash2 className="h-3 w-3" />}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mb-3 rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-5 text-center">
                  <p className="text-sm font-medium text-gray-700 mb-1">{t('integrations.metaNoPagesYet')}</p>
                  <p className="text-xs text-gray-500">{t('integrations.metaNoPagesYetDesc')}</p>
                </div>
              )}

              <button
                onClick={() => router.push('/meta-select')}
                className={`flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-medium transition-all ${
                  hasConnections
                    ? 'border border-dashed border-emerald-300 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-400'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.98]'
                }`}
              >
                <Plus className="h-3.5 w-3.5" />
                {hasConnections ? t('integrations.metaAddPage') : t('integrations.metaConnectPageButton')}
              </button>
            </>
          )}

          {/* ── Account not connected: prompt via toggle ── */}
          {!metaLoading && !isAccountConnected && (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-5 text-center">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100">
                <Link2 className="h-4 w-4 text-emerald-600" />
              </div>
              <p className="text-sm font-medium text-gray-700">
                {t('integrations.metaConnectAccountPrompt')}
              </p>
            </div>
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
              <span className="text-xs text-gray-400">{tCommon('comingSoon')}</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mb-4">{t('integrations.googleAdsDesc')}</p>
          <div className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 py-2.5 text-xs font-medium text-gray-400 cursor-not-allowed">
            {tCommon('comingSoon')}
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

    </div>
  );
}
