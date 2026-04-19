import type { Metadata } from 'next'
import Image from 'next/image'
import LandingHeader from '@/components/landing/LandingHeader'

export const metadata: Metadata = {
  title: 'Veri Silme - VoiceAgent by Yo Dijital',
  description: 'VoiceAgent platformundan kişisel verilerinizin silinmesini talep edin.',
}

export default function DataDeletionPage() {
  return (
    <div className="min-h-screen bg-[#131317] text-[#e5e1e7]">
      <LandingHeader ctaSchedule="Görüşme Planla" ctaTrial="14 Gün Ücretsiz Dene" />

      <div className="min-h-screen pt-[50px] bg-[#1b1b1f]">
        <main className="px-6 py-3 md:px-16">
          <div className="max-w-4xl mx-auto">

            {/* Hero Header */}
            <header className="mb-4">
              <h1 className="text-5xl font-bold tracking-tighter text-[#e5e1e7] mb-6">Veri Silme Talebi</h1>
              <p className="text-[#bbcabf] text-sm leading-relaxed max-w-3xl">
                KVKK (Kişisel Verilerin Korunması Kanunu) ve GDPR kapsamında kişisel verilerinizin silinmesini talep etme hakkına sahipsiniz. Bu hak &quot;unutulma hakkı&quot; veya &quot;silme hakkı&quot; olarak da bilinir.
              </p>
            </header>

            {/* Process Steps */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
              {[
                {
                  step: '1',
                  title: 'Talep Gönderin',
                  desc: 'E-posta ile veya platform üzerinden veri silme talebinizi iletin.',
                  icon: (
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="text-emerald-400">
                      <path d="M14 3L4 7V14C4 19.55 8.4 24.74 14 26C19.6 24.74 24 19.55 24 14V7L14 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                      <path d="M10 14L13 17L18 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ),
                },
                {
                  step: '2',
                  title: 'İnceleme',
                  desc: 'Sistemlerimiz tüm depolanan veri parçalarını tarar ve eşler.',
                  icon: (
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="text-emerald-400">
                      <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M17 17L23 23" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  ),
                },
                {
                  step: '3',
                  title: 'Kalıcı Silme',
                  desc: 'Tüm üretim ve yedek kayıtlarının kalıcı ve geri alınamaz silimi gerçekleştirilir.',
                  icon: (
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="text-emerald-400">
                      <path d="M6 8H22M10 8V6H18V8M20 8L19 22H9L8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 12V18M16 12V18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  ),
                },
              ].map((item, i) => (
                <div key={i} className="p-6 rounded-xl bg-[#353438]/30 border border-white/[0.06]">
                  <div className="text-emerald-400 mb-4">{item.icon}</div>
                  <h3 className="font-bold text-[#e5e1e7] mb-2">{item.step}. {item.title}</h3>
                  <p className="text-sm text-[#bbcabf]">{item.desc}</p>
                </div>
              ))}
            </div>

            {/* How to request */}
            <section className="mb-3">
              <h2 className="text-xs font-bold tracking-widest uppercase text-emerald-400 mb-6 flex items-center gap-3">
                <span className="w-8 h-px bg-emerald-400/30"></span>
                Nasıl Talepte Bulunabilirsiniz?
              </h2>

              {/* Email CTA */}
              <div className="relative bg-[#1f1f23] p-8 md:p-10 rounded-2xl border border-emerald-900/20 shadow-2xl overflow-hidden mb-8">
                <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent"></div>
                <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                  <div>
                    <h3 className="text-xl font-bold text-[#e5e1e7] mb-1">E-posta ile Talep Gönderin</h3>
                    <p className="text-sm text-[#bbcabf]">&quot;Veri Silme Talebi&quot; konusuyla aşağıdaki adrese yazın:</p>
                  </div>
                  <div className="text-emerald-400/20">
                    <svg width="48" height="48" viewBox="0 0 48 48" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                      <path d="M24 4L4 14V24C4 35.05 13.07 45.33 24 48C34.93 45.33 44 35.05 44 24V14L24 4Z"/>
                    </svg>
                  </div>
                </div>
                <a
                  href="mailto:info@yodijital.com?subject=Veri%20Silme%20Talebi"
                  className="inline-flex items-center gap-3 mt-6 bg-gradient-to-br from-emerald-400 to-emerald-600 text-black font-bold px-8 py-3.5 rounded-lg shadow-lg hover:opacity-90 transition-all duration-300 text-sm"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 4L8 9L14 4M2 4H14V12H2V4Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  info@yodijital.com — Talep Gönder
                </a>
              </div>

              <p className="text-[#bbcabf] text-sm leading-relaxed mb-3">E-postanızda aşağıdaki bilgileri belirtin:</p>
              <ul className="space-y-2 mb-6">
                {['Ad ve soyadınız', 'Platformda kayıtlı e-posta adresiniz', 'Silmek istediğiniz veri türleri (hesap, lead verileri vb.)'].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-[#bbcabf]">
                    <span className="text-emerald-400 mt-0.5 shrink-0">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 7H11.5M11.5 7L8 3.5M11.5 7L8 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            {/* Remaining content sections */}
            <div className="space-y-8">
              <section>
                <h2 className="text-xs font-bold tracking-widest uppercase text-emerald-400 mb-5 flex items-center gap-3">
                  <span className="w-8 h-px bg-emerald-400/30"></span>
                  Hesabınızı Silme (Platform İçi)
                </h2>
                <p className="text-[#bbcabf] text-sm leading-relaxed">
                  Platforma giriş yaparak Ayarlar → Hesap bölümünden hesabınızı ve tüm verilerinizi kalıcı olarak silebilirsiniz. Bu işlem geri alınamaz.
                </p>
              </section>

              <section>
                <h2 className="text-xs font-bold tracking-widest uppercase text-emerald-400 mb-5 flex items-center gap-3">
                  <span className="w-8 h-px bg-emerald-400/30"></span>
                  Silinecek Veriler
                </h2>
                <ul className="space-y-2">
                  {[
                    'Hesap bilgileri (ad, e-posta, şifre)',
                    'Platformda depolanan lead ve müşteri verileri',
                    'Kullanım geçmişi ve aktivite kayıtları',
                    'Tercih ve ayar verileri',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-[#bbcabf]">
                      <span className="text-emerald-400 mt-0.5 shrink-0">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7L5.5 10.5L12 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </section>

              <div className="bg-emerald-400/5 p-5 rounded-lg flex gap-4 items-start border border-emerald-400/20">
                <span className="text-emerald-400 mt-0.5 shrink-0">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 2C5.13 2 2 5.13 2 9C2 12.87 5.13 16 9 16C12.87 16 16 12.87 16 9C16 5.13 12.87 2 9 2ZM9.75 13H8.25V8.25H9.75V13ZM9.75 6.75H8.25V5.25H9.75V6.75Z" fill="currentColor"/></svg>
                </span>
                <p className="text-xs leading-relaxed text-[#bbcabf]">
                  <strong className="text-emerald-400">Önemli:</strong> Silme işlemi geri alınamaz. Tüm veriler kalıcı olarak kaldırılır ve yöneticilerimiz tarafından dahi kurtarılamaz.
                </p>
              </div>

              <section>
                <h2 className="text-xs font-bold tracking-widest uppercase text-emerald-400 mb-5 flex items-center gap-3">
                  <span className="w-8 h-px bg-emerald-400/30"></span>
                  İşlem Süresi
                </h2>
                <p className="text-[#bbcabf] text-sm leading-relaxed">
                  Veri silme taleplerini 30 gün içinde işleme alırız. Talebi aldığımızı onaylayan bir e-posta gönderilecek ve işlem tamamlandığında bilgilendirileceksiniz.
                </p>
              </section>

              <section>
                <h2 className="text-xs font-bold tracking-widest uppercase text-emerald-400 mb-5 flex items-center gap-3">
                  <span className="w-8 h-px bg-emerald-400/30"></span>
                  Saklama Zorunluluğu Olan Veriler
                </h2>
                <p className="text-[#bbcabf] text-sm leading-relaxed">
                  Bazı veriler yasal yükümlülükler (vergi kayıtları, muhasebe bilgileri vb.) nedeniyle belirli bir süre saklanmak zorundadır. Bu tür veriler yasal saklama süresi dolduktan sonra silinir.
                </p>
              </section>

              <section>
                <h2 className="text-xs font-bold tracking-widest uppercase text-emerald-400 mb-5 flex items-center gap-3">
                  <span className="w-8 h-px bg-emerald-400/30"></span>
                  Meta (Facebook) Veri Silme
                </h2>
                <p className="text-[#bbcabf] text-sm leading-relaxed">
                  Meta platformu üzerinden uygulamamızla bağlantı kurduysanız Meta&apos;nın uygulama veri silme talebi özelliğini de kullanabilirsiniz. Bu durumda Meta&apos;dan aldığımız veriler de silinecektir.
                </p>
              </section>

              <section>
                <h2 className="text-xs font-bold tracking-widest uppercase text-emerald-400 mb-5 flex items-center gap-3">
                  <span className="w-8 h-px bg-emerald-400/30"></span>
                  Google Veri Silme
                </h2>
                <p className="text-[#bbcabf] text-sm leading-relaxed">
                  VoiceAgent, Google Sheets içeriğinizi kalıcı olarak depolamaz. Google Sheets içe aktarımı için kullanılan OAuth erişim tokenı kısa ömürlü bir çerezde saklanır ve 1 saat içinde otomatik olarak sona erer.{' '}
                  <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 underline underline-offset-4">
                    Google Hesabı İzinleri
                  </a>{' '}
                  üzerinden VoiceAgent&apos;ın Google hesabınıza erişimini istediğiniz zaman iptal edebilirsiniz.
                </p>
              </section>

              <section>
                <h2 className="text-xs font-bold tracking-widest uppercase text-emerald-400 mb-5 flex items-center gap-3">
                  <span className="w-8 h-px bg-emerald-400/30"></span>
                  İletişim
                </h2>
                <div className="p-6 bg-[#1f1f23] rounded-lg border border-white/[0.04] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <p className="font-bold text-[#e5e1e7] mb-1">Doğrudan iletişim mi tercih ediyorsunuz?</p>
                    <p className="text-sm text-[#bbcabf]">Veri silme süreciyle ilgili sorularınız için:</p>
                  </div>
                  <a href="mailto:info@yodijital.com" className="text-emerald-400 font-bold text-sm hover:underline underline-offset-8 transition-all whitespace-nowrap">
                    info@yodijital.com
                  </a>
                </div>
              </section>
            </div>

          </div>
        </main>
      </div>

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
