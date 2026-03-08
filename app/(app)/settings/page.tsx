'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { useAuth } from '@/lib/auth-context'
import { db } from '@/lib/firebase'

interface UserProfile {
  displayName: string
  email: string
  semesterLabel: string
  digestDay: string
}

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

export default function SettingsPage() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [semesterLabel, setSemesterLabel] = useState('')
  const [digestDay, setDigestDay] = useState('sunday')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!user) return
    getDoc(doc(db, 'users', user.uid)).then((snap) => {
      if (snap.exists()) {
        const data = snap.data() as UserProfile
        setProfile(data)
        setSemesterLabel(data.semesterLabel)
        setDigestDay(data.digestDay)
      }
    })
  }, [user])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    await updateDoc(doc(db, 'users', user.uid), { semesterLabel, digestDay })
    setSaved(true)
    setSaving(false)
    setTimeout(() => setSaved(false), 2500)
  }

  async function handleLogout() {
    await logout()
    document.cookie = 'session=; Max-Age=0; path=/'
    router.push('/auth/login')
  }

  if (!profile) return <p className="text-stone-400 text-sm">Loading…</p>

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="text-2xl font-bold">⚙️ Settings</h1>
        <p className="text-stone-500 text-sm mt-1">Manage your digest and semester preferences</p>
      </div>

      <motion.form
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSave}
        className="card space-y-4"
      >
        <div>
          <label className="label">Your name</label>
          <p className="input bg-stone-50 text-stone-500">{profile.displayName}</p>
        </div>
        <div>
          <label className="label">Email</label>
          <p className="input bg-stone-50 text-stone-500">{profile.email}</p>
        </div>
        <div>
          <label className="label" htmlFor="semester">Semester label</label>
          <input
            id="semester"
            className="input"
            value={semesterLabel}
            onChange={(e) => setSemesterLabel(e.target.value)}
            placeholder="Sem 1 2026"
          />
        </div>
        <div>
          <label className="label" htmlFor="digestDay">Weekly digest day</label>
          <select
            id="digestDay"
            className="input"
            value={digestDay}
            onChange={(e) => setDigestDay(e.target.value)}
          >
            {DAYS.map((d) => (
              <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>
            ))}
          </select>
          <p className="text-xs text-stone-400 mt-1">Digest emails send at 8:00 AM EAT on your chosen day.</p>
        </div>
        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Saving…' : 'Save changes'}
          </button>
          {saved && <span className="text-sm text-green-600">Saved!</span>}
        </div>
      </motion.form>

      <div className="card space-y-3">
        <h2 className="font-semibold text-sm text-stone-700">Account</h2>
        <button onClick={handleLogout} className="btn-secondary text-sm text-red-500 border-red-200 hover:bg-red-50">
          Sign out
        </button>
      </div>
    </div>
  )
}
