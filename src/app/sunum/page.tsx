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

          <p className="text-sm font-semibold text-black mb-2">Ayl{"\u0131"}k Sabit Altyap{"\u0131"} Maliyeti (Detay)</p>
          <div className="space-y-3 mb-5">
            {/* Supabase */}
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-bold text-black">Supabase Pro</span>
                <span className="text-sm font-bold text-black">$25/ay</span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[11px] text-black">
                <p>{"\u2022"} 8GB veritaban{"\u0131"} diski (otomatik geni{"\u015f"}leme)</p>
                <p>{"\u2022"} 250GB egress (bandwidth)</p>
                <p>{"\u2022"} 100GB storage</p>
                <p>{"\u2022"} 100K auth kullan{"\u0131"}c{"\u0131"}</p>
                <p>{"\u2022"} $10 compute kredisi dahil</p>
                <p>{"\u2022"} G{"\u00fc"}nl{"\u00fc"}k otomatik backup</p>
                <p>{"\u2022"} Proje duraklat{"\u0131"}lmaz (always on)</p>
                <p>{"\u2022"} 2M Edge Function {"\u00e7"}a{"\u011f"}r{"\u0131"}/ay</p>
              </div>
              <p className="text-[10px] text-gray-500 mt-1">A{"\u015f"}{"\u0131"}m: $0.09/GB egress, $2/1M edge fn</p>
            </div>

            {/* Vercel */}
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-bold text-black">Vercel Pro</span>
                <span className="text-sm font-bold text-black">$20/ay</span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[11px] text-black">
                <p>{"\u2022"} $20 kredi dahil (t{"\u00fc"}m kaynaklara)</p>
                <p>{"\u2022"} 1TB Fast Data Transfer</p>
                <p>{"\u2022"} 10M Edge Request</p>
                <p>{"\u2022"} 200 saat build s{"\u00fc"}resi</p>
                <p>{"\u2022"} Custom domain</p>
                <p>{"\u2022"} Analytics</p>
              </div>
              <p className="text-[10px] text-gray-500 mt-1">Trafi{"\u011f"}e g{"\u00f6"}re de{"\u011f"}i{"\u015f"}ir. Maks $200 varsay{"\u0131"}lan b{"\u00fc"}t{"\u00e7"}e limiti</p>
            </div>

            {/* ElevenLabs */}
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-bold text-black">ElevenLabs Creator</span>
                <span className="text-sm font-bold text-black">$22/ay</span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[11px] text-black">
                <p>{"\u2022"} 100.000 karakter/ay TTS</p>
                <p>{"\u2022"} 30 {"\u00f6"}zel ses klonu</p>
                <p>{"\u2022"} Conversational AI: $0.10/dk</p>
                <p>{"\u2022"} Geli{"\u015f"}mi{"\u015f"} ses kalitesi</p>
                <p>{"\u2022"} Kullan{"\u0131"}lmayan kredi 2 ay devir</p>
                <p>{"\u2022"} T{"\u00fc"}rk{"\u00e7"}e dahil 32 dil</p>
              </div>
              <p className="text-[10px] text-gray-500 mt-1">Business: $330/ay (2M karakter, $0.08/dk arama)</p>
            </div>

            {/* Diger */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-black">Netgsm</span>
                  <span className="text-xs font-bold text-black">{"\u20ba"}2.172/ay</span>
                </div>
                <p className="text-[11px] text-black">Netsantral + Ses Paketi</p>
                <p className="text-[10px] text-gray-500">+GSM operat{"\u00f6"}r konu{"\u015f"}ma {"\u00fc"}creti eklenir</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-black">OpenAI</span>
                  <span className="text-xs font-bold text-black">$5{"\u2013"}20/ay</span>
                </div>
                <p className="text-[11px] text-black">GPT-4o-mini</p>
                <p className="text-[10px] text-gray-500">Kullan{"\u0131"}ma g{"\u00f6"}re de{"\u011f"}i{"\u015f"}ir</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-black">Resend</span>
                  <span className="text-xs font-bold text-black">$20/ay</span>
                </div>
                <p className="text-[11px] text-black">50.000 mail/ay</p>
                <p className="text-[10px] text-gray-500">Free: 3.000 mail/ay</p>
              </div>
            </div>
          </div>

          {/* Toplam Maliyet Grafigi */}
          <p className="text-sm font-semibold text-black mb-2">Toplam Ayl{"\u0131"}k Maliyet</p>
          <div className="rounded-lg bg-gray-50 border border-gray-200 p-4 mb-6">
            <div className="space-y-2">
              {[
                { label: "Supabase Pro", val: 25, color: "#22c55e" },
                { label: "ElevenLabs Creator", val: 22, color: "#8b5cf6" },
                { label: "Vercel Pro", val: 20, color: "#3b82f6" },
                { label: "Resend Pro", val: 20, color: "#ec4899" },
                { label: "Netgsm ({'\u20ba'}2.172)", val: 62, color: "#f97316" },
                { label: "OpenAI", val: 12, color: "#f59e0b" },
              ].map((bar) => (
                <div key={bar.label} className="flex items-center gap-2">
                  <span className="text-[11px] text-black w-36 shrink-0">{bar.label}</span>
                  <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${(bar.val / 62) * 100}%`, backgroundColor: bar.color }} />
                  </div>
                  <span className="text-[11px] font-bold text-black w-12 text-right">${bar.val}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-2 border-t border-gray-300 flex items-center justify-between">
              <span className="text-sm font-bold text-black">TOPLAM</span>
              <span className="text-lg font-bold text-black">~$161/ay <span className="text-[11px] font-normal">(~{"\u20ba"}5.635)</span></span>
            </div>
            <p className="text-[10px] text-gray-500 mt-1">Netgsm {"\u20ba"}2.172 sabit + GSM operat{"\u00f6"}r konu{"\u015f"}ma {"\u00fc"}creti hari{"\u00e7"}. Kur: $1 = ~{"\u20ba"}35</p>
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
