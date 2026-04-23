'use client';

import { useEffect, useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { Profile, Organization, OrganizationMember, CrmStage } from '@/lib/types';
import { SubscriptionProvider } from '@/components/providers/SubscriptionProvider';
import { CreditProvider } from '@/components/providers/CreditProvider';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const locale = useLocale();
  const tCommon = useTranslations('common');
  const [loading, setLoading] = useState(true);
  const { session, setSession, setStages, setMembers } = useAppStore();

  useEffect(() => {
    const supabase = createClient();

    async function loadSession() {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) { router.push('/login'); return; }

        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (!profile) { router.push('/login'); return; }

        const { data: membership } = await supabase
          .from('organization_members')
          .select('*, organization:organizations(*)')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .single();
        if (!membership) { router.push('/login'); return; }

        const organization = membership.organization as Organization;
        const orgId = organization.id;

        const [stagesRes, membersRes] = await Promise.all([
          supabase.from('crm_stages').select('*').eq('organization_id', orgId).order('position', { ascending: true }),
          supabase.from('organization_members').select('*, profile:profiles(*)').eq('organization_id', orgId).eq('is_active', true),
        ]);

        setSession({
          user: profile as Profile,
          organization,
          membership: membership as OrganizationMember,
          members: (membersRes.data || []) as OrganizationMember[],
        });
        setStages((stagesRes.data || []) as CrmStage[]);
        setMembers((membersRes.data || []) as OrganizationMember[]);
      } catch (err) {
        console.error('Session load error:', err);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    }

    loadSession();
  }, [router, setSession, setStages, setMembers]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <p className="text-sm text-gray-500">{tCommon('loading')}</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <SubscriptionProvider>
      <CreditProvider>
        <div className="flex h-screen bg-gray-50">
          <Sidebar />
          <div className="min-w-0 flex-1 flex flex-col overflow-hidden">
            <Topbar />
            <main className="flex-1 overflow-y-auto p-6">{children}</main>
          </div>
        </div>
      </CreditProvider>
    </SubscriptionProvider>
  );
}
