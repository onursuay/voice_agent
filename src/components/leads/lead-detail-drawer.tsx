'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  MoreHorizontal,
  Phone,
  Mail,
  Building2,
  Briefcase,
  MapPin,
  Globe,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  Plus,
  ArrowRight,
  MessageSquare,
  UserPlus,
  Tag,
  Upload,
  Pencil,
  Send,
  Trash2,
  Edit3,
  Clock,
  Link2,
  Hash,
} from 'lucide-react';
import { cn, formatRelativeTime, getSourceColor, getScoreColor, getInitials } from '@/lib/utils';
import { useAppStore } from '@/lib/store';
import type { Lead, LeadActivity, LeadNote, ActivityType, CrmStage } from '@/lib/types';
import { SOURCE_PLATFORM_LABELS } from '@/lib/types';
import { useTranslations } from 'next-intl';
import { Tabs } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { Dropdown } from '@/components/ui/dropdown';
import { Spinner } from '@/components/ui/loading';

// ============================================
// Activity Icon Map
// ============================================
const activityIconMap: Record<ActivityType, React.ReactNode> = {
  created: <Plus className="h-3.5 w-3.5" />,
  stage_change: <ArrowRight className="h-3.5 w-3.5" />,
  note_added: <MessageSquare className="h-3.5 w-3.5" />,
  email_sent: <Mail className="h-3.5 w-3.5" />,
  call_made: <Phone className="h-3.5 w-3.5" />,
  assigned: <UserPlus className="h-3.5 w-3.5" />,
  tag_added: <Tag className="h-3.5 w-3.5" />,
  tag_removed: <Tag className="h-3.5 w-3.5" />,
  merged: <Link2 className="h-3.5 w-3.5" />,
  imported: <Upload className="h-3.5 w-3.5" />,
  edited: <Pencil className="h-3.5 w-3.5" />,
  score_changed: <Hash className="h-3.5 w-3.5" />,
};

const activityColorMap: Record<ActivityType, string> = {
  created: 'bg-green-100 text-green-600',
  stage_change: 'bg-blue-100 text-blue-600',
  note_added: 'bg-yellow-100 text-yellow-600',
  email_sent: 'bg-indigo-100 text-indigo-600',
  call_made: 'bg-purple-100 text-purple-600',
  assigned: 'bg-cyan-100 text-cyan-600',
  tag_added: 'bg-pink-100 text-pink-600',
  tag_removed: 'bg-gray-100 text-gray-600',
  merged: 'bg-orange-100 text-orange-600',
  imported: 'bg-amber-100 text-amber-600',
  edited: 'bg-slate-100 text-slate-600',
  score_changed: 'bg-emerald-100 text-emerald-600',
};

// ============================================
// Copy Button Helper
// ============================================
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="ml-1.5 inline-flex items-center rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
      title="Kopyala"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

// ============================================
// Info Row
// ============================================
function InfoRow({
  icon,
  label,
  value,
  copyable = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null | undefined;
  copyable?: boolean;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2">
      <span className="mt-0.5 shrink-0 text-gray-400">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-gray-500">{label}</p>
        <div className="flex items-center">
          <p className="text-sm text-gray-900 truncate">{value}</p>
          {copyable && <CopyButton text={value} />}
        </div>
      </div>
    </div>
  );
}

// ============================================
// Section Wrapper
// ============================================
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-gray-100 pb-4 mb-4 last:border-0 last:mb-0 last:pb-0">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">{title}</h4>
      {children}
    </div>
  );
}

// ============================================
// Collapsible Section
// ============================================
function CollapsibleSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-100 pb-4 mb-4 last:border-0 last:mb-0 last:pb-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between text-xs font-semibold uppercase tracking-wider text-gray-400 hover:text-gray-600 transition-colors"
      >
        {title}
        {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
      </button>
      {open && <div className="mt-2">{children}</div>}
    </div>
  );
}

