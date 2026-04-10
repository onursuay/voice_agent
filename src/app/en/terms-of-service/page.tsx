import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import LandingHeader from '@/components/landing/LandingHeader'

export const metadata: Metadata = {
  title: 'Terms of Service - VoiceAgent by Yo Dijital',
  description: 'Terms of Service for VoiceAgent (voiceagent.yodijital.com).',
}

export default function TermsOfServiceEnPage() {
  return (
    <div className="min-h-screen bg-[#060609] text-white">
      <LandingHeader ctaSchedule="Book a Call" ctaTrial="14-Day Free Trial" />

      <div className="max-w-5xl mx-auto px-6 py-16">
        <Link href="/" className="text-indigo-400 hover:text-indigo-300 transition-colors mb-6 inline-block text-sm">
          &larr; Back to Home
        </Link>

        <div className="relative rounded-2xl border border-indigo-400/10 bg-white/[0.02] px-8 py-10 shadow-[0_0_60px_rgba(99,102,241,0.07),inset_0_0_40px_rgba(99,102,241,0.03)]">
          <p className="text-sm text-gray-500 mb-2">Last updated: April 2025</p>
          <h1 className="text-3xl font-bold mb-2 text-white">Terms of Service</h1>
          <p className="text-gray-500 mb-10">YO Dijital Medya A.Ş. · voiceagent.yodijital.com</p>

          <div className="space-y-8">
            <section>
              <h2 className="text-xl font-semibold mb-3 text-white">1) Parties and Definitions</h2>
              <p className="text-[14px] text-[#8a8f98] leading-relaxed">
                These terms apply to users of the VoiceAgent platform provided by YO Dijital Medya A.Ş. By using the Service, you agree to be bound by these Terms of Service. If you do not agree, please do not use the platform.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-white">2) Scope of Service</h2>
              <p className="text-[14px] text-[#8a8f98] leading-relaxed">
                VoiceAgent is a CRM and lead management platform that helps businesses collect, manage, and convert leads. Services include multi-channel lead collection (Meta Ads, WhatsApp, Instagram, Google Sheets), CRM pipeline management, AI-assisted calling, email campaign management, and analytics tools.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-white">3) User Authority</h2>
              <p className="text-[14px] text-[#8a8f98] leading-relaxed">
                Users may connect only accounts and data sources they are authorized to use. Users may not provide unauthorized access to third-party accounts or integrate data sources without proper authorization.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-white">4) Policy and API Compliance</h2>
              <p className="text-[14px] text-[#8a8f98] leading-relaxed">
                Operations carried out through VoiceAgent are subject to the policies and terms of relevant platforms (Google, Meta, etc.). Users may not use the service in ways that violate platform policies — including unauthorized data collection, misuse, or misleading content. Use of Google API data is governed by the Google API Services User Data Policy including Limited Use requirements.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-white">5) Prohibited Uses</h2>
              <p className="text-[14px] text-[#8a8f98] leading-relaxed mb-3">You may not use the platform for:</p>
              <ul className="list-disc pl-6 space-y-2 text-[14px] text-[#8a8f98] leading-relaxed">
                <li>Illegal activities or fraud</li>
                <li>Sending spam or unsolicited commercial communications</li>
                <li>Attempting to compromise platform security</li>
                <li>Violating the privacy rights of others</li>
                <li>Infringing intellectual property rights</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-white">6) Limitation of Liability</h2>
              <p className="text-[14px] text-[#8a8f98] leading-relaxed">
                Data displayed in VoiceAgent is based on data provided by connected platforms (Google, Meta); discrepancies may occur due to delays, quotas, outages, or platform changes. VoiceAgent is liable only to a limited extent for damage arising from third-party platform outages, API limits, or policy changes. To the maximum extent permitted by law, we are not liable for indirect, incidental, or consequential damages.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-white">7) Account Security</h2>
              <p className="text-[14px] text-[#8a8f98] leading-relaxed">
                The user is responsible for the security of their account and the protection of access credentials. Please notify us immediately of any unauthorized use at <a href="mailto:info@yodijital.com" className="text-indigo-400 hover:text-indigo-300">info@yodijital.com</a>.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-white">8) Termination</h2>
              <p className="text-[14px] text-[#8a8f98] leading-relaxed">
                VoiceAgent may suspend or terminate access in case of misuse or violation of these terms. Subscription fees for paid plans are stated in advance; you may cancel at any time and access continues until the end of the current billing period.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-white">9) Changes</h2>
              <p className="text-[14px] text-[#8a8f98] leading-relaxed">
                These terms may be updated with prior notice. The current version is always published on this page. Continued use of the Service after changes constitutes your acceptance.
              </p>
            </section>
          </div>
        </div>
      </div>

      <footer className="w-full border-t border-white/[0.05] py-6 px-6 bg-[#060609]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-3 text-gray-500">
            <Image src="/logo.png" alt="Yo Dijital" width={50} height={18} className="object-contain brightness-0 invert opacity-40" />
            <span>© 2025 Yo Dijital. All rights reserved.</span>
          </div>
          <nav className="flex flex-wrap gap-5 text-gray-500">
            <a href="/en/privacy-policy" className="hover:text-gray-300 transition-colors">Privacy Policy</a>
            <a href="/en/cookie-policy" className="hover:text-gray-300 transition-colors">Cookie Policy</a>
            <a href="/en/terms-of-service" className="hover:text-gray-300 transition-colors">Terms of Service</a>
            <a href="/en/data-deletion" className="hover:text-gray-300 transition-colors">Data Deletion</a>
          </nav>
        </div>
      </footer>
    </div>
  )
}
