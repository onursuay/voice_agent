'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/* ── Spinner ─────────────────────────────────────────── */

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const spinnerSizes = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
};

export function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <Loader2
      className={cn('animate-spin text-indigo-500', spinnerSizes[size], className)}
    />
  );
}

/* ── Skeleton ────────────────────────────────────────── */

export interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: boolean;
}

export function Skeleton({
  className,
  width,
  height,
  rounded = false,
}: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse bg-gray-200',
        rounded ? 'rounded-full' : 'rounded-lg',
        className
      )}
      style={{ width, height }}
    />
  );
}

/* ── Full Page Loading ───────────────────────────────── */

export interface PageLoadingProps {
  message?: string;
}

export function PageLoading({ message }: PageLoadingProps) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
      <Spinner size="lg" />
      {message && (
        <p className="mt-4 text-sm font-medium text-gray-600">{message}</p>
      )}
    </div>
  );
}
