import type { Metadata } from 'next'
import Image from 'next/image'
import LandingHeader from '@/components/landing/LandingHeader'

export const metadata: Metadata = {
  title: 'Kullanım Koşulları - VoiceAgent by Yo Dijital',
  description: 'VoiceAgent Kullanım Koşulları. Platformu kullanırken geçerli olan kural ve koşullar hakkında bilgi edinin.',
}

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-[#131317] text-[#e5e1e7]">
      <LandingHeader ctaSchedule="Görüşme Planla" ctaTrial="14 Gün Ücretsiz Dene" />

      <div className="min-h-screen pt-[56px] bg-[#131317]">
        <main className="px-6 py-3 md:px-16">

          {/* Hero Header */}
          <header className="max-w-4xl mb-4 text-center mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tighter text-[#e5e1e7] mb-6 leading-none">Kullanım Koşulları</h1>
            <p className="text-xl text-[#bbcabf] font-light leading-relaxed max-w-2xl mx-auto">
              Bu koşullar, YO Dijital Medya A.Ş. tarafından sağlanan VoiceAgent platformunun kullanıcıları için geçerlidir. Hizmeti kullanarak bu koşullara bağlı olmayı kabul etmiş olursunuz.
            </p>
          </header>

          {/* Content */}
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8">

            {/* 01. Taraflar ve Tanımlar */}
            <section className="md:col-span-8 bg-[#1b1b1f] p-8 md:p-10 rounded-xl border border-white/[0.04]">
              <div className="flex items-center gap-4 mb-6">
                <span className="text-emerald-400 font-mono text-sm tracking-widest">01.</span>
                <h2 className="text-xl font-bold tracking-tight text-[#e5e1e7]">Taraflar ve Tanımlar</h2>
              </div>
              <p className="text-[#bbcabf] leading-relaxed">
                Bu koşullar, YO Dijital Medya A.Ş. tarafından sağlanan VoiceAgent platformunun kullanıcıları için geçerlidir. Hizmeti kullanarak bu Kullanım Koşullarına bağlı olmayı kabul etmiş olursunuz. Kabul etmiyorsanız lütfen platformu kullanmayın.
              </p>
            </section>

            {/* Highlight card */}
            <aside className="md:col-span-4 bg-emerald-400/5 p-8 rounded-xl border border-emerald-400/20 flex flex-col justify-center">
              <div className="text-emerald-400 mb-4">
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14 3L4 7V14C4 19.55 8.4 24.74 14 26C19.6 24.74 24 19.55 24 14V7L14 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                  <path d="M10 14L13 17L18 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h4 className="text-emerald-400 font-bold mb-2">Temel İlke</h4>
              <p className="text-[#bbcabf] text-sm leading-relaxed">
                Verileriniz sizindir. VoiceAgent, kişisel verilerinizi hiçbir koşulda üçüncü taraflara satmaz veya devretmez.
              </p>
            </aside>

            {/* 02. Hizmetin Kapsamı */}
            <section className="md:col-span-12 space-y-4 mt-4">
              <div className="flex items-center gap-4 mb-6">
                <span className="text-emerald-400 font-mono text-sm tracking-widest">02.</span>
                <h2 className="text-xl font-bold tracking-tight text-[#e5e1e7]">Hizmetin Kapsamı</h2>
              </div>
              <p className="text-[#bbcabf] leading-relaxed">
                VoiceAgent, işletmelerin müşteri adaylarını toplamasına, yönetmesine ve satışa dönüştürmesine yardımcı olan bir CRM ve lead yönetim platformudur. Hizmetler; çok kanallı lead toplama (Meta Ads, WhatsApp, Instagram, Google Sheets), CRM pipeline yönetimi, AI destekli arama, e-posta kampanya yönetimi ve analitik araçları kapsamaktadır.
              </p>
            </section>

            {/* 03. Kullanıcı Yetkisi */}
            <section className="md:col-span-12">
              <div className="flex items-center gap-4 mb-6">
                <span className="text-emerald-400 font-mono text-sm tracking-widest">03.</span>
                <h2 className="text-xl font-bold tracking-tight text-[#e5e1e7]">Kullanıcı Yetkisi</h2>
              </div>
              <p className="text-[#bbcabf] leading-relaxed">
                Kullanıcılar yalnızca kullanmaya yetkili oldukları hesapları ve veri kaynaklarını bağlayabilir. Üçüncü taraf hesaplara yetkisiz erişim sağlanamaz veya uygun yetki olmadan veri kaynakları entegre edilemez.
              </p>
            </section>

            {/* 04. Politika ve API Uyumu */}
            <section className="md:col-span-12">
              <div className="flex items-center gap-4 mb-6">
                <span className="text-emerald-400 font-mono text-sm tracking-widest">04.</span>
                <h2 className="text-xl font-bold tracking-tight text-[#e5e1e7]">Politika ve API Uyumu</h2>
              </div>
              <p className="text-[#bbcabf] leading-relaxed">
                VoiceAgent aracılığıyla gerçekleştirilen işlemler, ilgili platformların (Google, Meta vb.) politikaları ve koşullarına tabidir. Kullanıcılar hizmeti yetkisiz veri toplama, kötüye kullanım veya yanıltıcı içerik gibi platform politikalarını ihlal eden şekillerde kullanamazlar. Google API verilerinin kullanımı, Sınırlı Kullanım gereksinimleri dahil Google API Hizmetleri Kullanıcı Verisi Politikası&apos;na tabidir.
              </p>
            </section>

            {/* 05. Yasaklı Kullanımlar */}
            <section className="md:col-span-12 bg-[#1b1b1f] p-8 md:p-10 rounded-xl border border-white/[0.04]">
              <div className="flex items-center gap-4 mb-6">
                <span className="text-emerald-400 font-mono text-sm tracking-widest">05.</span>
                <h2 className="text-xl font-bold tracking-tight text-[#e5e1e7]">Yasaklı Kullanımlar</h2>
              </div>
              <p className="text-[#bbcabf] leading-relaxed mb-6">Platformu aşağıdaki amaçlarla kullanamazsınız:</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: 'Yasadışı faaliyetler', desc: 'Yasadışı faaliyetler veya dolandırıcılık' },
                  { label: 'Spam gönderimi', desc: 'Spam veya istenmeyen ticari iletişim gönderme' },
                  { label: 'Güvenlik ihlali', desc: 'Platform güvenliğini tehlikeye atma girişimleri' },
                  { label: 'Gizlilik ihlali', desc: 'Başkalarının gizlilik haklarını ihlal etme' },
                  { label: 'Fikri mülkiyet', desc: 'Fikri mülkiyet haklarının ihlali' },
                ].map((item, i) => (
                  <div key={i} className="p-4 bg-[#353438]/30 rounded-lg border border-white/[0.04]">
                    <p className="text-[#e5e1e7] font-bold text-sm mb-1">{item.label}</p>
                    <p className="text-[#bbcabf] text-xs leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* 06-09 remaining sections */}
            <section className="md:col-span-12 bg-[#0e0e12] p-8 md:p-10 rounded-xl border border-emerald-900/10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div>
                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-emerald-400 font-mono text-sm tracking-widest">06.</span>
                    <h2 className="text-lg font-bold tracking-tight text-[#e5e1e7]">Sorumluluk Sınırlaması</h2>
                  </div>
                  <p className="text-[#bbcabf] text-sm leading-relaxed">
                    VoiceAgent&apos;ta görüntülenen veriler, bağlı platformlar tarafından sağlanan verilere dayanmaktadır; gecikmeler, kotalar veya kesintiler nedeniyle tutarsızlıklar oluşabilir. Yasaların izin verdiği azami ölçüde dolaylı, tesadüfi veya sonuçsal zararlardan sorumlu değiliz.
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-emerald-400 font-mono text-sm tracking-widest">07.</span>
                    <h2 className="text-lg font-bold tracking-tight text-[#e5e1e7]">Hesap Güvenliği</h2>
                  </div>
                  <p className="text-[#bbcabf] text-sm leading-relaxed">
                    Kullanıcı, hesabının güvenliğinden ve erişim kimlik bilgilerinin korunmasından sorumludur. Yetkisiz herhangi bir kullanım durumunda lütfen derhal{' '}
                    <a href="mailto:info@yodijital.com" className="text-emerald-400 hover:text-emerald-300 underline underline-offset-4">info@yodijital.com</a>{' '}
                    adresinden bize bildirin.
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-emerald-400 font-mono text-sm tracking-widest">08.</span>
                    <h2 className="text-lg font-bold tracking-tight text-[#e5e1e7]">Fesih</h2>
                  </div>
                  <p className="text-[#bbcabf] text-sm leading-relaxed">
                    VoiceAgent, kötüye kullanım veya bu koşulların ihlali durumunda erişimi askıya alabilir veya sonlandırabilir. Ücretli planlar için abonelik ücretleri önceden belirtilir; dilediğiniz zaman iptal edebilirsiniz.
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-emerald-400 font-mono text-sm tracking-widest">09.</span>
                    <h2 className="text-lg font-bold tracking-tight text-[#e5e1e7]">Değişiklikler</h2>
                  </div>
                  <p className="text-[#bbcabf] text-sm leading-relaxed">
                    Bu koşullar önceden bildirimde bulunularak güncellenebilir. Güncel sürüm her zaman bu sayfada yayınlanır. Değişikliklerden sonra Hizmeti kullanmaya devam etmeniz, koşulları kabul ettiğiniz anlamına gelir.
                  </p>
                </div>
              </div>
            </section>

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
