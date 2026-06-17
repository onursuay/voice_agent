'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { DatabaseBackup, RotateCcw, Loader2, ShieldCheck, AlarmClock } from 'lucide-react';
import { useAppStore } from '@/lib/store';

type Backup = {
  id: string;
  taken_at: string;
  reason: 'daily' | 'manual' | 'pre_restore' | string;
  lead_count: number;
};

// Owner: lead yedekleri. Her gece otomatik tam yedek alınır (cron); buradan anında
// manuel yedek alınabilir ve bir yedekten KAYIP/çöpteki lead'ler geri getirilebilir.
// Geri yükleme mevcut aktif lead'leri EZMEZ — yalnız eksik/silinmiş olanları geri ekler.
export function BackupTab() {
  const t = useTranslations('settings');
  const locale = useLocale();
  const isOwner = useAppStore((s) => s.session?.membership?.role === 'owner');

  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(true);
  const [backingUp, setBackingUp] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/leads/backups');
      if (res.ok) {
        const data = await res.json();
        setBackups(data.backups || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleBackupNow = async () => {
    setBackingUp(true); setError(null); setNotice(null);
    try {
      const res = await fetch('/api/leads/backups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'backup' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'error');
      setNotice(t('backup.backedUp', { count: data.lead_count ?? 0 }));
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'error');
    } finally {
      setBackingUp(false);
    }
  };

  const handleRestore = async (id: string) => {
    if (!window.confirm(t('backup.confirmRestore'))) return;
    setRestoringId(id); setError(null); setNotice(null);
    try {
      const res = await fetch('/api/leads/backups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restore', backup_id: id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'error');
      setNotice(t('backup.restored', { count: data.restored ?? 0 }));
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'error');
    } finally {
      setRestoringId(null);
    }
  };

  const reasonLabel = (r: string) =>
    r === 'manual' ? t('backup.reasonManual')
    : r === 'pre_restore' ? t('backup.reasonPreRestore')
    : t('backup.reasonDaily');

  if (!isOwner) {
    return <p className="text-sm text-muted">{t('backup.ownerOnly')}</p>;
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-gray-900">{t('backup.title')}</h3>
          <p className="mt-1 text-sm text-muted">{t('backup.desc')}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleBackupNow}
          disabled={backingUp}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
        >
          {backingUp ? <Loader2 className="h-4 w-4 animate-spin" /> : <DatabaseBackup className="h-4 w-4" />}
          {backingUp ? t('backup.backingUp') : t('backup.backupNow')}
        </button>
        <span className="inline-flex items-center gap-1.5 text-xs text-muted">
          <AlarmClock className="h-3.5 w-3.5" /> {t('backup.autoDaily')}
        </span>
      </div>

      {notice && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</p>}
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <div className="rounded-xl border border-gray-200">
        <div className="border-b border-gray-100 px-4 py-2.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{t('backup.history')}</p>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-gray-400" /></div>
        ) : backups.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted">{t('backup.empty')}</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {backups.map((b) => (
              <li key={b.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-800">
                    {new Date(b.taken_at).toLocaleString(locale)}
                  </p>
                  <p className="text-xs text-muted">
                    {reasonLabel(b.reason)} · {t('backup.count', { count: b.lead_count })}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRestore(b.id)}
                  disabled={restoringId !== null}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
                >
                  {restoringId === b.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                  {restoringId === b.id ? t('backup.restoring') : t('backup.restore')}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
