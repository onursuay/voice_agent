'use client';

import { usePathname } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { getInitials } from '@/lib/utils';
import { Menu, Search, Bell, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/leads': "Lead'ler",
  '/dashboard/pipeline': 'Pipeline',
  '/dashboard/import': 'İçe Aktar',
  '/dashboard/settings': 'Ayarlar',
};

function getPageTitle(pathname: string): string {
  // Exact match first
  if (pageTitles[pathname]) return pageTitles[pathname];
  // Prefix match
  for (const [path, title] of Object.entries(pageTitles)) {
    if (pathname.startsWith(path) && path !== '/dashboard') return title;
  }
  return 'Dashboard';
}

export function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { session, sidebarOpen, setSidebarOpen, searchQuery, setSearchQuery } = useAppStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const pageTitle = getPageTitle(pathname);

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
    router.push('/login');
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
        <p className="text-sm font-medium bg-gradient-to-r from-indigo-600 via-purple-500 to-indigo-600 bg-[length:200%_auto] animate-[gradient-shift_3s_ease_infinite] bg-clip-text text-transparent">
          Sat{"\u0131"}{"\u015f"} ekibinizin yapay zeka g{"\u00fc"}c{"\u00fc"}.
        </p>
      </div>

      {/* Center: search */}
      <div className="hidden flex-1 max-w-md sm:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Lead, telefon veya e-posta ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-10 pr-4 text-sm text-foreground placeholder:text-gray-400 transition-colors focus:bg-white focus:border-indigo-300"
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
      </div>
    </header>
  );
}
