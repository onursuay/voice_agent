'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import ScheduleModal from './ScheduleModal'

interface Props {
  ctaSchedule: string
  ctaTrial: string
  ctaDemo?: string
}

const productItems = [
  { icon: 'zap', label: 'Çok Kanallı Lead Toplama', desc: 'Meta, WhatsApp, Instagram DM ve Messenger\'dan gelen leadleri otomatik toplayın.', href: '/#ozellikler' },
  { icon: 'layers', label: 'CRM Pipeline', desc: 'Aşama bazlı satış takibi ile hangi lead\'in nerede olduğunu anlık görün.', href: '/#ozellikler' },
  { icon: 'phone', label: 'AI Destekli Arama', desc: 'Yapay zeka ile lead\'lerinizi otomatik arayın ve takip edin.', href: '/#ozellikler' },
  { icon: 'mail', label: 'Toplu E-posta', desc: 'Segmentlere göre kişiselleştirilmiş e-posta kampanyaları gönderin.', href: '/#ozellikler' },
  { icon: 'chart', label: 'Detaylı Analitik', desc: 'Kaynak bazlı lead ve dönüşüm raporları alın.', href: '/#ozellikler' },
  { icon: 'settings', label: 'Otomasyon Kuralları', desc: 'Lead geldiğinde otomatik ata, bildirim gönder, e-posta çalıştır.', href: '/#ozellikler' },
]

const integrationItems = [
  { icon: 'meta', label: 'Meta Ads', desc: 'Facebook ve Instagram reklam leadlerini otomatik çekin.', href: '/#entegrasyonlar' },
  { icon: 'whatsapp', label: 'WhatsApp', desc: 'WhatsApp mesajlarından gelen leadleri yakalayın.', href: '/#entegrasyonlar' },
  { icon: 'instagram', label: 'Instagram DM', desc: 'Instagram DM\'den gelen leadleri otomatik kaydedin.', href: '/#entegrasyonlar' },
  { icon: 'webhook', label: 'Webhook / Zapier', desc: 'Mevcut araçlarınızla webhook ile kolayca entegre olun.', href: '/#entegrasyonlar' },
]

const menuIcons: Record<string, string> = {
  zap: '<polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2"/>',
  layers: '<path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>',
  phone: '<path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.22 1.18 2 2 0 012.18 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.09a16 16 0 006 6l.56-.56a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>',
  mail: '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>',
  chart: '<path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>',
  meta: '<path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>',
  whatsapp: '<path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/>',
  instagram: '<rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>',
  webhook: '<path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/>',
}

function MIcon({ name }: { name: string }) {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: menuIcons[name] || '' }} />
}

const pillBase = 'btn-shimmer text-[14px] font-medium border border-emerald-400/30 text-emerald-400 px-5 py-2 rounded-full transition-colors cursor-pointer'

export default function LandingHeader({ ctaSchedule, ctaTrial }: Props) {
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>()
  const headerRef = useRef<HTMLDivElement>(null)

  const handleEnter = (menu: string) => { if (timeoutRef.current) clearTimeout(timeoutRef.current); setOpenMenu(menu) }
  const handleLeave = () => { timeoutRef.current = setTimeout(() => setOpenMenu(null), 200) }

  useEffect(() => {
    const fn = (e: MouseEvent) => { if (headerRef.current && !headerRef.current.contains(e.target as Node)) setOpenMenu(null) }
    document.addEventListener('click', fn)
    return () => document.removeEventListener('click', fn)
  }, [])

  return (
    <header className="w-full sticky top-0 z-50 bg-[#060609]/80 backdrop-blur-2xl" ref={headerRef}>
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3">

        <Link href="/" className="shrink-0">
          <Image src="/logo.png" alt="Yo Dijital" width={90} height={32} className="object-contain brightness-0 invert" />
        </Link>

        <nav className="hidden lg:flex items-center gap-2">
          {/* Ürün */}
          <div className="relative" onMouseEnter={() => handleEnter('product')} onMouseLeave={handleLeave}>
            <button className={`${pillBase} flex items-center gap-1.5 hover:bg-emerald-400/10`}>
              Ürün
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg>
            </button>
            {openMenu === 'product' && (
              <div className="absolute top-full left-0 mt-2 w-[560px] bg-[#1a1d21] border border-white/[0.06] rounded-2xl p-4 shadow-2xl shadow-black/50" onMouseEnter={() => handleEnter('product')} onMouseLeave={handleLeave}>
                <div className="grid grid-cols-3 gap-2">
                  {productItems.map((item, i) => (
                    <Link key={i} href={item.href} className="flex flex-col gap-1 p-3 rounded-xl hover:bg-white/[0.04] transition-colors group" onClick={() => setOpenMenu(null)}>
                      <div className="flex items-center gap-2 text-gray-200 group-hover:text-emerald-400 transition-colors">
                        <MIcon name={item.icon} />
                        <span className="text-[13px] font-semibold">{item.label}</span>
                      </div>
                      <p className="text-[12.5px] text-[#8a8f98] leading-relaxed">{item.desc}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Entegrasyonlar */}
          <div className="relative" onMouseEnter={() => handleEnter('integrations')} onMouseLeave={handleLeave}>
            <button className={`${pillBase} flex items-center gap-1.5 hover:bg-emerald-400/10`}>
              Entegrasyonlar
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg>
            </button>
            {openMenu === 'integrations' && (
              <div className="absolute top-full left-0 mt-2 w-[480px] bg-[#1a1d21] border border-white/[0.06] rounded-2xl p-4 shadow-2xl shadow-black/50" onMouseEnter={() => handleEnter('integrations')} onMouseLeave={handleLeave}>
                <div className="grid grid-cols-2 gap-2">
                  {integrationItems.map((item, i) => (
                    <Link key={i} href={item.href} className="flex flex-col gap-1 p-3 rounded-xl hover:bg-white/[0.04] transition-colors group" onClick={() => setOpenMenu(null)}>
                      <div className="flex items-center gap-2 text-gray-200 group-hover:text-emerald-400 transition-colors">
                        <MIcon name={item.icon} />
                        <span className="text-[13px] font-semibold">{item.label}</span>
                      </div>
                      <p className="text-[12.5px] text-[#8a8f98] leading-relaxed">{item.desc}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Link href="/pricing" className={`${pillBase} hover:bg-emerald-400/10`}>
            Fiyatlandırma
          </Link>
        </nav>

        <div className="flex items-center gap-2.5">
          <Link href="/login" className="hidden lg:inline-flex text-[14px] font-medium text-gray-400 hover:text-white px-3 py-2 transition-colors">
            Giriş Yap
          </Link>
          <ScheduleModal label={ctaSchedule} />
          <Link href="/register" className={`${pillBase} bg-emerald-400/10 hover:bg-emerald-400/15`}>
            {ctaTrial}
          </Link>
        </div>

      </div>
      <div className="h-[1px] bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
    </header>
  )
}
