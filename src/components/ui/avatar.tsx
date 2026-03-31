'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { getInitials } from '@/lib/utils';

const sizeStyles = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
};

export interface AvatarProps {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: keyof typeof sizeStyles;
  className?: string;
}

export function Avatar({
  src,
  alt,
  name = '',
  size = 'md',
  className,
}: AvatarProps) {
  const [imgError, setImgError] = useState(false);
  const initials = getInitials(name);
  const showImage = src && !imgError;

  return (
    <span
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 font-medium overflow-hidden',
        sizeStyles[size],
        className
      )}
    >
      {showImage ? (
        <img
          src={src}
          alt={alt || name}
          onError={() => setImgError(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <span>{initials}</span>
      )}
    </span>
  );
}
