'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Geçerli bir e-posta adresi girin');
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signUp({ email, password });
      if (authError) throw new Error(authError.message);
      if (!data.user) throw new Error('Kullanıcı oluşturulamadı');

      // Create profile + org + membership
      const res = await fetch('/api/auth/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: data.user.id,
          email,
          full_name: fullName,
          organization_name: orgName || `${fullName} Organizasyonu`,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Hesap oluşturulamadı');
      }

      router.push('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Kayıt yapılamadı');
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
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
              <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
              Ücretsiz Deneyin
            </div>
            <div className="mb-8">
              <img src="/logo.png" alt="Yo Dijital" className="h-12 brightness-0 invert" />
            </div>
            <h1 className="text-2xl font-bold leading-tight mb-3">
              Lead operasyonlarınızı<br />dönüştürün
            </h1>
            <p className="text-indigo-100 text-sm leading-relaxed">
              Reklam kaynaklı tüm lead&apos;lerinizi tek havuzda toplayın, CRM pipeline ile yönetin.
            </p>
          </div>

          <div className="space-y-3 mt-6">
            {[
              'Sınırsız lead toplama ve yönetim',
              'AI destekli arama ve otomasyon',
              'CRM pipeline ve aşama takibi',
              'Toplu e-posta ve bildirim',
              'Detaylı analitik ve raporlar',
            ].map((text) => (
              <div key={text} className="flex items-center gap-2.5">
                <svg className="h-4 w-4 text-indigo-200 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm text-indigo-100">{text}</span>
              </div>
            ))}
          </div>

          <div className="mt-8 flex items-center gap-2">
            {['A', 'M', 'E', 'K'].map((letter, i) => (
              <div key={letter} className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white ${i === 0 ? 'bg-blue-500' : i === 1 ? 'bg-orange-500' : i === 2 ? 'bg-pink-500' : 'bg-violet-500'} ${i > 0 ? '-ml-1.5' : ''} ring-2 ring-indigo-600`}>
                {letter}
              </div>
            ))}
            <span className="ml-2 text-xs text-indigo-200">500+ işletme Yo Dijital kullanıyor</span>
          </div>
        </div>

        {/* Right - Register Form */}
        <div className="flex-1 flex flex-col justify-center p-8 sm:p-10">
          <div className="lg:hidden mb-6 flex justify-center">
            <img src="/logo.png" alt="Yo Dijital" className="h-10" />
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-1">Ücretsiz Hesap Oluştur</h2>
          <p className="text-sm text-gray-500 mb-6">14 gün ücretsiz deneyin, kredi kartı gerekmez</p>

          {error && (
            <div className="mb-4 rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-600">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Ad Soyad</label>
                <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Adınız Soyadınız"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 transition-all duration-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:bg-white" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Şirket Adı</label>
                <input type="text" value={orgName} onChange={e => setOrgName(e.target.value)} placeholder="Şirketiniz"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 transition-all duration-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:bg-white" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">E-posta</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="ornek@sirket.com"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 transition-all duration-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:bg-white" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Şifre</label>
              <input type="password" required minLength={8} value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 8 karakter"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 transition-all duration-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:bg-white" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition-all duration-200 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? 'Kayıt yapılıyor...' : 'Ücretsiz Hesap Oluştur'}
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-gray-400">
            Kaydolarak <span className="text-gray-500">Kullanım Koşulları</span> ve <span className="text-gray-500">Gizlilik Politikası</span>&apos;nı kabul etmiş olursunuz.
          </p>

          <div className="mt-5 flex items-center gap-3">
            <div className="flex-1 border-t border-gray-200" />
            <span className="text-xs text-gray-400">veya</span>
            <div className="flex-1 border-t border-gray-200" />
          </div>

          <p className="mt-4 text-center text-sm text-gray-500">
            Zaten hesabınız var mı?{' '}
            <Link href="/login" className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">Giriş Yap</Link>
          </p>

          <p className="mt-6 text-center text-xs text-gray-400">© 2024-2026 Yo Dijital. Tüm hakları saklıdır.</p>
        </div>
      </div>
    </div>
  );
}
