'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/lib/auth-context'
import {
  getSocialIntentions,
  addSocialIntention,
  deleteSocialIntention,
  SocialIntention,
} from '@/lib/firestore'

export default function SocialPage() {
  const { user } = useAuth()
  const [intentions, setIntentions] = useState<SocialIntention[]>([])
  const [name, setName] = useState('')
  const [why, setWhy] = useState('')
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    if (!user) return
    getSocialIntentions(user.uid).then((data) => {
      setIntentions(data)
      setLoading(false)
    })
  }, [user])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !user) return
    setAdding(true)
    await addSocialIntention(user.uid, name.trim(), why.trim())
    const updated = await getSocialIntentions(user.uid)
    setIntentions(updated)
    setName('')
    setWhy('')
    setAdding(false)
  }

  async function handleDelete(id: string) {
    if (!user) return
    await deleteSocialIntention(user.uid, id)
    setIntentions((prev) => prev.filter((i) => i.id !== id))
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">👥 Social intentions</h1>
        <p className="text-stone-500 text-sm mt-1">
          Who do you want to make time for this semester?
        </p>
      </div>

      <form onSubmit={handleAdd} className="card space-y-3">
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="name">Name</label>
            <input
              id="name"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Amara"
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="why">Why (optional)</label>
            <input
              id="why"
              className="input"
              value={why}
              onChange={(e) => setWhy(e.target.value)}
              placeholder="We haven't properly caught up since last year"
            />
          </div>
        </div>
        <button type="submit" disabled={adding} className="btn-primary">
          {adding ? 'Adding…' : 'Add person'}
        </button>
      </form>

      {loading ? (
        <p className="text-stone-400 text-sm">Loading…</p>
      ) : intentions.length === 0 ? (
        <p className="text-stone-400 text-sm">No one added yet. Add a name above.</p>
      ) : (
        <ul className="space-y-3">
          <AnimatePresence>
            {intentions.map((p) => (
              <motion.li
                key={p.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -16 }}
                className="card flex items-start gap-4"
              >
                <div className="flex-1">
                  <p className="font-semibold text-sm">{p.name}</p>
                  {p.why && <p className="text-stone-500 text-sm mt-0.5">{p.why}</p>}
                </div>
                <button
                  onClick={() => handleDelete(p.id)}
                  className="text-stone-300 hover:text-red-400 transition text-lg leading-none mt-0.5"
                  aria-label="Delete"
                >
                  ×
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  )
}
