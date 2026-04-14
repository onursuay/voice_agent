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
    <div className="min-h-screen bg-[#060609] text-white">
      <LandingHeader ctaSchedule="Book a Call" ctaTrial="14-Day Free Trial" />

      <div className="max-w-5xl mx-auto px-6 py-16">
        <Link href="/" className="text-emerald-400 hover:text-emerald-300 transition-colors mb-6 inline-block text-sm">
          &larr; Back to Home
        </Link>

        <div className="relative rounded-2xl border border-emerald-400/10 bg-white/[0.02] px-8 py-10 shadow-[0_0_60px_rgba(16,185,129,0.07),inset_0_0_40px_rgba(16,185,129,0.03)]">
          <p className="text-sm text-gray-500 mb-2">Last updated: April 2025</p>
          <h1 className="text-3xl font-bold mb-2 text-white">Privacy Policy</h1>
          <p className="text-gray-500 mb-10">YO Dijital Medya A.Ş. · voiceagent.yodijital.com</p>

          <div className="space-y-8">
            <section>
              <h2 className="text-xl font-semibold mb-3 text-white">1. Introduction</h2>
              <p className="text-[14px] text-[#8a8f98] leading-relaxed">
                YO Dijital Medya A.Ş. (&quot;VoiceAgent&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform at <strong className="text-gray-300">voiceagent.yodijital.com</strong> (&quot;Service&quot;).
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-white">2. Information We Collect</h2>
              <p className="text-[14px] text-[#8a8f98] leading-relaxed mb-3">We may collect the following categories of information:</p>
              <ul className="list-disc pl-6 space-y-2 text-[14px] text-[#8a8f98] leading-relaxed">
                <li><strong className="text-gray-300">Account information:</strong> Name, email address, company name, and password.</li>
                <li><strong className="text-gray-300">Usage data:</strong> Platform interactions, session duration, and feature usage.</li>
                <li><strong className="text-gray-300">Lead data:</strong> Customer lead information automatically collected from integrated platforms (Meta, WhatsApp, etc.) or imported by the user.</li>
                <li><strong className="text-gray-300">Technical data:</strong> IP address, browser type, device information, and cookies.</li>
                <li><strong className="text-gray-300">Google Sheets / Drive data:</strong> When you connect your Google account to import spreadsheet data, we access only the files and sheet contents you explicitly select. See Section 4 for full details.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-white">3. How We Use Your Information</h2>
              <ul className="list-disc pl-6 space-y-2 text-[14px] text-[#8a8f98] leading-relaxed">
                <li>Provide, maintain, and improve our services.</li>
                <li>Manage your account and provide customer support.</li>
                <li>Send service notifications and product updates.</li>
                <li>Fulfill our legal obligations.</li>
                <li>Prevent fraud and ensure platform security.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-white">4. Google API Services — Limited Use Disclosure</h2>
              <p className="text-[14px] text-[#8a8f98] leading-relaxed mb-3">
                VoiceAgent&apos;s use and transfer to any other app of information received from Google APIs will adhere to the{' '}
                <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 underline">
                  Google API Services User Data Policy
                </a>
                , including the Limited Use requirements. Specifically:
              </p>
              <ul className="list-disc pl-6 space-y-3 text-[14px] text-[#8a8f98] leading-relaxed">
                <li><strong className="text-gray-300">Scopes requested:</strong> <code className="bg-white/10 px-1 rounded text-xs">spreadsheets.readonly</code> and <code className="bg-white/10 px-1 rounded text-xs">drive.readonly</code> — used to list spreadsheet files and read selected sheet contents for import.</li>
                <li><strong className="text-gray-300">Purpose of use:</strong> Google user data is used solely to enable the spreadsheet import feature into the VoiceAgent CRM. Data is not used for any other purpose.</li>
                <li><strong className="text-gray-300">No third-party transfer:</strong> Google user data is not transferred, sold, or disclosed to any third party except as required by law.</li>
                <li><strong className="text-gray-300">No advertising use:</strong> Google user data is not used for serving ads, retargeting, or personalized advertising.</li>
                <li><strong className="text-gray-300">No data sales:</strong> Google user data is not sold to any party under any circumstances.</li>
                <li><strong className="text-gray-300">Human access restrictions:</strong> No VoiceAgent personnel reads your Google Sheets content unless required by law or for security purposes.</li>
                <li><strong className="text-gray-300">Token storage:</strong> Your Google OAuth access token is stored in a short-lived, httpOnly cookie (expires within 1 hour). Never exposed to client-side JavaScript.</li>
                <li><strong className="text-gray-300">Revocation:</strong> You may revoke access at any time via <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 underline">Google Account Permissions</a>.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-white">5. Meta Platform Integration</h2>
              <p className="text-[14px] text-[#8a8f98] leading-relaxed">
                When you connect your Meta (Facebook/Instagram) account, we access ad account data, page data, and lead form submissions via the Meta Platform API. All Meta data is used exclusively to provide lead management and reporting features. Data is not transferred to third parties, sold, or used for purposes unrelated to your advertising operations.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-white">6. Data Sharing</h2>
              <p className="text-[14px] text-[#8a8f98] leading-relaxed mb-3">We do not sell your personal data. We may share it only in the following circumstances:</p>
              <ul className="list-disc pl-6 space-y-2 text-[14px] text-[#8a8f98] leading-relaxed">
                <li>With service providers (hosting, email delivery, analytics) on a need-to-know basis.</li>
                <li>With competent authorities when required by law.</li>
                <li>In connection with a merger, acquisition, or sale of assets.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-white">7. Data Security</h2>
              <p className="text-[14px] text-[#8a8f98] leading-relaxed">
                We implement industry-standard security measures including SSL/TLS encryption, secure server-side token storage, and regular security reviews to protect your data against unauthorized access, alteration, disclosure, or destruction.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-white">8. Data Retention</h2>
              <p className="text-[14px] text-[#8a8f98] leading-relaxed">
                Imported lead data is retained for as long as your account is active. Cached Google Sheets data is not persistently stored — sheet content is processed in-memory during the import session only. OAuth tokens expire automatically and are not refreshed without your action.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-white">9. Your Rights</h2>
              <p className="text-[14px] text-[#8a8f98] leading-relaxed mb-3">Under GDPR, KVKK, and applicable privacy laws, you have the right to access, correct, delete, restrict, or port your personal data. To exercise these rights, contact us at <a href="mailto:info@yodijital.com" className="text-indigo-400 hover:text-indigo-300">info@yodijital.com</a>.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-white">10. Policy Updates</h2>
              <p className="text-[14px] text-[#8a8f98] leading-relaxed">
                We may update this Privacy Policy from time to time. Changes will be published on this page with an updated &quot;Last updated&quot; date.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-white">11. Contact</h2>
              <p className="text-[14px] text-[#8a8f98] leading-relaxed">
                <strong className="text-gray-300">YO Dijital Medya A.Ş.</strong><br />
                Email: <a href="mailto:info@yodijital.com" className="text-indigo-400 hover:text-indigo-300">info@yodijital.com</a>
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
