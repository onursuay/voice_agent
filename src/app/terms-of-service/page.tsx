import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import LandingHeader from '@/components/landing/LandingHeader'

export const metadata: Metadata = {
  title: 'Kullanım Koşulları - VoiceAgent by Yo Dijital',
  description: 'VoiceAgent Kullanım Koşulları. Platformu kullanırken geçerli olan kural ve koşullar hakkında bilgi edinin.',
}

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-[#060609] text-white">
      <LandingHeader ctaSchedule="Görüşme Planla" ctaTrial="14 Gün Ücretsiz Dene" />

      <div className="max-w-5xl mx-auto px-6 py-16">
        <Link href="/" className="text-emerald-400 hover:text-emerald-300 transition-colors mb-6 inline-block text-sm">
          &larr; Ana Sayfaya Dön
        </Link>

        <div className="relative rounded-2xl border border-emerald-400/10 bg-white/[0.02] px-8 py-10 shadow-[0_0_60px_rgba(16,185,129,0.07),inset_0_0_40px_rgba(16,185,129,0.03)]">
          <p className="text-sm text-gray-500 mb-2">Son güncelleme: Nisan 2025</p>
          <h1 className="text-3xl font-bold mb-2 text-white">Kullanım Koşulları</h1>
          <p className="text-gray-500 mb-10">YO Dijital Medya A.Ş. · voiceagent.yodijital.com</p>

          <div className="space-y-8">
            <section>
              <h2 className="text-xl font-semibold mb-3 text-white">1) Taraflar ve Tanımlar</h2>
              <p className="text-[14px] text-[#8a8f98] leading-relaxed">
                Bu koşullar, YO Dijital Medya A.Ş. tarafından sağlanan VoiceAgent platformunun kullanıcıları için geçerlidir. Hizmeti kullanarak bu Kullanım Koşullarına bağlı olmayı kabul etmiş olursunuz. Kabul etmiyorsanız lütfen platformu kullanmayın.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-white">2) Hizmetin Kapsamı</h2>
              <p className="text-[14px] text-[#8a8f98] leading-relaxed">
                VoiceAgent, işletmelerin müşteri adaylarını toplamasına, yönetmesine ve satışa dönüştürmesine yardımcı olan bir CRM ve lead yönetim platformudur. Hizmetler; çok kanallı lead toplama (Meta Ads, WhatsApp, Instagram, Google Sheets), CRM pipeline yönetimi, AI destekli arama, e-posta kampanya yönetimi ve analitik araçları kapsamaktadır.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-white">3) Kullanıcı Yetkisi</h2>
              <p className="text-[14px] text-[#8a8f98] leading-relaxed">
                Kullanıcılar yalnızca kullanmaya yetkili oldukları hesapları ve veri kaynaklarını bağlayabilir. Üçüncü taraf hesaplara yetkisiz erişim sağlanamaz veya uygun yetki olmadan veri kaynakları entegre edilemez.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-white">4) Politika ve API Uyumu</h2>
              <p className="text-[14px] text-[#8a8f98] leading-relaxed">
                VoiceAgent aracılığıyla gerçekleştirilen işlemler, ilgili platformların (Google, Meta vb.) politikaları ve koşullarına tabidir. Kullanıcılar hizmeti yetkisiz veri toplama, kötüye kullanım veya yanıltıcı içerik gibi platform politikalarını ihlal eden şekillerde kullanamazlar. Google API verilerinin kullanımı, Sınırlı Kullanım gereksinimleri dahil Google API Hizmetleri Kullanıcı Verisi Politikası&apos;na tabidir.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-white">5) Yasaklı Kullanımlar</h2>
              <p className="text-[14px] text-[#8a8f98] leading-relaxed mb-3">Platformu aşağıdaki amaçlarla kullanamazsınız:</p>
              <ul className="list-disc pl-6 space-y-2 text-[14px] text-[#8a8f98] leading-relaxed">
                <li>Yasadışı faaliyetler veya dolandırıcılık</li>
                <li>Spam veya istenmeyen ticari iletişim gönderme</li>
                <li>Platform güvenliğini tehlikeye atma girişimleri</li>
                <li>Başkalarının gizlilik haklarını ihlal etme</li>
                <li>Fikri mülkiyet haklarının ihlali</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-white">6) Sorumluluk Sınırlaması</h2>
              <p className="text-[14px] text-[#8a8f98] leading-relaxed">
                VoiceAgent&apos;ta görüntülenen veriler, bağlı platformlar (Google, Meta) tarafından sağlanan verilere dayanmaktadır; gecikmeler, kotalar, kesintiler veya platform değişiklikleri nedeniyle tutarsızlıklar oluşabilir. VoiceAgent, üçüncü taraf platform kesintilerinden, API sınırlarından veya politika değişikliklerinden kaynaklanan zararlar için yalnızca sınırlı ölçüde sorumludur. Yasaların izin verdiği azami ölçüde dolaylı, tesadüfi veya sonuçsal zararlardan sorumlu değiliz.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-white">7) Hesap Güvenliği</h2>
              <p className="text-[14px] text-[#8a8f98] leading-relaxed">
                Kullanıcı, hesabının güvenliğinden ve erişim kimlik bilgilerinin korunmasından sorumludur. Yetkisiz herhangi bir kullanım durumunda lütfen derhal <a href="mailto:info@yodijital.com" className="text-emerald-400 hover:text-emerald-300">info@yodijital.com</a> adresinden bize bildirin.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-white">8) Fesih</h2>
              <p className="text-[14px] text-[#8a8f98] leading-relaxed">
                VoiceAgent, kötüye kullanım veya bu koşulların ihlali durumunda erişimi askıya alabilir veya sonlandırabilir. Ücretli planlar için abonelik ücretleri önceden belirtilir; dilediğiniz zaman iptal edebilirsiniz ve mevcut fatura dönemi sonuna kadar erişiminiz devam eder.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-white">9) Değişiklikler</h2>
              <p className="text-[14px] text-[#8a8f98] leading-relaxed">
                Bu koşullar önceden bildirimde bulunularak güncellenebilir. Güncel sürüm her zaman bu sayfada yayınlanır. Değişikliklerden sonra Hizmeti kullanmaya devam etmeniz, koşulları kabul ettiğiniz anlamına gelir.
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
