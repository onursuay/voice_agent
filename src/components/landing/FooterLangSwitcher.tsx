'use client'

import { useState } from 'react'

const langs = {
  tr: {
    flag: '🇹🇷',
    label: 'Türkçe',
    links: [
      { label: 'Gizlilik Politikası', href: '/privacy-policy' },
      { label: 'Kullanım Koşulları', href: '/terms-of-service' },
      { label: 'Çerez Politikası', href: '/cookie-policy' },
      { label: 'Veri Silme', href: '/data-deletion' },
    ],
  },
  en: {
    flag: '🇬🇧',
    label: 'English',
    links: [
      { label: 'Privacy Policy', href: '/en/privacy-policy' },
      { label: 'Terms of Service', href: '/en/terms-of-service' },
      { label: 'Cookie Policy', href: '/en/cookie-policy' },
      { label: 'Data Deletion', href: '/en/data-deletion' },
    ],
  },
}

type LangKey = keyof typeof langs

export default function FooterLangSwitcher() {
  const [lang, setLang] = useState<LangKey>('tr')
  const [open, setOpen] = useState(false)

  const current = langs[lang]
  const other = lang === 'tr' ? 'en' : 'tr'

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
      {/* Legal links */}
      <nav className="flex flex-wrap justify-center sm:justify-end gap-x-5 gap-y-2 text-gray-500">
        {current.links.map((l) => (
          <a key={l.href} href={l.href} className="hover:text-gray-300 transition-colors">
            {l.label}
          </a>
        ))}
      </nav>

      {/* Language selector */}
      <div className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1.5 text-gray-500 hover:text-gray-300 transition-colors border border-white/[0.08] rounded-md px-3 py-1.5 text-sm"
        >
          <span>{current.flag}</span>
          <span>{current.label}</span>
          <svg
            width={12}
            height={12}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`transition-transform ${open ? 'rotate-180' : ''}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {open && (
          <div className="absolute bottom-full mb-1 right-0 bg-[#0e0e12] border border-white/[0.08] rounded-md overflow-hidden shadow-lg z-50 min-w-[130px]">
            <button
              onClick={() => { setLang(other); setOpen(false) }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-gray-200 hover:bg-white/[0.04] transition-colors"
            >
              <span>{langs[other].flag}</span>
              <span>{langs[other].label}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
