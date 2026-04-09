import Link from 'next/link'
import Image from 'next/image'

export default function PrivacyPolicyPage() {
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
        <h1 className="text-3xl font-bold text-white mb-2">Gizlilik Politikası</h1>
        <p className="text-sm text-gray-500 mb-10">Son güncelleme: Nisan 2025</p>

        <div className="prose prose-invert max-w-none space-y-8 text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Giriş</h2>
            <p>Yo Dijital (&quot;biz&quot;, &quot;bizim&quot; veya &quot;şirketimiz&quot;) olarak gizliliğinize saygı duyuyoruz. Bu Gizlilik Politikası, voiceagant.yodijital.com adresindeki platformumuzu (&quot;Hizmet&quot;) kullandığınızda kişisel verilerinizi nasıl topladığımızı, kullandığımızı ve koruduğumuzu açıklamaktadır.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Topladığımız Bilgiler</h2>
            <p>Aşağıdaki bilgileri toplayabiliriz:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li><strong>Hesap bilgileri:</strong> Ad, e-posta adresi, şirket adı ve şifre</li>
              <li><strong>Kullanım verileri:</strong> Platform etkileşimleri, oturum süreleri ve özellik kullanımı</li>
              <li><strong>Lead verileri:</strong> Entegre platformlardan (Meta, WhatsApp vb.) otomatik toplanan müşteri adayı bilgileri</li>
              <li><strong>Teknik veriler:</strong> IP adresi, tarayıcı türü, cihaz bilgileri ve çerezler</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. Bilgileri Nasıl Kullanıyoruz</h2>
            <p>Topladığımız bilgileri şu amaçlarla kullanırız:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>Hizmetlerimizi sunmak ve geliştirmek</li>
              <li>Hesabınızı yönetmek ve müşteri desteği sağlamak</li>
              <li>Hizmet bildirimleri ve güncellemeler göndermek</li>
              <li>Yasal yükümlülüklerimizi yerine getirmek</li>
              <li>Dolandırıcılığı önlemek ve güvenliği sağlamak</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Veri Paylaşımı</h2>
            <p>Kişisel verilerinizi üçüncü taraflara satmıyoruz. Ancak aşağıdaki durumlarda paylaşabiliriz:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>Hizmet sağlayıcılarımızla (barındırma, e-posta, analitik hizmetleri)</li>
              <li>Yasal zorunluluk durumlarında yetkili makamlarla</li>
              <li>Şirket birleşmesi veya devralınması halinde</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Veri Güvenliği</h2>
            <p>Verilerinizi korumak için SSL şifreleme, güvenli veri depolama ve düzenli güvenlik denetimleri dahil olmak üzere endüstri standardı güvenlik önlemleri uyguluyoruz.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Haklarınız</h2>
            <p>KVKK ve GDPR kapsamında aşağıdaki haklara sahipsiniz:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>Kişisel verilerinize erişim hakkı</li>
              <li>Yanlış verilerin düzeltilmesini talep etme hakkı</li>
              <li>Verilerinizin silinmesini talep etme hakkı</li>
              <li>İşleme itiraz etme hakkı</li>
              <li>Veri taşınabilirliği hakkı</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. İletişim</h2>
            <p>Gizlilik politikamız hakkında sorularınız için: <a href="mailto:info@yodijital.com" className="text-emerald-400 hover:text-emerald-300">info@yodijital.com</a></p>
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
