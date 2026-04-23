'use client'

import { useState } from 'react'
import { Link, useRouter, usePathname } from '@/i18n/navigation'
import { useLocale } from 'next-intl'
import Image from 'next/image'
import ScheduleModal from './ScheduleModal'
import DemoModal from './DemoModal'
import LandingHeader from './LandingHeader'

/* ─────────────────────────── i18n content ─────────────────────────── */

const content = {
  tr: {
    badge: 'VoiceAgent — AI Destekli Hepsi Bir Arada Lead Yönetimi',
    heroLine1: "Lead'lerinizi Toplayın,",
    heroLine2: 'Satışa Dönüştürün',
    heroSub:
      "Yo Dijital, Meta reklamlarından gelen tüm lead'lerinizi tek merkezden toplamanızı, CRM pipeline ile yönetmenizi ve yapay zeka destekli aramalarla satışa dönüştürmenizi sağlar. Satış ekipleri ve ajanslar için geliştirilen bu yapı sayesinde operasyonel yükünüz azalır, dönüşüm oranınız artar.",
    ctaTrial: '14 Gün Ücretsiz Dene',
    ctaSchedule: 'Görüşme Planla',
    ctaDemo: 'Panelin Demosu',
    trustLabel: 'Entegre olduğumuz lider platformlar',
    capTitle: 'Modern Satış Ekipleri İçin Tasarlandı',
    capSub: 'Tüm lead operasyonlarınızın yerini alan altı temel modül.',
    caps: [
      { title: 'Çok Kanallı Lead Toplama', desc: "Meta, WhatsApp, Instagram ve Messenger'dan gelen leadleri otomatik toplayın ve tek havuzda birleştirin.", svg: 'zap' },
      { title: 'CRM Pipeline', desc: "Aşama bazlı satış takibi ile hangi lead'in nerede olduğunu anlık görün, tıklayarak ilerletin.", svg: 'layers' },
      { title: 'AI Destekli Arama', desc: "Yapay zeka ile lead'lerinizi otomatik arayın, görüşme notları alın ve akıllı takip yapın.", svg: 'phone' },
      { title: 'Toplu E-posta', desc: 'Segmentlere göre kişiselleştirilmiş e-posta kampanyaları gönderin, açılma oranlarını takip edin.', svg: 'mail' },
      { title: 'Detaylı Analitik', desc: 'Hangi kaynak en çok lead getiriyor? Hangi temsilci en iyi kapanıyor? Tüm raporlar tek ekranda.', svg: 'chart' },
      { title: 'Otomasyon Kuralları', desc: "Lead geldiğinde otomatik ata, bildirim gönder, e-posta çalıştır. Kural motoru ile sürecinizi otomatikleştirin.", svg: 'settings' },
    ],
    perfTitle: 'Ölçülebilir Sonuçlar',
    perfSub: 'Gerçek metrikler. Gerçek büyüme. Hiç uyumayan yapay zeka ile.',
    perfs: [
      { metric: '%60', label: 'Daha Hızlı Yanıt', desc: 'Otomatik atama ile leadler anında doğru temsilciye ulaşır, hiçbir fırsat kaçmaz.' },
      { metric: '3x', label: 'Dönüşüm Artışı', desc: 'Zamanında takip ve AI destekli aramalar satış dönüşümünü üç katına çıkarır.' },
      { metric: '%80', label: 'Zaman Tasarrufu', desc: 'Otomasyon raporlama, atama ve takip süreçlerini tamamen üstlenir.' },
    ],
    cmdTitle: 'Komuta Merkeziniz',
    cmdSub: 'Tek ekran. Tüm kanallar. Tam kontrol.',
    cmds: [
      { title: 'Tek Tıkla Aksiyon', desc: 'Tüm leadleri anında aşamaya taşıyın, atayın veya e-posta gönderin.' },
      { title: 'Tahmine Dayalı Uyarılar', desc: 'AI soğuyan leadleri tespit eder ve satış fırsatları kaybolmadan bildirir.' },
      { title: 'Birleşik Görünüm', desc: "Meta, WhatsApp ve Instagram'dan gelen tüm leadler tek panoda yan yana." },
      { title: 'Akıllı Otomasyon', desc: 'Performansa göre lead atama ve takip kurallarını otomatik çalıştıran motor.' },
    ],
    ctaBottom: 'Lead yönetiminizi dönüştürmeye hazır mısınız?',
    ctaBottomSub: '14 günlük ücretsiz denemenizi başlatın. Kredi kartı gerekmez.',
    panelTitle: 'Lead Yönetim Paneli',
    panelPeriod: 'Son 30 gün',
    panelStatus: 'Tüm sistemler aktif',
    panelTrend: 'Lead Trendi',
    panelConv: 'Dönüşüm',
    kpis: [
      { label: 'Toplam Lead', value: '1,248', delta: '+%18' },
      { label: 'Dönüşüm', value: '%24', delta: '+%6' },
      { label: 'Aktif Fırsat', value: '342', delta: '+%12' },
      { label: 'Ort. Yanıt', value: '4dk', delta: '-%60' },
    ],
    panelAI: 'AI Optimizasyon: Aktif',
    panelPlatforms: '4 kanal senkron',
    footer: '2025 Yo Dijital. Tüm hakları saklıdır.',
    legalLinks: [
      { label: 'Gizlilik Politikası', href: '/privacy-policy' },
      { label: 'Kullanım Koşulları', href: '/terms-of-service' },
      { label: 'Çerez Politikası', href: '/cookie-policy' },
      { label: 'Veri Silme', href: '/data-deletion' },
    ],
  },
  en: {
    badge: 'VoiceAgent — AI-Powered All-in-One Lead Management',
    heroLine1: 'Collect Your Leads,',
    heroLine2: 'Convert to Sales',
    heroSub:
      'Yo Dijital helps you collect all your leads from Meta ads in one place, manage them through a CRM pipeline, and convert them to sales with AI-powered calls. Designed for sales teams and agencies to reduce operational load and increase conversion rates.',
    ctaTrial: '14-Day Free Trial',
    ctaSchedule: 'Schedule a Meeting',
    ctaDemo: 'Panel Demo',
    trustLabel: 'Leading platforms we integrate with',
    capTitle: 'Designed for Modern Sales Teams',
    capSub: 'Six core modules that replace all your lead operations.',
    caps: [
      { title: 'Multi-Channel Lead Collection', desc: 'Automatically collect leads from Meta, WhatsApp, Instagram, and Messenger into a single pool.', svg: 'zap' },
      { title: 'CRM Pipeline', desc: 'See where each lead is in real-time with stage-based sales tracking, advance with a click.', svg: 'layers' },
      { title: 'AI-Powered Calling', desc: 'Automatically call your leads with AI, take meeting notes, and do smart follow-ups.', svg: 'phone' },
      { title: 'Bulk Email', desc: 'Send personalized email campaigns by segment and track open rates.', svg: 'mail' },
      { title: 'Detailed Analytics', desc: 'Which source brings the most leads? Who closes best? All reports in one screen.', svg: 'chart' },
      { title: 'Automation Rules', desc: 'Auto-assign, send notifications, run emails when a lead arrives. Automate with the rule engine.', svg: 'settings' },
    ],
    perfTitle: 'Measurable Results',
    perfSub: 'Real metrics. Real growth. With AI that never sleeps.',
    perfs: [
      { metric: '60%', label: 'Faster Response', desc: 'With automatic assignment, leads instantly reach the right rep — no opportunity missed.' },
      { metric: '3x', label: 'Conversion Boost', desc: 'Timely follow-ups and AI-powered calls triple your sales conversion rate.' },
      { metric: '80%', label: 'Time Saved', desc: 'Automation fully handles reporting, assignment, and follow-up processes.' },
    ],
    cmdTitle: 'Your Command Center',
    cmdSub: 'One screen. All channels. Full control.',
    cmds: [
      { title: 'One-Click Action', desc: 'Instantly move all leads to a stage, assign, or send an email.' },
      { title: 'Predictive Alerts', desc: 'AI detects cooling leads and notifies before sales opportunities are lost.' },
      { title: 'Unified View', desc: 'All leads from Meta, WhatsApp, and Instagram side by side in one dashboard.' },
      { title: 'Smart Automation', desc: 'Engine that automatically runs lead assignment and follow-up rules by performance.' },
    ],
    ctaBottom: 'Ready to transform your lead management?',
    ctaBottomSub: 'Start your 14-day free trial. No credit card required.',
    panelTitle: 'Lead Management Panel',
    panelPeriod: 'Last 30 days',
    panelStatus: 'All systems active',
    panelTrend: 'Lead Trend',
    panelConv: 'Conversion',
    kpis: [
      { label: 'Total Leads', value: '1,248', delta: '+18%' },
      { label: 'Conversion', value: '24%', delta: '+6%' },
      { label: 'Active Deals', value: '342', delta: '+12%' },
      { label: 'Avg. Response', value: '4min', delta: '-60%' },
    ],
    panelAI: 'AI Optimization: Active',
    panelPlatforms: '4 channels synced',
    footer: '2025 Yo Dijital. All rights reserved.',
    legalLinks: [
      { label: 'Privacy Policy', href: '/en/privacy-policy' },
      { label: 'Terms of Service', href: '/en/terms-of-service' },
      { label: 'Cookie Policy', href: '/en/cookie-policy' },
      { label: 'Data Deletion', href: '/en/data-deletion' },
    ],
  },
}

