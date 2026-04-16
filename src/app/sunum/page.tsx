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

        {/* ===== HERO BANNER ===== */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] p-8 sm:p-10">
          {/* Animated bg elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-emerald-500/10 blur-3xl" />
            <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-purple-500/10 blur-3xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-blue-500/5 blur-3xl" />
            {/* Grid pattern */}
            <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
            {/* Floating dots */}
            <div className="absolute top-6 right-12 w-2 h-2 rounded-full bg-emerald-400/40 animate-pulse" style={{ animationDuration: '3s' }} />
            <div className="absolute top-16 right-32 w-1.5 h-1.5 rounded-full bg-purple-400/30 animate-pulse" style={{ animationDuration: '4s', animationDelay: '1s' }} />
            <div className="absolute bottom-8 left-20 w-2 h-2 rounded-full bg-blue-400/30 animate-pulse" style={{ animationDuration: '3.5s', animationDelay: '0.5s' }} />
            <div className="absolute bottom-16 right-20 w-1 h-1 rounded-full bg-emerald-300/40 animate-pulse" style={{ animationDuration: '2.5s', animationDelay: '1.5s' }} />
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row items-center gap-8">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 px-3 py-1 text-[11px] font-medium text-white/80 mb-4">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                SaaS {"\u00dc"}r{"\u00fc"}n Sunumu
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight mb-3">
                Lead Operasyon<br />Dashboard + CRM
              </h1>
              <p className="text-sm text-white/60 leading-relaxed max-w-md">
                Meta reklamlar{"\u0131"}ndan gelen t{"\u00fc"}m lead{"\u2019"}leri tek merkezde toplay{"\u0131"}n, CRM pipeline ile y{"\u00f6"}netin, AI ile aksiyona d{"\u00f6"}n{"\u00fc"}{"\u015f"}t{"\u00fc"}r{"\u00fc"}n.
              </p>
              <div className="flex items-center gap-4 mt-5">
                {[
                  { val: "8", label: "Mod\u00fcl" },
                  { val: "6", label: "Kanal" },
                  { val: "7", label: "A\u015fama" },
                  { val: "\u221e", label: "Lead" },
                ].map((s) => (
                  <div key={s.label} className="text-center">
                    <p className="text-xl font-extrabold text-white">{s.val}</p>
                    <p className="text-[10px] text-white/40 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="shrink-0 hidden sm:block">
              <div className="relative w-48 h-48">
                {/* Concentric rings */}
                <div className="absolute inset-0 rounded-full border border-white/5 animate-[spin_20s_linear_infinite]" />
                <div className="absolute inset-4 rounded-full border border-white/10 animate-[spin_15s_linear_infinite_reverse]" />
                <div className="absolute inset-8 rounded-full border border-white/10 animate-[spin_25s_linear_infinite]" />
                {/* Platform icons on ring */}
                {[
                  { label: "Meta", angle: 0, color: "#1877F2" },
                  { label: "WA", angle: 72, color: "#25D366" },
                  { label: "IG", angle: 144, color: "#E4405F" },
                  { label: "Msg", angle: 216, color: "#0084FF" },
                  { label: "Web", angle: 288, color: "#6366f1" },
                ].map((p) => {
                  const r = 76;
                  const rad = (p.angle - 90) * (Math.PI / 180);
                  const x = 96 + r * Math.cos(rad) - 14;
                  const y = 96 + r * Math.sin(rad) - 14;
                  return (
                    <div key={p.label} className="absolute w-7 h-7 rounded-full flex items-center justify-center text-white text-[9px] font-bold shadow-lg" style={{ left: x, top: y, backgroundColor: p.color }}>
                      {p.label}
                    </div>
                  );
                })}
                {/* Center logo */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                    <img src="/logo.png" alt="" className="h-8 brightness-0 invert opacity-80" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ===== SECTION 1 ===== */}
        <section>
          <div className="flex items-center gap-3 mb-5">
            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-600 text-white text-xs font-bold">1</span>
            <h2 className="text-lg font-bold tracking-tight">Ama{"\u00e7"} ve Avantajlar</h2>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-700 p-6 mb-6 text-white">
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
                { label: "Lead", pct: 40, color: "#3b82f6" },
                { label: "WhatsApp", pct: 25, color: "#22c55e" },
                { label: "Instagram", pct: 18, color: "#ec4899" },
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
            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-600 text-white text-xs font-bold">2</span>
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
            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-600 text-white text-xs font-bold">3</span>
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
          <p className="text-sm font-semibold mb-1">SaaS Abonelik Fiyatland{"\u0131"}rmas{"\u0131"}</p>
          <p className="text-[11px] text-gray-400 mb-4">Fiyatlar USD bazl{"\u0131"}. Rakip kar{"\u015f"}{"\u0131"}la{"\u015f"}t{"\u0131"}rmas{"\u0131"} a{"\u015f"}a{"\u011f"}{"\u0131"}da.</p>
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { plan: "Ba\u015flang\u0131\u00e7", m: "$29", y: "$23", leads: "1.000", users: "3", email: "1.000", ai: "50 dk", perUser: "$9.67" },
              { plan: "B\u00fcy\u00fcme", m: "$79", y: "$63", leads: "10.000", users: "10", email: "10.000", ai: "500 dk", pop: true, perUser: "$7.90" },
              { plan: "Kurumsal", m: "$149", y: "$119", leads: "S\u0131n\u0131rs\u0131z", users: "S\u0131n\u0131rs\u0131z", email: "50.000", ai: "2.000 dk", perUser: "\u2014" },
            ].map((p) => (
              <div key={p.plan} className={`rounded-2xl border-2 p-5 transition-shadow hover:shadow-lg ${p.pop ? 'border-emerald-500 bg-emerald-50/30 shadow-md shadow-emerald-100/50' : 'border-gray-200 bg-white'}`}>
                {p.pop && <span className="inline-block bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full mb-2">Pop{"\u00fc"}ler</span>}
                <p className="text-base font-bold">{p.plan}</p>
                <div className="mt-2">
                  <span className="text-2xl font-extrabold">{p.m}</span>
                  <span className="text-sm text-gray-500">/ay</span>
                </div>
                <p className="text-[11px] text-gray-500 mt-1">Y{"\u0131"}ll{"\u0131"}k: {p.y}/ay <span className="font-semibold text-green-600">%20 indirim</span></p>
                <p className="text-[10px] text-gray-400">Ki{"\u015f"}i ba{"\u015f"}{"\u0131"}: {p.perUser}/kullan{"\u0131"}c{"\u0131"}</p>
                <div className="mt-3 pt-3 border-t border-gray-200 space-y-1.5 text-[11px] text-gray-600">
                  <p>{"\u2713"} {p.leads} lead/ay</p>
                  <p>{"\u2713"} {p.users} kullan{"\u0131"}c{"\u0131"}</p>
                  <p>{"\u2713"} {p.email} e-posta/ay</p>
                  <p>{"\u2713"} {p.ai} AI arama</p>
                  <p>{"\u2713"} Pipeline & Kanban</p>
                  <p>{"\u2713"} CSV/XLSX import</p>
                  <p>{"\u2713"} Otomasyonlar</p>
                </div>
              </div>
            ))}
          </div>

          {/* Rakip Karsilastirma */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-8">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
              <p className="text-sm font-semibold">Rakip Kar{"\u015f"}{"\u0131"}la{"\u015f"}t{"\u0131"}rmas{"\u0131"} <span className="text-[11px] font-normal text-gray-400">(ki{"\u015f"}i ba{"\u015f"}{"\u0131"} ayl{"\u0131"}k fiyat)</span></p>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-4 py-2 font-semibold">Platform</th>
                  <th className="text-right px-4 py-2 font-semibold">Ba{"\u015f"}lang{"\u0131"}{"\u00e7"}</th>
                  <th className="text-right px-4 py-2 font-semibold">Orta</th>
                  <th className="text-right px-4 py-2 font-semibold">Enterprise</th>
                  <th className="text-center px-4 py-2 font-semibold">AI Arama</th>
                  <th className="text-center px-4 py-2 font-semibold">Fiyatlama</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: "HubSpot", start: "$15", mid: "$50", ent: "$150+", ai: "\u2717", model: "Ki\u015fi ba\u015f\u0131", highlight: false },
                  { name: "Pipedrive", start: "$14", mid: "$49", ent: "$79", ai: "\u2717", model: "Ki\u015fi ba\u015f\u0131", highlight: false },
                  { name: "Salesforce", start: "$25", mid: "$100", ent: "$175", ai: "\u2717", model: "Ki\u015fi ba\u015f\u0131", highlight: false },
                  { name: "Zoho CRM", start: "$14", mid: "$40", ent: "$65", ai: "\u2717", model: "Ki\u015fi ba\u015f\u0131", highlight: false },
                  { name: "Bitrix24", start: "$49", mid: "$99", ent: "$199", ai: "\u2717", model: "Sabit (5-50 user)", highlight: false },
                  { name: "Yo Dijital", start: "$29", mid: "$79", ent: "$149", ai: "\u2713", model: "Sabit (org)", highlight: true },
                ].map((r) => (
                  <tr key={r.name} className={`border-b border-gray-50 ${r.highlight ? 'bg-emerald-50/50' : 'hover:bg-gray-50/50'}`}>
                    <td className={`px-4 py-2 font-semibold ${r.highlight ? 'text-emerald-700' : ''}`}>{r.name}</td>
                    <td className="px-4 py-2 text-right">{r.start}/ay</td>
                    <td className="px-4 py-2 text-right">{r.mid}/ay</td>
                    <td className="px-4 py-2 text-right">{r.ent}/ay</td>
                    <td className={`px-4 py-2 text-center ${r.ai === '\u2713' ? 'text-green-600 font-bold' : 'text-red-400'}`}>{r.ai}</td>
                    <td className="px-4 py-2 text-center text-gray-500">{r.model}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100">
              <p className="text-[10px] text-gray-500">{"\u2022"} Rakipler ki{"\u015f"}i ba{"\u015f"}{"\u0131"} fiyatland{"\u0131"}r{"\u0131"}r (10 ki{"\u015f"}i = 10x fiyat). Yo Dijital sabit organizasyon baz{"\u0131"}nda fiyatland{"\u0131"}r{"\u0131"}r.</p>
              <p className="text-[10px] text-gray-500">{"\u2022"} Hi{"\u00e7"}bir rakip dahili AI arama sunmuyor {"\u2014"} 3. parti entegrasyon gerektirir (+$50-200/ay ek maliyet).</p>
              <p className="text-[10px] text-gray-500">{"\u2022"} Meta lead form + WhatsApp + IG DM entegrasyonu rakiplerde ek {"\u00fc"}cretli veya mevcut de{"\u011f"}il.</p>
            </div>
          </div>

          {/* Gelir-Gider */}
          <p className="text-sm font-semibold mb-1">Gelir-Gider Projeksiyonu</p>
          <p className="text-[11px] text-gray-400 mb-4">Sabit altyap{"\u0131"}: $161/ay. M{"\u00fc"}{"\u015f"}teri ba{"\u015f"}{"\u0131"} AI arama: 10 arama/g{"\u00fc"}n {"\u00d7"} 1dk {"\u00d7"} $0.10 {"\u00d7"} 30g{"\u00fc"}n = $30/ay ek maliyet.</p>

          {/* Chart */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm mb-4">
            <div className="flex items-end gap-6 h-44 px-4">
              {[
                { label: "10 m\u00fc\u015fteri\n(Starter)", gelir: 290, net: 79 },
                { label: "10 m\u00fc\u015fteri\n(Growth)", gelir: 790, net: 329 },
                { label: "50 m\u00fc\u015fteri\n(mix)", gelir: 3050, net: 1389 },
                { label: "100 m\u00fc\u015fteri\n(mix)", gelir: 6400, net: 3239 },
              ].map((d) => {
                const max = 6400;
                return (
                  <div key={d.label} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full flex items-end justify-center gap-1.5 h-36">
                      <div className="w-7 bg-emerald-200 rounded-t-lg transition-all duration-700" style={{ height: `${(d.gelir / max) * 100}%` }} />
                      <div className="w-7 bg-green-400 rounded-t-lg transition-all duration-700" style={{ height: `${Math.max((d.net / max) * 100, 0)}%` }} />
                    </div>
                    <p className="text-[10px] text-center font-medium leading-tight whitespace-pre-line text-gray-500">{d.label}</p>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-center gap-6 mt-4 text-[11px]">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-emerald-200" /> Gelir</span>
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
                  ["10 m\u00fc\u015fteri (Starter)", "$290", "$161", "$50", "$211", "+$79", false],
                  ["10 m\u00fc\u015fteri (Growth)", "$790", "$161", "$300", "$461", "+$329", false],
                  ["50 m\u00fc\u015fteri (mix)", "$3.050", "$161", "$1.500", "$1.661", "+$1.389", false],
                  ["100 m\u00fc\u015fteri (mix)", "$6.400", "$161", "$3.000", "$3.161", "+$3.239", false],
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
          <p className="text-[10px] text-gray-400 mb-6">AI arama maliyeti: m{"\u00fc"}{"\u015f"}teri ba{"\u015f"}{"\u0131"} 10 arama/g{"\u00fc"}n {"\u00d7"} 1dk {"\u00d7"} $0.10 {"\u00d7"} 30 = $30/ay. Kullanmayan m{"\u00fc"}{"\u015f"}terilerde s{"\u0131"}f{"\u0131"}r.</p>

          {/* Break-even */}
          <div className="bg-gradient-to-r from-emerald-600 to-purple-600 rounded-2xl p-5 text-center text-white">
            <p className="text-xs text-white/70 mb-1">Break-even Noktas{"\u0131"}</p>
            <p className="text-2xl font-extrabold">~4 m{"\u00fc"}{"\u015f"}teri (Growth) <span className="text-white/60 font-normal mx-2">veya</span> ~7 m{"\u00fc"}{"\u015f"}teri (Starter)</p>
          </div>
        </section>

        <p className="text-center text-[11px] text-gray-400 pt-6 border-t border-gray-100">{"\u00a9"} 2024-2026 Yo Dijital. T{"\u00fc"}m haklar{"\u0131"} sakl{"\u0131"}d{"\u0131"}r.</p>
      </div>
    </div>
  );
}
