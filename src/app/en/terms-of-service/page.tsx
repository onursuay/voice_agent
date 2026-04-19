import type { Metadata } from 'next'
import Image from 'next/image'
import LandingHeader from '@/components/landing/LandingHeader'

export const metadata: Metadata = {
  title: 'Terms of Service - VoiceAgent by Yo Dijital',
  description: 'Terms of Service for VoiceAgent (voiceagent.yodijital.com).',
}

export default function TermsOfServiceEnPage() {
  return (
    <div className="min-h-screen bg-[#131317] text-[#e5e1e7]">
      <LandingHeader lang="en" ctaSchedule="Book a Call" ctaTrial="14-Day Free Trial" />

      <div className="min-h-screen pt-[44px] bg-[#131317]">
        <main className="px-6 py-3 md:px-16">

          {/* Hero Header */}
          <header className="max-w-4xl mb-4 text-center mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tighter text-[#e5e1e7] mb-6 leading-none">Terms of Service</h1>
            <p className="text-xl text-[#bbcabf] font-light leading-relaxed max-w-2xl mx-auto">
              These terms apply to users of the VoiceAgent platform provided by YO Dijital Medya A.Ş. By using the Service, you agree to be bound by these terms.
            </p>
          </header>

          {/* Content */}
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8">

            {/* 01. Parties and Definitions */}
            <section className="md:col-span-8 bg-[#1b1b1f] p-8 md:p-10 rounded-xl border border-white/[0.04]">
              <div className="flex items-center gap-4 mb-6">
                <span className="text-emerald-400 font-mono text-sm tracking-widest">01.</span>
                <h2 className="text-xl font-bold tracking-tight text-[#e5e1e7]">Parties and Definitions</h2>
              </div>
              <p className="text-[#bbcabf] leading-relaxed">
                These terms apply to users of the VoiceAgent platform provided by YO Dijital Medya A.Ş. By using the Service, you agree to be bound by these Terms of Service. If you do not agree, please do not use the platform.
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
              <h4 className="text-emerald-400 font-bold mb-2">The Golden Rule</h4>
              <p className="text-[#bbcabf] text-sm leading-relaxed">
                Your data is yours. VoiceAgent never sells or transfers your personal data to third parties under any circumstances.
              </p>
            </aside>

            {/* 02. Scope of Service */}
            <section className="md:col-span-12 space-y-4 mt-4">
              <div className="flex items-center gap-4 mb-6">
                <span className="text-emerald-400 font-mono text-sm tracking-widest">02.</span>
                <h2 className="text-xl font-bold tracking-tight text-[#e5e1e7]">Scope of Service</h2>
              </div>
              <p className="text-[#bbcabf] leading-relaxed">
                VoiceAgent is a CRM and lead management platform that helps businesses collect, manage, and convert leads. Services include multi-channel lead collection (Meta Ads, WhatsApp, Instagram, Google Sheets), CRM pipeline management, AI-assisted calling, email campaign management, and analytics tools.
              </p>
            </section>

            {/* 03. User Authority */}
            <section className="md:col-span-12">
              <div className="flex items-center gap-4 mb-6">
                <span className="text-emerald-400 font-mono text-sm tracking-widest">03.</span>
                <h2 className="text-xl font-bold tracking-tight text-[#e5e1e7]">User Authority</h2>
              </div>
              <p className="text-[#bbcabf] leading-relaxed">
                Users may connect only accounts and data sources they are authorized to use. Users may not provide unauthorized access to third-party accounts or integrate data sources without proper authorization.
              </p>
            </section>

            {/* 04. Policy and API Compliance */}
            <section className="md:col-span-12">
              <div className="flex items-center gap-4 mb-6">
                <span className="text-emerald-400 font-mono text-sm tracking-widest">04.</span>
                <h2 className="text-xl font-bold tracking-tight text-[#e5e1e7]">Policy and API Compliance</h2>
              </div>
              <p className="text-[#bbcabf] leading-relaxed">
                Operations carried out through VoiceAgent are subject to the policies and terms of relevant platforms (Google, Meta, etc.). Users may not use the service in ways that violate platform policies — including unauthorized data collection, misuse, or misleading content. Use of Google API data is governed by the Google API Services User Data Policy including Limited Use requirements.
              </p>
            </section>

            {/* 05. Prohibited Uses */}
            <section className="md:col-span-12 bg-[#1b1b1f] p-8 md:p-10 rounded-xl border border-white/[0.04]">
              <div className="flex items-center gap-4 mb-6">
                <span className="text-emerald-400 font-mono text-sm tracking-widest">05.</span>
                <h2 className="text-xl font-bold tracking-tight text-[#e5e1e7]">Prohibited Uses</h2>
              </div>
              <p className="text-[#bbcabf] leading-relaxed mb-6">You may not use the platform for:</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: 'Illegal activities', desc: 'Illegal activities or fraud' },
                  { label: 'Spam', desc: 'Sending spam or unsolicited commercial communications' },
                  { label: 'Security breach', desc: 'Attempting to compromise platform security' },
                  { label: 'Privacy violation', desc: 'Violating the privacy rights of others' },
                  { label: 'IP infringement', desc: 'Infringing intellectual property rights' },
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
                    <h2 className="text-lg font-bold tracking-tight text-[#e5e1e7]">Limitation of Liability</h2>
                  </div>
                  <p className="text-[#bbcabf] text-sm leading-relaxed">
                    Data displayed in VoiceAgent is based on data provided by connected platforms; discrepancies may occur due to delays, quotas, or outages. To the maximum extent permitted by law, we are not liable for indirect, incidental, or consequential damages.
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-emerald-400 font-mono text-sm tracking-widest">07.</span>
                    <h2 className="text-lg font-bold tracking-tight text-[#e5e1e7]">Account Security</h2>
                  </div>
                  <p className="text-[#bbcabf] text-sm leading-relaxed">
                    The user is responsible for the security of their account and the protection of access credentials. Please notify us immediately of any unauthorized use at{' '}
                    <a href="mailto:info@yodijital.com" className="text-emerald-400 hover:text-emerald-300 underline underline-offset-4">info@yodijital.com</a>.
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-emerald-400 font-mono text-sm tracking-widest">08.</span>
                    <h2 className="text-lg font-bold tracking-tight text-[#e5e1e7]">Termination</h2>
                  </div>
                  <p className="text-[#bbcabf] text-sm leading-relaxed">
                    VoiceAgent may suspend or terminate access in case of misuse or violation of these terms. Subscription fees for paid plans are stated in advance; you may cancel at any time and access continues until the end of the current billing period.
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-emerald-400 font-mono text-sm tracking-widest">09.</span>
                    <h2 className="text-lg font-bold tracking-tight text-[#e5e1e7]">Changes</h2>
                  </div>
                  <p className="text-[#bbcabf] text-sm leading-relaxed">
                    These terms may be updated with prior notice. The current version is always published on this page. Continued use of the Service after changes constitutes your acceptance.
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
            <span className="text-white text-xs font-light tracking-wide">© 2025 Yo Dijital. All rights reserved.</span>
          </div>
          <nav className="flex flex-wrap justify-center gap-6 text-xs text-white">
            <a href="/en/privacy-policy" className="hover:text-emerald-300 transition-colors underline underline-offset-4">Privacy Policy</a>
            <a href="/en/cookie-policy" className="hover:text-emerald-300 transition-colors underline underline-offset-4">Cookie Policy</a>
            <a href="/en/terms-of-service" className="hover:text-emerald-300 transition-colors underline underline-offset-4">Terms of Service</a>
            <a href="/en/data-deletion" className="hover:text-emerald-300 transition-colors underline underline-offset-4">Data Deletion</a>
          </nav>
        </div>
      </footer>
    </div>
  )
}
