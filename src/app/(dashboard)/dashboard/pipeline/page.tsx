'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical,
  Phone,
  Building2,
  BarChart3,
  Users,
  TrendingUp,
  Target,
  Layers,
} from 'lucide-react';
import { cn, formatRelativeTime, getSourceColor, getScoreColor, getInitials } from '@/lib/utils';
import { useAppStore } from '@/lib/store';
import { SOURCE_PLATFORM_LABELS } from '@/lib/types';
import type { Lead, CrmStage } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Spinner } from '@/components/ui/loading';
import { LeadDetailDrawer } from '@/components/leads/lead-detail-drawer';
import { useTranslations } from 'next-intl';

// ============================================
// Lead Card (Sortable)
// ============================================
interface LeadCardProps {
  lead: Lead;
  onClick: () => void;
  isDragging?: boolean;
}

function LeadCardContent({ lead, onClick, isDragging }: LeadCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'group cursor-pointer rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition-all',
        'hover:border-gray-300 hover:shadow-md',
        isDragging && 'shadow-lg ring-2 ring-indigo-500/20 opacity-90'
      )}
    >
      {/* Name & Score */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {lead.full_name || 'Isimsiz Lead'}
          </p>
          {lead.company && (
            <div className="flex items-center gap-1 mt-0.5">
              <Building2 className="h-3 w-3 text-gray-400 shrink-0" />
              <p className="text-xs text-gray-500 truncate">{lead.company}</p>
            </div>
          )}
        </div>
        <span
          className={cn(
            'shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold',
            getScoreColor(lead.score)
          )}
        >
          {lead.score}
        </span>
      </div>

      {/* Phone */}
      {lead.phone && (
        <div className="flex items-center gap-1.5 mb-2">
          <Phone className="h-3 w-3 text-gray-400 shrink-0" />
          <span className="text-xs text-gray-600 truncate">{lead.phone}</span>
        </div>
      )}

      {/* Footer: platform + assigned + time */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100">
        <div className="flex items-center gap-2">
          {/* Platform dot */}
          <span
            className="h-2.5 w-2.5 rounded-full shrink-0"
            style={{ backgroundColor: getSourceColor(lead.source_platform) }}
            title={SOURCE_PLATFORM_LABELS[lead.source_platform]}
          />
          {/* Assigned avatar */}
          {lead.assigned_user && (
            <Avatar
              src={lead.assigned_user.avatar_url}
              name={lead.assigned_user.full_name}
              size="xs"
            />
          )}
        </div>
        {lead.last_activity_at && (
          <span className="text-[10px] text-gray-400 shrink-0">
            {formatRelativeTime(lead.last_activity_at)}
          </span>
        )}
      </div>
    </div>
  );
}

function SortableLeadCard({ lead, onClick }: { lead: Lead; onClick: () => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id, data: { type: 'lead', lead } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <LeadCardContent lead={lead} onClick={onClick} isDragging={isDragging} />
    </div>
  );
}

// ============================================
// Stage Column
// ============================================
interface StageColumnProps {
  stage: CrmStage;
  leads: Lead[];
  onLeadClick: (leadId: string) => void;
}

