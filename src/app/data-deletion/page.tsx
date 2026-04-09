import Link from 'next/link'
import Image from 'next/image'

export default function DataDeletionPage() {
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
        <h1 className="text-3xl font-bold text-white mb-2">Veri Silme Talebi</h1>
        <p className="text-sm text-gray-500 mb-10">Son güncelleme: Nisan 2025</p>

        <div className="prose prose-invert max-w-none space-y-8 text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Verilerinizi Silme Hakkınız</h2>
            <p>KVKK (Kişisel Verilerin Korunması Kanunu) ve GDPR kapsamında kişisel verilerinizin silinmesini talep etme hakkına sahipsiniz. Bu hak &quot;unutulma hakkı&quot; veya &quot;silme hakkı&quot; olarak da bilinir.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Nasıl Talepte Bulunabilirsiniz?</h2>
            <div className="bg-emerald-400/[0.06] border border-emerald-400/20 rounded-2xl p-6 mb-6">
              <h3 className="text-base font-semibold text-emerald-400 mb-3">Veri Silme Talebi Gönderin</h3>
              <p className="mb-4">Aşağıdaki e-posta adresine &quot;Veri Silme Talebi&quot; konusuyla yazın:</p>
              <a href="mailto:info@yodijital.com?subject=Veri%20Silme%20Talebi" className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-6 py-3 rounded-xl transition-colors text-sm">
                info@yodijital.com — Talep Gönder
              </a>
            </div>
            <p>E-postanızda aşağıdaki bilgileri belirtin:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>Ad ve soyadınız</li>
              <li>Platformda kayıtlı e-posta adresiniz</li>
              <li>Silmek istediğiniz veri türleri (hesap, lead verileri vb.)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Hesabınızı Silme (Platform İçi)</h2>
            <p>Platform hesabınıza giriş yaparak Ayarlar → Hesap bölümünden hesabınızı ve tüm verilerinizi kalıcı olarak silebilirsiniz. Bu işlem geri alınamaz.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Silinecek Veriler</h2>
            <p>Talebinizi aldıktan sonra aşağıdaki verilerinizi sileriz:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>Hesap bilgileri (ad, e-posta, şifre)</li>
              <li>Platformda depolanan lead ve müşteri verileri</li>
              <li>Kullanım geçmişi ve aktivite kayıtları</li>
              <li>Tercih ve ayar verileri</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">İşlem Süresi</h2>
            <p>Veri silme taleplerini 30 gün içinde işleme alırız. Talebi aldığımızı onaylayan bir e-posta gönderilecek ve işlem tamamlandığında bilgilendirileceksiniz.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Saklama Zorunluluğu Olan Veriler</h2>
            <p>Bazı veriler yasal yükümlülükler (vergi kayıtları, muhasebe bilgileri vb.) nedeniyle belirli bir süre saklanmak zorundadır. Bu tür veriler yasal saklama süresi dolduktan sonra silinir.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Meta (Facebook) Veri Silme</h2>
            <p>Meta platformu üzerinden uygulamamızla bağlantı kurduysanız Meta&apos;nın uygulama veri silme talebi özelliğini de kullanabilirsiniz. Bu durumda Meta&apos;dan aldığımız veriler de silinecektir.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">İletişim</h2>
            <p>Veri silme süreciyle ilgili sorularınız için: <a href="mailto:info@yodijital.com" className="text-emerald-400 hover:text-emerald-300">info@yodijital.com</a></p>
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
