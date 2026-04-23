import type { Metadata } from 'next'
import Image from 'next/image'
import LandingHeader from '@/components/landing/LandingHeader'

export const metadata: Metadata = {
  title: 'Gizlilik Politikası - VoiceAgent by Yo Dijital',
  description: 'VoiceAgent Gizlilik Politikası. Verilerinizi nasıl topladığımız, kullandığımız ve koruduğumuz hakkında bilgi edinin.',
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#131317] text-[#e5e1e7]">
      <LandingHeader ctaSchedule="Görüşme Planla" ctaTrial="14 Gün Ücretsiz Dene" />

      <div className="min-h-screen pt-[32px] bg-[#1b1b1f]">
        <main className="py-3 px-4 md:px-12">
          <div className="max-w-[960px] mx-auto">

            {/* Main card */}
            <div className="bg-[#353438] rounded-xl border border-white/[0.06] shadow-2xl p-8 md:p-16 relative overflow-hidden">

              {/* Editorial Header */}
              <header className="mb-4">
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tighter text-[#e5e1e7] mb-8 leading-tight">
                  Gizlilik Politikası.
                </h1>
                <p className="text-[#bbcabf] text-sm leading-relaxed max-w-2xl">
                  YO Dijital Medya A.Ş. olarak gizliliğinizi korumaya kararlıyız. Bu politika, verilerinizi nasıl topladığımızı, kullandığımızı ve koruduğumuzu açıklamaktadır.
                </p>
              </header>

              {/* Document Body */}
              <div className="space-y-4 text-[#bbcabf] leading-relaxed text-sm">

                <section>
                  <h2 className="text-xs font-bold tracking-widest uppercase text-emerald-400 mb-6 flex items-center gap-3">
                    <span className="w-8 h-px bg-emerald-400/30"></span>
                    01. Giriş
                  </h2>
                  <p>
                    YO Dijital Medya A.Ş. (&quot;VoiceAgent&quot;, &quot;biz&quot;, &quot;bizim&quot; veya &quot;şirketimiz&quot;) gizliliğinizi korumaya kararlıdır. Bu Gizlilik Politikası, <strong className="text-[#e5e1e7]">voiceagent.yodijital.com</strong> adresindeki platformumuzu (&quot;Hizmet&quot;) kullandığınızda kişisel verilerinizi nasıl topladığımızı, kullandığımızı, açıkladığımızı ve koruduğumuzu açıklamaktadır.
                  </p>
                </section>

                <section>
                  <h2 className="text-xs font-bold tracking-widest uppercase text-emerald-400 mb-6 flex items-center gap-3">
                    <span className="w-8 h-px bg-emerald-400/30"></span>
                    02. Topladığımız Bilgiler
                  </h2>
                  <p className="mb-4">Aşağıdaki bilgi kategorilerini toplayabiliriz:</p>
                  <ul className="space-y-3 mt-4">
                    <li className="flex items-start gap-3 p-4 bg-[#1b1b1f] rounded-lg border border-white/[0.04]">
                      <span className="text-emerald-400 mt-0.5">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8L6.5 11.5L13 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </span>
                      <span><strong className="text-[#e5e1e7]">Hesap bilgileri:</strong> Ad, e-posta adresi, şirket adı ve şifre.</span>
                    </li>
                    <li className="flex items-start gap-3 p-4 bg-[#1b1b1f] rounded-lg border border-white/[0.04]">
                      <span className="text-emerald-400 mt-0.5">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8L6.5 11.5L13 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </span>
                      <span><strong className="text-[#e5e1e7]">Kullanım verileri:</strong> Platform etkileşimleri, oturum süreleri ve özellik kullanımı.</span>
                    </li>
                    <li className="flex items-start gap-3 p-4 bg-[#1b1b1f] rounded-lg border border-white/[0.04]">
                      <span className="text-emerald-400 mt-0.5">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8L6.5 11.5L13 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </span>
                      <span><strong className="text-[#e5e1e7]">Lead verileri:</strong> Entegre platformlardan (Meta, WhatsApp vb.) otomatik toplanan veya kullanıcı tarafından içe aktarılan müşteri adayı bilgileri.</span>
                    </li>
                    <li className="flex items-start gap-3 p-4 bg-[#1b1b1f] rounded-lg border border-white/[0.04]">
                      <span className="text-emerald-400 mt-0.5">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8L6.5 11.5L13 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </span>
                      <span><strong className="text-[#e5e1e7]">Teknik veriler:</strong> IP adresi, tarayıcı türü, cihaz bilgileri ve çerezler.</span>
                    </li>
                    <li className="flex items-start gap-3 p-4 bg-[#1b1b1f] rounded-lg border border-white/[0.04]">
                      <span className="text-emerald-400 mt-0.5">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8L6.5 11.5L13 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </span>
                      <span><strong className="text-[#e5e1e7]">Google Sheets / Drive verileri:</strong> Google hesabınızı tablo verileri içe aktarmak için bağladığınızda, yalnızca açıkça seçtiğiniz dosyalara ve sayfa içeriklerine erişiriz. Ayrıntılar için Bölüm 4&apos;e bakın.</span>
                    </li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xs font-bold tracking-widest uppercase text-emerald-400 mb-6 flex items-center gap-3">
                    <span className="w-8 h-px bg-emerald-400/30"></span>
                    03. Bilgileri Nasıl Kullanıyoruz
                  </h2>
                  <ul className="space-y-3">
                    {[
                      'Hizmetlerimizi sunmak, sürdürmek ve geliştirmek.',
                      'Hesabınızı yönetmek ve müşteri desteği sağlamak.',
                      'Hizmet bildirimleri ve ürün güncellemeleri göndermek.',
                      'Yasal yükümlülüklerimizi yerine getirmek.',
                      'Dolandırıcılığı önlemek ve platform güvenliğini sağlamak.',
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="text-emerald-400 mt-0.5 shrink-0">
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8L6.5 11.5L13 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </section>

                <section>
                  <h2 className="text-xs font-bold tracking-widest uppercase text-emerald-400 mb-6 flex items-center gap-3">
                    <span className="w-8 h-px bg-emerald-400/30"></span>
                    04. Google API Hizmetleri — Sınırlı Kullanım Beyanı
                  </h2>
                  <p className="mb-5">
                    VoiceAgent&apos;ın Google API&apos;lerinden aldığı bilgilerin kullanımı ve diğer uygulamalara aktarımı, Sınırlı Kullanım gereksinimleri dahil olmak üzere{' '}
                    <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 underline underline-offset-4">
                      Google API Hizmetleri Kullanıcı Verisi Politikası
                    </a>
                    &apos;na uygun olacaktır. Özellikle:
                  </p>
                  <div className="p-6 bg-[#1b1b1f] rounded-lg border-l-4 border-emerald-400/40 space-y-3 text-sm">
                    <div><strong className="text-[#e5e1e7]">İstenen kapsamlar:</strong> <code className="bg-white/10 px-1.5 py-0.5 rounded text-xs text-emerald-300">spreadsheets.readonly</code> ve <code className="bg-white/10 px-1.5 py-0.5 rounded text-xs text-emerald-300">drive.readonly</code> — tablo dosyalarını listelemek ve içe aktarma için seçilen sayfa içeriklerini okumak amacıyla kullanılır.</div>
                    <div><strong className="text-[#e5e1e7]">Kullanım amacı:</strong> Google kullanıcı verileri yalnızca VoiceAgent CRM&apos;e tablo içe aktarma özelliğini etkinleştirmek için kullanılır.</div>
                    <div><strong className="text-[#e5e1e7]">Üçüncü taraf aktarımı yok:</strong> Google kullanıcı verileri, kanunen gerekli olmadıkça üçüncü taraflara aktarılmaz, satılmaz veya ifşa edilmez.</div>
                    <div><strong className="text-[#e5e1e7]">Reklam kullanımı yok:</strong> Google kullanıcı verileri reklam gösterimi, yeniden hedefleme veya kişiselleştirilmiş reklamcılık için kullanılmaz.</div>
                    <div><strong className="text-[#e5e1e7]">Veri satışı yok:</strong> Google kullanıcı verileri hiçbir koşulda herhangi bir tarafa satılmaz.</div>
                    <div><strong className="text-[#e5e1e7]">İnsan erişim kısıtlamaları:</strong> VoiceAgent personeli, kanunen zorunlu olmadıkça veya güvenlik amaçları dışında Google Sheets içeriğinizi okumaz.</div>
                    <div><strong className="text-[#e5e1e7]">Token depolama:</strong> Google OAuth erişim tokenınız kısa ömürlü, httpOnly bir çerezde saklanır (1 saat içinde sona erer).</div>
                    <div><strong className="text-[#e5e1e7]">İptal:</strong> <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 underline underline-offset-4">Google Hesabı İzinleri</a> üzerinden erişimi istediğiniz zaman iptal edebilirsiniz.</div>
                  </div>
                </section>

                <section>
                  <h2 className="text-xs font-bold tracking-widest uppercase text-emerald-400 mb-6 flex items-center gap-3">
                    <span className="w-8 h-px bg-emerald-400/30"></span>
                    05. Meta Platform Entegrasyonu
                  </h2>
                  <p>
                    Meta (Facebook/Instagram) hesabınızı bağladığınızda, Meta Platform API&apos;si aracılığıyla reklam hesabı verilerine, sayfa verilerine ve lead form gönderimlere erişiriz. Tüm Meta verileri yalnızca lead yönetimi ve raporlama özellikleri sağlamak amacıyla kullanılır. Veriler üçüncü taraflara aktarılmaz, satılmaz veya reklam faaliyetlerinizle ilgisiz amaçlar için kullanılmaz.
                  </p>
                </section>

                <section>
                  <h2 className="text-xs font-bold tracking-widest uppercase text-emerald-400 mb-6 flex items-center gap-3">
                    <span className="w-8 h-px bg-emerald-400/30"></span>
                    06. Veri Paylaşımı
                  </h2>
                  <p className="mb-4">Kişisel verilerinizi satmıyoruz. Yalnızca aşağıdaki durumlarda paylaşabiliriz:</p>
                  <ul className="space-y-2">
                    {[
                      'Hizmet sağlayıcılarla (barındırma, e-posta teslimatı, analitik) ihtiyaç bazında.',
                      'Kanunen zorunlu olduğunda yetkili makamlarla.',
                      'Birleşme, satın alma veya varlık satışı kapsamında.',
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="text-emerald-400 mt-0.5 shrink-0">
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 7H11.5M11.5 7L8 3.5M11.5 7L8 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </section>

                <section>
                  <h2 className="text-xs font-bold tracking-widest uppercase text-emerald-400 mb-6 flex items-center gap-3">
                    <span className="w-8 h-px bg-emerald-400/30"></span>
                    07. Veri Güvenliği
                  </h2>
                  <p>
                    Verilerinizi yetkisiz erişim, değiştirme, ifşa veya imhaya karşı korumak için SSL/TLS şifreleme, güvenli sunucu tarafı token depolama ve düzenli güvenlik incelemeleri dahil endüstri standardı güvenlik önlemleri uyguluyoruz.
                  </p>
                </section>

                <section>
                  <h2 className="text-xs font-bold tracking-widest uppercase text-emerald-400 mb-6 flex items-center gap-3">
                    <span className="w-8 h-px bg-emerald-400/30"></span>
                    08. Veri Saklama
                  </h2>
                  <p>
                    İçe aktarılan lead verileri hesabınız aktif olduğu sürece saklanır. Önbelleğe alınan Google Sheets verileri kalıcı olarak depolanmaz — sayfa içeriği yalnızca içe aktarma oturumu sırasında bellekte işlenir. OAuth tokenlar otomatik olarak sona erer ve eyleminiz olmadan yenilenmez.
                  </p>
                </section>

                <section>
                  <h2 className="text-xs font-bold tracking-widest uppercase text-emerald-400 mb-6 flex items-center gap-3">
                    <span className="w-8 h-px bg-emerald-400/30"></span>
                    09. Haklarınız
                  </h2>
                  <p>
                    GDPR, KVKK ve geçerli gizlilik yasaları kapsamında kişisel verilerinize erişim, düzeltme, silme, kısıtlama veya taşıma hakkına sahipsiniz. Bu hakları kullanmak için{' '}
                    <a href="mailto:info@yodijital.com" className="text-emerald-400 hover:text-emerald-300 underline underline-offset-4">info@yodijital.com</a>{' '}
                    adresiyle iletişime geçin.
                  </p>
                </section>

                <section>
                  <h2 className="text-xs font-bold tracking-widest uppercase text-emerald-400 mb-6 flex items-center gap-3">
                    <span className="w-8 h-px bg-emerald-400/30"></span>
                    10. Politika Güncellemeleri
                  </h2>
                  <p>
                    Bu Gizlilik Politikasını zaman zaman güncelleyebiliriz. Değişiklikler güncellenmiş &quot;Son güncelleme&quot; tarihi ile bu sayfada yayınlanacaktır.
                  </p>
                </section>

                <section>
                  <h2 className="text-xs font-bold tracking-widest uppercase text-emerald-400 mb-6 flex items-center gap-3">
                    <span className="w-8 h-px bg-emerald-400/30"></span>
                    11. İletişim
                  </h2>
                  <div className="p-6 bg-[#1b1b1f] rounded-lg border border-white/[0.04]">
                    <p className="font-medium text-[#e5e1e7] mb-1">YO Dijital Medya A.Ş.</p>
                    <p>E-posta: <a href="mailto:info@yodijital.com" className="text-emerald-400 hover:text-emerald-300 underline underline-offset-4">info@yodijital.com</a></p>
                  </div>
                </section>

              </div>
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
