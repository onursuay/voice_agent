'use client'

import { useState, useEffect } from 'react'
import { Eye, EyeOff, Copy, Check, Users, BadgePercent } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { getStoredProfile, setStoredProfile } from '@/lib/subscription/storage'
import { useAppStore } from '@/lib/store'
import { createClient } from '@/lib/supabase/client'
import type { UserProfile } from '@/lib/subscription/types'

export default function HesabimPage() {
  const { session } = useAppStore()
  const t = useTranslations('hesabim')

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [profileSaved, setProfileSaved] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPw, setShowCurrentPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)
  const [showConfirmPw, setShowConfirmPw] = useState(false)
  const [pwSaved, setPwSaved] = useState(false)
  const [pwError, setPwError] = useState('')

  const [codeCopied, setCodeCopied] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)

  useEffect(() => {
    const stored = getStoredProfile()
    // Pre-fill from Supabase session if localStorage has no name yet
    if (!stored.firstName && !stored.lastName && session?.user) {
      const fullName = session.user.full_name || ''
      const parts = fullName.trim().split(' ')
      const firstName = parts[0] || ''
      const lastName = parts.slice(1).join(' ') || ''
      const email = session.user.email || ''
      setProfile({ ...stored, firstName, lastName, email })
    } else {
      setProfile(stored)
    }
  }, [session])

  if (!profile) return null

  const initials = `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`.toUpperCase() || 'U'
  const referralLink = `https://voiceagent.yodijital.com/?referralCode=${profile.referralCode}`

  const handleSaveProfile = () => {
    setStoredProfile(profile)
    setProfileSaved(true)
    setTimeout(() => setProfileSaved(false), 2000)
  }

  const handleSavePassword = async () => {
    setPwError('')
    if (!newPassword || newPassword !== confirmPassword) {
      setPwError(t('passwordMismatch'))
      return
    }
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) {
      setPwError(error.message)
      return
    }
    setPwSaved(true)
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setTimeout(() => setPwSaved(false), 2000)
  }

  const handleCopy = (text: string, type: 'code' | 'link') => {
    navigator.clipboard.writeText(text)
    if (type === 'code') {
      setCodeCopied(true)
      setTimeout(() => setCodeCopied(false), 2000)
    } else {
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    }
  }

  return (
    <div className="space-y-6">

      {/* Top row: Profile + Password */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Profile Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="text-base font-bold text-gray-900 mb-5">{t('profileInfo')}</h3>

          {/* Avatar */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-lg">
              {initials}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{t('profilePhoto')}</p>
              <p className="text-sm text-gray-400">{t('maxFileSize')}</p>
            </div>
            <button className="ml-auto px-3 py-1.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
              {t('uploadPhoto')}
            </button>
          </div>

          {/* Name fields */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">{t('firstName')}</label>
              <input
                type="text"
                value={profile.firstName}
                onChange={e => setProfile({ ...profile, firstName: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">{t('lastName')}</label>
              <input
                type="text"
                value={profile.lastName}
                onChange={e => setProfile({ ...profile, lastName: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Email */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-600 mb-1.5">{t('email')}</label>
            <input
              type="email"
              value={profile.email}
              onChange={e => setProfile({ ...profile, email: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500"
            />
          </div>

          {/* Help access toggle */}
          <div className="flex items-center justify-between mb-6">
            <label className="text-sm text-gray-700">{t('helpAccess')}</label>
            <button
              onClick={() => setProfile({ ...profile, helpAccessEnabled: !profile.helpAccessEnabled })}
              className={`relative w-10 h-5 rounded-full transition-colors ${
                profile.helpAccessEnabled ? 'bg-indigo-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                  profile.helpAccessEnabled ? 'translate-x-5' : ''
                }`}
              />
            </button>
          </div>

          {/* Save button */}
          <button
            onClick={handleSaveProfile}
            className="w-full py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors text-sm"
          >
            {profileSaved ? t('saved') : t('save')}
          </button>
        </div>

        {/* Password Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="space-y-4">
            {/* Current password */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">{t('passwordChange')}</label>
              <div className="relative">
                <input
                  type={showCurrentPw ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder={t('currentPassword')}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 pr-10"
                />
                <button
                  onClick={() => setShowCurrentPw(!showCurrentPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New password */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">{t('newPasswordLabel')}</label>
              <div className="relative">
                <input
                  type={showNewPw ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder={t('newPassword')}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 pr-10"
                />
                <button
                  onClick={() => setShowNewPw(!showNewPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">{t('confirmPasswordLabel')}</label>
              <div className="relative">
                <input
                  type={showConfirmPw ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder={t('confirmPassword')}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 pr-10"
                />
                <button
                  onClick={() => setShowConfirmPw(!showConfirmPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {pwError && <p className="text-sm text-red-500">{pwError}</p>}

            <button
              onClick={handleSavePassword}
              className="w-full py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors text-sm"
            >
              {pwSaved ? 'Şifre Güncellendi ✓' : 'Şifreyi Güncelle'}
            </button>
          </div>
        </div>
      </div>

      {/* Referral Section */}
      <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-2xl border border-indigo-200 p-6">
        <h3 className="text-center text-lg font-bold text-gray-900 mb-6">
          Arkadaşlarını Davet Et, Birlikte Kazan
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Referral Info */}
          <div>
            <h4 className="text-sm font-bold text-gray-900 mb-1">Referans Bilgileri</h4>
            <p className="text-sm text-gray-500 mb-4">Arkadaşlarını davet et, her kayıt için indirim kazan.</p>

            {/* Referral code */}
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Referans Kodun</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={profile.referralCode}
                  readOnly
                  className="flex-1 px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-700"
                />
                <button
                  onClick={() => handleCopy(profile.referralCode, 'code')}
                  className="px-4 py-2.5 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-1.5 bg-white"
                >
                  {codeCopied ? <Check className="w-4 h-4 text-indigo-600" /> : <Copy className="w-4 h-4" />}
                  {codeCopied ? 'Kopyalandı' : 'Kodu Kopyala'}
                </button>
              </div>
            </div>

            {/* Referral link */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Referans Linkin</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={referralLink}
                  readOnly
                  className="flex-1 px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 truncate"
                />
                <button
                  onClick={() => handleCopy(referralLink, 'link')}
                  className="px-4 py-2.5 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-1.5 bg-white"
                >
                  {linkCopied ? <Check className="w-4 h-4 text-indigo-600" /> : <Copy className="w-4 h-4" />}
                  {linkCopied ? 'Kopyalandı' : 'Kopyala'}
                </button>
              </div>
            </div>
          </div>

          {/* Earnings */}
          <div>
            <h4 className="text-sm font-bold text-gray-900 mb-1">Kazançların</h4>
            <p className="text-sm text-gray-500 mb-4">Referanslarınla elde ettiğin indirimler burada gösterilir.</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-xl p-4 text-center border border-gray-100">
                <Users className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500 mb-1">Referanslar</p>
                <p className="text-2xl font-bold text-gray-900">0</p>
              </div>
              <div className="bg-white rounded-xl p-4 text-center border border-gray-100">
                <BadgePercent className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500 mb-1">Toplam İndirim</p>
                <p className="text-2xl font-bold text-gray-900">₺0</p>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
