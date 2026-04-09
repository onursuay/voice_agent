import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'Cookie Policy - VoiceAgent by Yo Dijital',
  description: 'Cookie Policy for VoiceAgent (voiceagant.yodijital.com).',
}

export default function CookiePolicyEnPage() {
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
        <h1 className="text-3xl font-bold text-white mb-2">Cookie Policy</h1>
        <p className="text-sm text-gray-500 mb-10">Last updated: April 2025</p>

        <div className="prose prose-invert max-w-none space-y-8 text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. What Are Cookies?</h2>
            <p>Cookies are small text files placed on your device by websites you visit. We use cookies to improve your experience, remember your preferences, and analyze platform performance.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Types of Cookies We Use</h2>
            <div className="space-y-4">
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                <h3 className="text-base font-semibold text-white mb-2">Essential Cookies</h3>
                <p className="text-sm">Required for core platform functionality. Without these cookies, our services cannot operate properly. Session management and security verification fall into this category.</p>
              </div>
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                <h3 className="text-base font-semibold text-white mb-2">Analytics Cookies</h3>
                <p className="text-sm">Help us understand how the platform is used. This data is used to improve the platform. Which pages are visited most and how users navigate the site are tracked under this scope.</p>
              </div>
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                <h3 className="text-base font-semibold text-white mb-2">Preference Cookies</h3>
                <p className="text-sm">Remember your personal preferences such as language settings and interface options, so you do not need to reconfigure them on each visit.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. Third-Party Cookies</h2>
            <p>The following third-party services may use cookies:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li><strong>Supabase:</strong> Authentication and database services</li>
              <li><strong>Meta Pixel:</strong> Ad performance measurement (optional integration)</li>
              <li><strong>Vercel Analytics:</strong> Platform performance analysis</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Managing Cookies</h2>
            <p>You can manage or delete cookies through your browser settings. However, disabling essential cookies may affect the platform&apos;s functionality.</p>
            <p className="mt-3">Cookie management in common browsers:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Chrome: Settings → Privacy and Security → Cookies</li>
              <li>Firefox: Options → Privacy and Security</li>
              <li>Safari: Preferences → Privacy</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Contact</h2>
            <p>For questions about our cookie policy: <a href="mailto:info@yodijital.com" className="text-indigo-400 hover:text-indigo-300">info@yodijital.com</a></p>
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
