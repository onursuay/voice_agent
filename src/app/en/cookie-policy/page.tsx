import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import LandingHeader from '@/components/landing/LandingHeader'

export const metadata: Metadata = {
  title: 'Cookie Policy - VoiceAgent by Yo Dijital',
  description: 'Cookie Policy for VoiceAgent (voiceagent.yodijital.com).',
}

export default function CookiePolicyEnPage() {
  return (
    <div className="min-h-screen bg-[#060609] text-white">
      <LandingHeader ctaSchedule="Book a Call" ctaTrial="14-Day Free Trial" />

      <div className="max-w-5xl mx-auto px-6 py-16">
        <Link href="/" className="text-indigo-400 hover:text-indigo-300 transition-colors mb-6 inline-block text-sm">
          &larr; Back to Home
        </Link>

        <div className="relative rounded-2xl border border-indigo-400/10 bg-white/[0.02] px-8 py-10 shadow-[0_0_60px_rgba(99,102,241,0.07),inset_0_0_40px_rgba(99,102,241,0.03)]">
          <p className="text-sm text-gray-500 mb-2">Last updated: April 2025</p>
          <h1 className="text-3xl font-bold mb-2 text-white">Cookie Policy</h1>
          <p className="text-gray-500 mb-10">YO Dijital Medya A.Ş. · voiceagent.yodijital.com</p>

          <div className="space-y-8">
            <section>
              <h2 className="text-xl font-semibold mb-3 text-white">1. What Are Cookies?</h2>
              <p className="text-[14px] text-[#8a8f98] leading-relaxed">
                Cookies are small text files placed on your device by websites you visit. We use cookies to improve your experience, remember your preferences, and analyze platform performance.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-white">2. Types of Cookies We Use</h2>
              <div className="space-y-4">
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
                  <h3 className="text-base font-semibold text-white mb-2">Essential Cookies</h3>
                  <p className="text-[14px] text-[#8a8f98] leading-relaxed">Required for core platform functionality. Without these cookies, our services cannot operate properly. Session management and security verification fall into this category.</p>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
                  <h3 className="text-base font-semibold text-white mb-2">Analytics Cookies</h3>
                  <p className="text-[14px] text-[#8a8f98] leading-relaxed">Help us understand how the platform is used. This data is used to improve the platform, including which pages are visited most and how users navigate.</p>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
                  <h3 className="text-base font-semibold text-white mb-2">Preference Cookies</h3>
                  <p className="text-[14px] text-[#8a8f98] leading-relaxed">Remember your personal preferences such as language settings and interface options, so you do not need to reconfigure them on each visit.</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-white">3. Third-Party Cookies</h2>
              <p className="text-[14px] text-[#8a8f98] leading-relaxed mb-3">The following third-party services may use cookies:</p>
              <ul className="list-disc pl-6 space-y-2 text-[14px] text-[#8a8f98] leading-relaxed">
                <li><strong className="text-gray-300">Supabase:</strong> Authentication and database services</li>
                <li><strong className="text-gray-300">Meta Pixel:</strong> Ad performance measurement (optional integration)</li>
                <li><strong className="text-gray-300">Vercel Analytics:</strong> Platform performance analysis</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-white">4. Managing Cookies</h2>
              <p className="text-[14px] text-[#8a8f98] leading-relaxed mb-3">
                You can manage or delete cookies through your browser settings. However, disabling essential cookies may affect the platform&apos;s functionality.
              </p>
              <ul className="list-disc pl-6 space-y-1 text-[14px] text-[#8a8f98] leading-relaxed">
                <li>Chrome: Settings → Privacy and Security → Cookies</li>
                <li>Firefox: Options → Privacy and Security</li>
                <li>Safari: Preferences → Privacy</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-white">5. Contact</h2>
              <p className="text-[14px] text-[#8a8f98] leading-relaxed">
                For questions about our cookie policy: <a href="mailto:info@yodijital.com" className="text-indigo-400 hover:text-indigo-300">info@yodijital.com</a>
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
