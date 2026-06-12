import 'server-only';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';

// Owner'ın Ayarlar → Bildirimler sekmesinden yönettiği org-bazlı mail anahtarları.
// organizations.settings.notifications altında saklanır; tanımsızsa hepsi AÇIK.

export interface NotificationSettings {
  assignment_email: boolean;     // manuel atamada atanan kişiye mail
  inactivity_reminders: boolean; // hareketsizlik hatırlatmaları
  sla_alerts: boolean;           // speed-to-lead / retry SLA uyarıları
  daily_report: boolean;         // günlük Excel raporu
}

const DEFAULTS: NotificationSettings = {
  assignment_email: true,
  inactivity_reminders: true,
  sla_alerts: true,
  daily_report: true,
};

export async function getNotificationSettings(
  orgId: string,
  cache?: Map<string, NotificationSettings>,
): Promise<NotificationSettings> {
  if (cache?.has(orgId)) return cache.get(orgId)!;
  const admin = createAdminSupabaseClient();
  const { data } = await admin.from('organizations').select('settings').eq('id', orgId).single();
  const n = (data?.settings as { notifications?: Partial<NotificationSettings> } | null)?.notifications || {};
  const merged: NotificationSettings = {
    assignment_email: n.assignment_email !== false,
    inactivity_reminders: n.inactivity_reminders !== false,
    sla_alerts: n.sla_alerts !== false,
    daily_report: n.daily_report !== false,
  };
  cache?.set(orgId, merged);
  return merged;
}

export { DEFAULTS as NOTIFICATION_DEFAULTS };
