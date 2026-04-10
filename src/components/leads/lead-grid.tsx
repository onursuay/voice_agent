'use client';

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { ArrowUp, ArrowDown, ArrowUpDown, X, Trash2, ExternalLink, Copy, ChevronDown } from 'lucide-react';
import { cn, formatRelativeTime, getSourceColor, getScoreColor, getInitials } from '@/lib/utils';
import { useAppStore } from '@/lib/store';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import type { Lead, ColumnDef, SortConfig, CrmStage, LeadSourcePlatform } from '@/lib/types';
import { SOURCE_PLATFORM_LABELS } from '@/lib/types';

// ── Column Definitions ──────────────────────────────────

export const LEAD_COLUMNS: ColumnDef[] = [
  { key: '_select', label: '', type: 'text', sortable: false, filterable: false, editable: false, width: 40 },
  { key: '_row_num', label: '#', type: 'text', sortable: false, filterable: false, editable: false, width: 40 },
  { key: 'full_name', label: 'Ad Soyad', type: 'text', sortable: true, filterable: true, editable: true, width: 200 },
  { key: 'phone', label: 'Telefon', type: 'phone', sortable: true, filterable: true, editable: true, width: 140 },
  { key: 'email', label: 'E-posta', type: 'email', sortable: true, filterable: true, editable: true, width: 200 },
  { key: 'source_platform', label: 'Kaynak', type: 'platform', sortable: true, filterable: true, editable: true, width: 130 },
  { key: 'stage', label: 'Aşama', type: 'stage', sortable: true, filterable: true, editable: true, width: 150 },
  { key: 'score', label: 'Skor', type: 'number', sortable: true, filterable: true, editable: true, width: 80 },
  { key: 'assigned_to', label: 'Atanan', type: 'user', sortable: true, filterable: true, editable: true, width: 140 },
  { key: 'campaign_name', label: 'Kampanya', type: 'text', sortable: true, filterable: true, editable: true, width: 150 },
  { key: 'city', label: 'Sehir', type: 'text', sortable: true, filterable: true, editable: true, width: 120 },
  { key: 'company', label: 'Sirket', type: 'text', sortable: true, filterable: true, editable: true, width: 140 },
  { key: 'tags', label: 'Etiketler', type: 'tags', sortable: false, filterable: true, editable: true, width: 180 },
  { key: 'first_seen_at', label: 'Ilk Gorulme', type: 'date', sortable: true, filterable: false, editable: false, width: 130 },
  { key: 'last_activity_at', label: 'Son Aktivite', type: 'date', sortable: true, filterable: false, editable: false, width: 130 },
];

// ── Helpers ─────────────────────────────────────────────

function getStageBadgeColor(color: string): 'gray' | 'blue' | 'green' | 'red' | 'yellow' | 'indigo' | 'purple' | 'pink' {
  const map: Record<string, 'gray' | 'blue' | 'green' | 'red' | 'yellow' | 'indigo' | 'purple' | 'pink'> = {
    '#6b7280': 'gray', '#3b82f6': 'blue', '#22c55e': 'green', '#ef4444': 'red',
    '#eab308': 'yellow', '#6366f1': 'indigo', '#a855f7': 'purple', '#ec4899': 'pink',
  };
  if (map[color]) return map[color];
  const lc = color.toLowerCase();
  if (lc.includes('green') || lc.includes('22c') || lc.includes('10b')) return 'green';
  if (lc.includes('blue') || lc.includes('3b8') || lc.includes('2563')) return 'blue';
  if (lc.includes('red') || lc.includes('ef4') || lc.includes('dc2')) return 'red';
  if (lc.includes('yellow') || lc.includes('eab') || lc.includes('f59')) return 'yellow';
  if (lc.includes('indigo') || lc.includes('636') || lc.includes('4f4')) return 'indigo';
  if (lc.includes('purple') || lc.includes('a855') || lc.includes('8b5')) return 'purple';
  if (lc.includes('pink') || lc.includes('ec48')) return 'pink';
  return 'gray';
}

