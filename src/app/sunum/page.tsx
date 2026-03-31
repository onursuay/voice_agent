'use client';

export default function SunumPage() {
  return (
    <div className="min-h-screen bg-white text-black">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Yo Dijital" className="h-7" />
            <div className="h-4 w-px bg-gray-300" />
            <span className="text-xs font-medium text-black">Lead Operasyon Dashboard + CRM</span>
          </div>
          <span className="text-[11px] text-gray-500">{"\u00dc"}r{"\u00fc"}n Sunumu</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-6 space-y-8">

        {/* 1 - AMAC */}
        <section>
          <h2 className="text-base font-bold text-black mb-3">1) Ama{"\u00e7"} ve Avantajlar</h2>

          <div className="rounded-lg bg-gray-50 border border-gray-200 px-4 py-3 mb-5">
            <p className="text-sm font-semibold text-black mb-1">Ne yapar?</p>
            <p className="text-sm text-black leading-relaxed">Meta reklamlar{"\u0131"}ndan (Facebook, Instagram, WhatsApp, Messenger) gelen t{"\u00fc"}m lead{"\u2019"}leri tek merkezde toplar, CRM pipeline ile y{"\u00f6"}netir, e-posta ve AI arama ile aksiyona d{"\u00f6"}n{"\u00fc"}{"\u015f"}t{"\u00fc"}r{"\u00fc"}r.</p>
          </div>

          <p className="text-sm font-semibold text-black mb-2">Hangi sorunu {"\u00e7"}{"\u00f6"}zer?</p>
          <div className="space-y-1.5 mb-5">
            {[
              { p: "Lead\u2019ler farkl\u0131 platformlarda da\u011f\u0131n\u0131k", s: "Tek havuzda birle\u015fir" },
              { p: "Excel/Sheets ile takip", s: "Airtable benzeri profesyonel grid" },
              { p: "Lead hangi a\u015famada bilinmiyor", s: "Pipeline ile g\u00f6rsel takip" },
              { p: "Zaman\u0131nda d\u00f6n\u00fc\u015f yap\u0131lam\u0131yor", s: "Otomasyon ve AI arama" },
              { p: "Ayn\u0131 ki\u015fi farkl\u0131 kanallardan geliyor", s: "Otomatik dedupe" },
            ].map((item) => (
              <div key={item.p} className="flex items-center gap-2 text-sm text-black">
                <span className="text-red-500 text-xs">{"\u2717"}</span>
                <span>{item.p}</span>
                <span className="text-gray-400">{"\u2192"}</span>
                <span className="font-semibold text-green-700">{"\u2713"} {item.s}</span>
              </div>
            ))}
          </div>

          {/* Lead Kaynak Dagilim Grafigi */}
          <p className="text-sm font-semibold text-black mb-2">Lead Kaynak Da{"\u011f"}{"\u0131"}l{"\u0131"}m{"\u0131"} (Ortalama)</p>
          <div className="rounded-lg bg-gray-50 border border-gray-200 p-4 mb-5">
            <div className="space-y-2">
              {[
                { label: "Meta Lead Form", pct: 40, color: "bg-blue-500" },
                { label: "WhatsApp", pct: 25, color: "bg-green-500" },
                { label: "Instagram DM", pct: 18, color: "bg-pink-500" },
                { label: "Messenger", pct: 10, color: "bg-indigo-500" },
                { label: "Website / Di\u011fer", pct: 7, color: "bg-gray-400" },
              ].map((bar) => (
                <div key={bar.label} className="flex items-center gap-3">
                  <span className="text-xs text-black w-28 shrink-0">{bar.label}</span>
                  <div className="flex-1 h-5 bg-gray-200 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${bar.color}`} style={{ width: `${bar.pct}%` }} />
                  </div>
                  <span className="text-xs font-bold text-black w-8 text-right">%{bar.pct}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {[
              "\u00c7ok kanall\u0131 toplama", "Otomatik dedupe", "Airtable grid",
              "CRM Pipeline", "CSV import", "E-posta", "AI arama",
              "Otomasyon", "Rol eri\u015fimi",
            ].map((t) => (
              <div key={t} className="rounded bg-gray-50 border border-gray-200 px-2 py-1.5 text-[11px] font-medium text-black text-center">{t}</div>
            ))}
          </div>
        </section>

        {/* 2 - SIDEBAR */}
        <section>
          <h2 className="text-base font-bold text-black mb-3">2) Sidebar Alanlar{"\u0131"}</h2>
          <div className="space-y-1.5">
            {[
              { name: "Dashboard", color: "#6366f1", desc: "Toplam lead, haftal\u0131k yeni, d\u00f6n\u00fc\u015f\u00fcm oran\u0131, pipeline \u00f6zeti" },
              { name: "Lead\u2019ler", color: "#3b82f6", desc: "Ana veri havuzu \u2014 Airtable benzeri tablo, inline edit, filtre, arama" },
              { name: "Pipeline", color: "#8b5cf6", desc: "Kanban board, s\u00fcr\u00fckle-b\u0131rak ile a\u015fama de\u011fi\u015ftirme" },
              { name: "\u0130\u00e7e Aktar", color: "#f59e0b", desc: "CSV/XLSX y\u00fckleme, kolon e\u015fle\u015ftirme, dedupe, 4 ad\u0131ml\u0131 wizard" },
              { name: "E-posta", color: "#ec4899", desc: "Tek/toplu g\u00f6nderim, \u015fablon sistemi, g\u00f6nderim ge\u00e7mi\u015fi" },
              { name: "Otomasyonlar", color: "#eab308", desc: "Kural motoru: tetikleyici \u2192 aksiyon (ata, hat\u0131rlat, etiketle)" },
              { name: "AI Aramalar", color: "#22c55e", desc: "Otomatik arama, senaryo, ses profili, transkript, AI \u00f6zet" },
              { name: "Ayarlar", color: "#6b7280", desc: "Organizasyon, \u00fcyeler, pipeline a\u015famalar\u0131, profil" },
            ].map((item) => (
              <div key={item.name} className="flex items-center gap-3 rounded bg-gray-50 border border-gray-200 px-3 py-2">
                <span className="shrink-0 h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-sm font-semibold text-black w-28 shrink-0">{item.name}</span>
                <span className="text-sm text-black">{item.desc}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 3 - MALIYET & KAZANC */}
        <section>
          <h2 className="text-base font-bold text-black mb-3">3) Maliyet ve Kazan{"\u00e7"}</h2>

          <p className="text-sm font-semibold text-black mb-2">Ayl{"\u0131"}k Altyap{"\u0131"} Maliyeti</p>
          <table className="w-full text-xs mb-5">
            <thead>
              <tr className="border-b border-gray-300">
                <th className="text-left py-1.5 font-semibold text-black">Servis</th>
                <th className="text-left py-1.5 font-semibold text-black">Kullan{"\u0131"}m</th>
                <th className="text-right py-1.5 font-semibold text-black">Maliyet</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Supabase", "500MB DB, 50K user", "$0"],
                ["Vercel", "Hosting", "$0"],
                ["Resend", "3.000 mail/ay", "$0"],
                ["ElevenLabs", "10K karakter/ay", "$0"],
                ["OpenAI", "GPT-4o-mini", "$5\u201320/ay"],
                ["Netgsm", "Telefon", "200\u2013500 \u20ba/ay"],
              ].map(([s, k, m]) => (
                <tr key={s} className="border-b border-gray-100">
                  <td className="py-1.5 font-medium text-black">{s}</td>
                  <td className="py-1.5 text-black">{k}</td>
                  <td className="py-1.5 text-right font-semibold text-black">{m}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Maliyet Bar Grafigi */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: "Ba\u015flang\u0131\u00e7", value: "\u20ba0", sub: "Free tier", color: "#22c55e", h: 20 },
              { label: "Orta \u00d6l\u00e7ek", value: "~$80", sub: "/ay", color: "#3b82f6", h: 55 },
              { label: "Tam Kapasite", value: "~$90", sub: "/ay + telefon", color: "#8b5cf6", h: 65 },
            ].map((b) => (
              <div key={b.label} className="text-center">
                <div className="h-24 flex items-end justify-center mb-2">
                  <div className="w-12 rounded-t" style={{ height: `${b.h}%`, backgroundColor: b.color }} />
                </div>
                <p className="text-lg font-bold text-black">{b.value}</p>
                <p className="text-[10px] text-black">{b.label}</p>
                <p className="text-[10px] text-gray-500">{b.sub}</p>
              </div>
            ))}
          </div>

          <p className="text-sm font-semibold text-black mb-2">SaaS Abonelik Fiyatland{"\u0131"}rmas{"\u0131"}</p>
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { plan: "Starter", m: "\u20ba999", y: "\u20ba799", leads: "1.000", users: "2", email: "1.000", ai: "50 dk" },
              { plan: "Growth", m: "\u20ba1.999", y: "\u20ba1.599", leads: "10.000", users: "10", email: "10.000", ai: "500 dk", pop: true },
              { plan: "Enterprise", m: "\u20ba3.999", y: "\u20ba3.199", leads: "S\u0131n\u0131rs\u0131z", users: "S\u0131n\u0131rs\u0131z", email: "50.000", ai: "2.000 dk" },
            ].map((p) => (
              <div key={p.plan} className={`rounded-lg border p-3 ${p.pop ? 'border-indigo-400 bg-indigo-50/40' : 'border-gray-200 bg-gray-50'}`}>
                {p.pop && <span className="inline-block bg-indigo-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded mb-1.5">Pop{"\u00fc"}ler</span>}
                <p className="text-sm font-bold text-black">{p.plan}</p>
                <p className="text-lg font-bold text-black mt-0.5">{p.m}<span className="text-[11px] font-normal">/ay</span></p>
                <p className="text-[10px] text-black">Y{"\u0131"}ll{"\u0131"}k: {p.y}/ay <span className="font-semibold text-green-700">%20 indirim</span></p>
                <div className="mt-2 space-y-0.5 text-[11px] text-black">
                  <p>{p.leads} lead/ay</p>
                  <p>{p.users} kullan{"\u0131"}c{"\u0131"}</p>
                  <p>{p.email} e-posta/ay</p>
                  <p>{p.ai} AI arama</p>
                </div>
              </div>
            ))}
          </div>

          {/* Gelir Projeksiyonu Grafik */}
          <p className="text-sm font-semibold text-black mb-2">Gelir Projeksiyonu</p>
          <div className="rounded-lg bg-gray-50 border border-gray-200 p-4 mb-4">
            <div className="flex items-end gap-4 h-40">
              {[
                { label: "10 m\u00fc\u015fteri\n(Starter)", gelir: 9990, net: 7490, maxH: 100 },
                { label: "10 m\u00fc\u015fteri\n(Growth)", gelir: 19990, net: 15990, maxH: 100 },
                { label: "50 m\u00fc\u015fteri\n(mix)", gelir: 79965, net: 67965, maxH: 100 },
                { label: "100 m\u00fc\u015fteri\n(mix)", gelir: 179900, net: 154900, maxH: 100 },
              ].map((d) => {
                const maxVal = 179900;
                const gelirH = (d.gelir / maxVal) * 100;
                const netH = (d.net / maxVal) * 100;
                return (
                  <div key={d.label} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex items-end justify-center gap-1 h-32">
                      <div className="w-5 bg-indigo-300 rounded-t" style={{ height: `${gelirH}%` }} title={`Gelir: \u20ba${d.gelir.toLocaleString('tr-TR')}`} />
                      <div className="w-5 bg-green-500 rounded-t" style={{ height: `${netH}%` }} title={`Net: \u20ba${d.net.toLocaleString('tr-TR')}`} />
                    </div>
                    <p className="text-[10px] text-black text-center font-medium leading-tight whitespace-pre-line">{d.label}</p>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-center gap-4 mt-3 text-[10px] text-black">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-indigo-300" /> Gelir</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-green-500" /> Net K{"\u00e2"}r</span>
            </div>
          </div>

          <table className="w-full text-xs mb-5">
            <thead>
              <tr className="border-b border-gray-300">
                <th className="text-left py-1.5 font-semibold text-black">Senaryo</th>
                <th className="text-right py-1.5 font-semibold text-black">Gelir</th>
                <th className="text-right py-1.5 font-semibold text-black">Maliyet</th>
                <th className="text-right py-1.5 font-semibold text-green-700">Net</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["10 m\u00fc\u015fteri (Starter)", "\u20ba9.990", "\u20ba2.500", "\u20ba7.490"],
                ["10 m\u00fc\u015fteri (Growth)", "\u20ba19.990", "\u20ba4.000", "\u20ba15.990"],
                ["50 m\u00fc\u015fteri (mix)", "\u20ba79.965", "\u20ba12.000", "\u20ba67.965"],
                ["100 m\u00fc\u015fteri (mix)", "\u20ba179.900", "\u20ba25.000", "\u20ba154.900"],
              ].map(([s, g, m, n]) => (
                <tr key={s} className="border-b border-gray-100">
                  <td className="py-1.5 text-black">{s}</td>
                  <td className="py-1.5 text-right text-black">{g}</td>
                  <td className="py-1.5 text-right text-black">{m}</td>
                  <td className="py-1.5 text-right font-bold text-green-700">{n}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="rounded bg-gray-100 px-4 py-2.5 text-center">
            <span className="text-xs text-black">Break-even: </span>
            <span className="text-sm font-bold text-black">3 m{"\u00fc"}{"\u015f"}teri</span>
            <span className="text-xs text-black"> {"\u2014"} Starter plan bile altyap{"\u0131"} maliyetini kar{"\u015f"}{"\u0131"}lar</span>
          </div>
        </section>

        <p className="text-center text-[10px] text-gray-500 pt-3 border-t border-gray-200">{"\u00a9"} 2024-2026 Yo Dijital</p>
      </div>
    </div>
  );
}
