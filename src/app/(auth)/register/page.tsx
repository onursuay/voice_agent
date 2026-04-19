'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useTranslations } from 'next-intl'
import { Turnstile } from '@marsidev/react-turnstile'

export default function RegisterPage() {
  const router = useRouter()
  const t = useTranslations('auth.register')
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
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)

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
    if (!name.trim()) { setError(t('errorFullName')); return }
    if (!email.trim() || !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email.trim())) { setError(t('errorEmail')); return }
    if (!password || password.length < 8) { setError(t('errorPassword')); return }
    if (password !== passwordConfirm) { setError(t('errorPasswordMatch')); return }
    if (phone.trim() && !/^[+]?[0-9\s()-]{7,20}$/.test(phone.trim())) { setError(t('errorPhone')); return }
    if (!acceptedTerms) { setError(t('errorTerms')); return }
    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error: authError } = await supabase.auth.signUp({ email, password })
      if (authError) throw new Error(authError.message)
      if (!data.user) throw new Error(t('errorCreate'))
      const res = await fetch('/api/auth/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: data.user.id, email, full_name: name.trim(), organization_name: company.trim() || `${name.trim()} Organization` }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || t('errorCreate')) }
      router.push('/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('errorGeneral'))
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#060609] flex flex-col items-center justify-start px-4 py-10 relative overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true" />

      <div className="w-full max-w-[460px] relative z-10">
        <div className="flex justify-center mb-5">
          <Link href="/">
            <Image src="/logos/yoai-logo.png" alt="Yo Dijital" width={80} height={28} className="brightness-0 invert" priority />
          </Link>
        </div>

        <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
          <h1 className="text-2xl font-bold text-white text-center mb-2">{t('title')}</h1>
          <p className="text-sm text-gray-400 text-center mb-6">{t('subtitle')}</p>

          {error && (
            <div className="mb-6 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">{t('fullNameLabel')} <span className="text-emerald-400">*</span></label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder={t('fullNamePlaceholder')}
                className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder-gray-500 outline-none transition focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30"
                autoComplete="name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">{t('emailLabel')} <span className="text-emerald-400">*</span></label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={t('emailPlaceholder')}
                className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder-gray-500 outline-none transition focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30"
                autoComplete="email" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">{t('companyLabel')}</label>
              <input type="text" value={company} onChange={e => setCompany(e.target.value)} placeholder={t('companyPlaceholder')}
                className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder-gray-500 outline-none transition focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30"
                autoComplete="organization" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">{t('phoneLabel')}</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value.replace(/[^0-9+\s()-]/g, ''))} placeholder={t('phonePlaceholder')}
                className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder-gray-500 outline-none transition focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30"
                autoComplete="tel" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">{t('passwordLabel')} <span className="text-emerald-400">*</span></label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={t('passwordPlaceholder')}
                className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder-gray-500 outline-none transition focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30"
                autoComplete="new-password" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">{t('confirmPasswordLabel')} <span className="text-emerald-400">*</span></label>
              <input type="password" value={passwordConfirm} onChange={e => setPasswordConfirm(e.target.value)} placeholder={t('confirmPasswordPlaceholder')}
                className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder-gray-500 outline-none transition focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30"
                autoComplete="new-password" />
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={acceptedTerms} onChange={e => setAcceptedTerms(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-white/20 bg-white/[0.04] text-emerald-500 focus:ring-emerald-500/30 accent-emerald-500" />
              <span className="text-sm text-gray-400 leading-relaxed">
                {t('agreeText')}{' '}
                <Link href="/privacy-policy" target="_blank" className="text-emerald-400 hover:text-emerald-300 underline">{t('privacyPolicy')}</Link>
                {', '}
                <Link href="/terms-of-service" target="_blank" className="text-emerald-400 hover:text-emerald-300 underline">{t('terms')}</Link>
                {' '}{t('cookiePolicy') && 've'}{' '}
                <Link href="/cookie-policy" target="_blank" className="text-emerald-400 hover:text-emerald-300 underline">{t('cookiePolicy')}</Link>
              </span>
            </label>

            <button type="submit" disabled={loading}
              className="w-full rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:from-emerald-600 hover:to-teal-600 disabled:opacity-60 disabled:cursor-not-allowed">
              {loading ? t('submitLoading') : t('submit')}
            </button>
          </form>

          <p className="text-xs text-gray-500 text-center mt-4">{t('noCard')}</p>

          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500">
              {t('haveAccount')}{' '}
              <Link href="/login" className="text-emerald-400 hover:text-emerald-300 font-medium transition">{t('loginLink')}</Link>
            </p>
          </div>
        </div>

        <div className="mt-5 text-center">
          <Link href="/" className="text-sm text-gray-500 hover:text-emerald-400 transition">{t('backHome')}</Link>
        </div>

        <div className="mt-4 mb-2 flex flex-wrap justify-center gap-4">
          <a href="/privacy-policy" className="text-xs text-gray-600 hover:text-gray-400 transition">{t('privacyPolicy')}</a>
          <a href="/cookie-policy" className="text-xs text-gray-600 hover:text-gray-400 transition">{t('cookiePolicy')}</a>
          <a href="/terms-of-service" className="text-xs text-gray-600 hover:text-gray-400 transition">{t('terms')}</a>
          <a href="/data-deletion" className="text-xs text-gray-600 hover:text-gray-400 transition">{t('dataDeletion')}</a>
        </div>
      </div>
    </div>
  )
}
