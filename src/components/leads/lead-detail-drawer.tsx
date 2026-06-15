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
  PhoneCall,
} from 'lucide-react';
import { cn, formatRelativeTime, getSourceColor, getScoreColor, getInitials } from '@/lib/utils';
import { useAppStore } from '@/lib/store';
import type { Lead, LeadActivity, LeadNote, ActivityType, CrmStage } from '@/lib/types';
import { SOURCE_PLATFORM_LABELS } from '@/lib/types';
import { useTranslations, useLocale } from 'next-intl';
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
  email_sent: 'bg-emerald-100 text-emerald-600',
  call_made: 'bg-purple-100 text-purple-600',
  assigned: 'bg-cyan-100 text-cyan-600',
  tag_added: 'bg-pink-100 text-pink-600',
  tag_removed: 'bg-gray-100 text-gray-600',
  merged: 'bg-orange-100 text-orange-600',
  imported: 'bg-amber-100 text-amber-600',
  edited: 'bg-slate-100 text-slate-600',
  score_changed: 'bg-emerald-100 text-emerald-600',
};

// Arama aktivitesinin metadata.outcome değerini çeviri anahtarına eşler
const CALL_OUTCOME_LABEL_KEY: Record<string, string> = {
  reached: 'callReached',
  no_answer: 'callNoAnswer',
  busy: 'callBusy',
  wrong_number: 'callWrong',
};
const KNOWN_ACTIVITY_TYPES = new Set<ActivityType>([
  'created', 'stage_change', 'note_added', 'email_sent', 'call_made', 'assigned',
  'tag_added', 'tag_removed', 'merged', 'imported', 'edited', 'score_changed',
]);

