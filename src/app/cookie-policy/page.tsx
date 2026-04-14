import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import LandingHeader from '@/components/landing/LandingHeader'

export const metadata: Metadata = {
  title: 'Çerez Politikası - VoiceAgent by Yo Dijital',
  description: 'VoiceAgent Çerez Politikası. Çerezleri nasıl kullandığımız ve yönetebileceğiniz hakkında bilgi edinin.',
}

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-[#060609] text-white">
      <LandingHeader ctaSchedule="Görüşme Planla" ctaTrial="14 Gün Ücretsiz Dene" />

      <div className="max-w-5xl mx-auto px-6 py-16">
        <Link href="/" className="text-emerald-400 hover:text-emerald-300 transition-colors mb-6 inline-block text-sm">
          &larr; Ana Sayfaya Dön
        </Link>

        <div className="relative rounded-2xl border border-emerald-400/10 bg-white/[0.02] px-8 py-10 shadow-[0_0_60px_rgba(16,185,129,0.07),inset_0_0_40px_rgba(16,185,129,0.03)]">
          <p className="text-sm text-gray-500 mb-2">Son güncelleme: Nisan 2025</p>
          <h1 className="text-3xl font-bold mb-2 text-white">Çerez Politikası</h1>
          <p className="text-gray-500 mb-10">YO Dijital Medya A.Ş. · voiceagent.yodijital.com</p>

          <div className="space-y-8">
            <section>
              <h2 className="text-xl font-semibold mb-3 text-white">1. Çerezler Nedir?</h2>
              <p className="text-[14px] text-[#8a8f98] leading-relaxed">
                Çerezler, ziyaret ettiğiniz web siteleri tarafından cihazınıza yerleştirilen küçük metin dosyalarıdır. Deneyiminizi iyileştirmek, tercihlerinizi hatırlamak ve platform performansını analiz etmek için çerezler kullanıyoruz.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-white">2. Kullandığımız Çerez Türleri</h2>
              <div className="space-y-4">
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
                  <h3 className="text-base font-semibold text-white mb-2">Zorunlu Çerezler</h3>
                  <p className="text-[14px] text-[#8a8f98] leading-relaxed">Platformun temel işlevleri için gereklidir. Bu çerezler olmadan hizmetlerimiz düzgün çalışmaz. Oturum yönetimi ve güvenlik doğrulaması bu kategoriye girer.</p>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
                  <h3 className="text-base font-semibold text-white mb-2">Analitik Çerezler</h3>
                  <p className="text-[14px] text-[#8a8f98] leading-relaxed">Platformun nasıl kullanıldığını anlamamıza yardımcı olur. Bu veriler platformu geliştirmek için kullanılır. Hangi sayfaların en çok ziyaret edildiği ve kullanıcıların nasıl gezindiği bu kapsamda izlenir.</p>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
                  <h3 className="text-base font-semibold text-white mb-2">Tercih Çerezleri</h3>
                  <p className="text-[14px] text-[#8a8f98] leading-relaxed">Dil tercihleri ve arayüz ayarları gibi kişisel tercihlerinizi hatırlar. Bu sayede her ziyaretinizde aynı ayarları tekrar yapmanız gerekmez.</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-white">3. Üçüncü Taraf Çerezleri</h2>
              <p className="text-[14px] text-[#8a8f98] leading-relaxed mb-3">Aşağıdaki üçüncü taraf hizmetleri çerez kullanabilir:</p>
              <ul className="list-disc pl-6 space-y-2 text-[14px] text-[#8a8f98] leading-relaxed">
                <li><strong className="text-gray-300">Supabase:</strong> Kimlik doğrulama ve veritabanı hizmetleri</li>
                <li><strong className="text-gray-300">Meta Pixel:</strong> Reklam performansı ölçümü (isteğe bağlı entegrasyon)</li>
                <li><strong className="text-gray-300">Vercel Analytics:</strong> Platform performans analizi</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-white">4. Çerezleri Kontrol Etme</h2>
              <p className="text-[14px] text-[#8a8f98] leading-relaxed mb-3">
                Çerezleri tarayıcı ayarlarınızdan yönetebilir veya silebilirsiniz. Ancak zorunlu çerezleri devre dışı bırakmak platformun işlevselliğini etkileyebilir.
              </p>
              <ul className="list-disc pl-6 space-y-1 text-[14px] text-[#8a8f98] leading-relaxed">
                <li>Chrome: Ayarlar → Gizlilik ve Güvenlik → Çerezler</li>
                <li>Firefox: Seçenekler → Gizlilik ve Güvenlik</li>
                <li>Safari: Tercihler → Gizlilik</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-white">5. İletişim</h2>
              <p className="text-[14px] text-[#8a8f98] leading-relaxed">
                Çerez politikamız hakkında sorularınız için: <a href="mailto:info@yodijital.com" className="text-emerald-400 hover:text-emerald-300">info@yodijital.com</a>
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
            <a href="/privacy-policy" className="hover:text-gray-300 transition-colors">Gizlilik Politikası</a>
            <a href="/cookie-policy" className="hover:text-gray-300 transition-colors">Çerez Politikası</a>
            <a href="/terms-of-service" className="hover:text-gray-300 transition-colors">Kullanım Koşulları</a>
            <a href="/data-deletion" className="hover:text-gray-300 transition-colors">Veri Silme</a>
          </nav>
        </div>
      </footer>
    </div>
  )
}
