'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Filter, X, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LEAD_COLUMNS } from './lead-grid';
import type { FilterConfig } from '@/lib/types';

// ── Operator labels ─────────────────────────────────────

const OPERATOR_LABELS: Record<string, string> = {
  eq: 'eşittir',
  neq: 'eşit değildir',
  contains: 'içerir',
  not_contains: 'içermez',
  gt: 'büyüktür',
  lt: 'küçüktür',
  gte: 'büyük eşittir',
  lte: 'küçük eşittir',
  in: 'içerir (çoklu)',
  is_empty: 'boş',
  is_not_empty: 'boş değil',
};

const TEXT_OPERATORS = ['contains', 'eq', 'not_contains', 'is_empty', 'is_not_empty'] as const;
const NUMBER_OPERATORS = ['eq', 'gt', 'lt', 'gte', 'lte'] as const;
const SELECT_OPERATORS = ['eq', 'neq', 'in'] as const;

function getOperatorsForType(type: string) {
  switch (type) {
    case 'number':
      return NUMBER_OPERATORS;
    case 'select':
    case 'platform':
    case 'stage':
    case 'user':
      return SELECT_OPERATORS;
    default:
      return TEXT_OPERATORS;
  }
}

// ── Filter Row ──────────────────────────────────────────

interface FilterRowProps {
  onAdd: (filter: FilterConfig) => void;
  onCancel: () => void;
}

function FilterRow({ onAdd, onCancel }: FilterRowProps) {
  const filterableColumns = LEAD_COLUMNS.filter((c) => c.filterable && c.key !== '_select');
  const [column, setColumn] = useState(filterableColumns[0]?.key || '');
  const [operator, setOperator] = useState('contains');
  const [value, setValue] = useState('');

  const selectedCol = filterableColumns.find((c) => c.key === column);
  const operators = selectedCol ? getOperatorsForType(selectedCol.type) : TEXT_OPERATORS;

  useEffect(() => {
    setOperator(operators[0]);
    setValue('');
  }, [column]);

  const needsValue = operator !== 'is_empty' && operator !== 'is_not_empty';

  return (
    <div className="flex items-center gap-2">
      <select
        value={column}
        onChange={(e) => setColumn(e.target.value)}
        className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      >
        {filterableColumns.map((col) => (
          <option key={col.key} value={col.key}>
            {col.label}
          </option>
        ))}
      </select>

      <select
        value={operator}
        onChange={(e) => setOperator(e.target.value)}
        className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      >
        {operators.map((op) => (
          <option key={op} value={op}>
            {OPERATOR_LABELS[op] || op}
          </option>
        ))}
      </select>

      {needsValue && (
        <input
          type={selectedCol?.type === 'number' ? 'number' : 'text'}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Değer..."
          className="w-40 rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      )}

      <Button
        size="sm"
        variant="primary"
        onClick={() => {
          if (!needsValue || value.trim()) {
            onAdd({
              column,
              operator: operator as FilterConfig['operator'],
              value: needsValue ? value : '',
            });
          }
        }}
        disabled={needsValue && !value.trim()}
      >
        Ekle
      </Button>
      <Button size="sm" variant="ghost" onClick={onCancel}>
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

// ── Main Filter Panel ───────────────────────────────────

export function LeadFilters() {
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const filters = useAppStore((s) => s.filters);
  const addFilter = useAppStore((s) => s.addFilter);
  const removeFilter = useAppStore((s) => s.removeFilter);
  const setFilters = useAppStore((s) => s.setFilters);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const getColumnLabel = (key: string) =>
    LEAD_COLUMNS.find((c) => c.key === key)?.label || key;

  return (
    <div ref={panelRef} className="relative">
      {/* Trigger */}
      <Button
        variant="secondary"
        size="sm"
        icon={<Filter className="h-4 w-4" />}
        onClick={() => setOpen(!open)}
      >
        Filtrele
        {filters.length > 0 && (
          <span className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500 text-[10px] font-bold text-white">
            {filters.length}
          </span>
        )}
      </Button>

      {/* Panel */}
      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 w-[520px] rounded-lg border border-gray-200 bg-white p-4 shadow-xl">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-900">Filtreler</h4>
            {filters.length > 0 && (
              <button
                onClick={() => setFilters([])}
                className="text-xs font-medium text-red-500 hover:text-red-600"
              >
                <span className="flex items-center gap-1">
                  <Trash2 className="h-3 w-3" />
                  Filtreleri Temizle
                </span>
              </button>
            )}
          </div>

          {/* Active Filters */}
          {filters.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {filters.map((f, i) => (
                <Badge key={i} color="indigo" size="md" removable onRemove={() => removeFilter(i)}>
                  {getColumnLabel(f.column)} {OPERATOR_LABELS[f.operator] || f.operator}{' '}
                  {f.value ? `"${f.value}"` : ''}
                </Badge>
              ))}
            </div>
          )}

          {/* Add Filter */}
          {adding ? (
            <FilterRow
              onAdd={(filter) => {
                addFilter(filter);
                setAdding(false);
              }}
              onCancel={() => setAdding(false)}
            />
          ) : (
            <button
              onClick={() => setAdding(true)}
              className="flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              <Plus className="h-4 w-4" />
              Filtre Ekle
            </button>
          )}

          {filters.length === 0 && !adding && (
            <p className="mt-2 text-xs text-gray-400">Henüz filtre eklenmedi.</p>
          )}
        </div>
      )}
    </div>
  );
}
