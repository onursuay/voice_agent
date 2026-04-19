import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import LandingHeader from '@/components/landing/LandingHeader'

export const metadata: Metadata = {
  title: 'Gizlilik Politikası - VoiceAgent by Yo Dijital',
  description: 'VoiceAgent Gizlilik Politikası. Verilerinizi nasıl topladığımız, kullandığımız ve koruduğumuz hakkında bilgi edinin.',
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#060609] text-white">
      <LandingHeader ctaSchedule="Görüşme Planla" ctaTrial="14 Gün Ücretsiz Dene" />

      <div className="max-w-5xl mx-auto px-6 py-16">
        <Link href="/" className="text-emerald-400 hover:text-emerald-300 transition-colors mb-6 inline-block text-sm">
          &larr; Ana Sayfaya Dön
        </Link>

        <div className="relative rounded-2xl border border-emerald-400/10 bg-white/[0.02] px-8 py-10 shadow-[0_0_60px_rgba(16,185,129,0.07),inset_0_0_40px_rgba(16,185,129,0.03)]">
          <p className="text-sm text-gray-500 mb-2">Son güncelleme: Nisan 2025</p>
          <h1 className="text-3xl font-bold mb-2 text-white">Gizlilik Politikası</h1>
          <p className="text-gray-500 mb-10">YO Dijital Medya A.Ş. · voiceagent.yodijital.com</p>

          <div className="space-y-8">
            <section>
              <h2 className="text-xl font-semibold mb-3 text-white">1. Giriş</h2>
              <p className="text-[14px] text-[#8a8f98] leading-relaxed">
                YO Dijital Medya A.Ş. (&quot;VoiceAgent&quot;, &quot;biz&quot;, &quot;bizim&quot; veya &quot;şirketimiz&quot;) gizliliğinizi korumaya kararlıdır. Bu Gizlilik Politikası, <strong className="text-gray-300">voiceagent.yodijital.com</strong> adresindeki platformumuzu (&quot;Hizmet&quot;) kullandığınızda kişisel verilerinizi nasıl topladığımızı, kullandığımızı, açıkladığımızı ve koruduğumuzu açıklamaktadır.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-white">2. Topladığımız Bilgiler</h2>
              <p className="text-[14px] text-[#8a8f98] leading-relaxed mb-3">Aşağıdaki bilgi kategorilerini toplayabiliriz:</p>
              <ul className="list-disc pl-6 space-y-2 text-[14px] text-[#8a8f98] leading-relaxed">
                <li><strong className="text-gray-300">Hesap bilgileri:</strong> Ad, e-posta adresi, şirket adı ve şifre.</li>
                <li><strong className="text-gray-300">Kullanım verileri:</strong> Platform etkileşimleri, oturum süreleri ve özellik kullanımı.</li>
                <li><strong className="text-gray-300">Lead verileri:</strong> Entegre platformlardan (Meta, WhatsApp vb.) otomatik toplanan veya kullanıcı tarafından içe aktarılan müşteri adayı bilgileri.</li>
                <li><strong className="text-gray-300">Teknik veriler:</strong> IP adresi, tarayıcı türü, cihaz bilgileri ve çerezler.</li>
                <li><strong className="text-gray-300">Google Sheets / Drive verileri:</strong> Google hesabınızı tablo verileri içe aktarmak için bağladığınızda, yalnızca açıkça seçtiğiniz dosyalara ve sayfa içeriklerine erişiriz. Ayrıntılar için Bölüm 4&apos;e bakın.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-white">3. Bilgileri Nasıl Kullanıyoruz</h2>
              <ul className="list-disc pl-6 space-y-2 text-[14px] text-[#8a8f98] leading-relaxed">
                <li>Hizmetlerimizi sunmak, sürdürmek ve geliştirmek.</li>
                <li>Hesabınızı yönetmek ve müşteri desteği sağlamak.</li>
                <li>Hizmet bildirimleri ve ürün güncellemeleri göndermek.</li>
                <li>Yasal yükümlülüklerimizi yerine getirmek.</li>
                <li>Dolandırıcılığı önlemek ve platform güvenliğini sağlamak.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-white">4. Google API Hizmetleri — Sınırlı Kullanım Beyanı</h2>
              <p className="text-[14px] text-[#8a8f98] leading-relaxed mb-3">
                VoiceAgent&apos;ın Google API&apos;lerinden aldığı bilgilerin kullanımı ve diğer uygulamalara aktarımı, Sınırlı Kullanım gereksinimleri dahil olmak üzere{' '}
                <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 underline">
                  Google API Hizmetleri Kullanıcı Verisi Politikası
                </a>
                &apos;na uygun olacaktır. Özellikle:
              </p>
              <ul className="list-disc pl-6 space-y-3 text-[14px] text-[#8a8f98] leading-relaxed">
                <li><strong className="text-gray-300">İstenen kapsamlar:</strong> <code className="bg-white/10 px-1 rounded text-xs">spreadsheets.readonly</code> ve <code className="bg-white/10 px-1 rounded text-xs">drive.readonly</code> — tablo dosyalarını listelemek ve içe aktarma için seçilen sayfa içeriklerini okumak amacıyla kullanılır.</li>
                <li><strong className="text-gray-300">Kullanım amacı:</strong> Google kullanıcı verileri yalnızca VoiceAgent CRM&apos;e tablo içe aktarma özelliğini etkinleştirmek için kullanılır. Veriler başka bir amaçla kullanılmaz.</li>
                <li><strong className="text-gray-300">Üçüncü taraf aktarımı yok:</strong> Google kullanıcı verileri, kanunen gerekli olmadıkça üçüncü taraflara aktarılmaz, satılmaz veya ifşa edilmez.</li>
                <li><strong className="text-gray-300">Reklam kullanımı yok:</strong> Google kullanıcı verileri reklam gösterimi, yeniden hedefleme veya kişiselleştirilmiş reklamcılık için kullanılmaz.</li>
                <li><strong className="text-gray-300">Veri satışı yok:</strong> Google kullanıcı verileri hiçbir koşulda herhangi bir tarafa satılmaz.</li>
                <li><strong className="text-gray-300">İnsan erişim kısıtlamaları:</strong> VoiceAgent personeli, kanunen zorunlu olmadıkça veya güvenlik amaçları dışında Google Sheets içeriğinizi okumaz.</li>
                <li><strong className="text-gray-300">Token depolama:</strong> Google OAuth erişim tokenınız kısa ömürlü, httpOnly bir çerezde saklanır (1 saat içinde sona erer). İstemci tarafı JavaScript&apos;e asla açık değildir.</li>
                <li><strong className="text-gray-300">İptal:</strong> <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 underline">Google Hesabı İzinleri</a> üzerinden erişimi istediğiniz zaman iptal edebilirsiniz.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-white">5. Meta Platform Entegrasyonu</h2>
              <p className="text-[14px] text-[#8a8f98] leading-relaxed">
                Meta (Facebook/Instagram) hesabınızı bağladığınızda, Meta Platform API&apos;si aracılığıyla reklam hesabı verilerine, sayfa verilerine ve lead form gönderimlere erişiriz. Tüm Meta verileri yalnızca lead yönetimi ve raporlama özellikleri sağlamak amacıyla kullanılır. Veriler üçüncü taraflara aktarılmaz, satılmaz veya reklam faaliyetlerinizle ilgisiz amaçlar için kullanılmaz.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-white">6. Veri Paylaşımı</h2>
              <p className="text-[14px] text-[#8a8f98] leading-relaxed mb-3">Kişisel verilerinizi satmıyoruz. Yalnızca aşağıdaki durumlarda paylaşabiliriz:</p>
              <ul className="list-disc pl-6 space-y-2 text-[14px] text-[#8a8f98] leading-relaxed">
                <li>Hizmet sağlayıcılarla (barındırma, e-posta teslimatı, analitik) ihtiyaç bazında.</li>
                <li>Kanunen zorunlu olduğunda yetkili makamlarla.</li>
                <li>Birleşme, satın alma veya varlık satışı kapsamında.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-white">7. Veri Güvenliği</h2>
              <p className="text-[14px] text-[#8a8f98] leading-relaxed">
                Verilerinizi yetkisiz erişim, değiştirme, ifşa veya imhaya karşı korumak için SSL/TLS şifreleme, güvenli sunucu tarafı token depolama ve düzenli güvenlik incelemeleri dahil endüstri standardı güvenlik önlemleri uyguluyoruz.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-white">8. Veri Saklama</h2>
              <p className="text-[14px] text-[#8a8f98] leading-relaxed">
                İçe aktarılan lead verileri hesabınız aktif olduğu sürece saklanır. Önbelleğe alınan Google Sheets verileri kalıcı olarak depolanmaz — sayfa içeriği yalnızca içe aktarma oturumu sırasında bellekte işlenir. OAuth tokenlar otomatik olarak sona erer ve eyleminiz olmadan yenilenmez.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-white">9. Haklarınız</h2>
              <p className="text-[14px] text-[#8a8f98] leading-relaxed mb-3">GDPR, KVKK ve geçerli gizlilik yasaları kapsamında kişisel verilerinize erişim, düzeltme, silme, kısıtlama veya taşıma hakkına sahipsiniz. Bu hakları kullanmak için <a href="mailto:info@yodijital.com" className="text-emerald-400 hover:text-emerald-300">info@yodijital.com</a> adresiyle iletişime geçin.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-white">10. Politika Güncellemeleri</h2>
              <p className="text-[14px] text-[#8a8f98] leading-relaxed">
                Bu Gizlilik Politikasını zaman zaman güncelleyebiliriz. Değişiklikler güncellenmiş &quot;Son güncelleme&quot; tarihi ile bu sayfada yayınlanacaktır.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-white">11. İletişim</h2>
              <p className="text-[14px] text-[#8a8f98] leading-relaxed">
                <strong className="text-gray-300">YO Dijital Medya A.Ş.</strong><br />
                E-posta: <a href="mailto:info@yodijital.com" className="text-emerald-400 hover:text-emerald-300">info@yodijital.com</a>
              </p>
            </section>
          </div>
        </div>
      </div>

      <footer className="w-full border-t border-white/[0.05] py-6 px-6 bg-[#060609]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-3 text-gray-500">
            <Image src="/logo.png" alt="Yo Dijital" width={50} height={18} className="object-contain brightness-0 invert opacity-40" />
            <span>© 2025 Yo Dijital. Tüm hakları saklıdır.</span>
          </div>
          <nav className="flex flex-wrap gap-5 text-gray-500">
            <a href="/en/privacy-policy" className="hover:text-gray-300 transition-colors">Gizlilik Politikası</a>
            <a href="/cookie-policy" className="hover:text-gray-300 transition-colors">Çerez Politikası</a>
            <a href="/terms-of-service" className="hover:text-gray-300 transition-colors">Kullanım Koşulları</a>
            <a href="/data-deletion" className="hover:text-gray-300 transition-colors">Veri Silme</a>
          </nav>
        </div>
      </footer>
    </div>
  )
}
