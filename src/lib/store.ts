import { create } from 'zustand';
import type { AppSession, Lead, CrmStage, FilterConfig, SortConfig, OrganizationMember } from './types';

interface AppStore {
  // Session
  session: AppSession | null;
  setSession: (session: AppSession | null) => void;

  // Leads
  leads: Lead[];
  setLeads: (leads: Lead[]) => void;
  addLead: (lead: Lead) => void;
  updateLead: (id: string, data: Partial<Lead>) => void;
  deleteLead: (id: string) => void;
  deleteLeads: (ids: string[]) => void;
  selectedLeadIds: Set<string>;
  setSelectedLeadIds: (ids: Set<string>) => void;
  toggleLeadSelection: (id: string) => void;
  selectAllLeads: () => void;
  clearSelection: () => void;

  // Active lead (drawer)
  activeLeadId: string | null;
  setActiveLeadId: (id: string | null) => void;

  // CRM Stages
  stages: CrmStage[];
  setStages: (stages: CrmStage[]) => void;

  // Members
  members: OrganizationMember[];
  setMembers: (members: OrganizationMember[]) => void;

  // Filters & Sort
  filters: FilterConfig[];
  setFilters: (filters: FilterConfig[]) => void;
  addFilter: (filter: FilterConfig) => void;
  removeFilter: (index: number) => void;
  sort: SortConfig | null;
  setSort: (sort: SortConfig | null) => void;

  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Source filter
  sourceFilter: string;
  setSourceFilter: (source: string) => void;

  // Import table filter
  importJobFilter: { id: string; name: string; columns: string[] } | null;
  setImportJobFilter: (job: { id: string; name: string; columns: string[] } | null) => void;

  // Per-page
  perPage: number;
  setPerPage: (n: number) => void;

  // Refresh trigger
  leadsNeedRefresh: number;
  triggerLeadsRefresh: () => void;

  // View
  hiddenColumns: Set<string>;
  toggleColumn: (col: string) => void;
  setHiddenColumns: (cols: Set<string>) => void;
  columnLabelOverrides: Record<string, string>;
  setColumnLabelOverrides: (overrides: Record<string, string>) => void;

  // UI
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
}

export const useAppStore = create<AppStore>((set, get) => ({
  session: null,
  setSession: (session) => set({ session }),

  leads: [],
  setLeads: (leads) => set({ leads }),
  addLead: (lead) => set({ leads: [...get().leads, lead] }),
  updateLead: (id, data) => set({
    leads: get().leads.map(l => l.id === id ? { ...l, ...data } : l),
  }),
  deleteLead: (id) => set({
    leads: get().leads.filter(l => l.id !== id),
    selectedLeadIds: (() => { const s = new Set(get().selectedLeadIds); s.delete(id); return s; })(),
  }),
  deleteLeads: (ids) => {
    const idSet = new Set(ids);
    set({
      leads: get().leads.filter(l => !idSet.has(l.id)),
      selectedLeadIds: new Set(),
    });
  },
  selectedLeadIds: new Set(),
  setSelectedLeadIds: (ids) => set({ selectedLeadIds: ids }),
  toggleLeadSelection: (id) => {
    const current = new Set(get().selectedLeadIds);
    if (current.has(id)) current.delete(id);
    else current.add(id);
    set({ selectedLeadIds: current });
  },
  selectAllLeads: () => set({ selectedLeadIds: new Set(get().leads.map(l => l.id)) }),
  clearSelection: () => set({ selectedLeadIds: new Set() }),

  activeLeadId: null,
  setActiveLeadId: (id) => set({ activeLeadId: id, drawerOpen: !!id }),

  stages: [],
  setStages: (stages) => set({ stages }),

  members: [],
  setMembers: (members) => set({ members }),

  filters: [],
  setFilters: (filters) => set({ filters }),
  addFilter: (filter) => set({ filters: [...get().filters, filter] }),
  removeFilter: (index) => set({ filters: get().filters.filter((_, i) => i !== index) }),
  sort: null,
  setSort: (sort) => set({ sort }),

  searchQuery: '',
  setSearchQuery: (searchQuery) => set({ searchQuery }),

  sourceFilter: '',
  setSourceFilter: (sourceFilter) => set({ sourceFilter }),

  importJobFilter: null,
  setImportJobFilter: (importJobFilter) => set({ importJobFilter }),

  perPage: 25,
  setPerPage: (perPage) => set({ perPage }),

  leadsNeedRefresh: 0,
  triggerLeadsRefresh: () => set((s) => ({ leadsNeedRefresh: s.leadsNeedRefresh + 1 })),

  hiddenColumns: new Set(),
  toggleColumn: (col) => {
    const current = new Set(get().hiddenColumns);
    if (current.has(col)) current.delete(col);
    else current.add(col);
    set({ hiddenColumns: current });
  },
  setHiddenColumns: (cols) => set({ hiddenColumns: cols }),

  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  drawerOpen: false,
  setDrawerOpen: (open) => set({ drawerOpen: open }),
}));
