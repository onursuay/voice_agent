'use client';

import React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

const colorStyles = {
  gray: 'bg-gray-100 text-gray-700',
  blue: 'bg-blue-50 text-blue-700',
  green: 'bg-green-50 text-green-700',
  red: 'bg-red-50 text-red-700',
  yellow: 'bg-yellow-50 text-yellow-700',
  indigo: 'bg-emerald-50 text-emerald-700',
  purple: 'bg-purple-50 text-purple-700',
  pink: 'bg-pink-50 text-pink-700',
};

const sizeStyles = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
};

export interface BadgeProps {
  children: React.ReactNode;
  color?: keyof typeof colorStyles;
  size?: keyof typeof sizeStyles;
  removable?: boolean;
  onRemove?: () => void;
  className?: string;
}

export function Badge({
  children,
  color = 'gray',
  size = 'sm',
  removable = false,
  onRemove,
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium',
        colorStyles[color],
        sizeStyles[size],
        className
      )}
    >
      {children}
      {removable && (
        <button
          type="button"
          onClick={onRemove}
          className={cn(
            'ml-0.5 inline-flex shrink-0 items-center justify-center rounded-full',
            'hover:bg-black/10 transition-colors',
            size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'
          )}
        >
          <X className={size === 'sm' ? 'h-2.5 w-2.5' : 'h-3 w-3'} />
        </button>
      )}
    </span>
  );
}
