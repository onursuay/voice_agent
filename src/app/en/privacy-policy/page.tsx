import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import LandingHeader from '@/components/landing/LandingHeader'

export const metadata: Metadata = {
  title: 'Privacy Policy - VoiceAgent by Yo Dijital',
  description:
    'Privacy Policy for VoiceAgent (voiceagent.yodijital.com). Learn how we collect, use, and protect your data, including our use of Google API Services.',
}

export default function PrivacyPolicyEnPage() {
  return (
    <div className="min-h-screen bg-[#131317] text-[#e5e1e7]">
      <LandingHeader lang="en" ctaSchedule="Book a Call" ctaTrial="14-Day Free Trial" />

      <div className="min-h-screen pt-20 bg-[#1b1b1f]">
        <main className="py-3 px-4 md:px-12">
          <div className="max-w-[960px] mx-auto">

            {/* Back link */}
            <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-emerald-400 transition-colors mb-3">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Back to Home
            </Link>

            {/* Main card */}
            <div className="bg-[#353438] rounded-xl border border-white/[0.06] shadow-2xl p-8 md:p-16 relative overflow-hidden">

              {/* Editorial Header */}
              <header className="mb-4">
                <div className="flex flex-wrap items-center gap-4 mb-6">
                  <span className="px-2 py-1 bg-emerald-400/10 text-emerald-400 text-[10px] font-bold tracking-widest uppercase rounded">Privacy</span>
                  <span className="text-slate-500 text-[10px] font-medium tracking-widest uppercase">Last updated: April 2025</span>
                </div>
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tighter text-[#e5e1e7] mb-8 leading-tight">
                  Privacy Policy.
                </h1>
                <p className="text-[#bbcabf] text-xl leading-relaxed max-w-2xl">
                  YO Dijital Medya A.Ş. is committed to protecting your privacy. This policy explains how we collect, use, and safeguard your information.
                </p>
              </header>

              {/* Document Body */}
              <div className="space-y-4 text-[#bbcabf] leading-relaxed text-[15px]">

                <section>
                  <h2 className="text-xs font-bold tracking-widest uppercase text-[#adc6ff] mb-6 flex items-center gap-3">
                    <span className="w-8 h-px bg-[#adc6ff]/30"></span>
                    01. Introduction
                  </h2>
                  <p>
                    YO Dijital Medya A.Ş. (&quot;VoiceAgent&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform at <strong className="text-[#e5e1e7]">voiceagent.yodijital.com</strong> (&quot;Service&quot;).
                  </p>
                </section>

                <section>
                  <h2 className="text-xs font-bold tracking-widest uppercase text-[#adc6ff] mb-6 flex items-center gap-3">
                    <span className="w-8 h-px bg-[#adc6ff]/30"></span>
                    02. Information We Collect
                  </h2>
                  <p className="mb-4">We may collect the following categories of information:</p>
                  <ul className="space-y-3 mt-4">
                    <li className="flex items-start gap-3 p-4 bg-[#1b1b1f] rounded-lg border border-white/[0.04]">
                      <span className="text-emerald-400 mt-0.5">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8L6.5 11.5L13 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </span>
                      <span><strong className="text-[#e5e1e7]">Account information:</strong> Name, email address, company name, and password.</span>
                    </li>
                    <li className="flex items-start gap-3 p-4 bg-[#1b1b1f] rounded-lg border border-white/[0.04]">
                      <span className="text-emerald-400 mt-0.5">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8L6.5 11.5L13 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </span>
                      <span><strong className="text-[#e5e1e7]">Usage data:</strong> Platform interactions, session duration, and feature usage.</span>
                    </li>
                    <li className="flex items-start gap-3 p-4 bg-[#1b1b1f] rounded-lg border border-white/[0.04]">
                      <span className="text-emerald-400 mt-0.5">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8L6.5 11.5L13 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </span>
                      <span><strong className="text-[#e5e1e7]">Lead data:</strong> Customer lead information automatically collected from integrated platforms (Meta, WhatsApp, etc.) or imported by the user.</span>
                    </li>
                    <li className="flex items-start gap-3 p-4 bg-[#1b1b1f] rounded-lg border border-white/[0.04]">
                      <span className="text-emerald-400 mt-0.5">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8L6.5 11.5L13 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </span>
                      <span><strong className="text-[#e5e1e7]">Technical data:</strong> IP address, browser type, device information, and cookies.</span>
                    </li>
                    <li className="flex items-start gap-3 p-4 bg-[#1b1b1f] rounded-lg border border-white/[0.04]">
                      <span className="text-emerald-400 mt-0.5">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8L6.5 11.5L13 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </span>
                      <span><strong className="text-[#e5e1e7]">Google Sheets / Drive data:</strong> When you connect your Google account to import spreadsheet data, we access only the files and sheet contents you explicitly select. See Section 4 for full details.</span>
                    </li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xs font-bold tracking-widest uppercase text-[#adc6ff] mb-6 flex items-center gap-3">
                    <span className="w-8 h-px bg-[#adc6ff]/30"></span>
                    03. How We Use Your Information
                  </h2>
                  <ul className="space-y-3">
                    {[
                      'Provide, maintain, and improve our services.',
                      'Manage your account and provide customer support.',
                      'Send service notifications and product updates.',
                      'Fulfill our legal obligations.',
                      'Prevent fraud and ensure platform security.',
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="text-emerald-400 mt-0.5 shrink-0">
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8L6.5 11.5L13 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </section>

                <section>
                  <h2 className="text-xs font-bold tracking-widest uppercase text-[#adc6ff] mb-6 flex items-center gap-3">
                    <span className="w-8 h-px bg-[#adc6ff]/30"></span>
                    04. Google API Services — Limited Use Disclosure
                  </h2>
                  <p className="mb-5">
                    VoiceAgent&apos;s use and transfer to any other app of information received from Google APIs will adhere to the{' '}
                    <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 underline underline-offset-4">
                      Google API Services User Data Policy
                    </a>
                    , including the Limited Use requirements. Specifically:
                  </p>
                  <div className="p-6 bg-[#1b1b1f] rounded-lg border-l-4 border-emerald-400/40 space-y-3 text-sm">
                    <div><strong className="text-[#e5e1e7]">Scopes requested:</strong> <code className="bg-white/10 px-1.5 py-0.5 rounded text-xs text-emerald-300">spreadsheets.readonly</code> and <code className="bg-white/10 px-1.5 py-0.5 rounded text-xs text-emerald-300">drive.readonly</code> — used to list spreadsheet files and read selected sheet contents for import.</div>
                    <div><strong className="text-[#e5e1e7]">Purpose of use:</strong> Google user data is used solely to enable the spreadsheet import feature into the VoiceAgent CRM. Data is not used for any other purpose.</div>
                    <div><strong className="text-[#e5e1e7]">No third-party transfer:</strong> Google user data is not transferred, sold, or disclosed to any third party except as required by law.</div>
                    <div><strong className="text-[#e5e1e7]">No advertising use:</strong> Google user data is not used for serving ads, retargeting, or personalized advertising.</div>
                    <div><strong className="text-[#e5e1e7]">No data sales:</strong> Google user data is not sold to any party under any circumstances.</div>
                    <div><strong className="text-[#e5e1e7]">Human access restrictions:</strong> No VoiceAgent personnel reads your Google Sheets content unless required by law or for security purposes.</div>
                    <div><strong className="text-[#e5e1e7]">Token storage:</strong> Your Google OAuth access token is stored in a short-lived, httpOnly cookie (expires within 1 hour). Never exposed to client-side JavaScript.</div>
                    <div><strong className="text-[#e5e1e7]">Revocation:</strong> You may revoke access at any time via <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 underline underline-offset-4">Google Account Permissions</a>.</div>
                  </div>
                </section>

                <section>
                  <h2 className="text-xs font-bold tracking-widest uppercase text-[#adc6ff] mb-6 flex items-center gap-3">
                    <span className="w-8 h-px bg-[#adc6ff]/30"></span>
                    05. Meta Platform Integration
                  </h2>
                  <p>
                    When you connect your Meta (Facebook/Instagram) account, we access ad account data, page data, and lead form submissions via the Meta Platform API. All Meta data is used exclusively to provide lead management and reporting features. Data is not transferred to third parties, sold, or used for purposes unrelated to your advertising operations.
                  </p>
                </section>

                <section>
                  <h2 className="text-xs font-bold tracking-widest uppercase text-[#adc6ff] mb-6 flex items-center gap-3">
                    <span className="w-8 h-px bg-[#adc6ff]/30"></span>
                    06. Data Sharing
                  </h2>
                  <p className="mb-4">We do not sell your personal data. We may share it only in the following circumstances:</p>
                  <ul className="space-y-2">
                    {[
                      'With service providers (hosting, email delivery, analytics) on a need-to-know basis.',
                      'With competent authorities when required by law.',
                      'In connection with a merger, acquisition, or sale of assets.',
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="text-[#adc6ff] mt-0.5 shrink-0">
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 7H11.5M11.5 7L8 3.5M11.5 7L8 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </section>

                <section>
                  <h2 className="text-xs font-bold tracking-widest uppercase text-[#adc6ff] mb-6 flex items-center gap-3">
                    <span className="w-8 h-px bg-[#adc6ff]/30"></span>
                    07. Data Security
                  </h2>
                  <p>
                    We implement industry-standard security measures including SSL/TLS encryption, secure server-side token storage, and regular security reviews to protect your data against unauthorized access, alteration, disclosure, or destruction.
                  </p>
                </section>

                <section>
                  <h2 className="text-xs font-bold tracking-widest uppercase text-[#adc6ff] mb-6 flex items-center gap-3">
                    <span className="w-8 h-px bg-[#adc6ff]/30"></span>
                    08. Data Retention
                  </h2>
                  <p>
                    Imported lead data is retained for as long as your account is active. Cached Google Sheets data is not persistently stored — sheet content is processed in-memory during the import session only. OAuth tokens expire automatically and are not refreshed without your action.
                  </p>
                </section>

                <section>
                  <h2 className="text-xs font-bold tracking-widest uppercase text-[#adc6ff] mb-6 flex items-center gap-3">
                    <span className="w-8 h-px bg-[#adc6ff]/30"></span>
                    09. Your Rights
                  </h2>
                  <p>
                    Under GDPR, KVKK, and applicable privacy laws, you have the right to access, correct, delete, restrict, or port your personal data. To exercise these rights, contact us at{' '}
                    <a href="mailto:info@yodijital.com" className="text-emerald-400 hover:text-emerald-300 underline underline-offset-4">info@yodijital.com</a>.
                  </p>
                </section>

                <section>
                  <h2 className="text-xs font-bold tracking-widest uppercase text-[#adc6ff] mb-6 flex items-center gap-3">
                    <span className="w-8 h-px bg-[#adc6ff]/30"></span>
                    10. Policy Updates
                  </h2>
                  <p>
                    We may update this Privacy Policy from time to time. Changes will be published on this page with an updated &quot;Last updated&quot; date.
                  </p>
                </section>

                <section>
                  <h2 className="text-xs font-bold tracking-widest uppercase text-[#adc6ff] mb-6 flex items-center gap-3">
                    <span className="w-8 h-px bg-[#adc6ff]/30"></span>
                    11. Contact
                  </h2>
                  <div className="p-6 bg-[#1b1b1f] rounded-lg border border-white/[0.04]">
                    <p className="font-medium text-[#e5e1e7] mb-1">YO Dijital Medya A.Ş.</p>
                    <p>Email: <a href="mailto:info@yodijital.com" className="text-emerald-400 hover:text-emerald-300 underline underline-offset-4">info@yodijital.com</a></p>
                  </div>
                </section>

              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-[#131317] border-t border-emerald-900/20 w-full py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center sm:items-start gap-2">
            <Image src="/logo.png" alt="Yo Dijital" width={50} height={18} className="object-contain brightness-0 invert opacity-60" />
            <span className="text-slate-500 text-xs font-light tracking-wide">© 2025 Yo Dijital. All rights reserved.</span>
          </div>
          <nav className="flex flex-wrap justify-center gap-6 text-xs text-slate-500">
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
