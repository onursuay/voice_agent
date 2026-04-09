import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'Data Deletion - VoiceAgent by Yo Dijital',
  description: 'Request deletion of your personal data from VoiceAgent (voiceagant.yodijital.com).',
}

export default function DataDeletionEnPage() {
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
        <h1 className="text-3xl font-bold text-white mb-2">Data Deletion Request</h1>
        <p className="text-sm text-gray-500 mb-10">Last updated: April 2025</p>

        <div className="prose prose-invert max-w-none space-y-8 text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Your Right to Data Deletion</h2>
            <p>Under GDPR and KVKK (Turkish Personal Data Protection Law), you have the right to request the deletion of your personal data. This right is also known as the &quot;right to be forgotten&quot; or &quot;right to erasure&quot;.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">How to Submit a Request</h2>
            <div className="bg-indigo-400/[0.06] border border-indigo-400/20 rounded-2xl p-6 mb-6">
              <h3 className="text-base font-semibold text-indigo-400 mb-3">Send a Data Deletion Request</h3>
              <p className="mb-4">Send an email with the subject &quot;Data Deletion Request&quot; to:</p>
              <a
                href="mailto:info@yodijital.com?subject=Data%20Deletion%20Request"
                className="inline-flex items-center gap-2 bg-indigo-500 hover:bg-indigo-400 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
              >
                info@yodijital.com — Send Request
              </a>
            </div>
            <p>Please include the following information in your email:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>Your full name</li>
              <li>The email address registered on the platform</li>
              <li>The types of data you wish to delete (account, lead data, etc.)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Deleting Your Account (In-Platform)</h2>
            <p>You can also permanently delete your account and all associated data by logging into the platform and navigating to Settings → Account. This action is irreversible.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Data That Will Be Deleted</h2>
            <p>Upon receiving your request, we will delete the following data:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>Account information (name, email, password)</li>
              <li>Lead and customer data stored on the platform</li>
              <li>Usage history and activity logs</li>
              <li>Preference and settings data</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Processing Time</h2>
            <p>We process data deletion requests within 30 days. A confirmation email will be sent upon receipt of your request, and you will be notified once the process is complete.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Legally Retained Data</h2>
            <p>Some data may be required to be retained for a specific period due to legal obligations (tax records, accounting information, etc.). Such data will be deleted after the legally mandated retention period expires.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Meta (Facebook) Data Deletion</h2>
            <p>If you connected our application via the Meta platform, you may also use Meta&apos;s app data deletion feature. In this case, data received from Meta will also be deleted.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Google Data Deletion</h2>
            <p>VoiceAgent does not persistently store your Google Sheets content. The OAuth access token used for Google Sheets import is stored in a short-lived cookie and expires automatically. You may also revoke VoiceAgent&apos;s access to your Google account at any time via <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300">Google Account Permissions</a>.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Contact</h2>
            <p>For questions about the data deletion process: <a href="mailto:info@yodijital.com" className="text-indigo-400 hover:text-indigo-300">info@yodijital.com</a></p>
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