// ============================================
// Detail Tab
// ============================================
function DetailTab({ lead }: { lead: Lead }) {
  const { stages, members, updateLead } = useAppStore();
  const [tagInput, setTagInput] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);

  const handleStageChange = async (stageId: string) => {
    try {
      const res = await fetch(`/api/leads/${lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage_id: stageId }),
      });
      if (res.ok) {
        const updatedStage = stages.find((s) => s.id === stageId);
        updateLead(lead.id, { stage_id: stageId, stage: updatedStage });
      }
    } catch (err) {
      console.error('Stage update failed:', err);
    }
  };

  const handleAssignChange = async (userId: string) => {
    try {
      const res = await fetch(`/api/leads/${lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assigned_to: userId || null }),
      });
      if (res.ok) {
        const member = members.find((m) => m.user_id === userId);
        updateLead(lead.id, { assigned_to: userId || null, assigned_user: member?.profile });
      }
    } catch (err) {
      console.error('Assign update failed:', err);
    }
  };

  const handleAddTag = async () => {
    const tag = tagInput.trim();
    if (!tag || lead.tags.includes(tag)) {
      setTagInput('');
      setShowTagInput(false);
      return;
    }
    const newTags = [...lead.tags, tag];
    try {
      const res = await fetch(`/api/leads/${lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags: newTags }),
      });
      if (res.ok) {
        updateLead(lead.id, { tags: newTags });
      }
    } catch (err) {
      console.error('Tag add failed:', err);
    }
    setTagInput('');
    setShowTagInput(false);
  };

  const handleRemoveTag = async (tag: string) => {
    const newTags = lead.tags.filter((t) => t !== tag);
    try {
      const res = await fetch(`/api/leads/${lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags: newTags }),
      });
      if (res.ok) {
        updateLead(lead.id, { tags: newTags });
      }
    } catch (err) {
      console.error('Tag remove failed:', err);
    }
  };

  const currentStage = lead.stage || stages.find((s) => s.id === lead.stage_id);

  return (
    <div className="p-4 space-y-0 overflow-y-auto">
      {/* Contact Info */}
      <Section title="İletişim Bilgileri">
        <InfoRow icon={<Phone className="h-4 w-4" />} label="Telefon" value={lead.phone} copyable />
        <InfoRow icon={<Mail className="h-4 w-4" />} label="E-posta" value={lead.email} copyable />
        <InfoRow icon={<Building2 className="h-4 w-4" />} label="Şirket" value={lead.company} />
        <InfoRow icon={<Briefcase className="h-4 w-4" />} label="Ünvan" value={lead.job_title} />
        <InfoRow icon={<MapPin className="h-4 w-4" />} label="Şehir" value={lead.city} />
        <InfoRow icon={<Globe className="h-4 w-4" />} label="Ülke" value={lead.country} />
      </Section>

      {/* CRM Section */}
      <Section title="CRM">
        <div className="space-y-3">
          {/* Stage */}
          <div>
            <p className="text-xs text-gray-500 mb-1">Aşama</p>
            <select
              value={lead.stage_id || ''}
              onChange={(e) => handleStageChange(e.target.value)}
              className="block w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">Aşama Seçin</option>
              {stages
                .sort((a, b) => a.position - b.position)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Score */}
          <div>
            <p className="text-xs text-gray-500 mb-1">Skor</p>
            <span
              className={cn(
                'inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-semibold',
                getScoreColor(lead.score)
              )}
            >
              {lead.score}
            </span>
          </div>

          {/* Assigned */}
          <div>
            <p className="text-xs text-gray-500 mb-1">Atanan Kişi</p>
            <select
              value={lead.assigned_to || ''}
              onChange={(e) => handleAssignChange(e.target.value)}
              className="block w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">Atanmamış</option>
              {members.map((m) => (
                <option key={m.user_id} value={m.user_id}>
                  {m.profile?.full_name || m.user_id}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Section>

      {/* Source Section */}
      <Section title="Kaynak">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Platform:</span>
            <Badge
              color="blue"
              size="sm"
              className="!rounded-md"
            >
              <span
                className="inline-block h-2 w-2 rounded-full mr-1"
                style={{ backgroundColor: getSourceColor(lead.source_platform) }}
              />
              {SOURCE_PLATFORM_LABELS[lead.source_platform]}
            </Badge>
          </div>
          {lead.campaign_name && (
            <div className="flex items-start gap-2">
              <span className="text-xs text-gray-500 shrink-0">Kampanya:</span>
              <span className="text-sm text-gray-900">{lead.campaign_name}</span>
            </div>
          )}
          {lead.ad_set_name && (
            <div className="flex items-start gap-2">
              <span className="text-xs text-gray-500 shrink-0">Reklam Seti:</span>
              <span className="text-sm text-gray-900">{lead.ad_set_name}</span>
            </div>
          )}
          {lead.ad_name && (
            <div className="flex items-start gap-2">
              <span className="text-xs text-gray-500 shrink-0">Reklam:</span>
              <span className="text-sm text-gray-900">{lead.ad_name}</span>
            </div>
          )}
          {lead.form_name && (
            <div className="flex items-start gap-2">
              <span className="text-xs text-gray-500 shrink-0">Form:</span>
              <span className="text-sm text-gray-900">{lead.form_name}</span>
            </div>
          )}
        </div>
      </Section>

      {/* UTM Section (Collapsible) */}
      {(lead.utm_source || lead.utm_medium || lead.utm_campaign || lead.utm_content || lead.utm_term) && (
        <CollapsibleSection title="UTM Parametreleri">
          <div className="space-y-1.5">
            {lead.utm_source && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500 w-20 shrink-0">Source:</span>
                <span className="text-gray-900">{lead.utm_source}</span>
              </div>
            )}
            {lead.utm_medium && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500 w-20 shrink-0">Medium:</span>
                <span className="text-gray-900">{lead.utm_medium}</span>
              </div>
            )}
            {lead.utm_campaign && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500 w-20 shrink-0">Campaign:</span>
                <span className="text-gray-900">{lead.utm_campaign}</span>
              </div>
            )}
            {lead.utm_content && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500 w-20 shrink-0">Content:</span>
                <span className="text-gray-900">{lead.utm_content}</span>
              </div>
            )}
            {lead.utm_term && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500 w-20 shrink-0">Term:</span>
                <span className="text-gray-900">{lead.utm_term}</span>
              </div>
            )}
          </div>
        </CollapsibleSection>
      )}

      {/* Tags */}
      <Section title="Etiketler">
        <div className="flex flex-wrap gap-1.5">
          {lead.tags.map((tag) => (
            <Badge key={tag} color="indigo" size="sm" removable onRemove={() => handleRemoveTag(tag)}>
              {tag}
            </Badge>
          ))}
          {showTagInput ? (
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddTag();
                  if (e.key === 'Escape') {
                    setShowTagInput(false);
                    setTagInput('');
                  }
                }}
                placeholder="Etiket adi..."
                autoFocus
                className="h-6 w-28 rounded border border-gray-300 px-2 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/20"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="inline-flex h-6 items-center rounded bg-indigo-500 px-2 text-xs text-white hover:bg-indigo-600"
              >
                Ekle
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowTagInput(true)}
              className="inline-flex items-center gap-1 rounded-full border border-dashed border-gray-300 px-2.5 py-0.5 text-xs text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors"
            >
              <Plus className="h-3 w-3" />
              Etiket
            </button>
          )}
        </div>
      </Section>

      {/* Custom Fields */}
      {lead.custom_fields && Object.keys(lead.custom_fields).length > 0 && (
        <Section title="Özel Alanlar">
          <div className="space-y-2">
            {Object.entries(lead.custom_fields).map(([key, value]) => (
              <div key={key} className="flex items-start gap-2">
                <span className="text-xs text-gray-500 shrink-0">{key}:</span>
                <span className="text-sm text-gray-900">{String(value)}</span>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

// ============================================
// Activities Tab
// ============================================
function ActivitiesTab({ leadId }: { leadId: string }) {
  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchActivities() {
      setLoading(true);
      try {
        const res = await fetch(`/api/leads/${leadId}/activities`);
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) setActivities(Array.isArray(data) ? data : data.data || []);
        }
      } catch (err) {
        console.error('Failed to fetch activities:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchActivities();
    return () => { cancelled = true; };
  }, [leadId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size="md" />
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Clock className="h-10 w-10 text-gray-300 mb-3" />
        <p className="text-sm font-medium text-gray-500">Henüz aktivite yok</p>
        <p className="text-xs text-gray-400 mt-1">Bu lead için henüz bir aktivite kaydedilmedi.</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="relative">
        {/* Vertical timeline line */}
        <div className="absolute left-4 top-2 bottom-2 w-px bg-gray-200" />

        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="relative flex gap-3 pl-1">
              {/* Circle icon */}
              <div
                className={cn(
                  'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                  activityColorMap[activity.activity_type] || 'bg-gray-100 text-gray-500'
                )}
              >
                {activityIconMap[activity.activity_type] || <Clock className="h-3.5 w-3.5" />}
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1 pt-0.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                    {activity.description && (
                      <p className="text-xs text-gray-500 mt-0.5">{activity.description}</p>
                    )}
                  </div>
                  <span className="shrink-0 text-xs text-gray-400">
                    {formatRelativeTime(activity.created_at)}
                  </span>
                </div>
                {activity.user && (
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <Avatar
                      src={activity.user.avatar_url}
                      name={activity.user.full_name}
                      size="xs"
                    />
                    <span className="text-xs text-gray-500">{activity.user.full_name}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================
// Notes Tab
// ============================================
function NotesTab({ leadId }: { leadId: string }) {
  const [notes, setNotes] = useState<LeadNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchNotes = useCallback(async () => {
    try {
      const res = await fetch(`/api/leads/${leadId}/notes`);
      if (res.ok) {
        const data = await res.json();
        setNotes(Array.isArray(data) ? data : data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch notes:', err);
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    setLoading(true);
    fetchNotes();
  }, [fetchNotes]);

  const handleAddNote = async () => {
    const content = newNote.trim();
    if (!content) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/leads/${leadId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        setNewNote('');
        fetchNotes();
      }
    } catch (err) {
      console.error('Failed to add note:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size="md" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Notes List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <MessageSquare className="h-10 w-10 text-gray-300 mb-3" />
            <p className="text-sm font-medium text-gray-500">Henüz not yok</p>
            <p className="text-xs text-gray-400 mt-1">Bu lead için ilk notu siz ekleyin.</p>
          </div>
        ) : (
          notes.map((note) => (
            <div key={note.id} className="rounded-lg border border-gray-100 bg-gray-50/50 p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Avatar
                    src={note.user?.avatar_url}
                    name={note.user?.full_name || 'Sistem'}
                    size="xs"
                  />
                  <span className="text-xs font-medium text-gray-700">
                    {note.user?.full_name || 'Sistem'}
                  </span>
                </div>
                <span className="text-xs text-gray-400">
                  {formatRelativeTime(note.created_at)}
                </span>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.content}</p>
            </div>
          ))
        )}
      </div>

      {/* Add Note */}
      <div className="border-t border-gray-200 p-4 bg-white">
        <textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Not ekle..."
          rows={3}
          className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              handleAddNote();
            }
          }}
        />
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-gray-400">Cmd+Enter ile gonder</span>
          <Button
            size="sm"
            onClick={handleAddNote}
            loading={submitting}
            disabled={!newNote.trim()}
            icon={<Send className="h-3.5 w-3.5" />}
          >
            Not Ekle
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Lead Detail Drawer
// ============================================
export interface LeadDetailDrawerProps {
  onDelete?: (leadId: string) => void;
  onEdit?: (leadId: string) => void;
}

export function LeadDetailDrawer({ onDelete, onEdit }: LeadDetailDrawerProps) {
  const { leads, activeLeadId, setActiveLeadId, drawerOpen, setDrawerOpen } = useAppStore();
  const [activeTab, setActiveTab] = useState('detail');

  const lead = leads.find((l) => l.id === activeLeadId);

  const handleClose = useCallback(() => {
    setActiveLeadId(null);
    setDrawerOpen(false);
  }, [setActiveLeadId, setDrawerOpen]);

  // Close on ESC
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') handleClose();
    }
    if (drawerOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [drawerOpen, handleClose]);

  // Reset tab when opening new lead
  useEffect(() => {
    if (activeLeadId) setActiveTab('detail');
  }, [activeLeadId]);

  if (!drawerOpen || !lead) return null;

  const tabItems = [
    { key: 'detail', label: 'Detay' },
    { key: 'activities', label: 'Aktiviteler' },
    { key: 'notes', label: 'Notlar' },
  ];

  return (
    <>
      {/* Overlay */}
      <div
        className="drawer-overlay fixed inset-0 z-50 bg-black/20 backdrop-blur-[2px] transition-opacity"
        onClick={handleClose}
      />

      {/* Drawer */}
      <div
        className={cn(
          'fixed right-0 top-0 z-50 flex h-full w-full max-w-[480px] flex-col bg-white shadow-2xl',
          'transform transition-transform duration-300 ease-out',
          drawerOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar
              name={lead.full_name || 'Lead'}
              src={null}
              size="md"
            />
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-gray-900 truncate">
                {lead.full_name || 'İsimsiz Lead'}
              </h2>
              {lead.company && (
                <p className="text-xs text-gray-500 truncate">{lead.company}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Dropdown
              trigger={
                <button
                  type="button"
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                >
                  <MoreHorizontal className="h-5 w-5" />
                </button>
              }
              items={[
                {
                  key: 'edit',
                  label: 'Düzenle',
                  icon: <Edit3 className="h-4 w-4" />,
                  onClick: () => onEdit?.(lead.id),
                },
                {
                  key: 'delete',
                  label: 'Sil',
                  icon: <Trash2 className="h-4 w-4" />,
                  danger: true,
                  onClick: () => onDelete?.(lead.id),
                },
              ]}
              align="right"
            />
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-4 pt-2">
          <Tabs items={tabItems} activeKey={activeTab} onChange={setActiveTab} />
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'detail' && <DetailTab lead={lead} />}
          {activeTab === 'activities' && <ActivitiesTab leadId={lead.id} />}
          {activeTab === 'notes' && <NotesTab leadId={lead.id} />}
        </div>
      </div>
    </>
  );
}
