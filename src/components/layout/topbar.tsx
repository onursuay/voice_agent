'use client';

import { usePathname } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { getInitials } from '@/lib/utils';
import { Menu, Search, Bell, ChevronDown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState, useRef, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

const PAGE_TITLE_KEYS: Record<string, string> = {
  '/dashboard': 'dashboard',
  '/dashboard/leads': 'leads',
  '/dashboard/pipeline': 'pipeline',
  '/dashboard/import': 'import',
  '/dashboard/settings': 'settings',
  '/dashboard/hesabim': 'hesabim',
  '/dashboard/faturalarim': 'faturalarim',
  '/dashboard/abonelik': 'abonelik',
  '/dashboard/email': 'email',
  '/dashboard/automations': 'automations',
  '/dashboard/calls': 'calls',
};

function getPageTitleKey(pathname: string): string {
  if (PAGE_TITLE_KEYS[pathname]) return PAGE_TITLE_KEYS[pathname];
  for (const [path, key] of Object.entries(PAGE_TITLE_KEYS)) {
    if (pathname.startsWith(path) && path !== '/dashboard') return key;
  }
  return 'dashboard';
}

export function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { session, sidebarOpen, setSidebarOpen, searchQuery, setSearchQuery } = useAppStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const tTopbar = useTranslations('topbar');
  const tNav = useTranslations('nav');

  const titleKey = getPageTitleKey(pathname);
  const pageTitle = tNav(titleKey as Parameters<typeof tNav>[0]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-border bg-white px-4 sm:px-6">
      {/* Left: hamburger + title */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-foreground transition-colors lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <p className="text-sm font-medium bg-gradient-to-r from-emerald-600 via-purple-500 to-emerald-600 bg-[length:200%_auto] animate-[gradient-shift_3s_ease_infinite] bg-clip-text text-transparent">
          {tTopbar('tagline')}
        </p>
      </div>

      {/* Center: search */}
      <div className="hidden flex-1 max-w-md sm:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={tTopbar('searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-10 pr-4 text-sm text-foreground placeholder:text-gray-400 transition-colors focus:bg-white focus:border-emerald-300"
          />
        </div>
      </div>

      {/* Right: notification + avatar */}
      <div className="flex items-center gap-2">
        {/* Notification bell */}
        <button className="relative flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-foreground transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
        </button>

        {/* Avatar dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-100 transition-colors"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-xs font-semibold text-white">
              {session ? getInitials(session.user.full_name || session.user.email) : 'U'}
            </div>
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-1 w-48 rounded-xl border border-gray-200 bg-white py-1 shadow-lg z-50">
              <div className="border-b border-gray-100 px-4 py-2">
                <p className="text-xs font-semibold text-gray-900 truncate">{session?.user.full_name}</p>
                <p className="text-xs text-gray-500 truncate">{session?.user.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                {tTopbar('logout')}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
