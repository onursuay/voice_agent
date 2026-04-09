import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'Terms of Service - VoiceAgent by Yo Dijital',
  description: 'Terms of Service for VoiceAgent (voiceagant.yodijital.com).',
}

export default function TermsOfServiceEnPage() {
  return (
    <div className="min-h-screen bg-[#060609] text-white" style={{ fontSize: '16px' }}>
      <header className="w-full border-b border-white/[0.05] py-4 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/">
            <Image src="/logo.png" alt="Yo Dijital" width={90} height={32} className="object-contain brightness-0 invert" />
          </Link>
          <Link href="/" className="text-sm text-gray-400 hover:text-white transition-colors">← Home</Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-white mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-500 mb-10">Last updated: April 2025</p>

        <div className="prose prose-invert max-w-none space-y-8 text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Acceptance of Terms</h2>
            <p>By using the VoiceAgent platform (&quot;Service&quot;) operated by YO Dijital Medya A.Ş., you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the platform.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Service Description</h2>
            <p>VoiceAgent is a CRM and lead management platform that helps businesses collect, manage, and convert leads. Our services include:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>Multi-channel lead collection (Meta Ads, WhatsApp, Instagram, Google Sheets, etc.)</li>
              <li>CRM pipeline management</li>
              <li>AI-assisted calling and follow-up features</li>
              <li>Email campaign management</li>
              <li>Analytics and reporting tools</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. User Accounts</h2>
            <p>You must create an account to access the platform. You are responsible for maintaining the security of your account and for all activities that occur under it. Please notify us immediately of any unauthorized use.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Prohibited Uses</h2>
            <p>You may not use the platform for:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>Illegal activities or fraud</li>
              <li>Sending spam or unsolicited commercial communications</li>
              <li>Attempting to compromise platform security</li>
              <li>Violating the privacy rights of others</li>
              <li>Infringing intellectual property rights</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Billing and Subscriptions</h2>
            <p>Subscription fees for paid plans are stated in advance. You may cancel your subscription at any time; access continues until the end of the current billing period.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Service Changes and Termination</h2>
            <p>We reserve the right to modify these terms with prior notice for the purpose of improving the service. We reserve the right to suspend or terminate your account if you violate these terms.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Limitation of Liability</h2>
            <p>VoiceAgent does not guarantee that the service will be uninterrupted or error-free. To the maximum extent permitted by law, we are not liable for indirect, incidental, or consequential damages.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Contact</h2>
            <p>For questions about these terms: <a href="mailto:info@yodijital.com" className="text-indigo-400 hover:text-indigo-300">info@yodijital.com</a></p>
          </section>
        </div>
      </main>

      <footer className="w-full border-t border-white/[0.05] py-6 px-6 mt-12">
        <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-5 text-sm text-gray-500">
          <a href="/en/privacy-policy" className="hover:text-gray-300 transition-colors">Privacy Policy</a>
          <a href="/en/cookie-policy" className="hover:text-gray-300 transition-colors">Cookie Policy</a>
          <a href="/en/terms-of-service" className="hover:text-gray-300 transition-colors">Terms of Service</a>
          <a href="/en/data-deletion" className="hover:text-gray-300 transition-colors">Data Deletion</a>
        </div>
      </footer>
    </div>
  )
}
