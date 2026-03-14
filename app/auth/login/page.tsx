'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { motion, AnimatePresence } from 'framer-motion'

export default function LoginPage() {
  const { login, resetPassword } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const [forgotOpen, setForgotOpen] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetStatus, setResetStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      document.cookie = 'session=1; path=/; max-age=604800; SameSite=Lax'
      router.push('/dashboard')
    } catch {
      setError('Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setResetStatus('sending')
    try {
      await resetPassword(resetEmail)
      setResetStatus('sent')
    } catch {
      setResetStatus('error')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-stone-50">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-brand-500">bTsHelper</h1>
          <p className="mt-1 text-sm text-stone-500">Welcome back</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">
          {error && (
            <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>
          )}
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              required
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@uni.edu"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="label" htmlFor="password">Password</label>
              <button
                type="button"
                onClick={() => { setForgotOpen(!forgotOpen); setResetStatus('idle'); setResetEmail(email) }}
                className="text-xs text-brand-500 hover:underline"
              >
                Forgot password?
              </button>
            </div>
            <input
              id="password"
              type="password"
              required
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <AnimatePresence>
            {forgotOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 space-y-3">
                  <p className="text-xs text-stone-500">Enter your email and we'll send a reset link.</p>
                  {resetStatus === 'sent' ? (
                    <p className="text-sm text-green-600 font-medium">Check your inbox — link sent!</p>
                  ) : (
                    <form onSubmit={handleReset} className="flex gap-2">
                      <input
                        type="email"
                        required
                        className="input flex-1 text-sm py-1.5"
                        placeholder="you@uni.edu"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                      />
                      <button
                        type="submit"
                        disabled={resetStatus === 'sending'}
                        className="btn-primary text-sm px-3 py-1.5 shrink-0"
                      >
                        {resetStatus === 'sending' ? '…' : 'Send'}
                      </button>
                    </form>
                  )}
                  {resetStatus === 'error' && (
                    <p className="text-xs text-red-500">Couldn't send reset email. Check the address and try again.</p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
          <p className="text-center text-sm text-stone-500">
            No account?{' '}
            <Link href="/auth/signup" className="font-medium text-brand-500 hover:underline">
              Sign up
            </Link>
          </p>
        </form>
      </motion.div>
    </div>
  )
}
