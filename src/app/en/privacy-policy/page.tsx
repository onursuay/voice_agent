import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'Privacy Policy - VoiceAgent by Yo Dijital',
  description:
    'Privacy Policy for VoiceAgent (voiceagant.yodijital.com). Learn how we collect, use, and protect your data, including our use of Google API Services.',
}

export default function PrivacyPolicyEnPage() {
  return (
    <div className="min-h-screen bg-[#060609] text-white" style={{ fontSize: '16px' }}>
      <header className="w-full border-b border-white/[0.05] py-4 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/">
            <Image
              src="/logo.png"
              alt="Yo Dijital"
              width={90}
              height={32}
              className="object-contain brightness-0 invert"
            />
          </Link>
          <Link href="/" className="text-sm text-gray-400 hover:text-white transition-colors">
            ← Home
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-10">Last updated: April 2025</p>

        <div className="prose prose-invert max-w-none space-y-8 text-gray-300 leading-relaxed">

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Introduction</h2>
            <p>
              YO Dijital Medya A.Ş. (&quot;VoiceAgent&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) is
              committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and
              safeguard your information when you use our platform at{' '}
              <strong>voiceagant.yodijital.com</strong> (&quot;Service&quot;). Please read this policy carefully.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Information We Collect</h2>
            <p>We may collect the following categories of information:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>
                <strong>Account information:</strong> Name, email address, company name, and password.
              </li>
              <li>
                <strong>Usage data:</strong> Platform interactions, session duration, and feature usage.
              </li>
              <li>
                <strong>Lead data:</strong> Customer lead information automatically collected from integrated
                platforms (Meta, WhatsApp, etc.) or imported by the user.
              </li>
              <li>
                <strong>Technical data:</strong> IP address, browser type, device information, and cookies.
              </li>
              <li>
                <strong>Google Sheets / Drive data:</strong> When you connect your Google account to import
                spreadsheet data, we access only the files and sheet contents you explicitly select. See Section 4
                for full details.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>Provide, maintain, and improve our services.</li>
              <li>Manage your account and provide customer support.</li>
              <li>Send service notifications and product updates.</li>
              <li>Fulfill our legal obligations.</li>
              <li>Prevent fraud and ensure platform security.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              4. Google API Services — Limited Use Disclosure
            </h2>
            <p>
              VoiceAgent&apos;s use and transfer to any other app of information received from Google APIs will
              adhere to the{' '}
              <a
                href="https://developers.google.com/terms/api-services-user-data-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-400 hover:text-indigo-300 underline"
              >
                Google API Services User Data Policy
              </a>
              , including the Limited Use requirements. Specifically:
            </p>
            <ul className="list-disc pl-6 space-y-3 mt-3">
              <li>
                <strong>Scopes requested:</strong> When you connect your Google account, VoiceAgent requests
                access to{' '}
                <code className="bg-white/10 px-1 rounded text-sm">
                  https://www.googleapis.com/auth/spreadsheets.readonly
                </code>{' '}
                and{' '}
                <code className="bg-white/10 px-1 rounded text-sm">
                  https://www.googleapis.com/auth/drive.readonly
                </code>
                . These scopes allow VoiceAgent to list your Google Spreadsheet files and read the content of
                sheets you select for import.
              </li>
              <li>
                <strong>Purpose of use:</strong> Google user data is used solely to enable the spreadsheet import
                feature — allowing you to map Google Sheets columns to lead fields and import rows into the
                VoiceAgent CRM. Data is not used for any purpose unrelated to this feature.
              </li>
              <li>
                <strong>No data transfer to third parties:</strong> Google user data (spreadsheet content, file
                names) is not transferred, sold, or disclosed to any third party except as necessary to provide
                the import feature you initiated, or as required by law.
              </li>
              <li>
                <strong>No advertising use:</strong> Google user data is not used for serving ads, including
                retargeting, personalized advertising, or interest-based advertising.
              </li>
              <li>
                <strong>No data sales:</strong> Google user data is not sold to any party under any
                circumstances.
              </li>
              <li>
                <strong>Human access restrictions:</strong> No VoiceAgent personnel reads your Google Sheets
                content unless you have provided affirmative consent, it is necessary for security purposes, or
                it is required by applicable law.
              </li>
              <li>
                <strong>Token storage:</strong> Your Google OAuth access token is stored in a short-lived,
                httpOnly cookie (expires with the token lifetime, typically 1 hour). It is never exposed to
                client-side JavaScript or logged in plain text.
              </li>
              <li>
                <strong>Revocation:</strong> You may revoke VoiceAgent&apos;s access to your Google account at
                any time via{' '}
                <a
                  href="https://myaccount.google.com/permissions"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-400 hover:text-indigo-300 underline"
                >
                  Google Account Permissions
                </a>
                .
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Meta Platform Integration</h2>
            <p>
              When you connect your Meta (Facebook/Instagram) account, we access ad account data, page data, and
              lead form submissions via the Meta Platform API. All Meta data is used exclusively to provide the
              lead management and reporting features within VoiceAgent. Data is not transferred to third parties,
              sold, or used for purposes unrelated to your advertising operations.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Data Sharing</h2>
            <p>
              We do not sell your personal data. We may share it only in the following circumstances:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>With service providers (hosting, email delivery, analytics) on a need-to-know basis.</li>
              <li>With competent authorities when required by law.</li>
              <li>In connection with a merger, acquisition, or sale of assets.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Data Security</h2>
            <p>
              We implement industry-standard security measures including SSL/TLS encryption, secure server-side
              token storage, and regular security reviews to protect your data against unauthorized access,
              alteration, disclosure, or destruction.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Data Retention</h2>
            <p>
              Imported lead data is retained for as long as your account is active or as needed to provide the
              service. Cached Google Sheets data is not persistently stored — sheet content is processed
              in-memory during the import session only. OAuth tokens expire automatically and are not refreshed
              without your action.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">9. Your Rights</h2>
            <p>Under GDPR, KVKK, and applicable privacy laws, you have the right to:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>Access your personal data.</li>
              <li>Request correction of inaccurate data.</li>
              <li>Request deletion of your data.</li>
              <li>Object to or restrict processing.</li>
              <li>Data portability.</li>
            </ul>
            <p className="mt-3">
              To exercise these rights, contact us at{' '}
              <a
                href="mailto:info@yodijital.com"
                className="text-indigo-400 hover:text-indigo-300"
              >
                info@yodijital.com
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">10. Policy Updates</h2>
            <p>
              We may update this Privacy Policy from time to time. Changes will be published on this page with
              an updated &quot;Last updated&quot; date. Continued use of the Service after changes constitutes
              your acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">11. Contact</h2>
            <p>
              For questions about this Privacy Policy or our data practices, please contact:
            </p>
            <p className="mt-2">
              <strong>YO Dijital Medya A.Ş.</strong>
              <br />
              Email:{' '}
              <a
                href="mailto:info@yodijital.com"
                className="text-indigo-400 hover:text-indigo-300"
              >
                info@yodijital.com
              </a>
            </p>
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
