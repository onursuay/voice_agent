'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw new Error(authError.message === 'Invalid login credentials' ? 'Geçersiz e-posta veya şifre' : authError.message);
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Giriş yapılamadı');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50/50 via-white to-indigo-50/30 p-4">
      <div className="flex w-full max-w-[960px] overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-xl shadow-gray-200/40">

        {/* Left - Brand Card */}
        <div className="hidden lg:flex lg:w-[420px] shrink-0 flex-col justify-between bg-gradient-to-br from-indigo-600 to-indigo-700 p-10 text-white rounded-l-2xl shadow-2xl shadow-indigo-600/25">
          <div>
            <div className="mb-10">
              <img src="/logo.png" alt="Yo Dijital" className="h-12 brightness-0 invert" />
            </div>
            <h1 className="text-2xl font-bold leading-tight mb-3">
              Lead yönetiminizi<br />tek merkezden kontrol edin
            </h1>
            <p className="text-indigo-100 text-sm leading-relaxed">
              Meta reklamlarından gelen tüm lead&apos;lerinizi toplayın, yönetin ve aksiyona dönüştürün.
            </p>
          </div>

          <div className="space-y-4 mt-8">
            {[
              { title: 'Çok Kanallı Lead Toplama', desc: 'Meta, WhatsApp, Instagram DM, Messenger' },
              { title: 'CRM Pipeline', desc: 'Aşama bazlı satış takibi' },
              { title: 'AI & Otomasyon', desc: 'Otomatik atama, e-posta, AI arama' },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-3">
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20">
                  <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p className="text-xs text-indigo-200">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex items-center gap-2 text-xs text-indigo-200">
            <span>Kredi kartı gerekmez</span>
            <span>•</span>
            <span>14 gün ücretsiz</span>
          </div>
        </div>

        {/* Right - Login Form */}
        <div className="flex-1 flex flex-col justify-center p-8 sm:p-10">
          <div className="lg:hidden mb-6 flex justify-center">
            <img src="/logo.png" alt="Yo Dijital" className="h-10" />
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-1">Giriş Yap</h2>
          <p className="text-sm text-gray-500 mb-6">Lead yönetim panelinize erişin</p>

          {error && (
            <div className="mb-4 rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-600">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">E-posta</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="ornek@sirket.com"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 transition-all duration-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:bg-white" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Şifre</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 transition-all duration-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:bg-white" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition-all duration-200 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            </button>
          </form>

          <div className="mt-6 flex items-center gap-3">
            <div className="flex-1 border-t border-gray-200" />
            <span className="text-xs text-gray-400">veya</span>
            <div className="flex-1 border-t border-gray-200" />
          </div>

          <p className="mt-4 text-center text-sm text-gray-500">
            Hesabınız yok mu?{' '}
            <Link href="/register" className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">Ücretsiz Başla</Link>
          </p>

          <p className="mt-8 text-center text-xs text-gray-400">© 2024-2026 Yo Dijital. Tüm hakları saklıdır.</p>
        </div>
      </div>
    </div>
  );
}
