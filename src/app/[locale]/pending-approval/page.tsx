'use client';

import { useRouter } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/client';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { Clock } from 'lucide-react';

export default function PendingApprovalPage() {
  const router = useRouter();
  const t = useTranslations('access');

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <div className="min-h-screen bg-[#060609] flex items-center justify-center px-4 py-6 relative overflow-hidden">
      {/* Subtle radial gradient background */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% 20%, rgba(16,185,129,0.07) 0%, transparent 70%), radial-gradient(ellipse 60% 40% at 80% 80%, rgba(20,184,166,0.05) 0%, transparent 60%)',
        }}
        aria-hidden="true"
      />

      <div className="w-full max-w-[420px] relative z-10">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Image
            src="/logos/yoai-logo.png"
            alt="DijiGrow"
            width={80}
            height={28}
            className="brightness-0 invert"
            priority
          />
        </div>

        {/* Card */}
        <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-8 backdrop-blur-sm text-center">
          {/* Icon */}
          <div className="flex items-center justify-center mx-auto mb-5 h-14 w-14 rounded-full bg-amber-500/10 border border-amber-500/20">
            <Clock className="h-7 w-7 text-amber-400" />
          </div>

          {/* Title */}
          <h1 className="text-xl font-bold text-white mb-3 tracking-tight">
            {t('pendingTitle')}
          </h1>

          {/* Description */}
          <p className="text-sm text-gray-400 leading-relaxed mb-8">
            {t('pendingDesc')}
          </p>

          {/* Logout button */}
          <button
            onClick={handleLogout}
            className="w-full rounded-lg border border-white/10 bg-white/[0.06] px-4 py-2.5 text-sm font-medium text-gray-300 transition hover:bg-white/[0.10] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 active:scale-[0.98]"
            style={{ transition: 'background-color 150ms ease, color 150ms ease, transform 150ms ease' }}
          >
            {t('logout')}
          </button>
        </div>
      </div>
    </div>
  );
}