// Özel alan anahtarlarını okunur etikete çevirir. Meta form alanları çoğunlukla
// diyakritiksiz/küçük harf gelir (amac, butce…); bilinenler haritadan, gerisi
// genel biçimleme ile (alt çizgi/tire → boşluk, baş harfler büyük).
const CUSTOM_FIELD_LABELS: Record<string, string> = {
  amac: 'Amaç', butce: 'Bütçe', konum: 'Konum', zaman: 'Zaman', sure: 'Süre',
  ad: 'Ad', soyad: 'Soyad', isim: 'İsim', telefon: 'Telefon', email: 'E-posta',
  eposta: 'E-posta', adres: 'Adres', sehir: 'Şehir', il: 'İl', ilce: 'İlçe',
  meslek: 'Meslek', firma: 'Firma', sirket: 'Şirket', mesaj: 'Mesaj', not: 'Not',
};
function prettifyFieldKey(key: string): string {
  const k = key.toLowerCase().trim();
  if (CUSTOM_FIELD_LABELS[k]) return CUSTOM_FIELD_LABELS[k];
  return key
    .replace(/[_-]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((w) => w.charAt(0).toLocaleUpperCase('tr') + w.slice(1))
    .join(' ');
}

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

  const tD = useTranslations('leads');
  return (
    <button
      type="button"
      onClick={handleCopy}
      className="ml-1.5 inline-flex items-center rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
      title={tD('drawer.copy')}
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
// Contact Outcome Section
// ============================================
const OUTCOME_KEYS = ['reached', 'no_answer', 'busy', 'wrong_number'] as const;
type ContactOutcome = (typeof OUTCOME_KEYS)[number];

function ContactSection({ lead }: { lead: Lead }) {
  const t = useTranslations('leads.drawer.contact');
  const { updateLead } = useAppStore();
  const [logging, setLogging] = useState<ContactOutcome | null>(null);

  const outcomeLabel: Record<ContactOutcome, string> = {
    reached: t('outcomeReached'),
    no_answer: t('outcomeNoAnswer'),
    busy: t('outcomeBusy'),
    wrong_number: t('outcomeWrong'),
  };

  const outcomeColor: Record<ContactOutcome, string> = {
    reached: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 active:bg-emerald-200',
    no_answer: 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100 active:bg-yellow-200',
    busy: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100 active:bg-orange-200',
    wrong_number: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100 active:bg-red-200',
  };

  const handleLogOutcome = async (outcome: ContactOutcome) => {
    setLogging(outcome);
    try {
      const res = await fetch(`/api/leads/${lead.id}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outcome }),
      });
      if (res.ok) {
        const data = await res.json();
        const l = data.lead;
        updateLead(lead.id, {
          contact_attempts: l.contact_attempts,
          last_contact_at: l.last_contact_at,
          first_contact_at: l.first_contact_at,
          contact_outcome: l.contact_outcome,
          last_activity_at: l.last_activity_at,
        });
      }
    } catch (err) {
      console.error('Contact log failed:', err);
    } finally {
      setLogging(null);
    }
  };

  // Speed-to-lead: diff between assigned_at and first_contact_at
  const speedToLead = (() => {
    if (!lead.assigned_at || !lead.first_contact_at) return null;
    const diffMs =
      new Date(lead.first_contact_at).getTime() - new Date(lead.assigned_at).getTime();
    if (diffMs < 0) return null;
    const totalSec = Math.floor(diffMs / 1000);
    if (totalSec < 60) return `${totalSec}s`;
    const mins = Math.floor(totalSec / 60);
    if (mins < 60) return `${mins}dk`;
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return remMins > 0 ? `${hrs}sa ${remMins}dk` : `${hrs}sa`;
  })();

  return (
    <Section title={t('callResult')}>
      {/* Outcome buttons */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {OUTCOME_KEYS.map((outcome) => {
          // Tekli seçim: yalnızca kayıtlı sonuç (lead.contact_outcome) renkli/vurgulu,
          // diğerleri sönük. Tıklama sonucu değiştirir ve bir arama denemesi kaydeder.
          const isSelected = lead.contact_outcome === outcome;
          return (
            <button
              key={outcome}
              type="button"
              disabled={logging !== null}
              onClick={() => handleLogOutcome(outcome)}
              aria-pressed={isSelected}
              className={cn(
                'inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 disabled:cursor-not-allowed',
                isSelected
                  ? cn(outcomeColor[outcome], 'font-semibold shadow-sm')
                  : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700',
                logging !== null && logging !== outcome && 'opacity-50',
                logging === outcome && 'opacity-80 cursor-wait'
              )}
            >
              {logging === outcome ? (
                <span className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
              ) : isSelected ? (
                <Check className="h-3 w-3" />
              ) : (
                <PhoneCall className="h-3 w-3" />
              )}
              {outcomeLabel[outcome]}
            </button>
          );
        })}
      </div>

      {/* Stats row */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
        {typeof lead.contact_attempts === 'number' && lead.contact_attempts > 0 && (
          <span>
            {t('attempts')}:{' '}
            <span className="font-semibold text-gray-700">{lead.contact_attempts}</span>
          </span>
        )}
        {speedToLead && (
          <span>
            {t('firstCallAfter')}:{' '}
            <span className="font-semibold text-gray-700">{speedToLead}</span>
          </span>
        )}
      </div>
    </Section>
  );
}

// ============================================
// Detail Tab
// ============================================
function DetailTab({ lead }: { lead: Lead }) {
  const t = useTranslations('leads');
  const tR = useTranslations('routing');
  const { stages, members, updateLead } = useAppStore();
  const [tagInput, setTagInput] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  const [runningRules, setRunningRules] = useState(false);

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

  const handleRunRules = async () => {
    setRunningRules(true);
    try {
      const res = await fetch(`/api/leads/${lead.id}/route-rules`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        const result = data?.result ?? {};
        updateLead(lead.id, {
          routing_status: result.status ?? lead.routing_status,
          ...(result.assigneeId ? { assigned_to: result.assigneeId } : {}),
        });
      }
    } catch (err) {
      console.error('Run rules failed:', err);
    } finally {
      setRunningRules(false);
    }
  };

  const routingStatusConfig: Record<string, { label: string; color: 'green' | 'red' | 'gray' | 'yellow' }> = {
    sent: { label: tR('statusSent'), color: 'green' },
    failed: { label: tR('statusFailed'), color: 'red' },
    no_match: { label: tR('statusNoMatch'), color: 'gray' },
    skipped: { label: tR('statusSkipped'), color: 'gray' },
  };

  const currentStage = lead.stage || stages.find((s) => s.id === lead.stage_id);

  return (
    <div className="p-4 space-y-0 overflow-y-auto">
      {/* Contact Info */}
      <Section title={t('drawer.contactInfo')}>
        <InfoRow icon={<Phone className="h-4 w-4" />} label={t('drawer.phone')} value={lead.phone} copyable />
        <InfoRow icon={<Mail className="h-4 w-4" />} label={t('drawer.email')} value={lead.email} copyable />
        <InfoRow icon={<Building2 className="h-4 w-4" />} label={t('drawer.company')} value={lead.company} />
        <InfoRow icon={<Briefcase className="h-4 w-4" />} label={t('drawer.jobTitle')} value={lead.job_title} />
        <InfoRow icon={<MapPin className="h-4 w-4" />} label={t('drawer.city')} value={lead.city} />
        <InfoRow icon={<Globe className="h-4 w-4" />} label={t('drawer.country')} value={lead.country} />
      </Section>

      {/* Contact Outcome / Accountability */}
      {lead.phone && <ContactSection lead={lead} />}

      {/* CRM Section */}
      <Section title={t('drawer.crm')}>
        <div className="space-y-3">
          {/* Stage */}
          <div>
            <p className="text-xs text-gray-500 mb-1">{t('drawer.stage')}</p>
            <select
              value={lead.stage_id || ''}
              onChange={(e) => handleStageChange(e.target.value)}
              className="block w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="">{t('drawer.stageSelect')}</option>
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
            <p className="text-xs text-gray-500 mb-1">{t('drawer.score')}</p>
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
            <p className="text-xs text-gray-500 mb-1">{t('drawer.assignee')}</p>
            <select
              value={lead.assigned_to || ''}
              onChange={(e) => handleAssignChange(e.target.value)}
              className="block w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="">{t('drawer.unassigned')}</option>
              {members.map((m) => (
                <option key={m.user_id} value={m.user_id}>
                  {m.profile?.full_name || m.user_id}
                </option>
              ))}
            </select>
          </div>

          {/* Routing — Run / Resend */}
          <div>
            <p className="text-xs text-gray-500 mb-1.5">{tR('rulesTitle')}</p>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={handleRunRules}
                loading={runningRules}
                disabled={runningRules}
                icon={<Send className="h-3.5 w-3.5" />}
              >
                {runningRules
                  ? tR('running')
                  : lead.routing_status === 'sent' || lead.routing_status === 'failed'
                  ? tR('resend')
                  : tR('runRules')}
              </Button>
              {lead.routing_status && routingStatusConfig[lead.routing_status] && (
                <Badge
                  color={routingStatusConfig[lead.routing_status].color}
                  size="sm"
                >
                  {routingStatusConfig[lead.routing_status].label}
                </Badge>
              )}
              {lead.routing_status && !routingStatusConfig[lead.routing_status] && (
                <Badge color="yellow" size="sm">
                  {tR('statusPending')}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </Section>

      {/* Source Section */}
      <Section title={t('drawer.source')}>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">{t('drawer.platform')}</span>
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
              <span className="text-xs text-gray-500 shrink-0">{t('drawer.campaign')}</span>
              <span className="text-sm text-gray-900">{lead.campaign_name}</span>
            </div>
          )}
          {lead.ad_set_name && (
            <div className="flex items-start gap-2">
              <span className="text-xs text-gray-500 shrink-0">{t('drawer.adSet')}</span>
              <span className="text-sm text-gray-900">{lead.ad_set_name}</span>
            </div>
          )}
          {lead.ad_name && (
            <div className="flex items-start gap-2">
              <span className="text-xs text-gray-500 shrink-0">{t('drawer.ad')}</span>
              <span className="text-sm text-gray-900">{lead.ad_name}</span>
            </div>
          )}
          {lead.form_name && (
            <div className="flex items-start gap-2">
              <span className="text-xs text-gray-500 shrink-0">{t('drawer.form')}</span>
              <span className="text-sm text-gray-900">{lead.form_name}</span>
            </div>
          )}
          {lead.meta_lead_id && (
            <div className="flex items-start gap-2">
              <span className="text-xs text-gray-500 shrink-0">{t('leadId')}</span>
              <span className="text-xs text-gray-500 font-mono">{lead.meta_lead_id}</span>
            </div>
          )}
        </div>
      </Section>

      {/* UTM Section (Collapsible) */}
      {(lead.utm_source || lead.utm_medium || lead.utm_campaign || lead.utm_content || lead.utm_term) && (
        <CollapsibleSection title={t('drawer.utmParams')}>
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
      <Section title={t('drawer.tags')}>
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
                placeholder={t('fields.tagPlaceholder')}
                autoFocus
                className="h-6 w-28 rounded border border-gray-300 px-2 text-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/20"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="inline-flex h-6 items-center rounded bg-emerald-500 px-2 text-xs text-white hover:bg-emerald-600"
              >
                {t('fields.tagAdd')}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowTagInput(true)}
              className="inline-flex items-center gap-1 rounded-full border border-dashed border-gray-300 px-2.5 py-0.5 text-xs text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors"
            >
              <Plus className="h-3 w-3" />
              {t('fields.tag')}
            </button>
          )}
        </div>
      </Section>

      {/* Custom Fields */}
      {lead.custom_fields && Object.keys(lead.custom_fields).length > 0 && (
        <Section title={t('drawer.customFields')}>
          <div className="space-y-2">
            {Object.entries(lead.custom_fields).map(([key, value]) => (
              <div key={key} className="flex items-baseline gap-2">
                <span className="shrink-0 text-xs font-medium text-gray-500">{prettifyFieldKey(key)}:</span>
                <span className="break-words text-sm text-gray-900">{String(value)}</span>
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
  const t = useTranslations('leads');
  const locale = useLocale();
  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const [loading, setLoading] = useState(true);

  // Aktivite başlığını makine değeri yerine kullanıcının diline çevirir (TR/EN).
  // Arama aktiviteleri metadata.outcome'a göre etiketlenir; bilinen tipler çeviri
  // anahtarından gelir, bilinmeyenler ham title'a düşer.
  const activityTitle = (activity: LeadActivity): string => {
    const type = activity.activity_type;
    if (type === 'call_made') {
      const outcome = (activity.metadata as { outcome?: string } | null)?.outcome;
      const key = outcome ? CALL_OUTCOME_LABEL_KEY[outcome] : undefined;
      return t(`drawer.activityLabels.${key ?? 'call_made'}` as Parameters<typeof t>[0]);
    }
    if (KNOWN_ACTIVITY_TYPES.has(type)) {
      return t(`drawer.activityLabels.${type}` as Parameters<typeof t>[0]);
    }
    return activity.title;
  };

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
        <p className="text-sm font-medium text-gray-500">{t('drawer.noActivities')}</p>
        <p className="text-xs text-gray-400 mt-1">{t('drawer.noActivitiesDesc')}</p>
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
                    <p className="text-sm font-medium text-gray-900">{activityTitle(activity)}</p>
                    {activity.description && (
                      <p className="text-xs text-gray-500 mt-0.5">{activity.description}</p>
                    )}
                  </div>
                  <span className="shrink-0 text-xs text-gray-400">
                    {formatRelativeTime(activity.created_at, locale)}
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
  const t = useTranslations('leads');
  const locale = useLocale();
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
            <p className="text-sm font-medium text-gray-500">{t('drawer.noNotes')}</p>
            <p className="text-xs text-gray-400 mt-1">{t('drawer.noNotesDesc')}</p>
          </div>
        ) : (
          notes.map((note) => (
            <div key={note.id} className="rounded-lg border border-gray-100 bg-gray-50/50 p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Avatar
                    src={note.user?.avatar_url}
                    name={note.user?.full_name || 'System'}
                    size="xs"
                  />
                  <span className="text-xs font-medium text-gray-700">
                    {note.user?.full_name || 'System'}
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
          placeholder={t('drawer.notePlaceholder')}
          rows={3}
          className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              handleAddNote();
            }
          }}
        />
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-gray-400">{t('drawer.noteSendHint')}</span>
          <Button
            size="sm"
            onClick={handleAddNote}
            loading={submitting}
            disabled={!newNote.trim()}
            icon={<Send className="h-3.5 w-3.5" />}
          >
            {t('drawer.noteAdd')}
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
  const t = useTranslations('leads');
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
    { key: 'detail', label: t('drawer.tabs.detail') },
    { key: 'activities', label: t('drawer.tabs.activities') },
    { key: 'notes', label: t('drawer.tabs.notes') },
  ];

  return (
    <>
      {/* Overlay */}
      <div
        className="drawer-overlay fixed inset-0 z-50 bg-black/20 backdrop-blur-[2px] transition-opacity"
        onClick={handleClose}
      />

      {/* Drawer — full-width on mobile, max 480px on md+ */}
      <div
        className={cn(
          'fixed right-0 top-0 z-50 flex h-full w-full md:max-w-[480px] flex-col bg-white shadow-2xl',
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
                {lead.full_name || t('namelessLead')}
              </h2>
              {lead.company && (
                <p className="text-xs text-gray-500 truncate">{lead.company}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Ara (Call) button — shown when phone exists */}
            {lead.phone && (
              <a
                href={`tel:${lead.phone}`}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700 active:bg-emerald-800 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                title={lead.phone}
              >
                <Phone className="h-4 w-4" />
                <span>{t('drawer.call')}</span>
              </a>
            )}
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
                  label: t('gridActions.edit'),
                  icon: <Edit3 className="h-4 w-4" />,
                  onClick: () => onEdit?.(lead.id),
                },
                {
                  key: 'delete',
                  label: t('delete'),
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
