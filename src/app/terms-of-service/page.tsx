import Link from 'next/link'
import Image from 'next/image'

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-[#060609] text-white" style={{ fontSize: '16px' }}>
      <header className="w-full border-b border-white/[0.05] py-4 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/">
            <Image src="/logo.png" alt="Yo Dijital" width={90} height={32} className="object-contain brightness-0 invert" />
          </Link>
          <Link href="/" className="text-sm text-gray-400 hover:text-white transition-colors">← Ana Sayfa</Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-white mb-2">Kullanım Koşulları</h1>
        <p className="text-sm text-gray-500 mb-10">Son güncelleme: Nisan 2025</p>

        <div className="prose prose-invert max-w-none space-y-8 text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Hizmetin Kabulü</h2>
            <p>Yo Dijital platformunu (&quot;Hizmet&quot;) kullanarak bu Kullanım Koşullarını kabul etmiş olursunuz. Bu koşulları kabul etmiyorsanız lütfen platformu kullanmayın.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Hizmet Açıklaması</h2>
            <p>Yo Dijital, işletmelerin müşteri adaylarını (lead) toplamasına, yönetmesine ve satışa dönüştürmesine yardımcı olan bir CRM ve lead yönetim platformudur. Hizmetlerimiz şunları kapsar:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>Çok kanallı lead toplama (Meta Ads, WhatsApp, Instagram vb.)</li>
              <li>CRM pipeline yönetimi</li>
              <li>AI destekli arama ve takip özellikleri</li>
              <li>E-posta kampanya yönetimi</li>
              <li>Analitik ve raporlama araçları</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. Kullanıcı Hesabı</h2>
            <p>Platforma erişmek için hesap oluşturmanız gerekmektedir. Hesabınızın güvenliğinden ve gerçekleştirilen tüm faaliyetlerden siz sorumlusunuz. Şüpheli etkinlik durumunda derhal bizimle iletişime geçin.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Kabul Edilemez Kullanım</h2>
            <p>Aşağıdaki amaçlarla platform kullanılamaz:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>Yasadışı faaliyetler veya dolandırıcılık</li>
              <li>Spam veya istenmeyen ticari iletişim gönderme</li>
              <li>Platformun güvenliğini tehlikeye atma girişimleri</li>
              <li>Başkalarının gizlilik haklarını ihlal etme</li>
              <li>Fikri mülkiyet haklarının ihlali</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Ücretlendirme ve Abonelik</h2>
            <p>Ücretli planlar için abonelik ücretleri önceden belirtilir. Aboneliğinizi dilediğiniz zaman iptal edebilirsiniz; iptal sonrası mevcut dönem sonuna kadar hizmete erişiminiz devam eder.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Hizmet Değişiklikleri ve Fesih</h2>
            <p>Hizmeti geliştirme amacıyla önceden bildirimde bulunarak bu koşulları değiştirme hakkımızı saklı tutarız. Koşulları ihlal etmeniz durumunda hesabınızı askıya alma veya sonlandırma hakkımız bulunmaktadır.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Sorumluluk Sınırlaması</h2>
            <p>Yo Dijital, hizmetin kesintisiz veya hatasız çalışacağını garanti etmez. Yasaların izin verdiği azami ölçüde dolaylı, tesadüfi veya sonuçsal zararlardan sorumlu değiliz.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. İletişim</h2>
            <p>Kullanım koşulları hakkında sorularınız için: <a href="mailto:info@yodijital.com" className="text-emerald-400 hover:text-emerald-300">info@yodijital.com</a></p>
          </section>
        </div>
      </main>

      <footer className="w-full border-t border-white/[0.05] py-6 px-6 mt-12">
        <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-5 text-sm text-gray-500">
          <a href="/privacy-policy" className="hover:text-gray-300 transition-colors">Gizlilik Politikası</a>
          <a href="/cookie-policy" className="hover:text-gray-300 transition-colors">Çerez Politikası</a>
          <a href="/terms-of-service" className="hover:text-gray-300 transition-colors">Kullanım Koşulları</a>
          <a href="/data-deletion" className="hover:text-gray-300 transition-colors">Veri Silme</a>
        </div>
      </footer>
    </div>
  )
}
