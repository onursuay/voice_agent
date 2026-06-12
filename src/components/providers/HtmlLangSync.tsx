'use client';

import { useEffect } from 'react';
import { useLocale } from 'next-intl';

// Kök layout client-side dil geçişinde yeniden render edilmediği için
// <html lang> değerini burada güncel tutuyoruz.
export function HtmlLangSync() {
  const locale = useLocale();

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return null;
}
