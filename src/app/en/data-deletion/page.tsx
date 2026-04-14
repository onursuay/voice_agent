import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import LandingHeader from '@/components/landing/LandingHeader'

export const metadata: Metadata = {
  title: 'Data Deletion - VoiceAgent by Yo Dijital',
  description: 'Request deletion of your personal data from VoiceAgent (voiceagent.yodijital.com).',
}

export default function DataDeletionEnPage() {
  return (
    <div className="min-h-screen bg-[#060609] text-white">
      <LandingHeader ctaSchedule="Book a Call" ctaTrial="14-Day Free Trial" />

      <div className="max-w-5xl mx-auto px-6 py-16">
        <Link href="/" className="text-emerald-400 hover:text-emerald-300 transition-colors mb-6 inline-block text-sm">
          &larr; Back to Home
        </Link>

        <div className="relative rounded-2xl border border-emerald-400/10 bg-white/[0.02] px-8 py-10 shadow-[0_0_60px_rgba(16,185,129,0.07),inset_0_0_40px_rgba(16,185,129,0.03)]">
          <p className="text-sm text-gray-500 mb-2">Last updated: April 2025</p>
          <h1 className="text-3xl font-bold mb-2 text-white">Data Deletion Request</h1>
          <p className="text-gray-500 mb-10">YO Dijital Medya A.Ş. · voiceagent.yodijital.com</p>

          <div className="space-y-8">
            <section>
              <h2 className="text-xl font-semibold mb-3 text-white">Your Right to Data Deletion</h2>
              <p className="text-[14px] text-[#8a8f98] leading-relaxed">
                Under GDPR and KVKK (Turkish Personal Data Protection Law), you have the right to request the deletion of your personal data. This right is also known as the &quot;right to be forgotten&quot; or &quot;right to erasure&quot;.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-white">How to Submit a Request</h2>
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.06] p-6 mb-6">
                <h3 className="text-base font-semibold text-emerald-400 mb-3">Send a Data Deletion Request</h3>
                <p className="text-[14px] text-[#8a8f98] mb-4">Send an email with the subject &quot;Data Deletion Request&quot; to:</p>
                <a
                  href="mailto:info@yodijital.com?subject=Data%20Deletion%20Request"
                  className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
                >
                  info@yodijital.com — Send Request
                </a>
              </div>
              <p className="text-[14px] text-[#8a8f98] leading-relaxed mb-3">Please include the following information in your email:</p>
              <ul className="list-disc pl-6 space-y-2 text-[14px] text-[#8a8f98] leading-relaxed">
                <li>Your full name</li>
                <li>The email address registered on the platform</li>
                <li>The types of data you wish to delete (account, lead data, etc.)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-white">Deleting Your Account (In-Platform)</h2>
              <p className="text-[14px] text-[#8a8f98] leading-relaxed">
                You can also permanently delete your account and all associated data by logging into the platform and navigating to Settings → Account. This action is irreversible.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-white">Data That Will Be Deleted</h2>
              <ul className="list-disc pl-6 space-y-2 text-[14px] text-[#8a8f98] leading-relaxed">
                <li>Account information (name, email, password)</li>
                <li>Lead and customer data stored on the platform</li>
                <li>Usage history and activity logs</li>
                <li>Preference and settings data</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-white">Processing Time</h2>
              <p className="text-[14px] text-[#8a8f98] leading-relaxed">
                We process data deletion requests within 30 days. A confirmation email will be sent upon receipt, and you will be notified once the process is complete.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-white">Legally Retained Data</h2>
              <p className="text-[14px] text-[#8a8f98] leading-relaxed">
                Some data may be required to be retained for a specific period due to legal obligations (tax records, accounting information, etc.). Such data will be deleted after the legally mandated retention period expires.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-white">Meta (Facebook) Data Deletion</h2>
              <p className="text-[14px] text-[#8a8f98] leading-relaxed">
                If you connected our application via the Meta platform, you may also use Meta&apos;s app data deletion feature. In this case, all data received from Meta will also be deleted.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-white">Google Data Deletion</h2>
              <p className="text-[14px] text-[#8a8f98] leading-relaxed">
                VoiceAgent does not persistently store your Google Sheets content. The OAuth access token used for Google Sheets import is stored in a short-lived cookie and expires automatically within 1 hour. You may revoke VoiceAgent&apos;s access to your Google account at any time via{' '}
                <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300">
                  Google Account Permissions
                </a>.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-white">Contact</h2>
              <p className="text-[14px] text-[#8a8f98] leading-relaxed">
                For questions about the data deletion process: <a href="mailto:info@yodijital.com" className="text-indigo-400 hover:text-indigo-300">info@yodijital.com</a>
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
