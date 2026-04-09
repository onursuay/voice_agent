'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store';
import { getInitials } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  GitBranch,
  Upload,
  Settings,
  Mail,
  Zap,
  Phone,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  User,
  FileText,
  CreditCard,
  HelpCircle,
  Globe,
  ChevronRight,
  Check,
} from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import type { UserRole } from '@/lib/types';
import { ROLE_LABELS } from '@/lib/types';

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ElementType;
  children?: NavItem[];
  disabled?: boolean;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { id: 'leads', label: "Lead'ler", href: '/dashboard/leads', icon: Users },
  { id: 'pipeline', label: 'Pipeline', href: '/dashboard/pipeline', icon: GitBranch },
  { id: 'import', label: 'İçe Aktar', href: '/dashboard/import', icon: Upload },
  { id: 'email', label: 'E-posta', href: '/dashboard/email', icon: Mail },
  { id: 'automations', label: 'Otomasyonlar', href: '/dashboard/automations', icon: Zap },
  { id: 'calls', label: 'AI Aramalar', href: '/dashboard/calls', icon: Phone },
  { id: 'settings', label: 'Ayarlar', href: '/dashboard/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { session, setSidebarOpen } = useAppStore();

  const [collapsed, setCollapsed] = useState(true);
  const [ready, setReady] = useState(false);
  const [animate, setAnimate] = useState(false);
  const [showHintButton, setShowHintButton] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Read saved state, mark ready, then enable transitions
  useEffect(() => {
    try {
      const saved = localStorage.getItem('sidebar_collapsed');
      if (saved !== null) setCollapsed(JSON.parse(saved));
    } catch { /* ignore */ }
    setReady(true);
    requestAnimationFrame(() => requestAnimationFrame(() => setAnimate(true)));
  }, []);

  // Persist collapsed state
  useEffect(() => {
    if (ready) localStorage.setItem('sidebar_collapsed', JSON.stringify(collapsed));
  }, [collapsed, ready]);

  // Collapsed hint animation: logo 5s → button 1s → loop
  useEffect(() => {
    if (!collapsed || !ready) return;
    setShowHintButton(false);
    const loop = () => {
      const t1 = setTimeout(() => setShowHintButton(true), 5000);
      const t2 = setTimeout(() => setShowHintButton(false), 6000);
      const t3 = setTimeout(loop, 6000);
      return [t1, t2, t3];
    };
    const timers = loop();
    return () => timers.forEach(clearTimeout);
  }, [collapsed, ready]);

  const toggleCollapse = useCallback(() => {
    setCollapsed(prev => !prev);
  }, []);

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  // SSR placeholder
  if (!ready) {
    return <div className="bg-white border-r border-gray-200 h-screen shrink-0" style={{ width: '72px' }} />;
  }

  return (
    <div
      className={`bg-white border-r border-gray-200 h-screen flex flex-col shrink-0 ${animate ? 'transition-[width] duration-300' : ''}`}
      style={{ width: collapsed ? '72px' : '260px' }}
    >
      {/* Header / Logo */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between min-h-[56px]">
        {collapsed ? (
          <div className="group relative flex items-center justify-center w-full h-10 rounded-lg overflow-hidden">
            {/* Indigo glow particles — only during hint */}
            <div
              className={`absolute inset-0 transition-opacity duration-500 pointer-events-none ${showHintButton ? 'opacity-100' : 'opacity-0'}`}
              aria-hidden="true"
            >
              <span className="absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" style={{ animationDuration: '1.5s' }} />
              <span className="absolute top-0 right-2 w-1 h-1 rounded-full bg-indigo-300 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.3s' }} />
              <span className="absolute bottom-1 left-3 w-1 h-1 rounded-full bg-indigo-500 animate-ping" style={{ animationDuration: '1.8s', animationDelay: '0.5s' }} />
              <span className="absolute bottom-0 right-1 w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" style={{ animationDuration: '1.6s', animationDelay: '0.2s' }} />
              <div className="absolute inset-0 rounded-lg ring-1 ring-indigo-400/40 shadow-[0_0_8px_rgba(99,102,241,0.3)]" />
            </div>

            <Link
              href="/dashboard"
              className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 group-hover:opacity-0 ${showHintButton ? 'opacity-0' : 'opacity-100'}`}
            >
              <img src="/logo.png" alt="Yo Dijital" style={{ width: 36, height: 36 }} className="object-contain" />
            </Link>
            <button
              onClick={toggleCollapse}
              className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 group-hover:opacity-100 rounded-lg ${showHintButton ? 'opacity-100' : 'opacity-0'}`}
              aria-label="Genişlet"
            >
              <PanelLeftOpen className="w-6 h-6 text-indigo-500" />
            </button>
          </div>
        ) : (
          <>
            <Link href="/dashboard" className="flex-shrink-0">
              <img src="/logo.png" alt="Yo Dijital" style={{ height: 40 }} className="object-contain cursor-pointer" />
            </Link>
            <button
              onClick={toggleCollapse}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors ml-auto"
              aria-label="Daralt"
            >
              <PanelLeftClose className="w-5 h-5 text-gray-600" />
            </button>
          </>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                active
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-gray-700 hover:bg-gray-50'
              } ${collapsed ? 'justify-center' : ''}`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={`w-5 h-5 shrink-0 ${active ? 'text-indigo-600' : 'text-gray-400'}`} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-gray-200 relative">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className={`w-full flex items-center gap-3 rounded-lg p-2 hover:bg-gray-50 transition-colors ${collapsed ? 'justify-center' : ''}`}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white text-xs font-bold">
            {session?.user?.full_name ? getInitials(session.user.full_name) : 'U'}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0 text-left">
              <p className="truncate text-sm font-medium text-gray-900" style={{ maxWidth: '140px' }}>
                {session?.user?.full_name || 'Kullanıcı'}
              </p>
              <p className="text-xs text-indigo-600">
                {session?.membership?.role ? ROLE_LABELS[session.membership.role as UserRole] : ''}
              </p>
            </div>
          )}
        </button>

        {/* Dropdown */}
        {dropdownOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
            <div
              className={`absolute z-50 bg-white border border-gray-200 rounded-xl shadow-lg w-60 overflow-hidden ${
                collapsed ? 'left-full ml-2 bottom-0' : 'bottom-full mb-2 left-4'
              }`}
            >
              {/* Header */}
              <div className="px-4 py-3.5 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white text-xs font-bold">
                    {session?.user?.full_name ? getInitials(session.user.full_name) : 'U'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{session?.user?.full_name || 'Kullanıcı'}</p>
                    <p className="text-xs text-gray-500 truncate">{session?.user?.email || ''}</p>
                  </div>
                </div>
              </div>

              {/* Menu items */}
              <div className="py-1">
                <Link
                  href="/dashboard/settings?tab=profile"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <User className="h-4 w-4 text-gray-400" />
                  Hesabım
                </Link>
                <Link
                  href="/dashboard/settings"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Settings className="h-4 w-4 text-gray-400" />
                  Ayarlar
                </Link>
              </div>

              {/* Logout */}
              <div className="border-t border-gray-100 py-1">
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Çıkış Yap
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