function generateId(): string {
  return `lead_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

// Cell address: row index (lead index or -1 for new row) + column key
type CellAddress = { row: number; col: string } | null;

function cellEq(a: CellAddress, b: CellAddress): boolean {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return a.row === b.row && a.col === b.col;
}

// ── Saved indicator toast ───────────────────────────────

function SavedToast({ show }: { show: boolean }) {
  return (
    <div
      className={cn(
        'pointer-events-none fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-lg transition-all duration-300',
        show ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      )}
    >
      <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
      Kaydedildi
    </div>
  );
}

// ── Context Menu ────────────────────────────────────────

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onCopy: () => void;
  onStageChange: () => void;
  onOpenDrawer: () => void;
}

function ContextMenu({ x, y, onClose, onEdit, onDelete, onCopy, onStageChange, onOpenDrawer }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="fixed z-50 min-w-[180px] rounded-lg border border-gray-200 bg-white py-1 shadow-xl"
      style={{ left: x, top: y }}
    >
      {[
        { label: 'Duzenle', icon: '✏️', action: onEdit },
        { label: 'Ac', icon: '📄', action: onOpenDrawer },
        { label: 'Kopyala', icon: '📋', action: onCopy },
        { label: 'Aşama Değiştir', icon: '🔄', action: onStageChange },
        { label: 'Sil', icon: '🗑️', action: onDelete, danger: true },
      ].map((item) => (
        <button
          key={item.label}
          onClick={() => { item.action(); onClose(); }}
          className={cn(
            'flex w-full items-center gap-2 px-3 py-1.5 text-sm transition-colors',
            (item as { danger?: boolean }).danger
              ? 'text-red-600 hover:bg-red-50'
              : 'text-gray-700 hover:bg-gray-100'
          )}
        >
          <span className="w-5 text-center">{item.icon}</span>
          {item.label}
        </button>
      ))}
    </div>
  );
}

// ── Header Context Menu ─────────────────────────────────

interface HeaderContextMenuProps {
  x: number;
  y: number;
  colKey: string;
  onClose: () => void;
  onSort: (dir: 'asc' | 'desc') => void;
  onHide: () => void;
}

function HeaderContextMenu({ x, y, colKey, onClose, onSort, onHide }: HeaderContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="fixed z-50 min-w-[160px] rounded-lg border border-gray-200 bg-white py-1 shadow-xl"
      style={{ left: x, top: y }}
    >
      <button onClick={() => { onSort('asc'); onClose(); }} className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100">
        <ArrowUp className="h-3.5 w-3.5" /> A-Z Sirala
      </button>
      <button onClick={() => { onSort('desc'); onClose(); }} className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100">
        <ArrowDown className="h-3.5 w-3.5" /> Z-A Sirala
      </button>
      <div className="my-1 border-t border-gray-100" />
      <button onClick={() => { onHide(); onClose(); }} className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100">
        <X className="h-3.5 w-3.5" /> Gizle
      </button>
    </div>
  );
}

// ── Stage Selector Dropdown ─────────────────────────────

function StageDropdown({
  stages,
  currentStageId,
  onSelect,
  onClose,
}: {
  stages: CrmStage[];
  currentStageId: string | null;
  onSelect: (stageId: string) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div ref={ref} className="absolute left-0 top-full z-50 mt-0.5 min-w-[160px] rounded-lg border border-gray-200 bg-white py-1 shadow-xl">
      {stages.map((stage) => (
        <button
          key={stage.id}
          onClick={() => { onSelect(stage.id); onClose(); }}
          className={cn(
            'flex w-full items-center gap-2 px-3 py-1.5 text-sm transition-colors hover:bg-gray-100',
            currentStageId === stage.id && 'bg-indigo-50 font-medium'
          )}
        >
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
          {stage.name}
        </button>
      ))}
    </div>
  );
}

// ── Source Platform Dropdown ────────────────────────────

function PlatformDropdown({
  currentValue: _currentValue,
  onSelect,
  onClose,
}: {
  currentValue: string;
  onSelect: (value: LeadSourcePlatform) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const platforms = Object.entries(SOURCE_PLATFORM_LABELS) as [LeadSourcePlatform, string][];

  return (
    <div ref={ref} className="absolute left-0 top-full z-50 mt-0.5 min-w-[160px] rounded-lg border border-gray-200 bg-white py-1 shadow-xl">
      {platforms.map(([value, label]) => (
        <button
          key={value}
          onClick={() => { onSelect(value); onClose(); }}
          className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-100"
        >
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: getSourceColor(value) }} />
          {label}
        </button>
      ))}
    </div>
  );
}

// ── User Dropdown ───────────────────────────────────────

function UserDropdown({
  members,
  currentUserId,
  onSelect,
  onClose,
}: {
  members: { id: string; user_id: string; profile?: { full_name: string; avatar_url: string | null } }[];
  currentUserId: string | null;
  onSelect: (userId: string | null) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div ref={ref} className="absolute left-0 top-full z-50 mt-0.5 min-w-[180px] rounded-lg border border-gray-200 bg-white py-1 shadow-xl">
      <button
        onClick={() => { onSelect(null); onClose(); }}
        className={cn('flex w-full items-center gap-2 px-3 py-1.5 text-sm text-gray-400 hover:bg-gray-100', !currentUserId && 'bg-indigo-50')}
      >
        Atanmamis
      </button>
      {members.map((m) => (
        <button
          key={m.user_id}
          onClick={() => { onSelect(m.user_id); onClose(); }}
          className={cn(
            'flex w-full items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100',
            currentUserId === m.user_id && 'bg-indigo-50 font-medium'
          )}
        >
          <Avatar src={m.profile?.avatar_url} name={m.profile?.full_name || ''} size="xs" />
          {m.profile?.full_name || m.user_id}
        </button>
      ))}
    </div>
  );
}

// ── Tags Editor ─────────────────────────────────────────

function TagsEditor({
  tags,
  onSave,
  onClose,
}: {
  tags: string[];
  onSave: (tags: string[]) => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState(tags.join(', '));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleSave = () => {
    const newTags = value.split(',').map(t => t.trim()).filter(Boolean);
    onSave(newTags);
    onClose();
  };

  return (
    <input
      ref={inputRef}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={handleSave}
      onKeyDown={(e) => {
        if (e.key === 'Enter') handleSave();
        if (e.key === 'Escape') onClose();
        e.stopPropagation();
      }}
      placeholder="etiket1, etiket2..."
      className="w-full rounded border border-blue-400 bg-white px-1.5 py-0.5 text-sm shadow-sm outline-none ring-1 ring-blue-200"
    />
  );
}

// ── Main Grid Component ─────────────────────────────────

const NEW_ROW_SENTINEL = '__NEW_ROW__';

export function LeadGrid() {
  const leads = useAppStore((s) => s.leads);
  const selectedLeadIds = useAppStore((s) => s.selectedLeadIds);
  const toggleLeadSelection = useAppStore((s) => s.toggleLeadSelection);
  const selectAllLeads = useAppStore((s) => s.selectAllLeads);
  const clearSelection = useAppStore((s) => s.clearSelection);
  const setActiveLeadId = useAppStore((s) => s.setActiveLeadId);
  const sort = useAppStore((s) => s.sort);
  const setSort = useAppStore((s) => s.setSort);
  const hiddenColumns = useAppStore((s) => s.hiddenColumns);
  const stages = useAppStore((s) => s.stages);
  const members = useAppStore((s) => s.members);
  const updateLead = useAppStore((s) => s.updateLead);
  const addLead = useAppStore((s) => s.addLead);
  const deleteLead = useAppStore((s) => s.deleteLead);
  const toggleColumn = useAppStore((s) => s.toggleColumn);

  // -- Grid state
  const [selectedCell, setSelectedCell] = useState<CellAddress>(null);
  const [editingCell, setEditingCell] = useState<CellAddress>(null);
  const [editValue, setEditValue] = useState('');
  const [showSaved, setShowSaved] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; leadId: string } | null>(null);
  const [headerContextMenu, setHeaderContextMenu] = useState<{ x: number; y: number; colKey: string } | null>(null);
  const [dropdownCell, setDropdownCell] = useState<CellAddress>(null);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const [newRowData, setNewRowData] = useState<Record<string, string>>({});
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  const gridRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const visibleColumns = useMemo(() =>
    LEAD_COLUMNS.filter((col) => col.key === '_select' || col.key === '_row_num' || !hiddenColumns.has(col.key)),
    [hiddenColumns]
  );

  const editableVisibleColumns = useMemo(() =>
    visibleColumns.filter((col) => col.key !== '_select' && col.key !== '_row_num'),
    [visibleColumns]
  );

  const allSelected = leads.length > 0 && selectedLeadIds.size === leads.length;
  const someSelected = selectedLeadIds.size > 0 && !allSelected;

  const getColWidth = useCallback((col: ColumnDef) => columnWidths[col.key] || col.width || 120, [columnWidths]);

  // Flash saved toast
  const flashSaved = useCallback(() => {
    setShowSaved(true);
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    savedTimerRef.current = setTimeout(() => setShowSaved(false), 1500);
  }, []);

  // ── Sort handler ──────────────────────────────────────
  const handleSort = useCallback((col: ColumnDef) => {
    if (!col.sortable) return;
    if (sort?.column === col.key) {
      if (sort.direction === 'asc') setSort({ column: col.key, direction: 'desc' });
      else setSort(null);
    } else {
      setSort({ column: col.key, direction: 'asc' });
    }
  }, [sort, setSort]);

  // ── Select all checkbox ───────────────────────────────
  const handleHeaderCheckbox = useCallback(() => {
    if (allSelected || someSelected) clearSelection();
    else selectAllLeads();
  }, [allSelected, someSelected, clearSelection, selectAllLeads]);

  // ── Save existing lead cell ───────────────────────────
  const handleInlineSave = useCallback((leadId: string, field: string, value: string | number | string[] | null) => {
    const payload: Partial<Lead> = {};
    (payload as Record<string, unknown>)[field] = value;
    updateLead(leadId, payload);
    flashSaved();
    fetch(`/api/leads/${leadId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(console.error);
  }, [updateLead, flashSaved]);

  // ── Save new row ──────────────────────────────────────
  const handleNewRowSave = useCallback(() => {
    const hasData = Object.values(newRowData).some((v) => v.trim() !== '');
    if (!hasData) return;

    const now = new Date().toISOString();
    const newLead: Lead = {
      id: generateId(),
      organization_id: '',
      phone: newRowData.phone || null,
      email: newRowData.email || null,
      external_platform_id: null,
      first_name: null,
      last_name: null,
      full_name: newRowData.full_name || null,
      company: newRowData.company || null,
      job_title: null,
      city: newRowData.city || null,
      country: null,
      stage_id: newRowData.stage_id || (stages.length > 0 ? stages[0].id : null),
      assigned_to: newRowData.assigned_to || null,
      score: newRowData.score ? parseInt(newRowData.score, 10) : 0,
      source_platform: (newRowData.source_platform as LeadSourcePlatform) || 'manual',
      campaign_name: newRowData.campaign_name || null,
      ad_set_name: null,
      ad_name: null,
      form_name: null,
      utm_source: null,
      utm_medium: null,
      utm_campaign: null,
      utm_content: null,
      utm_term: null,
      tags: newRowData.tags ? newRowData.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      custom_fields: {},
      notes_count: 0,
      activities_count: 0,
      last_activity_at: null,
      first_seen_at: now,
      created_at: now,
      updated_at: now,
      stage: stages.find((s) => s.id === (newRowData.stage_id || stages[0]?.id)),
    };

    addLead(newLead);
    setNewRowData({});
    flashSaved();

    // POST to API in background
    fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newLead),
    }).catch(console.error);
  }, [newRowData, stages, addLead, flashSaved]);

  // ── Delete lead ───────────────────────────────────────
  const handleDeleteLead = useCallback((id: string) => {
    deleteLead(id);
    fetch(`/api/leads/${id}`, { method: 'DELETE' }).catch(console.error);
  }, [deleteLead]);

  // ── Copy lead to clipboard ────────────────────────────
  const handleCopyLead = useCallback((lead: Lead) => {
    const text = `${lead.full_name || ''}\t${lead.phone || ''}\t${lead.email || ''}\t${lead.company || ''}`;
    navigator.clipboard.writeText(text).catch(console.error);
    flashSaved();
  }, [flashSaved]);

  // ── Cell navigation helpers ───────────────────────────
  const getColIndex = useCallback((colKey: string) =>
    editableVisibleColumns.findIndex((c) => c.key === colKey), [editableVisibleColumns]);

  const getNextCol = useCallback((colKey: string) => {
    const idx = getColIndex(colKey);
    if (idx < editableVisibleColumns.length - 1) return editableVisibleColumns[idx + 1].key;
    return null;
  }, [getColIndex, editableVisibleColumns]);

  const getPrevCol = useCallback((colKey: string) => {
    const idx = getColIndex(colKey);
    if (idx > 0) return editableVisibleColumns[idx - 1].key;
    return null;
  }, [getColIndex, editableVisibleColumns]);

  // ── Start editing ─────────────────────────────────────
  const startEditing = useCallback((row: number, col: string, initialValue?: string) => {
    const colDef = LEAD_COLUMNS.find((c) => c.key === col);
    if (!colDef || !colDef.editable) return;
    if (colDef.type === 'date') return;

    // For dropdowns, use dropdown instead of text input
    if (colDef.type === 'stage' || colDef.type === 'platform' || colDef.type === 'user' || colDef.type === 'tags') {
      setDropdownCell({ row, col });
      return;
    }

    setEditingCell({ row, col });
    if (initialValue !== undefined) {
      setEditValue(initialValue);
    } else if (row === -1) {
      setEditValue(newRowData[col] || '');
    } else {
      const lead = leads[row];
      if (lead) {
        const val = (lead as unknown as Record<string, unknown>)[col];
        setEditValue(val != null ? String(val) : '');
      }
    }
  }, [leads, newRowData]);

  // ── Commit edit ───────────────────────────────────────
  const commitEdit = useCallback((moveDirection?: 'right' | 'down') => {
    if (!editingCell) return;
    const { row, col } = editingCell;
    const colDef = LEAD_COLUMNS.find((c) => c.key === col);

    if (row === -1) {
      // New row
      setNewRowData((prev) => ({ ...prev, [col]: editValue }));
      // If Enter/Tab and there's data, maybe save
      if (moveDirection === 'down') {
        // Save the new row when pressing Enter
        const updated = { ...newRowData, [col]: editValue };
        const hasData = Object.values(updated).some((v) => v.trim() !== '');
        if (hasData) {
          setNewRowData(updated);
          // Use timeout to let state update
          setTimeout(() => handleNewRowSave(), 0);
        }
      }
    } else {
      // Existing lead
      const lead = leads[row];
      if (lead) {
        const oldVal = (lead as unknown as Record<string, unknown>)[col];
        const oldStr = oldVal != null ? String(oldVal) : '';
        if (editValue !== oldStr) {
          const saveValue = colDef?.type === 'number' ? parseInt(editValue, 10) || 0 : editValue;
          handleInlineSave(lead.id, col, saveValue as string | number);
        }
      }
    }

    setEditingCell(null);

    // Navigate
    if (moveDirection === 'right') {
      const nextCol = getNextCol(col);
      if (nextCol) {
        setSelectedCell({ row, col: nextCol });
      } else if (row < leads.length - 1) {
        const firstCol = editableVisibleColumns[0]?.key;
        if (firstCol) setSelectedCell({ row: row + 1, col: firstCol });
      } else {
        setSelectedCell({ row: -1, col: editableVisibleColumns[0]?.key || col });
      }
    } else if (moveDirection === 'down') {
      if (row < leads.length - 1) {
        setSelectedCell({ row: row + 1, col });
      } else if (row !== -1) {
        setSelectedCell({ row: -1, col });
      }
    }
  }, [editingCell, editValue, leads, newRowData, handleInlineSave, handleNewRowSave, getNextCol, editableVisibleColumns]);

  // ── Cancel edit ───────────────────────────────────────
  const cancelEdit = useCallback(() => {
    setEditingCell(null);
    setDropdownCell(null);
  }, []);

  // ── Focus input when editing starts ───────────────────
  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingCell]);

  // ── Keyboard navigation ───────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // If a dropdown is open, let it handle events
      if (dropdownCell) return;

      // If editing, handle edit keys
      if (editingCell) {
        if (e.key === 'Tab') {
          e.preventDefault();
          commitEdit('right');
        } else if (e.key === 'Enter') {
          e.preventDefault();
          commitEdit('down');
        } else if (e.key === 'Escape') {
          e.preventDefault();
          cancelEdit();
        }
        return;
      }

      // If a cell is selected but not editing
      if (selectedCell) {
        const { row, col } = selectedCell;

        if (e.key === 'ArrowRight') {
          e.preventDefault();
          const next = getNextCol(col);
          if (next) setSelectedCell({ row, col: next });
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          const prev = getPrevCol(col);
          if (prev) setSelectedCell({ row, col: prev });
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          if (row < leads.length - 1) setSelectedCell({ row: row + 1, col });
          else if (row !== -1) setSelectedCell({ row: -1, col });
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          if (row === -1 && leads.length > 0) setSelectedCell({ row: leads.length - 1, col });
          else if (row > 0) setSelectedCell({ row: row - 1, col });
        } else if (e.key === 'Enter' || e.key === 'F2') {
          e.preventDefault();
          startEditing(row, col);
        } else if (e.key === 'Delete' || e.key === 'Backspace') {
          e.preventDefault();
          startEditing(row, col, '');
        } else if (e.key === 'Escape') {
          setSelectedCell(null);
        } else if (e.key === 'Tab') {
          e.preventDefault();
          const next = getNextCol(col);
          if (next) setSelectedCell({ row, col: next });
        } else if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
          // Start typing to replace
          e.preventDefault();
          startEditing(row, col, e.key);
        }
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedCell, editingCell, dropdownCell, leads.length, commitEdit, cancelEdit, startEditing, getNextCol, getPrevCol]);

  // ── Column resize ─────────────────────────────────────
  const handleResizeStart = useCallback((colKey: string, startX: number) => {
    const startWidth = columnWidths[colKey] || LEAD_COLUMNS.find((c) => c.key === colKey)?.width || 120;
    const onMouseMove = (e: MouseEvent) => {
      const diff = e.clientX - startX;
      const newWidth = Math.max(50, startWidth + diff);
      setColumnWidths((prev) => ({ ...prev, [colKey]: newWidth }));
    };
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [columnWidths]);

  // ── Render cell content (read-only mode) ──────────────
  const renderCellContent = useCallback((lead: Lead, col: ColumnDef) => {
    const key = col.key;

    switch (key) {
      case 'full_name':
        return <span className="truncate font-medium text-gray-900">{lead.full_name || ''}</span>;
      case 'phone':
        return <span className="truncate text-gray-700">{lead.phone || ''}</span>;
      case 'email':
        return <span className="truncate text-gray-700">{lead.email || ''}</span>;
      case 'source_platform': {
        const color = getSourceColor(lead.source_platform);
        const label = SOURCE_PLATFORM_LABELS[lead.source_platform] || lead.source_platform;
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: `${color}15`, color }}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
            {label}
          </span>
        );
      }
      case 'stage': {
        const stage = lead.stage || stages.find((s) => s.id === lead.stage_id);
        if (!stage) return <span className="text-gray-400">-</span>;
        return <Badge color={getStageBadgeColor(stage.color)} size="sm">{stage.name}</Badge>;
      }
      case 'score': {
        const colorCls = getScoreColor(lead.score);
        return <span className={cn('inline-flex rounded-md px-2 py-0.5 text-xs font-semibold', colorCls)}>{lead.score}</span>;
      }
      case 'assigned_to': {
        const user = lead.assigned_user;
        if (!user) return <span className="text-gray-400">-</span>;
        return (
          <div className="flex items-center gap-2">
            <Avatar src={user.avatar_url} name={user.full_name} size="xs" />
            <span className="truncate text-sm text-gray-700">{user.full_name}</span>
          </div>
        );
      }
      case 'campaign_name':
        return <span className="truncate text-gray-700">{lead.campaign_name || ''}</span>;
      case 'city':
        return <span className="truncate text-gray-700">{lead.city || ''}</span>;
      case 'company':
        return <span className="truncate text-gray-700">{lead.company || ''}</span>;
      case 'tags':
        if (!lead.tags || lead.tags.length === 0) return <span className="text-gray-400">-</span>;
        return (
          <div className="flex flex-wrap gap-1">
            {lead.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} color="indigo" size="sm">{tag}</Badge>
            ))}
            {lead.tags.length > 3 && <Badge color="gray" size="sm">+{lead.tags.length - 3}</Badge>}
          </div>
        );
      case 'first_seen_at':
        return <span className="text-gray-500 text-xs" title={lead.first_seen_at}>{formatRelativeTime(lead.first_seen_at)}</span>;
      case 'last_activity_at':
        return lead.last_activity_at
          ? <span className="text-gray-500 text-xs" title={lead.last_activity_at}>{formatRelativeTime(lead.last_activity_at)}</span>
          : <span className="text-gray-400">-</span>;
      default:
        return <span className="text-gray-600">-</span>;
    }
  }, [stages]);

  // ── Placeholder text for new row ──────────────────────
  const getPlaceholder = (colKey: string): string => {
    const map: Record<string, string> = {
      full_name: 'Ad Soyad...',
      phone: '+90...',
      email: 'email@...',
      source_platform: 'Kaynak...',
      stage: 'Aşama...',
      score: '0',
      assigned_to: 'Atanan...',
      campaign_name: 'Kampanya...',
      city: 'Sehir...',
      company: 'Sirket...',
      tags: 'Etiketler...',
    };
    return map[colKey] || '...';
  };

  // ── Compute total width ───────────────────────────────
  const totalWidth = visibleColumns.reduce((sum, col) => sum + getColWidth(col), 0);

  // Sticky column left offsets
  const stickyLefts: Record<string, number> = {};
  let leftAcc = 0;
  for (const col of visibleColumns) {
    if (col.key === '_select' || col.key === '_row_num' || col.key === 'full_name') {
      stickyLefts[col.key] = leftAcc;
      leftAcc += getColWidth(col);
    } else {
      break;
    }
  }

  return (
    <div ref={gridRef} className="h-full w-full overflow-auto rounded-lg border border-gray-200 bg-white">
      <SavedToast show={showSaved} />

      {contextMenu && (() => {
        const lead = leads.find((l) => l.id === contextMenu.leadId);
        if (!lead) return null;
        return (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            onClose={() => setContextMenu(null)}
            onEdit={() => {
              const rowIdx = leads.findIndex((l) => l.id === lead.id);
              setSelectedCell({ row: rowIdx, col: 'full_name' });
              startEditing(rowIdx, 'full_name');
            }}
            onDelete={() => handleDeleteLead(lead.id)}
            onCopy={() => handleCopyLead(lead)}
            onStageChange={() => {
              const rowIdx = leads.findIndex((l) => l.id === lead.id);
              setDropdownCell({ row: rowIdx, col: 'stage' });
            }}
            onOpenDrawer={() => setActiveLeadId(lead.id)}
          />
        );
      })()}

      {headerContextMenu && (
        <HeaderContextMenu
          x={headerContextMenu.x}
          y={headerContextMenu.y}
          colKey={headerContextMenu.colKey}
          onClose={() => setHeaderContextMenu(null)}
          onSort={(dir) => setSort({ column: headerContextMenu.colKey, direction: dir })}
          onHide={() => toggleColumn(headerContextMenu.colKey)}
        />
      )}

      <div style={{ minWidth: totalWidth }}>
        {/* ── Header ───────────────────────────────── */}
        <div className="sticky top-0 z-20 flex border-b border-gray-200 bg-gray-50">
          {visibleColumns.map((col) => {
            const isCheckbox = col.key === '_select';
            const isRowNum = col.key === '_row_num';
            const isSorted = sort?.column === col.key;
            const isSticky = col.key in stickyLefts;
            const w = getColWidth(col);

            return (
              <div
                key={col.key}
                className={cn(
                  'group/hdr relative flex shrink-0 items-center overflow-hidden border-r border-gray-200 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500',
                  col.sortable && 'cursor-pointer select-none hover:bg-gray-100 hover:text-gray-700',
                  isSticky && 'sticky bg-gray-50 z-30'
                )}
                style={{ width: w, left: isSticky ? stickyLefts[col.key] : undefined }}
                onClick={() => handleSort(col)}
                onContextMenu={(e) => {
                  if (!isCheckbox && !isRowNum) {
                    e.preventDefault();
                    setHeaderContextMenu({ x: e.clientX, y: e.clientY, colKey: col.key });
                  }
                }}
              >
                {isCheckbox ? (
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => { if (el) el.indeterminate = someSelected; }}
                    onChange={handleHeaderCheckbox}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                ) : isRowNum ? (
                  <span className="text-gray-400">#</span>
                ) : (
                  <div className="flex items-center gap-1">
                    <span>{col.label}</span>
                    {col.sortable && (
                      <span className="ml-0.5">
                        {isSorted ? (
                          sort?.direction === 'asc'
                            ? <ArrowUp className="h-3.5 w-3.5 text-indigo-500" />
                            : <ArrowDown className="h-3.5 w-3.5 text-indigo-500" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3 text-gray-300" />
                        )}
                      </span>
                    )}
                  </div>
                )}
                {/* Resize handle */}
                {!isCheckbox && !isRowNum && (
                  <div
                    className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize opacity-0 hover:opacity-100 group-hover/hdr:opacity-50"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleResizeStart(col.key, e.clientX);
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="mx-auto h-full w-0.5 bg-indigo-400" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Data Rows ────────────────────────────── */}
        {leads.map((lead, rowIndex) => {
          const isSelected = selectedLeadIds.has(lead.id);
          const isEvenRow = rowIndex % 2 === 0;
          const isHovered = hoveredRow === rowIndex;

          return (
            <div
              key={lead.id}
              className={cn(
                'group relative flex border-b border-gray-200 transition-colors',
                isSelected ? 'bg-indigo-50/60' : isEvenRow ? 'bg-white' : 'bg-gray-50/30',
                isHovered && !isSelected && 'bg-blue-50/30'
              )}
              onMouseEnter={() => setHoveredRow(rowIndex)}
              onMouseLeave={() => setHoveredRow(null)}
              onContextMenu={(e) => {
                e.preventDefault();
                setContextMenu({ x: e.clientX, y: e.clientY, leadId: lead.id });
              }}
            >
              {visibleColumns.map((col) => {
                const isSticky = col.key in stickyLefts;
                const isCheckbox = col.key === '_select';
                const isRowNum = col.key === '_row_num';
                const isCellSelected = cellEq(selectedCell, { row: rowIndex, col: col.key });
                const isCellEditing = cellEq(editingCell, { row: rowIndex, col: col.key });
                const isDropdownOpen = cellEq(dropdownCell, { row: rowIndex, col: col.key });
                const w = getColWidth(col);

                return (
                  <div
                    key={col.key}
                    className={cn(
                      'relative flex shrink-0 items-center border-r border-gray-200 px-2 py-1.5 text-sm',
                      isSticky && 'sticky z-10',
                      isSticky && (isSelected ? 'bg-indigo-50/60' : isEvenRow ? 'bg-white' : 'bg-gray-50/30'),
                      isSticky && isHovered && !isSelected && 'bg-blue-50/30',
                      isCheckbox && 'justify-center',
                      isRowNum && 'justify-center',
                      isCellSelected && !isCellEditing && 'ring-2 ring-inset ring-blue-500',
                      isCellEditing && 'bg-white shadow-sm ring-2 ring-inset ring-blue-500 z-20'
                    )}
                    style={{ width: w, left: isSticky ? stickyLefts[col.key] : undefined }}
                    onClick={(e) => {
                      if (isCheckbox) {
                        e.stopPropagation();
                        toggleLeadSelection(lead.id);
                        return;
                      }
                      if (isRowNum) return;
                      setSelectedCell({ row: rowIndex, col: col.key });
                      // Close any open dropdowns
                      if (!isDropdownOpen) setDropdownCell(null);
                    }}
                    onDoubleClick={() => {
                      if (!isCheckbox && !isRowNum && col.editable) {
                        startEditing(rowIndex, col.key);
                      }
                    }}
                  >
                    {isCheckbox ? (
                      <input
                        type="checkbox"
                        checked={selectedLeadIds.has(lead.id)}
                        onChange={(e) => { e.stopPropagation(); toggleLeadSelection(lead.id); }}
                        onClick={(e) => e.stopPropagation()}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    ) : isRowNum ? (
                      <span className="text-xs text-gray-400 select-none">{rowIndex + 1}</span>
                    ) : isCellEditing ? (
                      <input
                        ref={inputRef}
                        type={col.type === 'number' ? 'number' : 'text'}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => commitEdit()}
                        className="w-full bg-transparent text-sm outline-none"
                        autoFocus
                      />
                    ) : isDropdownOpen && col.key === 'stage' ? (
                      <div className="relative w-full">
                        {renderCellContent(lead, col)}
                        <StageDropdown
                          stages={stages}
                          currentStageId={lead.stage_id}
                          onSelect={(stageId) => {
                            const stage = stages.find((s) => s.id === stageId);
                            handleInlineSave(lead.id, 'stage_id', stageId);
                            if (stage) updateLead(lead.id, { stage });
                          }}
                          onClose={() => setDropdownCell(null)}
                        />
                      </div>
                    ) : isDropdownOpen && col.key === 'source_platform' ? (
                      <div className="relative w-full">
                        {renderCellContent(lead, col)}
                        <PlatformDropdown
                          currentValue={lead.source_platform}
                          onSelect={(value) => handleInlineSave(lead.id, 'source_platform', value)}
                          onClose={() => setDropdownCell(null)}
                        />
                      </div>
                    ) : isDropdownOpen && col.key === 'assigned_to' ? (
                      <div className="relative w-full">
                        {renderCellContent(lead, col)}
                        <UserDropdown
                          members={members}
                          currentUserId={lead.assigned_to}
                          onSelect={(userId) => handleInlineSave(lead.id, 'assigned_to', userId)}
                          onClose={() => setDropdownCell(null)}
                        />
                      </div>
                    ) : isDropdownOpen && col.key === 'tags' ? (
                      <TagsEditor
                        tags={lead.tags || []}
                        onSave={(tags) => handleInlineSave(lead.id, 'tags', tags as unknown as string)}
                        onClose={() => setDropdownCell(null)}
                      />
                    ) : (
                      renderCellContent(lead, col)
                    )}
                  </div>
                );
              })}

              {/* Row action buttons on hover */}
              {isHovered && (
                <div className="pointer-events-auto absolute right-2 top-1/2 z-20 flex -translate-y-1/2 items-center gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); setActiveLeadId(lead.id); }}
                    className="flex h-6 w-6 items-center justify-center rounded bg-white text-gray-400 shadow-sm ring-1 ring-gray-200 transition-colors hover:text-indigo-600"
                    title="Ac"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteLead(lead.id); }}
                    className="flex h-6 w-6 items-center justify-center rounded bg-white text-gray-400 shadow-sm ring-1 ring-gray-200 transition-colors hover:text-red-500"
                    title="Sil"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {/* ── New Row (always visible) ─────────────── */}
        <div
          className="group flex border-b border-gray-200 bg-gray-50/50"
          onMouseEnter={() => setHoveredRow(-1)}
          onMouseLeave={() => setHoveredRow(null)}
        >
          {visibleColumns.map((col) => {
            const isSticky = col.key in stickyLefts;
            const isCheckbox = col.key === '_select';
            const isRowNum = col.key === '_row_num';
            const isCellSelected = cellEq(selectedCell, { row: -1, col: col.key });
            const isCellEditing = cellEq(editingCell, { row: -1, col: col.key });
            const isDropdownOpen = cellEq(dropdownCell, { row: -1, col: col.key });
            const w = getColWidth(col);

            return (
              <div
                key={col.key}
                className={cn(
                  'relative flex shrink-0 items-center border-r border-gray-200 px-2 py-1.5 text-sm',
                  isSticky && 'sticky z-10 bg-gray-50/50',
                  isCheckbox && 'justify-center',
                  isRowNum && 'justify-center',
                  isCellSelected && !isCellEditing && 'ring-2 ring-inset ring-blue-500',
                  isCellEditing && 'bg-white shadow-sm ring-2 ring-inset ring-blue-500 z-20'
                )}
                style={{ width: w, left: isSticky ? stickyLefts[col.key] : undefined }}
                onClick={() => {
                  if (isCheckbox || isRowNum) return;
                  setSelectedCell({ row: -1, col: col.key });
                  if (!isDropdownOpen) setDropdownCell(null);
                }}
                onDoubleClick={() => {
                  if (!isCheckbox && !isRowNum && col.editable) {
                    startEditing(-1, col.key);
                  }
                }}
              >
                {isCheckbox ? (
                  <span className="text-gray-300">+</span>
                ) : isRowNum ? (
                  <span className="text-xs text-gray-300 select-none">+</span>
                ) : isCellEditing ? (
                  <input
                    ref={inputRef}
                    type={col.type === 'number' ? 'number' : 'text'}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={() => commitEdit()}
                    placeholder={getPlaceholder(col.key)}
                    className="w-full bg-transparent text-sm outline-none placeholder:text-gray-300"
                    autoFocus
                  />
                ) : isDropdownOpen && col.key === 'stage' ? (
                  <div className="relative w-full">
                    <span className="text-gray-400">{newRowData.stage_id ? stages.find(s => s.id === newRowData.stage_id)?.name : getPlaceholder(col.key)}</span>
                    <StageDropdown
                      stages={stages}
                      currentStageId={newRowData.stage_id || null}
                      onSelect={(stageId) => {
                        setNewRowData((prev) => ({ ...prev, stage_id: stageId }));
                        setDropdownCell(null);
                      }}
                      onClose={() => setDropdownCell(null)}
                    />
                  </div>
                ) : isDropdownOpen && col.key === 'source_platform' ? (
                  <div className="relative w-full">
                    <span className="text-gray-400">{newRowData.source_platform ? SOURCE_PLATFORM_LABELS[newRowData.source_platform as LeadSourcePlatform] : getPlaceholder(col.key)}</span>
                    <PlatformDropdown
                      currentValue={newRowData.source_platform || ''}
                      onSelect={(value) => {
                        setNewRowData((prev) => ({ ...prev, source_platform: value }));
                        setDropdownCell(null);
                      }}
                      onClose={() => setDropdownCell(null)}
                    />
                  </div>
                ) : isDropdownOpen && col.key === 'assigned_to' ? (
                  <div className="relative w-full">
                    <span className="text-gray-400">{getPlaceholder(col.key)}</span>
                    <UserDropdown
                      members={members}
                      currentUserId={newRowData.assigned_to || null}
                      onSelect={(userId) => {
                        setNewRowData((prev) => ({ ...prev, assigned_to: userId || '' }));
                        setDropdownCell(null);
                      }}
                      onClose={() => setDropdownCell(null)}
                    />
                  </div>
                ) : isDropdownOpen && col.key === 'tags' ? (
                  <TagsEditor
                    tags={newRowData.tags ? newRowData.tags.split(',').map(t => t.trim()).filter(Boolean) : []}
                    onSave={(tags) => {
                      setNewRowData((prev) => ({ ...prev, tags: tags.join(', ') }));
                      setDropdownCell(null);
                    }}
                    onClose={() => setDropdownCell(null)}
                  />
                ) : newRowData[col.key] ? (
                  <span className="truncate text-gray-700">{newRowData[col.key]}</span>
                ) : (
                  <span className="text-gray-300 select-none">{col.editable ? getPlaceholder(col.key) : ''}</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Empty state */}
        {leads.length === 0 && (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <div className="text-center">
              <p className="text-lg font-medium">Henuz lead yok</p>
              <p className="mt-1 text-sm">Yukaridaki bos satira tiklayarak yeni lead ekleyebilirsiniz</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
