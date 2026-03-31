export default function SunumPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <img src="/logo.png" alt="Yo Dijital" className="h-16 mx-auto mb-6 brightness-0 invert" />
          <h1 className="text-4xl font-bold mb-3">Lead Operasyon Dashboard + CRM</h1>
          <p className="text-indigo-200 text-lg">Ürün Sunum Özeti</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12 space-y-16">

        {/* 1 - AMAÇ */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">1) Amaç &amp; Avantajlar</h2>
          <div className="h-1 w-16 bg-indigo-600 rounded mb-6" />

          <div className="bg-indigo-50 rounded-2xl p-6 mb-8">
            <p className="text-lg font-semibold text-indigo-900 mb-2">Ne yapar?</p>
            <p className="text-gray-700">Meta reklamlarından (Facebook, Instagram, WhatsApp, Messenger) gelen tüm lead&apos;leri tek merkezde toplar, CRM pipeline ile yönetir, e-posta ve AI arama ile aksiyona dönüştürür.</p>
          </div>

          <p className="font-semibold text-gray-900 mb-4">Hangi sorunu çözer?</p>
          <div className="space-y-3 mb-8">
            {[
              { problem: "Lead'ler farklı platformlarda dağınık kalıyor", solution: "Tek havuzda birleşir" },
              { problem: "Excel/Sheets ile takip yapılıyor", solution: "Airtable benzeri profesyonel grid" },
              { problem: "Hangi lead hangi aşamada bilinmiyor", solution: "Pipeline ile görsel takip" },
              { problem: "Lead'lere zamanında dönüş yapılamıyor", solution: "Otomasyon ve AI arama" },
              { problem: "Aynı kişi farklı kanallardan geliyor", solution: "Otomatik dedupe (telefon/email)" },
            ].map((item) => (
              <div key={item.problem} className="flex items-start gap-3 bg-gray-50 rounded-xl p-4">
                <span className="text-red-400 shrink-0 mt-0.5">✗</span>
                <div className="flex-1">
                  <span className="text-gray-600">{item.problem}</span>
                  <span className="mx-2 text-gray-300">→</span>
                  <span className="font-semibold text-green-700">✓ {item.solution}</span>
                </div>
              </div>
            ))}
          </div>

          <p className="font-semibold text-gray-900 mb-4">Avantajlar</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { title: "Çok kanallı toplama", desc: "Meta Lead Form, WhatsApp, Instagram DM, Messenger, Website" },
              { title: "Otomatik dedupe", desc: "Aynı kişi farklı kanallardan gelirse tek lead altında birleşir" },
              { title: "Airtable benzeri grid", desc: "Inline edit, filtre, sıralama, bulk action" },
              { title: "CRM Pipeline", desc: "Drag-drop Kanban, aşama takibi, stage history" },
              { title: "CSV/XLSX import", desc: "Mevcut verileri kolayca aktarma" },
              { title: "E-posta entegrasyonu", desc: "Tek/toplu gönderim, şablon sistemi" },
              { title: "AI arama", desc: "Otomatik arama, transkript, özet" },
              { title: "Otomasyon", desc: "Kural bazlı otomatik aksiyonlar" },
              { title: "Rol bazlı erişim", desc: "6 farklı rol seviyesi" },
              { title: "Çoklu organizasyon", desc: "Her müşteri kendi workspace'inde" },
            ].map((item) => (
              <div key={item.title} className="border border-gray-200 rounded-xl p-4">
                <p className="font-semibold text-gray-900 text-sm">{item.title}</p>
                <p className="text-gray-500 text-xs mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 2 - SIDEBAR */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">2) Sidebar Alanları</h2>
          <div className="h-1 w-16 bg-indigo-600 rounded mb-6" />

          <div className="space-y-4">
            {[
              { name: "Dashboard", color: "bg-indigo-100 text-indigo-700", desc: "Genel bakış: toplam lead, haftalık yeni, dönüşüm oranı, aktif pipeline, son lead'ler, pipeline özeti bar grafiği" },
              { name: "Lead'ler", color: "bg-blue-100 text-blue-700", desc: "Ana veri havuzu. Airtable benzeri tablo — tüm lead'ler burada listelenir, aranır, filtrelenir, inline düzenlenir, yeni lead eklenir" },
              { name: "Pipeline", color: "bg-purple-100 text-purple-700", desc: "Kanban board. Lead'ler aşama bazlı kolonlarda görünür. Sürükle-bırak ile aşama değiştirilir" },
              { name: "İçe Aktar", color: "bg-amber-100 text-amber-700", desc: "CSV/XLSX dosyadan lead yükleme. 4 adımlı wizard: Dosya Yükle → Kolon Eşleştir → Önizle → Sonuç" },
              { name: "E-posta", color: "bg-pink-100 text-pink-700", desc: "E-posta gönderim merkezi. Tek/toplu gönderim, şablon oluşturma, gönderim geçmişi" },
              { name: "Otomasyonlar", color: "bg-yellow-100 text-yellow-700", desc: "Kural motoru. Tetikleyici-aksiyon kuralları: lead gelince ata, hareketsizse hatırlat, skor değişince etiketle" },
              { name: "AI Aramalar", color: "bg-green-100 text-green-700", desc: "AI ile otomatik telefon araması. Lead seç → senaryo yaz → ses profili seç → kuyruğa ekle. Transkript + AI özet" },
              { name: "Ayarlar", color: "bg-gray-100 text-gray-700", desc: "Organizasyon bilgileri, üye yönetimi, pipeline aşamalarını özelleştirme, profil düzenleme" },
            ].map((item) => (
              <div key={item.name} className="flex items-start gap-4 rounded-xl border border-gray-200 p-5">
                <span className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-bold ${item.color}`}>{item.name}</span>
                <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 3 - MALİYET & KAZANÇ */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">3) Maliyet &amp; Kazanç</h2>
          <div className="h-1 w-16 bg-indigo-600 rounded mb-6" />

          <h3 className="font-semibold text-gray-900 mb-3">Aylık Altyapı Maliyeti</h3>
          <div className="overflow-x-auto mb-8">
            <table className="w-full text-sm border border-gray-200 rounded-xl overflow-hidden">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Servis</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Kullanım</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-700">Maliyet</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[
                  ["Supabase (DB + Auth)", "Free tier: 500MB, 50K user", "$0"],
                  ["Vercel (Hosting)", "Free tier", "$0"],
                  ["Resend (E-posta)", "Free: 3.000 mail/ay", "$0"],
                  ["ElevenLabs (Ses)", "Free: 10K karakter/ay", "$0"],
                  ["OpenAI (AI)", "GPT-4o-mini", "$5-20/ay"],
                  ["Netgsm (Telefon)", "Kullanıma göre", "~200-500 ₺/ay"],
                ].map(([servis, kullanim, maliyet]) => (
                  <tr key={servis}>
                    <td className="px-4 py-3 font-medium text-gray-900">{servis}</td>
                    <td className="px-4 py-3 text-gray-600">{kullanim}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">{maliyet}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-10">
            <div className="rounded-xl border-2 border-green-200 bg-green-50 p-4 text-center">
              <p className="text-xs text-green-600 font-semibold mb-1">Minimum</p>
              <p className="text-2xl font-bold text-green-700">₺0</p>
              <p className="text-xs text-green-600">Free tier</p>
            </div>
            <div className="rounded-xl border-2 border-blue-200 bg-blue-50 p-4 text-center">
              <p className="text-xs text-blue-600 font-semibold mb-1">Orta Ölçek</p>
              <p className="text-2xl font-bold text-blue-700">~$80</p>
              <p className="text-xs text-blue-600">/ay</p>
            </div>
            <div className="rounded-xl border-2 border-purple-200 bg-purple-50 p-4 text-center">
              <p className="text-xs text-purple-600 font-semibold mb-1">Tam Kapasite</p>
              <p className="text-2xl font-bold text-purple-700">~$90</p>
              <p className="text-xs text-purple-600">/ay + telefon</p>
            </div>
          </div>

          <h3 className="font-semibold text-gray-900 mb-3">SaaS Abonelik Fiyatlandırması</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
            {[
              { plan: "Starter", monthly: "₺999", yearly: "₺799", yTotal: "₺9.588", leads: "1.000", users: "2", email: "1.000", ai: "50 dk" },
              { plan: "Growth", monthly: "₺1.999", yearly: "₺1.599", yTotal: "₺19.188", leads: "10.000", users: "10", email: "10.000", ai: "500 dk", popular: true },
              { plan: "Enterprise", monthly: "₺3.999", yearly: "₺3.199", yTotal: "₺38.388", leads: "Sınırsız", users: "Sınırsız", email: "50.000", ai: "2.000 dk" },
            ].map((p) => (
              <div key={p.plan} className={`rounded-2xl border-2 p-6 ${p.popular ? 'border-indigo-500 shadow-lg shadow-indigo-100' : 'border-gray-200'}`}>
                {p.popular && <span className="inline-block bg-indigo-600 text-white text-xs font-bold px-2 py-0.5 rounded-full mb-3">Popüler</span>}
                <h4 className="text-lg font-bold text-gray-900">{p.plan}</h4>
                <div className="mt-3 mb-1">
                  <span className="text-3xl font-bold text-gray-900">{p.monthly}</span>
                  <span className="text-gray-500 text-sm">/ay</span>
                </div>
                <p className="text-sm text-gray-500 mb-4">Yıllık: {p.yearly}/ay ({p.yTotal}/yıl) <span className="text-green-600 font-semibold">%20 indirim</span></p>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>• {p.leads} lead/ay</p>
                  <p>• {p.users} kullanıcı</p>
                  <p>• {p.email} e-posta/ay</p>
                  <p>• {p.ai} AI arama</p>
                </div>
              </div>
            ))}
          </div>

          <h3 className="font-semibold text-gray-900 mb-3">Gelir Projeksiyonu</h3>
          <div className="overflow-x-auto mb-6">
            <table className="w-full text-sm border border-gray-200 rounded-xl overflow-hidden">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Senaryo</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-700">Aylık Gelir</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-700">Maliyet</th>
                  <th className="text-right px-4 py-3 font-semibold text-green-700">Net Kâr</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[
                  ["10 müşteri (Starter)", "₺9.990", "₺2.500", "₺7.490"],
                  ["10 müşteri (Growth)", "₺19.990", "₺4.000", "₺15.990"],
                  ["50 müşteri (mix)", "₺79.965", "₺12.000", "₺67.965"],
                  ["100 müşteri (mix)", "₺179.900", "₺25.000", "₺154.900"],
                ].map(([senaryo, gelir, maliyet, net]) => (
                  <tr key={senaryo}>
                    <td className="px-4 py-3 font-medium text-gray-900">{senaryo}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{gelir}</td>
                    <td className="px-4 py-3 text-right text-gray-500">{maliyet}</td>
                    <td className="px-4 py-3 text-right font-bold text-green-700">{net}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-indigo-50 rounded-2xl p-6 text-center">
            <p className="text-sm text-indigo-600 font-semibold mb-1">Break-even</p>
            <p className="text-3xl font-bold text-indigo-700">3 müşteri</p>
            <p className="text-sm text-indigo-500 mt-1">Starter plan bile altyapı maliyetini karşılar</p>
          </div>
        </section>

        {/* Footer */}
        <div className="text-center text-xs text-gray-400 pt-8 border-t border-gray-100">
          © 2024-2026 Yo Dijital. Tüm hakları saklıdır.
        </div>
      </div>
    </div>
  );
}
