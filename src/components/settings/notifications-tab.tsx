'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Bell, UserPlus, Clock3, AlarmClock, FileSpreadsheet, Check, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store';

// Owner'ın org-bazlı e-posta bildirim anahtarları.
// organizations.settings.notifications altında saklanır (RLS: yalnız owner update edebilir).

interface NotifState {
  assignment_email: boolean;
  inactivity_reminders: boolean;
  sla_alerts: boolean;
  daily_report: boolean;
}

const DEFAULTS: NotifState = {
  assignment_email: true,
  inactivity_reminders: true,
  sla_alerts: true,
  daily_report: true,
};

export function NotificationsTab() {
  const t = useTranslations('settings');
  const { session } = useAppStore();
  const orgId = session?.organization?.id ?? null;
  const isOwner = session?.membership?.role === 'owner';

  const [state, setState] = useState<NotifState>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orgId) return;
    const supabase = createClient();
    supabase
      .from('organizations')
      .select('settings')
      .eq('id', orgId)
      .single()
      .then(({ data }) => {
        const n = (data?.settings as { notifications?: Partial<NotifState> } | null)?.notifications || {};
        setState({
          assignment_email: n.assignment_email !== false,
          inactivity_reminders: n.inactivity_reminders !== false,
          sla_alerts: n.sla_alerts !== false,
          daily_report: n.daily_report !== false,
        });
        setLoading(false);
      });
  }, [orgId]);

  const persist = useCallback(async (next: NotifState) => {
    if (!orgId) return;
    setSaving(true);
    setError(null);
    try {
      const supabase = createClient();
      // settings JSONB'sinin diğer anahtarlarını koru
      const { data: cur } = await supabase.from('organizations').select('settings').eq('id', orgId).single();
      const settings = { ...((cur?.settings as Record<string, unknown>) || {}), notifications: next };
      const { error: upErr } = await supabase.from('organizations').update({ settings }).eq('id', orgId);
      if (upErr) throw upErr;
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'save failed');
    } finally {
      setSaving(false);
    }
  }, [orgId]);

  const toggle = (key: keyof NotifState) => {
    const next = { ...state, [key]: !state[key] };
    setState(next);
    void persist(next);
  };

  const ITEMS: Array<{ key: keyof NotifState; icon: React.ReactNode; title: string; desc: string }> = [
    { key: 'assignment_email', icon: <UserPlus className="h-5 w-5" />, title: t('notifications.assignmentTitle'), desc: t('notifications.assignmentDesc') },
    { key: 'inactivity_reminders', icon: <Clock3 className="h-5 w-5" />, title: t('notifications.inactivityTitle'), desc: t('notifications.inactivityDesc') },
    { key: 'sla_alerts', icon: <AlarmClock className="h-5 w-5" />, title: t('notifications.slaTitle'), desc: t('notifications.slaDesc') },
    { key: 'daily_report', icon: <FileSpreadsheet className="h-5 w-5" />, title: t('notifications.dailyTitle'), desc: t('notifications.dailyDesc') },
  ];

  if (loading) {
    return <div className="h-40 animate-pulse rounded-xl bg-gray-100" />;
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <Bell className="h-5 w-5 text-emerald-600" /> {t('notifications.title')}
          </h2>
          <p className="mt-0.5 text-sm text-gray-500">{t('notifications.desc')}</p>
        </div>
        {saving ? (
          <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
        ) : saved ? (
          <span className="flex items-center gap-1 text-xs font-medium text-emerald-600"><Check className="h-3.5 w-3.5" /> {t('notifications.saved')}</span>
        ) : null}
      </div>

      {!isOwner && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">{t('notifications.ownerOnly')}</p>
      )}
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}

      <div className="space-y-2">
        {ITEMS.map((item) => (
          <div key={item.key} className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">{item.icon}</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900">{item.title}</p>
              <p className="text-xs text-gray-500">{item.desc}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={state[item.key]}
              disabled={!isOwner || saving}
              onClick={() => toggle(item.key)}
              className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 disabled:cursor-not-allowed disabled:opacity-40 ${
                state[item.key] ? 'bg-emerald-500' : 'bg-gray-200'
              }`}
            >
              <span className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition duration-200 ${state[item.key] ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
