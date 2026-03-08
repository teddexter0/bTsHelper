'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useAuth } from '@/lib/auth-context'
import {
  getChecklistItems,
  getBudgets,
  getTransactions,
  getSocialIntentions,
} from '@/lib/firestore'

const card = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalItems: 0,
    checkedItems: 0,
    budgetCount: 0,
    socialCount: 0,
  })
  const [budgetSummaries, setBudgetSummaries] = useState<
    { label: string; emoji: string; spent: number; target: number; currency: string }[]
  >([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    ;(async () => {
      const [items, budgets, transactions, social] = await Promise.all([
        getChecklistItems(user.uid),
        getBudgets(user.uid),
        getTransactions(user.uid),
        getSocialIntentions(user.uid),
      ])

      const summaries = budgets.map((b) => {
        const spent = transactions
          .filter((t) => t.budgetId === b.id)
          .reduce((acc, t) => acc + t.amount, 0)
        return {
          label: b.label,
          emoji: b.emoji ?? '💰',
          spent,
          target: b.targetAmount,
          currency: b.currency,
        }
      })

      setStats({
        totalItems: items.length,
        checkedItems: items.filter((i) => i.checked).length,
        budgetCount: budgets.length,
        socialCount: social.length,
      })
      setBudgetSummaries(summaries.slice(0, 3))
      setLoading(false)
    })()
  }, [user])

  if (loading) return <p className="text-stone-400 text-sm">Loading…</p>

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">
          Hey, {user?.displayName?.split(' ')[0]} 👋
        </h1>
        <p className="text-stone-500 text-sm mt-1">Here&apos;s your semester at a glance.</p>
      </div>

      <motion.div
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.08 } } }}
      >
        <motion.div variants={card}>
          <Link href="/checklist" className="card block hover:shadow-md transition group">
            <p className="text-3xl mb-2">📦</p>
            <p className="font-semibold">Checklist</p>
            <p className="text-stone-500 text-sm mt-1">
              {stats.checkedItems}/{stats.totalItems} packed
            </p>
            {stats.totalItems > 0 && (
              <div className="mt-3 h-1.5 rounded-full bg-stone-100">
                <div
                  className="h-1.5 rounded-full bg-brand-500 transition-all"
                  style={{ width: `${(stats.checkedItems / stats.totalItems) * 100}%` }}
                />
              </div>
            )}
          </Link>
        </motion.div>

        <motion.div variants={card}>
          <Link href="/budget" className="card block hover:shadow-md transition group">
            <p className="text-3xl mb-2">💸</p>
            <p className="font-semibold">Budget</p>
            <p className="text-stone-500 text-sm mt-1">
              {stats.budgetCount} {stats.budgetCount === 1 ? 'goal' : 'goals'} tracked
            </p>
          </Link>
        </motion.div>

        <motion.div variants={card}>
          <Link href="/social" className="card block hover:shadow-md transition group">
            <p className="text-3xl mb-2">👥</p>
            <p className="font-semibold">Social</p>
            <p className="text-stone-500 text-sm mt-1">
              {stats.socialCount} {stats.socialCount === 1 ? 'person' : 'people'} on your list
            </p>
          </Link>
        </motion.div>

        <motion.div variants={card}>
          <Link href="/settings" className="card block hover:shadow-md transition group">
            <p className="text-3xl mb-2">📬</p>
            <p className="font-semibold">Weekly digest</p>
            <p className="text-stone-500 text-sm mt-1">Sundays, 8 AM EAT</p>
          </Link>
        </motion.div>
      </motion.div>

      {budgetSummaries.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="card"
        >
          <h2 className="font-semibold mb-4">Budget snapshot</h2>
          <ul className="space-y-3">
            {budgetSummaries.map((b) => {
              const pct = Math.min((b.spent / b.target) * 100, 100)
              const over = b.spent > b.target
              return (
                <li key={b.label}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>
                      {b.emoji} {b.label}
                    </span>
                    <span className={over ? 'text-red-500 font-medium' : 'text-stone-500'}>
                      {b.currency} {b.spent.toLocaleString()} / {b.target.toLocaleString()}
                      {over ? ' ⚠️' : ''}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-stone-100">
                    <div
                      className={`h-1.5 rounded-full transition-all ${over ? 'bg-red-400' : 'bg-brand-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </li>
              )
            })}
          </ul>
        </motion.div>
      )}
    </div>
  )
}
