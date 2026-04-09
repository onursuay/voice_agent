import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-[#060609]">
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="relative z-10 py-6 px-4 border-t border-white/5">
        <div className="max-w-2xl mx-auto flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          <Link
            href="https://voiceagant.yodijital.com/en/privacy-policy"
            target="_blank"
            className="text-xs text-gray-500 hover:text-emerald-400 transition"
          >
            Gizlilik Politikası
          </Link>
          <Link
            href="https://voiceagant.yodijital.com/en/cookie-policy"
            target="_blank"
            className="text-xs text-gray-500 hover:text-emerald-400 transition"
          >
            Çerez Politikası
          </Link>
          <Link
            href="https://voiceagant.yodijital.com/en/terms-of-service"
            target="_blank"
            className="text-xs text-gray-500 hover:text-emerald-400 transition"
          >
            Kullanım Koşulları
          </Link>
          <Link
            href="https://voiceagant.yodijital.com/en/data-deletion"
            target="_blank"
            className="text-xs text-gray-500 hover:text-emerald-400 transition"
          >
            Veri Silme
          </Link>
          <span className="text-xs text-gray-600">© 2024-2026 Yo Dijital. Tüm hakları saklıdır.</span>
        </div>
      </footer>
    </div>
  );
}
