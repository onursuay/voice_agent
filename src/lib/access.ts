// Sidebar nav bölümleri (sidebar.tsx NAV_ITEMS_BASE ile birebir id'ler)
export const NAV_PAGE_KEYS = [
  'dashboard', 'leads', 'pipeline', 'import', 'email', 'automations', 'integrations', 'calls',
] as const;
export type NavPageKey = (typeof NAV_PAGE_KEYS)[number];

// Rol şablonları (UI kolaylığı): owner/admin tam erişim
export const ROLE_PAGE_PRESETS: Record<string, NavPageKey[]> = {
  owner: [...NAV_PAGE_KEYS],
  admin: [...NAV_PAGE_KEYS],
  sales_manager: ['dashboard', 'leads', 'pipeline', 'email', 'calls'],
  sales_rep: ['leads'],
  analyst: ['dashboard', 'leads'],
  readonly: ['leads'],
};

export function isFullAccessRole(role?: string | null): boolean {
  return role === 'owner' || role === 'admin';
}

// allowed_pages null ise rol şablonundan türet; owner/admin her zaman tüm sayfalar
export function resolveAllowedPages(role: string | null | undefined, allowed: string[] | null | undefined): NavPageKey[] {
  if (isFullAccessRole(role)) return [...NAV_PAGE_KEYS];
  if (allowed && allowed.length) return allowed.filter((p): p is NavPageKey => (NAV_PAGE_KEYS as readonly string[]).includes(p));
  return ROLE_PAGE_PRESETS[role || 'readonly'] || ['leads'];
}

export function canAccessPage(page: NavPageKey, role: string | null | undefined, allowed: string[] | null | undefined): boolean {
  return resolveAllowedPages(role, allowed).includes(page);
}
