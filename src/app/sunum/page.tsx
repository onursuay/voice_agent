export default function SunumPage() {
  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header - kompakt */}
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Yo Dijital" className="h-8" />
            <div className="h-5 w-px bg-gray-200" />
            <span className="text-sm font-medium text-gray-500">Lead Operasyon Dashboard + CRM</span>
          </div>
          <span className="text-xs text-gray-400">&#220;r&#252;n Sunum &#214;zeti</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-10">

        {/* 1 - AMA&#199; */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-4">1) Ama&#231; ve Avantajlar</h2>

          <div className="rounded-xl bg-indigo-50/70 border border-indigo-100 px-5 py-4 mb-6">
            <p className="text-sm font-semibold text-indigo-800 mb-1">Ne yapar?</p>
            <p className="text-sm text-gray-700 leading-relaxed">Meta reklamlar&#305;ndan (Facebook, Instagram, WhatsApp, Messenger) gelen t&#252;m lead&apos;leri tek merkezde toplar, CRM pipeline ile y&#246;netir, e-posta ve AI arama ile aksiyona d&#246;n&#252;&#351;t&#252;r&#252;r.</p>
          </div>

          <p className="text-sm font-semibold text-gray-800 mb-3">Hangi sorunu &#231;&#246;zer?</p>
          <div className="space-y-2 mb-6">
            {[
              { p: "Lead\u2019ler farkl\u0131 platformlarda da\u011f\u0131n\u0131k", s: "Tek havuzda birle\u015fir" },
              { p: "Excel/Sheets ile takip", s: "Airtable benzeri profesyonel grid" },
              { p: "Lead hangi a\u015famada bilinmiyor", s: "Pipeline ile g\u00f6rsel takip" },
              { p: "Zaman\u0131nda d\u00f6n\u00fc\u015f yap\u0131lam\u0131yor", s: "Otomasyon ve AI arama" },
              { p: "Ayn\u0131 ki\u015fi farkl\u0131 kanallardan geliyor", s: "Otomatik dedupe" },
            ].map((item) => (
              <div key={item.p} className="flex items-center gap-2 text-sm">
                <span className="text-red-400 text-xs">{'\u2717'}</span>
                <span className="text-gray-500">{item.p}</span>
                <span className="text-gray-300">{'\u2192'}</span>
                <span className="font-medium text-green-700">{'\u2713'} {item.s}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              "\u00c7ok kanall\u0131 toplama",
              "Otomatik dedupe",
              "Airtable benzeri grid",
              "CRM Pipeline",
              "CSV/XLSX import",
              "E-posta entegrasyonu",
              "AI arama",
              "Otomasyon",
              "Rol bazl\u0131 eri\u015fim",
            ].map((t) => (
              <div key={t} className="rounded-lg bg-white border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700">{t}</div>
            ))}
          </div>
        </section>

        {/* 2 - SIDEBAR */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-4">2) Sidebar Alanlar\u0131</h2>
          <div className="space-y-2">
            {[
              { name: "Dashboard", color: "bg-indigo-500", desc: "Toplam lead, haftal\u0131k yeni, d\u00f6n\u00fc\u015f\u00fcm oran\u0131, pipeline \u00f6zeti" },
              { name: "Lead\u2019ler", color: "bg-blue-500", desc: "Ana veri havuzu \u2014 Airtable benzeri tablo, inline edit, filtre, arama" },
              { name: "Pipeline", color: "bg-purple-500", desc: "Kanban board, s\u00fcr\u00fckle-b\u0131rak ile a\u015fama de\u011fi\u015ftirme" },
              { name: "\u0130\u00e7e Aktar", color: "bg-amber-500", desc: "CSV/XLSX y\u00fckleme, kolon e\u015fle\u015ftirme, dedupe, 4 ad\u0131ml\u0131 wizard" },
              { name: "E-posta", color: "bg-pink-500", desc: "Tek/toplu g\u00f6nderim, \u015fablon sistemi, g\u00f6nderim ge\u00e7mi\u015fi" },
              { name: "Otomasyonlar", color: "bg-yellow-500", desc: "Kural motoru: tetikleyici \u2192 aksiyon (ata, hat\u0131rlat, etiketle)" },
              { name: "AI Aramalar", color: "bg-green-500", desc: "Otomatik arama, senaryo, ses profili, transkript, AI \u00f6zet" },
              { name: "Ayarlar", color: "bg-gray-500", desc: "Organizasyon, \u00fcyeler, pipeline a\u015famalar\u0131, profil" },
            ].map((item) => (
              <div key={item.name} className="flex items-center gap-3 rounded-lg bg-white border border-gray-200 px-4 py-2.5">
                <span className={`shrink-0 h-2 w-2 rounded-full ${item.color}`} />
                <span className="text-sm font-semibold text-gray-900 w-28 shrink-0">{item.name}</span>
                <span className="text-sm text-gray-500">{item.desc}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 3 - MAL\u0130YET & KAZAN\u00c7 */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-4">3) Maliyet ve Kazan\u00e7</h2>

          <p className="text-sm font-semibold text-gray-800 mb-2">Ayl\u0131k Altyap\u0131 Maliyeti</p>
          <table className="w-full text-xs mb-6">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500">
                <th className="text-left py-2 font-medium">Servis</th>
                <th className="text-left py-2 font-medium">Kullan\u0131m</th>
                <th className="text-right py-2 font-medium">Maliyet</th>
              </tr>
            </thead>
            <tbody className="text-gray-700">
              {[
                ["Supabase", "500MB DB, 50K user", "$0"],
                ["Vercel", "Hosting", "$0"],
                ["Resend", "3.000 mail/ay", "$0"],
                ["ElevenLabs", "10K karakter/ay", "$0"],
                ["OpenAI", "GPT-4o-mini", "$5\u201320/ay"],
                ["Netgsm", "Telefon", "200\u2013500 \u20ba/ay"],
              ].map(([s, k, m]) => (
                <tr key={s} className="border-b border-gray-100">
                  <td className="py-2 font-medium">{s}</td>
                  <td className="py-2 text-gray-500">{k}</td>
                  <td className="py-2 text-right font-semibold">{m}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="grid grid-cols-3 gap-3 mb-8">
            {[
              { label: "Ba\u015flang\u0131\u00e7", value: "\u20ba0", sub: "Free tier", c: "text-green-700 bg-green-50 border-green-200" },
              { label: "Orta \u00d6l\u00e7ek", value: "~$80", sub: "/ay", c: "text-blue-700 bg-blue-50 border-blue-200" },
              { label: "Tam Kapasite", value: "~$90", sub: "/ay + telefon", c: "text-purple-700 bg-purple-50 border-purple-200" },
            ].map((b) => (
              <div key={b.label} className={`rounded-lg border p-3 text-center ${b.c}`}>
                <p className="text-[10px] font-semibold uppercase tracking-wide opacity-70">{b.label}</p>
                <p className="text-xl font-bold">{b.value}</p>
                <p className="text-[10px] opacity-60">{b.sub}</p>
              </div>
            ))}
          </div>

          <p className="text-sm font-semibold text-gray-800 mb-3">SaaS Abonelik Fiyatland\u0131rmas\u0131</p>
          <div className="grid grid-cols-3 gap-3 mb-8">
            {[
              { plan: "Starter", m: "\u20ba999", y: "\u20ba799", yt: "\u20ba9.588", leads: "1.000", users: "2", email: "1.000", ai: "50 dk" },
              { plan: "Growth", m: "\u20ba1.999", y: "\u20ba1.599", yt: "\u20ba19.188", leads: "10.000", users: "10", email: "10.000", ai: "500 dk", pop: true },
              { plan: "Enterprise", m: "\u20ba3.999", y: "\u20ba3.199", yt: "\u20ba38.388", leads: "S\u0131n\u0131rs\u0131z", users: "S\u0131n\u0131rs\u0131z", email: "50.000", ai: "2.000 dk" },
            ].map((p) => (
              <div key={p.plan} className={`rounded-xl border p-4 ${p.pop ? 'border-indigo-400 bg-indigo-50/50' : 'border-gray-200 bg-white'}`}>
                {p.pop && <span className="inline-block bg-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded mb-2">Pop&#252;ler</span>}
                <p className="text-sm font-bold text-gray-900">{p.plan}</p>
                <p className="text-xl font-bold text-gray-900 mt-1">{p.m}<span className="text-xs font-normal text-gray-400">/ay</span></p>
                <p className="text-[11px] text-gray-500 mt-1">Y\u0131ll\u0131k: {p.y}/ay <span className="text-green-600 font-semibold">%20</span></p>
                <div className="mt-3 space-y-1 text-[11px] text-gray-600">
                  <p>{p.leads} lead/ay</p>
                  <p>{p.users} kullan\u0131c\u0131</p>
                  <p>{p.email} e-posta/ay</p>
                  <p>{p.ai} AI arama</p>
                </div>
              </div>
            ))}
          </div>

          <p className="text-sm font-semibold text-gray-800 mb-2">Gelir Projeksiyonu</p>
          <table className="w-full text-xs mb-6">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500">
                <th className="text-left py-2 font-medium">Senaryo</th>
                <th className="text-right py-2 font-medium">Ayl\u0131k Gelir</th>
                <th className="text-right py-2 font-medium">Maliyet</th>
                <th className="text-right py-2 font-medium text-green-700">Net</th>
              </tr>
            </thead>
            <tbody className="text-gray-700">
              {[
                ["10 m\u00fc\u015fteri (Starter)", "\u20ba9.990", "\u20ba2.500", "\u20ba7.490"],
                ["10 m\u00fc\u015fteri (Growth)", "\u20ba19.990", "\u20ba4.000", "\u20ba15.990"],
                ["50 m\u00fc\u015fteri (mix)", "\u20ba79.965", "\u20ba12.000", "\u20ba67.965"],
                ["100 m\u00fc\u015fteri (mix)", "\u20ba179.900", "\u20ba25.000", "\u20ba154.900"],
              ].map(([s, g, m, n]) => (
                <tr key={s} className="border-b border-gray-100">
                  <td className="py-2">{s}</td>
                  <td className="py-2 text-right">{g}</td>
                  <td className="py-2 text-right text-gray-400">{m}</td>
                  <td className="py-2 text-right font-bold text-green-700">{n}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="rounded-lg bg-gray-100 px-5 py-3 text-center">
            <span className="text-xs text-gray-500">Break-even: </span>
            <span className="text-sm font-bold text-gray-900">3 m&#252;&#351;teri</span>
            <span className="text-xs text-gray-500"> — Starter plan bile altyap&#305; maliyetini kar&#351;&#305;lar</span>
          </div>
        </section>

        <p className="text-center text-[11px] text-gray-400 pt-4 border-t border-gray-100">&copy; 2024-2026 Yo Dijital. T&#252;m haklar&#305; sakl&#305;d&#305;r.</p>
      </div>
    </div>
  );
}
