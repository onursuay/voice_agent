import { create } from 'zustand';
import type { AppSession, Lead, CrmStage, FilterConfig, SortConfig, OrganizationMember } from './types';
import type { ImportJobSummary } from './lead-import-columns';

// Columns hidden by default (still toggleable via the "Kolonlar" menu). These
// are CRM-internal extras that clutter the table for most lead sources; the
// user can re-enable any of them. Used both as the initial state and as the
// baseline that filters (import/form) reset back to.
export const DEFAULT_HIDDEN_COLUMNS = ['score', 'campaign_name', 'tags'];

interface AppStore {
  // Session
  session: AppSession | null;
  setSession: (session: AppSession | null) => void;

  // Leads
  leads: Lead[];
  setLeads: (leads: Lead[]) => void;
  total: number;
  setTotal: (n: number) => void;
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

  // Meta Custom Audience ile başarıyla senkronize (tamamlanan) leadleri göster/gizle.
  // Varsayılan false: senkronize olanlar listeden gizlenir.
  showSynced: boolean;
  setShowSynced: (show: boolean) => void;

  // Import table filter
  importJobFilter: { id: string; name: string; columns: string[] } | null;
  setImportJobFilter: (job: { id: string; name: string; columns: string[] } | null) => void;

  // İçe aktarılan listeler (account dropdown'da Meta sayfalarının yanında "hesap"
  // olarak listelenir). Leads sayfası mount'ta doldurur.
  importJobs: ImportJobSummary[];
  setImportJobs: (jobs: ImportJobSummary[]) => void;

  // Meta Lead Form filter (filters rows by meta_form_id AND drives dynamic columns)
  formFilter: { id: string; name: string; pageId: string } | null;
  setFormFilter: (form: { id: string; name: string; pageId: string } | null) => void;

  // Connected Meta accounts/pages + active page filter (lead source dropdown)
  connectedPages: { page_id: string; page_name: string | null }[];
  setConnectedPages: (pages: { page_id: string; page_name: string | null }[]) => void;
  pageFilter: string | null; // active meta_page_id; null = all accounts
  setPageFilter: (pageId: string | null) => void;

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

  // Bulk action trigger (e.g. from context menu)
  bulkActionModal: 'stage' | 'assign' | 'tag' | null;
  setBulkActionModal: (modal: 'stage' | 'assign' | 'tag' | null) => void;

  // Transient status toast (e.g. stage→Meta audience sync result)
  syncNotice: { message: string; variant: 'ok' | 'warn' | 'info' } | null;
  setSyncNotice: (notice: { message: string; variant: 'ok' | 'warn' | 'info' } | null) => void;
}

export const useAppStore = create<AppStore>((set, get) => ({
  session: null,
  setSession: (session) => set({ session }),

  leads: [],
  setLeads: (leads) => set({ leads }),
  total: 0,
  setTotal: (total) => set({ total }),
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

  showSynced: false,
  setShowSynced: (showSynced) => set({ showSynced }),

  importJobFilter: null,
  setImportJobFilter: (importJobFilter) => set({ importJobFilter }),

  importJobs: [],
  setImportJobs: (importJobs) => set({ importJobs }),

  formFilter: null,
  setFormFilter: (formFilter) => set({ formFilter }),

  connectedPages: [],
  setConnectedPages: (connectedPages) => set({ connectedPages }),
  pageFilter: null,
  setPageFilter: (pageFilter) => set({ pageFilter }),

  perPage: 25,
  setPerPage: (perPage) => set({ perPage }),

  leadsNeedRefresh: 0,
  triggerLeadsRefresh: () => set((s) => ({ leadsNeedRefresh: s.leadsNeedRefresh + 1 })),

  hiddenColumns: new Set(DEFAULT_HIDDEN_COLUMNS),
  toggleColumn: (col) => {
    const current = new Set(get().hiddenColumns);
    if (current.has(col)) current.delete(col);
    else current.add(col);
    set({ hiddenColumns: current });
  },
  setHiddenColumns: (cols) => set({ hiddenColumns: cols }),
  columnLabelOverrides: {},
  setColumnLabelOverrides: (columnLabelOverrides) => set({ columnLabelOverrides }),

  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  drawerOpen: false,
  setDrawerOpen: (open) => set({ drawerOpen: open }),

  bulkActionModal: null,
  setBulkActionModal: (modal) => set({ bulkActionModal: modal }),

  syncNotice: null,
  setSyncNotice: (syncNotice) => set({ syncNotice }),
}));
