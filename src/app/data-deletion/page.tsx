import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import LandingHeader from '@/components/landing/LandingHeader'

export const metadata: Metadata = {
  title: 'Veri Silme - VoiceAgent by Yo Dijital',
  description: 'VoiceAgent platformundan kişisel verilerinizin silinmesini talep edin.',
}

export default function DataDeletionPage() {
  return (
    <div className="min-h-screen bg-[#060609] text-white">
      <LandingHeader ctaSchedule="Görüşme Planla" ctaTrial="14 Gün Ücretsiz Dene" />

      <div className="max-w-5xl mx-auto px-6 py-16">
        <Link href="/" className="text-emerald-400 hover:text-emerald-300 transition-colors mb-6 inline-block text-sm">
          &larr; Ana Sayfaya Dön
        </Link>

        <div className="relative rounded-2xl border border-emerald-400/10 bg-white/[0.02] px-8 py-10 shadow-[0_0_60px_rgba(16,185,129,0.07),inset_0_0_40px_rgba(16,185,129,0.03)]">
          <p className="text-sm text-gray-500 mb-2">Son güncelleme: Nisan 2025</p>
          <h1 className="text-3xl font-bold mb-2 text-white">Veri Silme Talebi</h1>
          <p className="text-gray-500 mb-10">YO Dijital Medya A.Ş. · voiceagent.yodijital.com</p>

          <div className="space-y-8">
            <section>
              <h2 className="text-xl font-semibold mb-3 text-white">Verilerinizi Silme Hakkınız</h2>
              <p className="text-[14px] text-[#8a8f98] leading-relaxed">
                KVKK (Kişisel Verilerin Korunması Kanunu) ve GDPR kapsamında kişisel verilerinizin silinmesini talep etme hakkına sahipsiniz. Bu hak &quot;unutulma hakkı&quot; veya &quot;silme hakkı&quot; olarak da bilinir.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-white">Nasıl Talepte Bulunabilirsiniz?</h2>
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.06] p-6 mb-6">
                <h3 className="text-base font-semibold text-emerald-400 mb-3">Veri Silme Talebi Gönderin</h3>
                <p className="text-[14px] text-[#8a8f98] mb-4">&quot;Veri Silme Talebi&quot; konusuyla aşağıdaki e-posta adresine yazın:</p>
                <a
                  href="mailto:info@yodijital.com?subject=Veri%20Silme%20Talebi"
                  className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
                >
                  info@yodijital.com — Talep Gönder
                </a>
              </div>
              <p className="text-[14px] text-[#8a8f98] leading-relaxed mb-3">E-postanızda aşağıdaki bilgileri belirtin:</p>
              <ul className="list-disc pl-6 space-y-2 text-[14px] text-[#8a8f98] leading-relaxed">
                <li>Ad ve soyadınız</li>
                <li>Platformda kayıtlı e-posta adresiniz</li>
                <li>Silmek istediğiniz veri türleri (hesap, lead verileri vb.)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-white">Hesabınızı Silme (Platform İçi)</h2>
              <p className="text-[14px] text-[#8a8f98] leading-relaxed">
                Platforma giriş yaparak Ayarlar → Hesap bölümünden hesabınızı ve tüm verilerinizi kalıcı olarak silebilirsiniz. Bu işlem geri alınamaz.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-white">Silinecek Veriler</h2>
              <ul className="list-disc pl-6 space-y-2 text-[14px] text-[#8a8f98] leading-relaxed">
                <li>Hesap bilgileri (ad, e-posta, şifre)</li>
                <li>Platformda depolanan lead ve müşteri verileri</li>
                <li>Kullanım geçmişi ve aktivite kayıtları</li>
                <li>Tercih ve ayar verileri</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-white">İşlem Süresi</h2>
              <p className="text-[14px] text-[#8a8f98] leading-relaxed">
                Veri silme taleplerini 30 gün içinde işleme alırız. Talebi aldığımızı onaylayan bir e-posta gönderilecek ve işlem tamamlandığında bilgilendirileceksiniz.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-white">Saklama Zorunluluğu Olan Veriler</h2>
              <p className="text-[14px] text-[#8a8f98] leading-relaxed">
                Bazı veriler yasal yükümlülükler (vergi kayıtları, muhasebe bilgileri vb.) nedeniyle belirli bir süre saklanmak zorundadır. Bu tür veriler yasal saklama süresi dolduktan sonra silinir.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-white">Meta (Facebook) Veri Silme</h2>
              <p className="text-[14px] text-[#8a8f98] leading-relaxed">
                Meta platformu üzerinden uygulamamızla bağlantı kurduysanız Meta&apos;nın uygulama veri silme talebi özelliğini de kullanabilirsiniz. Bu durumda Meta&apos;dan aldığımız veriler de silinecektir.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-white">Google Veri Silme</h2>
              <p className="text-[14px] text-[#8a8f98] leading-relaxed">
                VoiceAgent, Google Sheets içeriğinizi kalıcı olarak depolamaz. Google Sheets içe aktarımı için kullanılan OAuth erişim tokenı kısa ömürlü bir çerezde saklanır ve 1 saat içinde otomatik olarak sona erer.{' '}
                <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300">
                  Google Hesabı İzinleri
                </a>{' '}
                üzerinden VoiceAgent&apos;ın Google hesabınıza erişimini istediğiniz zaman iptal edebilirsiniz.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-white">İletişim</h2>
              <p className="text-[14px] text-[#8a8f98] leading-relaxed">
                Veri silme süreciyle ilgili sorularınız için: <a href="mailto:info@yodijital.com" className="text-emerald-400 hover:text-emerald-300">info@yodijital.com</a>
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
