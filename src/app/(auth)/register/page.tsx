'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [company, setCompany] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [acceptedTerms, setAcceptedTerms] = useState(false)

  useEffect(() => {
    const c = canvasRef.current
    if (!c) return
    const ctx = c.getContext('2d')
    if (!ctx) return

    let animId: number
    let w = 0, h = 0
    const nodes: { x: number; y: number; vx: number; vy: number; r: number }[] = []
    const pulses: { from: number; to: number; t: number; speed: number }[] = []

    function resize() {
      w = c!.width = c!.offsetWidth
      h = c!.height = c!.offsetHeight
    }
    resize()
    window.addEventListener('resize', resize)

    for (let i = 0; i < 40; i++) {
      nodes.push({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3, r: Math.random() * 2 + 1.5 })
    }

    function draw() {
      ctx!.clearRect(0, 0, w, h)
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i]
        n.x += n.vx; n.y += n.vy
        if (n.x < 0 || n.x > w) n.vx *= -1
        if (n.y < 0 || n.y > h) n.vy *= -1
        n.x = Math.max(0, Math.min(w, n.x))
        n.y = Math.max(0, Math.min(h, n.y))
      }
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 180) {
            const alpha = (1 - dist / 180) * 0.35
            ctx!.beginPath(); ctx!.moveTo(nodes[i].x, nodes[i].y); ctx!.lineTo(nodes[j].x, nodes[j].y)
            ctx!.strokeStyle = 'rgba(255,255,255,' + alpha + ')'; ctx!.lineWidth = 0.8; ctx!.stroke()
            if (Math.random() < 0.008 && pulses.length < 15) pulses.push({ from: i, to: j, t: 0, speed: 0.008 + Math.random() * 0.008 })
          }
        }
      }
      for (let p = pulses.length - 1; p >= 0; p--) {
        const pulse = pulses[p]; pulse.t += pulse.speed
        if (pulse.t > 1) { pulses.splice(p, 1); continue }
        const from = nodes[pulse.from], to = nodes[pulse.to]
        const px = from.x + (to.x - from.x) * pulse.t, py = from.y + (to.y - from.y) * pulse.t
        const glow = Math.sin(pulse.t * Math.PI)
        ctx!.beginPath(); ctx!.arc(px, py, 2, 0, Math.PI * 2); ctx!.fillStyle = 'rgba(16,185,129,' + (glow * 0.8) + ')'; ctx!.fill()
        ctx!.beginPath(); ctx!.arc(px, py, 5, 0, Math.PI * 2); ctx!.fillStyle = 'rgba(16,185,129,' + (glow * 0.2) + ')'; ctx!.fill()
      }
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i]
        ctx!.beginPath(); ctx!.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx!.fillStyle = 'rgba(255,255,255,0.25)'; ctx!.fill()
        ctx!.beginPath(); ctx!.arc(n.x, n.y, n.r + 3, 0, Math.PI * 2); ctx!.fillStyle = 'rgba(255,255,255,0.03)'; ctx!.fill()
      }
      animId = requestAnimationFrame(draw)
    }
    draw()

    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize) }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!name.trim()) { setError('Ad soyad alanı zorunludur.'); return }
    if (!email.trim() || !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email.trim())) { setError('Geçerli bir e-posta adresi girin.'); return }
    if (!password || password.length < 8) { setError('Şifre en az 8 karakter olmalıdır.'); return }
    if (password !== passwordConfirm) { setError('Şifreler eşleşmiyor.'); return }
    if (phone.trim() && !/^[+]?[0-9\s()-]{7,20}$/.test(phone.trim())) { setError('Geçerli bir telefon numarası girin.'); return }
    if (!acceptedTerms) { setError('Devam etmek için politikaları kabul etmelisiniz.'); return }
    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error: authError } = await supabase.auth.signUp({ email, password })
      if (authError) throw new Error(authError.message)
      if (!data.user) throw new Error('Kullanıcı oluşturulamadı')
      const res = await fetch('/api/auth/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: data.user.id, email, full_name: name.trim(), organization_name: company.trim() || `${name.trim()} Organizasyonu` }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Hesap oluşturulamadı') }
      router.push('/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Kayıt yapılamadı')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#060609] flex items-center justify-center px-4 py-6 relative overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true" />

      <div className="w-full max-w-[380px] relative z-10">
        <div className="flex justify-center mb-5">
          <Link href="/">
            <Image src="/logos/yoai-logo.png" alt="Yo Dijital" width={80} height={28} className="brightness-0 invert" priority />
          </Link>
        </div>

        <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
          <h1 className="text-2xl font-bold text-white text-center mb-2">Ücretsiz Denemenizi Başlatın</h1>
          <p className="text-sm text-gray-400 text-center mb-6">Yo Dijital ile lead yönetiminizi yapay zekâ ile güçlendirin.</p>

          {error && (
            <div className="mb-6 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Ad Soyad <span className="text-emerald-400">*</span></label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Adınızı ve soyadınızı girin"
                className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder-gray-500 outline-none transition focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30"
                autoComplete="name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">E-posta Adresi <span className="text-emerald-400">*</span></label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="ornek@sirket.com"
                className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder-gray-500 outline-none transition focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30"
                autoComplete="email" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Şirket Adı (İsteğe bağlı)</label>
              <input type="text" value={company} onChange={e => setCompany(e.target.value)} placeholder="Şirketinizin adı"
                className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder-gray-500 outline-none transition focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30"
                autoComplete="organization" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Telefon (İsteğe bağlı)</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value.replace(/[^0-9+\s()-]/g, ''))} placeholder="+90 5XX XXX XX XX"
                className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder-gray-500 outline-none transition focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30"
                autoComplete="tel" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Şifre <span className="text-emerald-400">*</span></label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="En az 8 karakter"
                className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder-gray-500 outline-none transition focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30"
                autoComplete="new-password" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Şifre Tekrar <span className="text-emerald-400">*</span></label>
              <input type="password" value={passwordConfirm} onChange={e => setPasswordConfirm(e.target.value)} placeholder="Şifrenizi tekrar girin"
                className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder-gray-500 outline-none transition focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30"
                autoComplete="new-password" />
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={acceptedTerms} onChange={e => setAcceptedTerms(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-white/20 bg-white/[0.04] text-emerald-500 focus:ring-emerald-500/30 accent-emerald-500" />
              <span className="text-sm text-gray-400 leading-relaxed">
                Kayıt olarak,{' '}
                <Link href="/privacy-policy" target="_blank" className="text-emerald-400 hover:text-emerald-300 underline">Gizlilik Politikası</Link>
                {', '}
                <Link href="/terms-of-service" target="_blank" className="text-emerald-400 hover:text-emerald-300 underline">Kullanım Koşulları</Link>
                {' '}ve{' '}
                <Link href="/cookie-policy" target="_blank" className="text-emerald-400 hover:text-emerald-300 underline">Çerez Politikası</Link>
                &apos;nı kabul etmiş olursunuz.
              </span>
            </label>

            <button type="submit" disabled={loading}
              className="w-full rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:from-emerald-600 hover:to-teal-600 disabled:opacity-60 disabled:cursor-not-allowed">
              {loading ? 'Hesabınız oluşturuluyor...' : '14 Gün Ücretsiz Denemeyi Başlat'}
            </button>
          </form>

          <p className="text-xs text-gray-500 text-center mt-4">Kredi kartı gerekmez. İstediğiniz zaman iptal edin.</p>

          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500">
              Zaten hesabınız var mı?{' '}
              <Link href="/login" className="text-emerald-400 hover:text-emerald-300 font-medium transition">Giriş Yap</Link>
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-gray-500 hover:text-emerald-400 transition">← Ana sayfaya dön</Link>
        </div>
      </div>

      {/* Footer legal links */}
      <div className="absolute bottom-4 left-0 right-0 flex flex-wrap justify-center gap-4 px-4">
        <a href="/privacy-policy" className="text-xs text-gray-600 hover:text-gray-400 transition">Gizlilik Politikası</a>
        <a href="/cookie-policy" className="text-xs text-gray-600 hover:text-gray-400 transition">Çerez Politikası</a>
        <a href="/terms-of-service" className="text-xs text-gray-600 hover:text-gray-400 transition">Kullanım Koşulları</a>
        <a href="/data-deletion" className="text-xs text-gray-600 hover:text-gray-400 transition">Veri Silme</a>
      </div>
    </div>
  )
}
