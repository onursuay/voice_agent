import type { Metadata } from 'next'
import Image from 'next/image'
import LandingHeader from '@/components/landing/LandingHeader'

export const metadata: Metadata = {
  title: 'Çerez Politikası - VoiceAgent by Yo Dijital',
  description: 'VoiceAgent Çerez Politikası. Çerezleri nasıl kullandığımız ve yönetebileceğiniz hakkında bilgi edinin.',
}

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-[#131317] text-[#e5e1e7]">
      <LandingHeader ctaSchedule="Görüşme Planla" ctaTrial="14 Gün Ücretsiz Dene" />

      <main className="pt-[56px] min-h-screen bg-[#131317]">
        <section className="flex-1 px-6 py-3 max-w-5xl mx-auto">

          {/* Hero Header */}
          <header className="mb-4">
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tighter text-[#e5e1e7] mb-6 leading-[0.9]">
              Çerez Politikası
            </h1>
            <p className="text-lg text-[#bbcabf] leading-relaxed max-w-3xl font-light">
              VoiceAgent, hizmetlerimizi sağlamak, korumak ve geliştirmek için çerezler ve benzer teknolojiler kullanmaktadır. Bu politika, bu teknolojileri nasıl ve neden kullandığımızı açıklamaktadır.
            </p>
          </header>

          {/* Cookie Categories — Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
            {/* Essential */}
            <div className="p-8 rounded-xl bg-[#1b1b1f] flex flex-col gap-4 border border-white/[0.04]">
              <div className="w-12 h-12 rounded-lg bg-emerald-400/10 flex items-center justify-center">
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" className="text-emerald-400">
                  <path d="M11 2L3 6V11C3 15.97 6.58 20.74 11 22C15.42 20.74 19 15.97 19 11V6L11 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                  <path d="M7.5 11L10 13.5L14.5 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="text-lg font-bold tracking-tight text-[#e5e1e7]">Zorunlu Çerezler</h3>
              <p className="text-sm text-[#bbcabf] leading-relaxed">Platformun temel işlevleri için gereklidir. Oturum yönetimi ve güvenlik doğrulaması bu kategoriye girer.</p>
              <div className="mt-auto flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Her Zaman Aktif</span>
              </div>
            </div>

            {/* Analytics */}
            <div className="p-8 rounded-xl bg-[#1b1b1f] flex flex-col gap-4 border border-white/[0.04]">
              <div className="w-12 h-12 rounded-lg bg-emerald-400/10 flex items-center justify-center">
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" className="text-emerald-400">
                  <path d="M3 17L8 12L12 15L19 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M15 7H19V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="text-lg font-bold tracking-tight text-[#e5e1e7]">Analitik Çerezler</h3>
              <p className="text-sm text-[#bbcabf] leading-relaxed">Platformun nasıl kullanıldığını anlamamıza yardımcı olur. Tüm veriler anonimleştirilmiş ve toplulaştırılmıştır.</p>
              <div className="mt-auto">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Yapılandırılabilir</span>
              </div>
            </div>

            {/* Preference */}
            <div className="p-8 rounded-xl bg-[#1b1b1f] flex flex-col gap-4 border border-white/[0.04]">
              <div className="w-12 h-12 rounded-lg bg-[#45dfa4]/10 flex items-center justify-center">
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" className="text-[#45dfa4]">
                  <circle cx="11" cy="11" r="3" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M11 2V4M11 18V20M2 11H4M18 11H20M4.22 4.22L5.64 5.64M16.36 16.36L17.78 17.78M4.22 17.78L5.64 16.36M16.36 5.64L17.78 4.22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <h3 className="text-lg font-bold tracking-tight text-[#e5e1e7]">Tercih Çerezleri</h3>
              <p className="text-sm text-[#bbcabf] leading-relaxed">Dil tercihleri ve arayüz ayarları gibi kişisel tercihlerinizi hatırlar. Her ziyarette ayarları tekrar yapmanız gerekmez.</p>
              <div className="mt-auto">
                <span className="text-[10px] font-bold text-[#45dfa4] uppercase tracking-widest">Devre Dışı Bırakılabilir</span>
              </div>
            </div>
          </div>

          {/* Cookie Types Detail */}
          <div className="bg-[#1b1b1f] rounded-xl overflow-hidden border border-white/[0.04] mb-4">
            <div className="p-6 border-b border-white/[0.04] flex justify-between items-center">
              <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-[#bbcabf]">Çerez Türleri Detayı</h4>
              <span className="text-[10px] text-emerald-400 font-mono">VoiceAgent · 2025</span>
            </div>
            <div className="p-6 space-y-4">
              {[
                { label: 'Zorunlu Çerezler', desc: 'Platformun temel işlevleri için gereklidir. Bu çerezler olmadan hizmetlerimiz düzgün çalışmaz. Oturum yönetimi ve güvenlik doğrulaması bu kategoriye girer.' },
                { label: 'Analitik Çerezler', desc: 'Platformun nasıl kullanıldığını anlamamıza yardımcı olur. Bu veriler platformu geliştirmek için kullanılır. Hangi sayfaların en çok ziyaret edildiği ve kullanıcıların nasıl gezindiği bu kapsamda izlenir.' },
                { label: 'Tercih Çerezleri', desc: 'Dil tercihleri ve arayüz ayarları gibi kişisel tercihlerinizi hatırlar. Bu sayede her ziyaretinizde aynı ayarları tekrar yapmanız gerekmez.' },
              ].map((item, i) => (
                <div key={i} className="p-5 bg-[#353438]/20 rounded-lg border border-white/[0.03]">
                  <h5 className="text-sm font-bold text-[#e5e1e7] mb-2">{item.label}</h5>
                  <p className="text-sm text-[#bbcabf] leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Third-party & Managing */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-4">
            <div className="space-y-5">
              <h4 className="text-xs font-bold uppercase tracking-widest text-emerald-400 flex items-center gap-3">
                <span className="w-6 h-px bg-emerald-400/30"></span>
                Üçüncü Taraf Çerezleri
              </h4>
              <p className="text-[#bbcabf] text-sm leading-relaxed">Aşağıdaki üçüncü taraf hizmetleri çerez kullanabilir:</p>
              <ul className="space-y-3">
                {[
                  { name: 'Supabase', desc: 'Kimlik doğrulama ve veritabanı hizmetleri' },
                  { name: 'Meta Pixel', desc: 'Reklam performansı ölçümü (isteğe bağlı entegrasyon)' },
                  { name: 'Vercel Analytics', desc: 'Platform performans analizi' },
                ].map((item, i) => (
                  <li key={i} className="flex gap-3 items-start">
                    <span className="text-emerald-400 mt-0.5 shrink-0">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 7H11.5M11.5 7L8 3.5M11.5 7L8 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </span>
                    <span className="text-sm"><strong className="text-[#e5e1e7]">{item.name}:</strong> <span className="text-[#bbcabf]">{item.desc}</span></span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-[#353438] p-8 rounded-xl border border-white/[0.04]">
              <h4 className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-6 flex items-center gap-3">
                <span className="w-6 h-px bg-emerald-400/30"></span>
                Çerezleri Kontrol Etme
              </h4>
              <p className="text-[#bbcabf] text-sm leading-relaxed mb-4">
                Çerezleri tarayıcı ayarlarınızdan yönetebilir veya silebilirsiniz. Ancak zorunlu çerezleri devre dışı bırakmak platformun işlevselliğini etkileyebilir.
              </p>
              <div className="space-y-2">
                {[
                  'Chrome: Ayarlar → Gizlilik ve Güvenlik → Çerezler',
                  'Firefox: Seçenekler → Gizlilik ve Güvenlik',
                  'Safari: Tercihler → Gizlilik',
                ].map((item, i) => (
                  <p key={i} className="text-xs text-[#bbcabf] py-2 border-b border-white/[0.04] last:border-0">{item}</p>
                ))}
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="p-6 bg-[#1b1b1f] rounded-xl border border-white/[0.04]">
            <h4 className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-3 flex items-center gap-3">
              <span className="w-6 h-px bg-emerald-400/30"></span>
              İletişim
            </h4>
            <p className="text-[#bbcabf] text-sm">
              Çerez politikamız hakkında sorularınız için:{' '}
              <a href="mailto:info@yodijital.com" className="text-emerald-400 hover:text-emerald-300 underline underline-offset-4">info@yodijital.com</a>
            </p>
          </div>

        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#131317] border-t border-emerald-900/20 w-full py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center sm:items-start gap-2">
            <Image src="/logo.png" alt="Yo Dijital" width={50} height={18} className="object-contain brightness-0 invert opacity-60" />
            <span className="text-white text-xs font-light tracking-wide">© 2025 Yo Dijital. Tüm hakları saklıdır.</span>
          </div>
          <nav className="flex flex-wrap justify-center gap-6 text-xs text-white">
            <a href="/privacy-policy" className="hover:text-emerald-300 transition-colors underline underline-offset-4">Gizlilik Politikası</a>
            <a href="/cookie-policy" className="hover:text-emerald-300 transition-colors underline underline-offset-4">Çerez Politikası</a>
            <a href="/terms-of-service" className="hover:text-emerald-300 transition-colors underline underline-offset-4">Kullanım Koşulları</a>
            <a href="/data-deletion" className="hover:text-emerald-300 transition-colors underline underline-offset-4">Veri Silme</a>
          </nav>
        </div>
      </footer>
    </div>
  )
}
