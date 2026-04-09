'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useTranslations } from 'next-intl'

export default function LoginPage() {
  const router = useRouter()
  const t = useTranslations('auth.login')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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

    for (let i = 0; i < 35; i++) {
      nodes.push({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3, r: Math.random() * 2 + 1.5 })
    }

    function draw() {
      ctx!.clearRect(0, 0, w, h)
      for (const n of nodes) { n.x += n.vx; n.y += n.vy; if (n.x < 0 || n.x > w) n.vx *= -1; if (n.y < 0 || n.y > h) n.vy *= -1 }
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y, dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 180) {
            ctx!.beginPath(); ctx!.moveTo(nodes[i].x, nodes[i].y); ctx!.lineTo(nodes[j].x, nodes[j].y)
            ctx!.strokeStyle = `rgba(255,255,255,${(1 - dist / 180) * 0.35})`; ctx!.lineWidth = 0.8; ctx!.stroke()
            if (Math.random() < 0.008 && pulses.length < 15) pulses.push({ from: i, to: j, t: 0, speed: 0.008 + Math.random() * 0.008 })
          }
        }
      }
      for (let p = pulses.length - 1; p >= 0; p--) {
        const pulse = pulses[p]; pulse.t += pulse.speed
        if (pulse.t > 1) { pulses.splice(p, 1); continue }
        const f = nodes[pulse.from], t2 = nodes[pulse.to]
        const px = f.x + (t2.x - f.x) * pulse.t, py = f.y + (t2.y - f.y) * pulse.t
        const glow = Math.sin(pulse.t * Math.PI)
        ctx!.beginPath(); ctx!.arc(px, py, 2, 0, Math.PI * 2); ctx!.fillStyle = `rgba(16,185,129,${glow * 0.8})`; ctx!.fill()
      }
      for (const n of nodes) { ctx!.beginPath(); ctx!.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx!.fillStyle = 'rgba(255,255,255,0.25)'; ctx!.fill() }
      animId = requestAnimationFrame(draw)
    }
    draw()

    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize) }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!email.trim() || !password) { setError(t('errorRequired')); return }
    setLoading(true)
    try {
      const supabase = createClient()
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) throw new Error(authError.message === 'Invalid login credentials' ? t('errorInvalid') : authError.message)
      router.push('/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('errorGeneral'))
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
          <h1 className="text-2xl font-bold text-white text-center mb-2">{t('title')}</h1>
          <p className="text-sm text-gray-400 text-center mb-6">{t('subtitle')}</p>

          {error && (
            <div className="mb-6 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">{t('emailLabel')}</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={t('emailPlaceholder')}
                className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder-gray-500 outline-none transition focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">{t('passwordLabel')}</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={t('passwordPlaceholder')}
                className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder-gray-500 outline-none transition focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30"
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:from-emerald-600 hover:to-teal-600 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? t('submitLoading') : t('submit')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Hesabınız yok mu?{' '}
              <Link href="/register" className="text-emerald-400 hover:text-emerald-300 font-medium transition">Ücretsiz Kayıt Ol</Link>
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
