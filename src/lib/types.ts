// ============================================
// YO DİJİTAL - Lead Operations Dashboard + CRM
// TypeScript Types
// ============================================

export type UserRole = 'owner' | 'admin' | 'sales_manager' | 'sales_rep' | 'analyst' | 'readonly';
export type LeadStage = 'new' | 'contacted' | 'qualified' | 'meeting' | 'offer' | 'won' | 'lost';
export type LeadSourcePlatform = 'meta_lead_form' | 'whatsapp' | 'instagram_dm' | 'messenger' | 'website' | 'manual' | 'import' | 'other';
export type ActivityType = 'created' | 'stage_change' | 'note_added' | 'email_sent' | 'call_made' | 'assigned' | 'tag_added' | 'tag_removed' | 'merged' | 'imported' | 'edited' | 'score_changed';
export type ImportStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: UserRole;
  is_active: boolean;
  invited_at: string;
  joined_at: string;
  profile?: Profile;
}

export interface CrmStage {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  color: string;
  position: number;
  is_won: boolean;
  is_lost: boolean;
  created_at: string;
  lead_count?: number;
}

export interface Lead {
  id: string;
  organization_id: string;
  phone: string | null;
  email: string | null;
  external_platform_id: string | null;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  company: string | null;
  job_title: string | null;
  city: string | null;
  country: string | null;
  stage_id: string | null;
  assigned_to: string | null;
  score: number;
  source_platform: LeadSourcePlatform;
  campaign_name: string | null;
  ad_set_name: string | null;
  ad_name: string | null;
  form_name: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  tags: string[];
  custom_fields: Record<string, unknown>;
  notes_count: number;
  activities_count: number;
  last_activity_at: string | null;
  first_seen_at: string;
  created_at: string;
  updated_at: string;
  // Joined
  stage?: CrmStage;
  assigned_user?: Profile;
}

export interface LeadSource {
  id: string;
  organization_id: string;
  lead_id: string | null;
  platform: LeadSourcePlatform;
  platform_lead_id: string | null;
  campaign_id: string | null;
  campaign_name: string | null;
  ad_set_id: string | null;
  ad_set_name: string | null;
  ad_id: string | null;
  ad_name: string | null;
  form_id: string | null;
  form_name: string | null;
  raw_data: Record<string, unknown>;
  received_at: string;
  processed: boolean;
  created_at: string;
}

export interface LeadNote {
  id: string;
  lead_id: string;
  organization_id: string;
  user_id: string | null;
  content: string;
  is_system: boolean;
  created_at: string;
  updated_at: string;
  user?: Profile;
}

export interface LeadActivity {
  id: string;
  lead_id: string;
  organization_id: string;
  user_id: string | null;
  activity_type: ActivityType;
  title: string;
  description: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  user?: Profile;
}

export interface StageHistory {
  id: string;
  lead_id: string;
  organization_id: string;
  from_stage_id: string | null;
  to_stage_id: string | null;
  changed_by: string | null;
  duration_seconds: number | null;
  created_at: string;
  from_stage?: CrmStage;
  to_stage?: CrmStage;
}

export interface ImportJob {
  id: string;
  organization_id: string;
  user_id: string;
  file_name: string;
  file_url: string | null;
  status: ImportStatus;
  column_mapping: Record<string, string>;
  total_rows: number;
  processed_rows: number;
  created_rows: number;
  updated_rows: number;
  skipped_rows: number;
  error_rows: number;
  errors: Array<{ row: number; message: string }>;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface SavedView {
  id: string;
  organization_id: string;
  user_id: string | null;
  name: string;
  filters: Record<string, unknown>;
  sort_config: Array<{ column: string; direction: 'asc' | 'desc' }>;
  visible_columns: string[];
  is_default: boolean;
  is_shared: boolean;
  created_at: string;
  updated_at: string;
}

// UI Types
export interface ColumnDef {
  key: string;
  label: string;
  type: 'text' | 'email' | 'phone' | 'select' | 'tags' | 'date' | 'number' | 'user' | 'stage' | 'platform';
  sortable?: boolean;
  filterable?: boolean;
  editable?: boolean;
  width?: number;
  hidden?: boolean;
}

export interface FilterConfig {
  column: string;
  operator: 'eq' | 'neq' | 'contains' | 'not_contains' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'not_in' | 'is_empty' | 'is_not_empty';
  value: string | string[] | number;
}

export interface SortConfig {
  column: string;
  direction: 'asc' | 'desc';
}

// Session context
export interface AppSession {
  user: Profile;
  organization: Organization;
  membership: OrganizationMember;
  members: OrganizationMember[];
}

// Lead form fields for import mapping
export const LEAD_FIELD_OPTIONS: { value: string; label: string }[] = [
  { value: 'first_name', label: 'Ad' },
  { value: 'last_name', label: 'Soyad' },
  { value: 'full_name', label: 'Ad Soyad' },
  { value: 'email', label: 'E-posta' },
  { value: 'phone', label: 'Telefon' },
  { value: 'company', label: 'Şirket' },
  { value: 'job_title', label: 'Ünvan' },
  { value: 'city', label: 'Şehir' },
  { value: 'country', label: 'Ülke' },
  { value: 'source_platform', label: 'Kaynak Platform' },
  { value: 'campaign_name', label: 'Kampanya' },
  { value: 'ad_set_name', label: 'Reklam Seti' },
  { value: 'ad_name', label: 'Reklam' },
  { value: 'form_name', label: 'Form Adı' },
  { value: 'utm_source', label: 'UTM Source' },
  { value: 'utm_medium', label: 'UTM Medium' },
  { value: 'utm_campaign', label: 'UTM Campaign' },
  { value: 'tags', label: 'Etiketler' },
  { value: 'score', label: 'Skor' },
  { value: '_skip', label: '— Atla —' },
];

export const SOURCE_PLATFORM_LABELS: Record<LeadSourcePlatform, string> = {
  meta_lead_form: 'Meta Lead Form',
  whatsapp: 'WhatsApp',
  instagram_dm: 'Instagram DM',
  messenger: 'Messenger',
  website: 'Website',
  manual: 'Manuel',
  import: 'Import',
  other: 'Diğer',
};

export const STAGE_LABELS: Record<LeadStage, string> = {
  new: 'Yeni',
  contacted: 'İletişime Geçildi',
  qualified: 'Nitelikli',
  meeting: 'Toplantı',
  offer: 'Teklif',
  won: 'Kazanıldı',
  lost: 'Kaybedildi',
};

export const ROLE_LABELS: Record<UserRole, string> = {
  owner: 'Sahip',
  admin: 'Yönetici',
  sales_manager: 'Satış Müdürü',
  sales_rep: 'Satış Temsilcisi',
  analyst: 'Analist',
  readonly: 'Salt Okunur',
};

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  owner: ['*'],
  admin: ['leads.read', 'leads.write', 'leads.delete', 'leads.assign', 'leads.import', 'leads.export', 'pipeline.manage', 'members.manage', 'settings.manage', 'automations.manage'],
  sales_manager: ['leads.read', 'leads.write', 'leads.assign', 'leads.import', 'leads.export', 'pipeline.manage'],
  sales_rep: ['leads.read', 'leads.write', 'leads.assign'],
  analyst: ['leads.read', 'leads.export'],
  readonly: ['leads.read'],
};
