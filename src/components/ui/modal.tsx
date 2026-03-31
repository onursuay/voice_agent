'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

const sizeStyles = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
};

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  size?: keyof typeof sizeStyles;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function Modal({
  open,
  onClose,
  title,
  description,
  size = 'md',
  children,
  footer,
  className,
}: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (open) {
      document.addEventListener('keydown', handleKey);
    }
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/40 transition-opacity"
        onClick={onClose}
      />

      {/* Content */}
      <div
        className={cn(
          'relative z-10 w-full rounded-xl bg-white shadow-xl',
          'mx-4 animate-in fade-in zoom-in-95 duration-200',
          sizeStyles[size],
          className
        )}
      >
        {/* Header */}
        {(title || description) && (
          <div className="border-b border-gray-100 px-6 py-4">
            <div className="flex items-start justify-between">
              <div>
                {title && (
                  <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
                )}
                {description && (
                  <p className="mt-1 text-sm text-gray-500">{description}</p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* Body */}
        {children && <div className="px-6 py-4">{children}</div>}

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