type Lang = keyof typeof content

/* ─────────────────────────── Icons ─────────────────────────── */

const icons: Record<string, string> = {
  zap: '<polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2"/>',
  layers: '<path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>',
  phone: '<path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.22 1.18 2 2 0 012.18 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.09a16 16 0 006 6l.56-.56a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>',
  mail: '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>',
  chart: '<path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/>',
  settings:
    '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>',
  arrow: '<path d="M5 12h14"/><path d="M12 5l7 7-7 7"/>',
}

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      dangerouslySetInnerHTML={{ __html: icons[name] || '' }}
    />
  )
}

const bars = [35, 52, 40, 68, 48, 78, 55, 85, 45, 92, 62, 75, 50, 88, 58, 82]

const langMeta: Record<Lang, { flag: string; label: string }> = {
  tr: { flag: '🇹🇷', label: 'Türkçe' },
  en: { flag: '🇬🇧', label: 'English' },
}

/* ─────────────────────────── Component ─────────────────────────── */

export default function LandingContent() {
  const routeLocale = useLocale() as Lang
  const router = useRouter()
  const pathname = usePathname()
  const lang: Lang = routeLocale === 'en' ? 'en' : 'tr'
  const setLang = (l: Lang) => {
    if (l === lang) return
    router.replace(pathname, { locale: l })
  }
  const [dropOpen, setDropOpen] = useState(false)

  const c = content[lang]
  const other: Lang = lang === 'tr' ? 'en' : 'tr'

  return (
    <div className="min-h-screen bg-[#060609] text-white flex flex-col overflow-x-hidden" style={{ fontSize: '16px' }}>
      {/* Shimmer animation */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .btn-shimmer { position: relative; overflow: hidden; }
          .btn-shimmer::after {
            content: '';
            position: absolute;
            top: 0; left: -60%; width: 60%; height: 100%;
            background: linear-gradient(90deg, transparent, rgba(16,185,129,0.18), transparent);
            animation: shimmer-slide 6s ease-in-out infinite;
            opacity: 0;
          }
          .btn-shimmer:nth-child(1)::after { animation-delay: 0s; }
          .btn-shimmer:nth-child(2)::after { animation-delay: 2s; }
          .btn-shimmer:nth-child(3)::after { animation-delay: 4s; }
          @keyframes shimmer-slide {
            0% { left: -60%; opacity: 0; }
            5% { opacity: 1; }
            25% { left: 100%; opacity: 1; }
            30% { opacity: 0; }
            100% { opacity: 0; left: 100%; }
          }
        `,
      }} />

      {/* ═══════════ HEADER ═══════════ */}
      <LandingHeader lang={lang} ctaSchedule={c.ctaSchedule} ctaTrial={c.ctaTrial} ctaDemo={c.ctaDemo} />

      {/* ═══════════ HERO ═══════════ */}
      <section className="relative w-full px-6 pt-10 pb-8 md:pt-16 md:pb-10 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-[15%] left-1/2 -translate-x-1/2 w-[1000px] h-[700px] rounded-full blur-[160px]" style={{ background: 'radial-gradient(ellipse, rgba(16,185,129,0.07) 0%, rgba(20,184,166,0.03) 50%, transparent 80%)' }} />
        </div>
        <div className="relative max-w-7xl mx-auto text-center">
          <div className="btn-shimmer inline-flex items-center gap-2.5 text-[14px] font-medium text-emerald-400/90 border border-emerald-400/20 bg-emerald-400/[0.06] px-5 py-2.5 rounded-full mb-6">
            <Image src="/ai-brain.png" alt="" width={18} height={18} style={{ filter: 'brightness(0) saturate(100%) invert(73%) sepia(52%) saturate(456%) hue-rotate(108deg) brightness(95%) contrast(91%)' }} />
            {c.badge}
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[4.5rem] font-black leading-[1.1] tracking-tight text-white mb-5">
            {c.heroLine1}{' '}
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">{c.heroLine2}</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300 leading-relaxed mb-8 max-w-4xl mx-auto">{c.heroSub}</p>
          <div className="flex flex-wrap justify-center items-center gap-4">
            <Link href="/register" className="btn-shimmer inline-flex items-center justify-center font-semibold text-base px-10 py-4 rounded-full transition-all min-w-[220px] bg-gradient-to-r from-emerald-500 to-teal-500 text-black hover:from-emerald-400 hover:to-teal-400 shadow-[0_0_30px_rgba(16,185,129,0.2)] hover:shadow-[0_0_40px_rgba(16,185,129,0.3)]">
              {c.ctaTrial}
            </Link>
            <ScheduleModal label={c.ctaSchedule} variant="hero" />
            <DemoModal label={c.ctaDemo} variant="hero" />
          </div>
        </div>
      </section>

      {/* ═══════════ MOCK DASHBOARD PANEL ═══════════ */}
      <section className="w-full px-6 pb-8 md:pb-10">
        <div className="max-w-4xl mx-auto relative">
          <div className="absolute -inset-6 rounded-3xl blur-2xl" style={{ background: 'radial-gradient(ellipse at center, rgba(16,185,129,0.06), transparent 70%)' }} />
          <div className="relative bg-white/[0.025] border border-white/[0.08] rounded-2xl backdrop-blur-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                <span className="text-sm font-semibold text-gray-200">{c.panelTitle}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-emerald-400 font-medium">{c.panelAI}</span>
                <span className="text-xs text-gray-600">{c.panelPeriod}</span>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-4 gap-2">
                {c.kpis.map((kpi, i) => (
                  <div key={i} className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-3">
                    <p className="text-sm text-gray-500 mb-0.5">{kpi.label}</p>
                    <p className="text-xl font-bold text-white leading-tight">{kpi.value}</p>
                    <p className="text-xs text-emerald-400 font-medium">{kpi.delta}</p>
                  </div>
                ))}
              </div>
              <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500 font-medium">{c.panelTrend}</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-400/60" />
                    <span className="text-xs text-gray-600">{c.panelConv}</span>
                  </div>
                </div>
                <div className="h-28 flex items-end gap-[3px]">
                  {bars.map((h, i) => (
                    <div key={i} className="flex-1 rounded-t" style={{ height: `${h}%`, background: `linear-gradient(to top, rgba(16,185,129,0.15), rgba(16,185,129,${0.3 + h * 0.006}))` }} />
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Image src="/platform-icons/meta.svg" alt="Meta" width={14} height={14} className="brightness-0 invert opacity-40" />
                  <span className="text-xs text-gray-600">{c.panelPlatforms}</span>
                </div>
                <span className="text-xs text-emerald-400/70 font-medium">{c.panelStatus}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ TRUST STRIP ═══════════ */}
      <section id="entegrasyonlar" className="w-full border-y border-white/[0.04] py-6 px-6 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs text-gray-600 uppercase tracking-[0.2em] text-center mb-4 font-medium">{c.trustLabel}</p>
          <div className="flex flex-wrap justify-center items-center gap-3">
            {[{ label: 'Meta Ads', icon: '/platform-icons/meta.svg' }].map((p, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-gray-400 bg-white/[0.03] border border-white/[0.06] px-4 py-1.5 rounded-full">
                <Image src={p.icon} alt={p.label} width={14} height={14} className="brightness-0 invert opacity-50" />
                <span className="font-medium">{p.label}</span>
              </div>
            ))}
            {['WhatsApp', 'Instagram', 'Messenger', 'Zapier', 'Webhook'].map((label, i) => (
              <span key={i} className="text-sm font-medium text-gray-500 bg-white/[0.03] border border-white/[0.06] px-4 py-1.5 rounded-full">{label}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ AI CAPABILITIES ═══════════ */}
      <section id="ozellikler" className="relative w-full px-6 py-14 md:py-20">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-1/2 left-1/4 w-[500px] h-[500px] bg-emerald-500/[0.03] rounded-full blur-[120px]" />
        </div>
        <div className="relative max-w-7xl mx-auto">
          <div className="text-center mb-8 md:mb-10">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">{c.capTitle}</h2>
            <p className="text-base text-gray-500 max-w-xl mx-auto leading-relaxed">{c.capSub}</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {c.caps.map((cap, i) => (
              <div key={i} className="group bg-white/[0.025] border border-white/[0.06] rounded-2xl p-6 hover:border-emerald-400/20 hover:bg-white/[0.04] hover:shadow-[0_0_30px_rgba(16,185,129,0.06)] transition-all duration-300">
                <div className="w-10 h-10 rounded-xl bg-emerald-400/[0.08] border border-emerald-400/15 flex items-center justify-center mb-4 text-emerald-400 group-hover:shadow-[0_0_20px_rgba(16,185,129,0.1)] transition-all">
                  <Icon name={cap.svg} size={18} />
                </div>
                <h3 className="font-semibold text-white mb-1.5">{cap.title}</h3>
                <p className="text-base text-gray-300 leading-relaxed">{cap.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ PERFORMANCE ═══════════ */}
      <section className="relative w-full px-6 py-12 md:py-16 bg-white/[0.015]">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-teal-500/[0.04] rounded-full blur-[120px]" />
        </div>
        <div className="relative max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">{c.perfTitle}</h2>
            <p className="text-base text-gray-500 max-w-xl mx-auto leading-relaxed">{c.perfSub}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {c.perfs.map((perf, i) => (
              <div key={i} className="relative bg-gradient-to-b from-white/[0.04] to-white/[0.02] border border-white/[0.06] rounded-2xl p-7 text-center overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-b from-emerald-400/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative">
                  <p className="text-4xl md:text-5xl font-black bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent mb-1.5">{perf.metric}</p>
                  <p className="text-base font-semibold text-white mb-2">{perf.label}</p>
                  <p className="text-base text-gray-300 leading-relaxed">{perf.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ COMMAND CENTER ═══════════ */}
      <section className="w-full px-6 py-12 md:py-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">{c.cmdTitle}</h2>
            <p className="text-base text-gray-500 max-w-xl mx-auto leading-relaxed">{c.cmdSub}</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {c.cmds.map((cmd, i) => (
              <div key={i} className="bg-white/[0.025] border border-white/[0.06] rounded-2xl p-5 hover:border-emerald-400/10 transition-all duration-300">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400/10 to-teal-400/[0.06] border border-white/[0.06] flex items-center justify-center mb-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
                </div>
                <h4 className="font-semibold text-white text-base mb-1.5">{cmd.title}</h4>
                <p className="text-base text-gray-300 leading-relaxed">{cmd.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ BOTTOM CTA ═══════════ */}
      <section className="relative w-full px-6 py-14 md:py-20">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full blur-[150px]" style={{ background: 'radial-gradient(ellipse, rgba(16,185,129,0.08), transparent 70%)' }} />
        </div>
        <div className="relative max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">{c.ctaBottom}</h2>
          <p className="text-base text-gray-500 mb-6 max-w-md mx-auto leading-relaxed">{c.ctaBottomSub}</p>
          <div className="flex flex-wrap justify-center items-center gap-3">
            <Link href="/register" className="btn-shimmer inline-flex items-center gap-2 text-[14px] font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 text-black hover:from-emerald-400 hover:to-teal-400 px-7 py-3 rounded-full transition-all shadow-[0_0_30px_rgba(16,185,129,0.2)]">
              {c.ctaTrial} <Icon name="arrow" size={14} />
            </Link>
            <ScheduleModal label={c.ctaSchedule} variant="bottom" />
            <DemoModal label={c.ctaDemo} variant="bottom" />
          </div>
        </div>
      </section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer className="w-full border-t border-white/[0.05] py-6 px-6 bg-[#060609]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
          {/* Copyright */}
          <div className="flex items-center gap-3 text-gray-500">
            <Image src="/logo.png" alt="Yo Dijital" width={50} height={18} className="object-contain brightness-0 invert opacity-40" />
            <span>{c.footer}</span>
          </div>

          {/* Legal links + lang switcher */}
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            <nav className="flex flex-wrap justify-center sm:justify-end gap-x-5 gap-y-2 text-gray-500">
              {c.legalLinks.map((l) => (
                <a key={l.href} href={l.href} className="hover:text-gray-300 transition-colors">{l.label}</a>
              ))}
            </nav>

            {/* Language dropdown */}
            <div className="relative">
              <button
                onClick={() => setDropOpen((v) => !v)}
                className="flex items-center gap-1.5 text-gray-400 hover:text-gray-200 transition-colors border border-white/[0.10] hover:border-white/[0.20] bg-white/[0.03] hover:bg-white/[0.06] rounded-lg px-3 py-1.5 text-sm"
              >
                {/* Globe icon */}
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="opacity-70">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M2 12h20"/>
                  <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
                </svg>
                <span>{langMeta[lang].label}</span>
                <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`opacity-60 transition-transform duration-200 ${dropOpen ? 'rotate-180' : ''}`}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {dropOpen && (
                <div className="absolute bottom-full mb-2 right-0 bg-[#13141a] border border-white/[0.10] rounded-xl overflow-hidden shadow-2xl shadow-black/60 z-50 min-w-[150px] py-1">
                  {(['tr', 'en'] as Lang[]).map((l) => (
                    <button
                      key={l}
                      onClick={() => { setLang(l); setDropOpen(false) }}
                      className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${
                        lang === l
                          ? 'text-white bg-white/[0.06]'
                          : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
                      }`}
                    >
                      <span className="text-base leading-none">{langMeta[l].flag}</span>
                      <span>{langMeta[l].label}</span>
                      {lang === l && (
                        <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="ml-auto text-emerald-400">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
