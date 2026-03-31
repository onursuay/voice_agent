'use client';

export default function SunumPage() {
  return (
    <div className="min-h-screen bg-[#fafbfc] text-[#1a1a2e]" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="/logo.png" alt="Yo Dijital" className="h-7" />
            <div className="h-5 w-px bg-gray-200" />
            <span className="text-[13px] font-medium tracking-tight">Lead Operasyon Dashboard + CRM</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-gray-400 tracking-wide uppercase">{"\u00dc"}r{"\u00fc"}n Sunumu</span>
            <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-8 py-10 space-y-12">

        {/* ===== SECTION 1 ===== */}
        <section>
          <div className="flex items-center gap-3 mb-5">
            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-600 text-white text-xs font-bold">1</span>
            <h2 className="text-lg font-bold tracking-tight">Ama{"\u00e7"} ve Avantajlar</h2>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-700 p-6 mb-6 text-white">
            <p className="text-sm font-semibold text-white/80 mb-1">Ne yapar?</p>
            <p className="text-[15px] leading-relaxed">Meta reklamlar{"\u0131"}ndan (Facebook, Instagram, WhatsApp, Messenger) gelen t{"\u00fc"}m lead{"\u2019"}leri tek merkezde toplar, CRM pipeline ile y{"\u00f6"}netir, e-posta ve AI arama ile aksiyona d{"\u00f6"}n{"\u00fc"}{"\u015f"}t{"\u00fc"}r{"\u00fc"}r.</p>
          </div>

          <p className="text-sm font-semibold mb-3">Hangi sorunu {"\u00e7"}{"\u00f6"}zer?</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
            {[
              { p: "Lead\u2019ler farkl\u0131 platformlarda da\u011f\u0131n\u0131k", s: "Tek havuzda birle\u015fir" },
              { p: "Excel/Sheets ile takip", s: "Airtable benzeri grid" },
              { p: "Lead hangi a\u015famada bilinmiyor", s: "Pipeline ile g\u00f6rsel takip" },
              { p: "Zaman\u0131nda d\u00f6n\u00fc\u015f yap\u0131lam\u0131yor", s: "Otomasyon ve AI arama" },
              { p: "Ayn\u0131 ki\u015fi farkl\u0131 kanallardan", s: "Otomatik dedupe" },
            ].map((item) => (
              <div key={item.p} className="flex items-center gap-2.5 bg-white rounded-xl border border-gray-100 px-4 py-2.5 shadow-sm">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-red-50 text-red-400 text-[10px]">{"\u2717"}</span>
                <span className="text-sm text-gray-500 flex-1">{item.p}</span>
                <span className="text-gray-300">{"\u2192"}</span>
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-green-50 text-green-500 text-[10px]">{"\u2713"}</span>
                <span className="text-sm font-semibold text-green-700">{item.s}</span>
              </div>
            ))}
          </div>

          {/* Lead Kaynak Grafik */}
          <p className="text-sm font-semibold mb-3">Lead Kaynak Da{"\u011f"}{"\u0131"}l{"\u0131"}m{"\u0131"}</p>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm mb-6">
            <div className="space-y-3">
              {[
                { label: "Meta Lead Form", pct: 40, color: "#3b82f6" },
                { label: "WhatsApp", pct: 25, color: "#22c55e" },
                { label: "Instagram DM", pct: 18, color: "#ec4899" },
                { label: "Messenger", pct: 10, color: "#6366f1" },
                { label: "Website / Di\u011fer", pct: 7, color: "#9ca3af" },
              ].map((bar) => (
                <div key={bar.label} className="flex items-center gap-3">
                  <span className="text-xs font-medium w-28 shrink-0">{bar.label}</span>
                  <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${bar.pct}%`, backgroundColor: bar.color }} />
                  </div>
                  <span className="text-xs font-bold w-10 text-right">%{bar.pct}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              "\u00c7ok kanall\u0131 toplama", "Otomatik dedupe", "Airtable grid",
              "CRM Pipeline", "CSV import", "E-posta", "AI arama",
              "Otomasyon", "Rol eri\u015fimi",
            ].map((t) => (
              <span key={t} className="inline-flex items-center rounded-full bg-white border border-gray-200 px-3 py-1 text-[11px] font-medium shadow-sm">{t}</span>
            ))}
          </div>
        </section>

        {/* ===== SECTION 2 ===== */}
        <section>
          <div className="flex items-center gap-3 mb-5">
            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-600 text-white text-xs font-bold">2</span>
            <h2 className="text-lg font-bold tracking-tight">Mod{"\u00fc"}ller (Sidebar)</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { name: "Dashboard", color: "#6366f1", desc: "Toplam lead, haftal\u0131k yeni, d\u00f6n\u00fc\u015f\u00fcm oran\u0131, pipeline \u00f6zeti", icon: "\u2726" },
              { name: "Lead\u2019ler", color: "#3b82f6", desc: "Airtable benzeri tablo, inline edit, filtre, arama, yeni lead", icon: "\u2630" },
              { name: "Pipeline", color: "#8b5cf6", desc: "Kanban board, s\u00fcr\u00fckle-b\u0131rak ile a\u015fama de\u011fi\u015ftirme", icon: "\u2b95" },
              { name: "\u0130\u00e7e Aktar", color: "#f59e0b", desc: "CSV/XLSX y\u00fckleme, kolon e\u015fle\u015ftirme, dedupe", icon: "\u2b06" },
              { name: "E-posta", color: "#ec4899", desc: "Tek/toplu g\u00f6nderim, \u015fablon sistemi, ge\u00e7mi\u015f", icon: "\u2709" },
              { name: "Otomasyonlar", color: "#eab308", desc: "Tetikleyici \u2192 aksiyon kurallar\u0131", icon: "\u26a1" },
              { name: "AI Aramalar", color: "#22c55e", desc: "Otomatik arama, transkript, AI \u00f6zet", icon: "\u260e" },
              { name: "Ayarlar", color: "#6b7280", desc: "Organizasyon, \u00fcyeler, pipeline, profil", icon: "\u2699" },
            ].map((item) => (
              <div key={item.name} className="flex items-start gap-3 bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-center w-9 h-9 rounded-lg shrink-0 text-white text-sm" style={{ backgroundColor: item.color }}>{item.icon}</div>
                <div className="min-w-0">
                  <p className="text-sm font-bold">{item.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ===== SECTION 3 ===== */}
        <section>
          <div className="flex items-center gap-3 mb-5">
            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-600 text-white text-xs font-bold">3</span>
            <h2 className="text-lg font-bold tracking-tight">Maliyet ve Kazan{"\u00e7"}</h2>
          </div>

          {/* Sabit Maliyet Kartlari */}
          <p className="text-sm font-semibold mb-3">Ayl{"\u0131"}k Sabit Altyap{"\u0131"}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            {/* Supabase */}
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-green-600 text-sm font-bold">S</div>
                  <span className="text-sm font-bold">Supabase Pro</span>
                </div>
                <span className="text-sm font-bold bg-green-50 text-green-700 px-2.5 py-0.5 rounded-full">$25/ay</span>
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-gray-600">
                <p>{"\u2022"} 8GB DB (oto. geni{"\u015f"}leme)</p>
                <p>{"\u2022"} 250GB bandwidth</p>
                <p>{"\u2022"} 100GB storage</p>
                <p>{"\u2022"} 100K auth user</p>
                <p>{"\u2022"} G{"\u00fc"}nl{"\u00fc"}k backup</p>
                <p>{"\u2022"} Always on</p>
              </div>
            </div>

            {/* Vercel */}
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 text-sm font-bold">{"\u25b2"}</div>
                  <span className="text-sm font-bold">Vercel Pro</span>
                </div>
                <span className="text-sm font-bold bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full">$20/ay</span>
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-gray-600">
                <p>{"\u2022"} 1TB data transfer</p>
                <p>{"\u2022"} 10M edge request</p>
                <p>{"\u2022"} Custom domain</p>
                <p>{"\u2022"} Analytics</p>
              </div>
              <p className="text-[10px] text-gray-400 mt-1.5">Trafi{"\u011f"}e g{"\u00f6"}re artabilir (maks $200 b{"\u00fc"}t{"\u00e7"}e)</p>
            </div>

            {/* Netgsm */}
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600 text-sm font-bold">N</div>
                  <span className="text-sm font-bold">Netgsm</span>
                </div>
                <span className="text-sm font-bold bg-orange-50 text-orange-700 px-2.5 py-0.5 rounded-full">{"\u20ba"}2.172/ay</span>
              </div>
              <div className="text-[11px] text-gray-600 space-y-1">
                <p>{"\u2022"} Netsantral (Bulut Santral)</p>
                <p>{"\u2022"} Ses Paketi dahil</p>
              </div>
              <p className="text-[10px] text-gray-400 mt-1.5">+GSM operat{"\u00f6"}r konu{"\u015f"}ma {"\u00fc"}creti ayr{"\u0131"}ca</p>
            </div>

            {/* Diger 3lu */}
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="space-y-3">
                {[
                  { name: "OpenAI", price: "$5\u201320/ay", icon: "O", bg: "bg-amber-50", color: "text-amber-600", badge: "bg-amber-50 text-amber-700" },
                  { name: "Resend", price: "$20/ay", icon: "R", bg: "bg-pink-50", color: "text-pink-600", badge: "bg-pink-50 text-pink-700" },
                ].map((s) => (
                  <div key={s.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded ${s.bg} flex items-center justify-center ${s.color} text-[10px] font-bold`}>{s.icon}</div>
                      <span className="text-xs font-semibold">{s.name}</span>
                    </div>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${s.badge}`}>{s.price}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ElevenLabs - Full Width */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 text-sm font-bold">E</div>
                <div>
                  <span className="text-sm font-bold">ElevenLabs</span>
                  <span className="text-[11px] text-gray-400 ml-2">Ses & AI Arama</span>
                </div>
              </div>
              <span className="text-sm font-bold bg-purple-50 text-purple-700 px-2.5 py-0.5 rounded-full">$22+/ay</span>
            </div>

            <div className="overflow-x-auto mb-3">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="border-b-2 border-gray-100">
                    <th className="text-left py-2 font-semibold">Plan</th>
                    <th className="text-right py-2 font-semibold">Fiyat</th>
                    <th className="text-right py-2 font-semibold">Kredi/ay</th>
                    <th className="text-right py-2 font-semibold">~TTS dk</th>
                    <th className="text-right py-2 font-semibold">AI Arama/dk</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Free", "$0", "10K", "~10", "$0.10", false],
                    ["Starter", "$5", "30K", "~30", "$0.10", false],
                    ["Creator", "$22", "100K", "~100", "$0.10", true],
                    ["Pro", "$99", "500K", "~500", "$0.10", false],
                    ["Scale", "$330", "2M", "~2.000", "$0.10", false],
                    ["Business", "$1.320", "11M", "~11.000", "$0.08", false],
                  ].map(([plan, fiyat, kredi, tts, arama, highlight]) => (
                    <tr key={plan as string} className={`border-b border-gray-50 ${highlight ? 'bg-purple-50/50' : ''}`}>
                      <td className={`py-1.5 ${highlight ? 'font-bold text-purple-700' : ''}`}>{plan as string}</td>
                      <td className="py-1.5 text-right font-medium">{fiyat as string}</td>
                      <td className="py-1.5 text-right">{kredi as string}</td>
                      <td className="py-1.5 text-right">{tts as string}</td>
                      <td className="py-1.5 text-right">{arama as string}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Per call cost */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl bg-gray-50 p-3">
                <p className="text-[11px] font-semibold mb-2">1 Ki{"\u015f"}i Arama Maliyeti</p>
                <div className="space-y-1.5">
                  {[
                    ["1 dk", "$0.10", "\u20ba3.50"],
                    ["3 dk", "$0.30", "\u20ba10.50"],
                    ["5 dk", "$0.50", "\u20ba17.50"],
                  ].map(([dk, usd, tl]) => (
                    <div key={dk} className="flex items-center justify-between text-[11px]">
                      <span className="text-gray-500">{dk}</span>
                      <div className="flex gap-3">
                        <span className="font-medium">{usd}</span>
                        <span className="font-bold w-12 text-right">{tl}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-xl bg-gray-50 p-3">
                <p className="text-[11px] font-semibold mb-2">Ayl{"\u0131"}k Senaryo (1dk/arama)</p>
                <div className="space-y-1.5">
                  {[
                    ["10/g\u00fcn", "300 dk", "\u20ba1.820"],
                    ["25/g\u00fcn", "750 dk", "\u20ba3.395"],
                    ["50/g\u00fcn", "1.500 dk", "\u20ba6.020"],
                  ].map(([arama, dk, tl]) => (
                    <div key={arama} className="flex items-center justify-between text-[11px]">
                      <span className="text-gray-500">{arama}</span>
                      <div className="flex gap-3">
                        <span className="font-medium text-gray-500">{dk}</span>
                        <span className="font-bold w-16 text-right">{tl}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <p className="text-[10px] text-gray-400 mt-2">Sessizlik {">"}10sn: %95 indirim. Kredi 2 ay devir. T{"\u00fc"}rk{"\u00e7"}e dahil 32 dil.</p>
          </div>

          {/* Toplam Maliyet */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm mb-8">
            <p className="text-sm font-semibold mb-3">Toplam Ayl{"\u0131"}k Sabit Maliyet</p>
            <div className="space-y-2.5">
              {[
                { label: "Supabase Pro", val: 25, max: 62, color: "#22c55e" },
                { label: "ElevenLabs Creator", val: 22, max: 62, color: "#8b5cf6" },
                { label: "Vercel Pro", val: 20, max: 62, color: "#3b82f6" },
                { label: "Resend Pro", val: 20, max: 62, color: "#ec4899" },
                { label: "Netgsm (\u20ba2.172)", val: 62, max: 62, color: "#f97316" },
                { label: "OpenAI (~ort)", val: 12, max: 62, color: "#f59e0b" },
              ].map((bar) => (
                <div key={bar.label} className="flex items-center gap-3">
                  <span className="text-[11px] font-medium w-36 shrink-0">{bar.label}</span>
                  <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${(bar.val / bar.max) * 100}%`, backgroundColor: bar.color }} />
                  </div>
                  <span className="text-[11px] font-bold w-10 text-right">${bar.val}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t-2 border-gray-100 flex items-center justify-between">
              <span className="text-sm font-bold">TOPLAM</span>
              <div className="text-right">
                <span className="text-xl font-extrabold">~$161/ay</span>
                <span className="text-sm text-gray-500 ml-2">(~{"\u20ba"}5.635)</span>
              </div>
            </div>
            <p className="text-[10px] text-gray-400 mt-1.5">ElevenLabs arama {"\u00fc"}creti ve Netgsm GSM operat{"\u00f6"}r {"\u00fc"}creti hari{"\u00e7"}</p>
          </div>

          {/* SaaS Fiyatlandirma */}
          <p className="text-sm font-semibold mb-3">SaaS Abonelik Fiyatland{"\u0131"}rmas{"\u0131"}</p>
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { plan: "Starter", m: "\u20ba999", y: "\u20ba799", leads: "1.000", users: "2", email: "1.000", ai: "50 dk" },
              { plan: "Growth", m: "\u20ba1.999", y: "\u20ba1.599", leads: "10.000", users: "10", email: "10.000", ai: "500 dk", pop: true },
              { plan: "Enterprise", m: "\u20ba3.999", y: "\u20ba3.199", leads: "S\u0131n\u0131rs\u0131z", users: "S\u0131n\u0131rs\u0131z", email: "50.000", ai: "2.000 dk" },
            ].map((p) => (
              <div key={p.plan} className={`rounded-2xl border-2 p-5 transition-shadow hover:shadow-lg ${p.pop ? 'border-indigo-500 bg-indigo-50/30 shadow-md shadow-indigo-100/50' : 'border-gray-200 bg-white'}`}>
                {p.pop && <span className="inline-block bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full mb-2">Pop{"\u00fc"}ler</span>}
                <p className="text-base font-bold">{p.plan}</p>
                <div className="mt-2">
                  <span className="text-2xl font-extrabold">{p.m}</span>
                  <span className="text-sm text-gray-500">/ay</span>
                </div>
                <p className="text-[11px] text-gray-500 mt-1">Y{"\u0131"}ll{"\u0131"}k: {p.y}/ay <span className="font-semibold text-green-600">%20 indirim</span></p>
                <div className="mt-3 pt-3 border-t border-gray-200 space-y-1.5 text-[11px] text-gray-600">
                  <p>{"\u2713"} {p.leads} lead/ay</p>
                  <p>{"\u2713"} {p.users} kullan{"\u0131"}c{"\u0131"}</p>
                  <p>{"\u2713"} {p.email} e-posta/ay</p>
                  <p>{"\u2713"} {p.ai} AI arama</p>
                </div>
              </div>
            ))}
          </div>

          {/* Gelir-Gider */}
          <p className="text-sm font-semibold mb-1">Gelir-Gider Projeksiyonu</p>
          <p className="text-[11px] text-gray-400 mb-4">Sabit: {"\u20ba"}5.635/ay. M{"\u00fc"}{"\u015f"}teri ba{"\u015f"}{"\u0131"} AI arama: 10 arama/g{"\u00fc"}n {"\u00d7"} 1dk {"\u00d7"} 30g{"\u00fc"}n = {"\u20ba"}1.050/ay ek maliyet.</p>

          {/* Chart */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm mb-4">
            <div className="flex items-end gap-6 h-44 px-4">
              {[
                { label: "10 m\u00fc\u015fteri\n(Starter)", gelir: 9990, net: 0 },
                { label: "10 m\u00fc\u015fteri\n(Growth)", gelir: 19990, net: 3805 },
                { label: "50 m\u00fc\u015fteri\n(mix)", gelir: 79965, net: 21830 },
                { label: "100 m\u00fc\u015fteri\n(mix)", gelir: 179900, net: 69265 },
              ].map((d) => {
                const max = 179900;
                return (
                  <div key={d.label} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full flex items-end justify-center gap-1.5 h-36">
                      <div className="w-7 bg-indigo-200 rounded-t-lg transition-all duration-700" style={{ height: `${(d.gelir / max) * 100}%` }} />
                      <div className="w-7 bg-green-400 rounded-t-lg transition-all duration-700" style={{ height: `${Math.max((d.net / max) * 100, 0)}%` }} />
                    </div>
                    <p className="text-[10px] text-center font-medium leading-tight whitespace-pre-line text-gray-500">{d.label}</p>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-center gap-6 mt-4 text-[11px]">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-indigo-200" /> Gelir</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-green-400" /> Net K{"\u00e2"}r</span>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-4">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-2.5 font-semibold">Senaryo</th>
                  <th className="text-right px-4 py-2.5 font-semibold">Gelir</th>
                  <th className="text-right px-4 py-2.5 font-semibold">Sabit</th>
                  <th className="text-right px-4 py-2.5 font-semibold">AI Arama</th>
                  <th className="text-right px-4 py-2.5 font-semibold">Toplam</th>
                  <th className="text-right px-4 py-2.5 font-semibold">Net</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["10 m\u00fc\u015fteri (Starter)", "\u20ba9.990", "\u20ba5.635", "\u20ba10.550", "\u20ba16.185", "-\u20ba6.195", true],
                  ["10 m\u00fc\u015fteri (Growth)", "\u20ba19.990", "\u20ba5.635", "\u20ba10.550", "\u20ba16.185", "+\u20ba3.805", false],
                  ["50 m\u00fc\u015fteri (mix)", "\u20ba79.965", "\u20ba5.635", "\u20ba52.500", "\u20ba58.135", "+\u20ba21.830", false],
                  ["100 m\u00fc\u015fteri (mix)", "\u20ba179.900", "\u20ba5.635", "\u20ba105.000", "\u20ba110.635", "+\u20ba69.265", false],
                ].map(([s, g, sabit, ai, m, n, isNeg]) => (
                  <tr key={s as string} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-2.5 font-medium">{s as string}</td>
                    <td className="px-4 py-2.5 text-right">{g as string}</td>
                    <td className="px-4 py-2.5 text-right text-gray-400">{sabit as string}</td>
                    <td className="px-4 py-2.5 text-right text-gray-400">{ai as string}</td>
                    <td className="px-4 py-2.5 text-right font-medium">{m as string}</td>
                    <td className={`px-4 py-2.5 text-right font-bold ${isNeg ? 'text-red-500' : 'text-green-600'}`}>{n as string}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[10px] text-gray-400 mb-6">AI arama kullanmayan m{"\u00fc"}{"\u015f"}terilerde arama maliyeti s{"\u0131"}f{"\u0131"}rd{"\u0131"}r. GSM operat{"\u00f6"}r {"\u00fc"}creti hari{"\u00e7"}.</p>

          {/* Break-even */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-5 text-center text-white">
            <p className="text-xs text-white/70 mb-1">Break-even Noktas{"\u0131"}</p>
            <p className="text-2xl font-extrabold">~15 m{"\u00fc"}{"\u015f"}teri (Starter) <span className="text-white/60 font-normal mx-2">veya</span> ~8 m{"\u00fc"}{"\u015f"}teri (Growth)</p>
          </div>
        </section>

        <p className="text-center text-[11px] text-gray-400 pt-6 border-t border-gray-100">{"\u00a9"} 2024-2026 Yo Dijital. T{"\u00fc"}m haklar{"\u0131"} sakl{"\u0131"}d{"\u0131"}r.</p>
      </div>
    </div>
  );
}
