import Link from 'next/link'
import Image from 'next/image'

export default function CookiePolicyPage() {
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
        <h1 className="text-3xl font-bold text-white mb-2">Çerez Politikası</h1>
        <p className="text-sm text-gray-500 mb-10">Son güncelleme: Nisan 2025</p>

        <div className="prose prose-invert max-w-none space-y-8 text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Çerezler Nedir?</h2>
            <p>Çerezler, web siteleri tarafından tarayıcınıza yerleştirilen küçük metin dosyalarıdır. Platformumuzu ziyaret ettiğinizde deneyiminizi iyileştirmek, tercihleri hatırlamak ve hizmetlerimizin performansını analiz etmek için çerezler kullanıyoruz.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Kullandığımız Çerez Türleri</h2>
            <div className="space-y-4">
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                <h3 className="text-base font-semibold text-white mb-2">Zorunlu Çerezler</h3>
                <p className="text-sm">Platformun temel işlevleri için gereklidir. Bu çerezler olmadan hizmetlerimiz düzgün çalışmaz. Oturum yönetimi ve güvenlik doğrulaması bu kategoriye girer.</p>
              </div>
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                <h3 className="text-base font-semibold text-white mb-2">Analitik Çerezler</h3>
                <p className="text-sm">Platformun nasıl kullanıldığını anlamamıza yardımcı olur. Bu veriler platformu geliştirmek için kullanılır. Hangi sayfaların en çok ziyaret edildiği ve kullanıcıların nasıl gezindiği bu kapsamda izlenir.</p>
              </div>
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                <h3 className="text-base font-semibold text-white mb-2">Tercih Çerezleri</h3>
                <p className="text-sm">Dil tercihleri ve arayüz ayarları gibi kişisel tercihlerinizi hatırlar. Bu sayede her ziyaretinizde aynı ayarları tekrar yapmanız gerekmez.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. Üçüncü Taraf Çerezleri</h2>
            <p>Aşağıdaki üçüncü taraf hizmetleri çerez kullanabilir:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li><strong>Supabase:</strong> Kimlik doğrulama ve veritabanı hizmetleri</li>
              <li><strong>Meta Pixel:</strong> Reklam performansı ölçümü (isteğe bağlı entegrasyon)</li>
              <li><strong>Vercel Analytics:</strong> Platform performans analizi</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Çerezleri Kontrol Etme</h2>
            <p>Tarayıcı ayarlarınızdan çerezleri yönetebilir veya silebilirsiniz. Ancak zorunlu çerezleri devre dışı bırakmak platformun çalışmasını etkileyebilir.</p>
            <p className="mt-3">Yaygın tarayıcılar için çerez yönetimi:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Chrome: Ayarlar → Gizlilik ve Güvenlik → Çerezler</li>
              <li>Firefox: Seçenekler → Gizlilik ve Güvenlik</li>
              <li>Safari: Tercihler → Gizlilik</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. İletişim</h2>
            <p>Çerez politikamız hakkında sorularınız için: <a href="mailto:info@yodijital.com" className="text-emerald-400 hover:text-emerald-300">info@yodijital.com</a></p>
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