function StageColumn({ stage, leads, onLeadClick }: StageColumnProps) {
  const leadIds = useMemo(() => leads.map((l) => l.id), [leads]);

  const headerBg = stage.is_won
    ? 'bg-green-50 border-green-200'
    : stage.is_lost
    ? 'bg-red-50 border-red-200'
    : 'bg-white border-gray-200';

  const dotColor = stage.color || '#6b7280';

  return (
    <div className="flex h-full w-[280px] shrink-0 flex-col rounded-xl border border-gray-200 bg-gray-50/70">
      {/* Column Header */}
      <div className={cn('flex items-center justify-between rounded-t-xl border-b px-3 py-2.5', headerBg)}>
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="h-2.5 w-2.5 rounded-full shrink-0"
            style={{ backgroundColor: dotColor }}
          />
          <h3 className="text-sm font-semibold text-gray-800 truncate">{stage.name}</h3>
        </div>
        <span className="shrink-0 inline-flex items-center justify-center rounded-full bg-white px-2 py-0.5 text-xs font-medium text-gray-600 shadow-sm border border-gray-200">
          {leads.length}
        </span>
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        <SortableContext items={leadIds} strategy={verticalListSortingStrategy}>
          {leads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Layers className="h-8 w-8 text-gray-300 mb-2" />
              <p className="text-xs text-gray-400">Bu aşamada lead yok</p>
            </div>
          ) : (
            leads.map((lead) => (
              <SortableLeadCard
                key={lead.id}
                lead={lead}
                onClick={() => onLeadClick(lead.id)}
              />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
}

// ============================================
// Pipeline Page
// ============================================
export default function PipelinePage() {
  const {
    leads,
    setLeads,
    updateLead,
    stages,
    setStages,
    setActiveLeadId,
  } = useAppStore();

  const [loading, setLoading] = useState(true);
  const [activeDragLead, setActiveDragLead] = useState<Lead | null>(null);

  // Fetch leads and stages
  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      setLoading(true);
      try {
        const [leadsRes, stagesRes] = await Promise.all([
          fetch('/api/leads'),
          fetch('/api/stages'),
        ]);

        if (leadsRes.ok) {
          const leadsData = await leadsRes.json();
          if (!cancelled) setLeads(Array.isArray(leadsData) ? leadsData : leadsData.data || []);
        }
        if (stagesRes.ok) {
          const stagesData = await stagesRes.json();
          if (!cancelled) setStages(Array.isArray(stagesData) ? stagesData : stagesData.data || []);
        }
      } catch (err) {
        console.error('Pipeline data fetch failed:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, [setLeads, setStages]);

  // Sorted stages
  const sortedStages = useMemo(
    () => [...stages].sort((a, b) => a.position - b.position),
    [stages]
  );

  // Group leads by stage
  const leadsByStage = useMemo(() => {
    const map: Record<string, Lead[]> = {};
    for (const stage of sortedStages) {
      map[stage.id] = [];
    }
    // Also create an "unassigned" bucket
    map['__no_stage__'] = [];
    for (const lead of leads) {
      const key = lead.stage_id || '__no_stage__';
      if (map[key]) {
        map[key].push(lead);
      } else {
        map['__no_stage__'].push(lead);
      }
    }
    return map;
  }, [leads, sortedStages]);

  // Stats
  const stats = useMemo(() => {
    const total = leads.length;
    const wonCount = leads.filter((l) => {
      const stage = stages.find((s) => s.id === l.stage_id);
      return stage?.is_won;
    }).length;
    const conversionRate = total > 0 ? ((wonCount / total) * 100).toFixed(1) : '0';
    const avgScore = total > 0 ? Math.round(leads.reduce((sum, l) => sum + l.score, 0) / total) : 0;
    return { total, wonCount, conversionRate, avgScore };
  }, [leads, stages]);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const lead = leads.find((l) => l.id === event.active.id);
      if (lead) setActiveDragLead(lead);
    },
    [leads]
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      setActiveDragLead(null);

      const { active, over } = event;
      if (!over) return;

      const leadId = active.id as string;
      const lead = leads.find((l) => l.id === leadId);
      if (!lead) return;

      // Determine target stage
      let targetStageId: string | null = null;

      // Check if dropped over a stage column (the over.id might be a lead or a stage)
      const overData = over.data?.current as Record<string, unknown> | undefined;

      if (overData?.type === 'lead') {
        // Dropped over another lead, find that lead's stage
        const overLead = leads.find((l) => l.id === over.id);
        if (overLead) targetStageId = overLead.stage_id;
      } else {
        // Dropped over a stage column or container
        // Check if over.id matches a stage
        const matchedStage = stages.find((s) => s.id === over.id);
        if (matchedStage) {
          targetStageId = matchedStage.id;
        } else {
          // over.id might be a lead in a different column
          const overLead = leads.find((l) => l.id === over.id);
          if (overLead) targetStageId = overLead.stage_id;
        }
      }

      if (!targetStageId || targetStageId === lead.stage_id) return;

      // Optimistic update
      const updatedStage = stages.find((s) => s.id === targetStageId);
      updateLead(leadId, { stage_id: targetStageId, stage: updatedStage });

      // Persist
      try {
        const res = await fetch(`/api/leads/${leadId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stage_id: targetStageId }),
        });
        if (!res.ok) {
          // Revert on failure
          updateLead(leadId, { stage_id: lead.stage_id, stage: lead.stage });
          console.error('Failed to update lead stage');
        }
      } catch (err) {
        updateLead(leadId, { stage_id: lead.stage_id, stage: lead.stage });
        console.error('Failed to update lead stage:', err);
      }
    },
    [leads, stages, updateLead]
  );

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      // We use closestCorners strategy, so DragOver handles cross-container detection
    },
    []
  );

  const handleLeadClick = useCallback(
    (leadId: string) => {
      setActiveLeadId(leadId);
    },
    [setActiveLeadId]
  );

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Spinner size="lg" />
          <p className="text-sm text-gray-500">Pipeline yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Top Stats Bar */}
      <div className="shrink-0 border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-gray-900">Pipeline</h1>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50">
              <Users className="h-4.5 w-4.5 text-indigo-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Toplam Lead</p>
              <p className="text-lg font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-50">
              <TrendingUp className="h-4.5 w-4.5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Kazanılan</p>
              <p className="text-lg font-bold text-gray-900">{stats.wonCount}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
              <Target className="h-4.5 w-4.5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Dönüşüm Oranı</p>
              <p className="text-lg font-bold text-gray-900">%{stats.conversionRate}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50">
              <BarChart3 className="h-4.5 w-4.5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Ort. Skor</p>
              <p className="text-lg font-bold text-gray-900">{stats.avgScore}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
        >
          <div className="flex h-full gap-3 p-4">
            {sortedStages.map((stage) => (
              <StageColumn
                key={stage.id}
                stage={stage}
                leads={leadsByStage[stage.id] || []}
                onLeadClick={handleLeadClick}
              />
            ))}

            {/* Unassigned stage column */}
            {(leadsByStage['__no_stage__'] || []).length > 0 && (
              <StageColumn
                key="__no_stage__"
                stage={{
                  id: '__no_stage__',
                  organization_id: '',
                  name: 'Aşamasız',
                  slug: 'no-stage',
                  color: '#9ca3af',
                  position: 999,
                  is_won: false,
                  is_lost: false,
                  created_at: '',
                }}
                leads={leadsByStage['__no_stage__'] || []}
                onLeadClick={handleLeadClick}
              />
            )}
          </div>

          {/* Drag overlay for smooth animation */}
          <DragOverlay>
            {activeDragLead ? (
              <div className="w-[260px]">
                <LeadCardContent
                  lead={activeDragLead}
                  onClick={() => {}}
                  isDragging
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Lead Detail Drawer */}
      <LeadDetailDrawer />
    </div>
  );
}
