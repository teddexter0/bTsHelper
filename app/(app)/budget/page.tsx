'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/lib/auth-context'
import {
  getBudgets,
  addBudget,
  deleteBudget,
  getTransactions,
  addTransaction,
  deleteTransaction,
  Budget,
  Transaction,
  BudgetFrequency,
} from '@/lib/firestore'
import clsx from 'clsx'

const FREQUENCIES: { value: BudgetFrequency; label: string }[] = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'one-time', label: 'One-time / savings' },
]

const EMOJIS = ['💰', '🍔', '📚', '🎧', '👟', '✈️', '🏋️', '🎬', '🛒', '💊']

export default function BudgetPage() {
  const { user } = useAuth()
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  // New budget form
  const [bLabel, setBLabel] = useState('')
  const [bTarget, setBTarget] = useState('')
  const [bCurrency, setBCurrency] = useState('KES')
  const [bFreq, setBFreq] = useState<BudgetFrequency>('monthly')
  const [bDeadline, setBDeadline] = useState('')
  const [bEmoji, setBEmoji] = useState('💰')
  const [addingBudget, setAddingBudget] = useState(false)
  const [showBudgetForm, setShowBudgetForm] = useState(false)

  // New transaction form
  const [txBudgetId, setTxBudgetId] = useState('')
  const [txAmount, setTxAmount] = useState('')
  const [txNote, setTxNote] = useState('')
  const [txDate, setTxDate] = useState(new Date().toISOString().slice(0, 10))
  const [addingTx, setAddingTx] = useState(false)
  const [showTxForm, setShowTxForm] = useState(false)

  async function reload() {
    if (!user) return
    const [b, t] = await Promise.all([getBudgets(user.uid), getTransactions(user.uid)])
    setBudgets(b)
    setTransactions(t)
  }

  useEffect(() => {
    if (!user) return
    reload().then(() => setLoading(false))
  }, [user])

  async function handleAddBudget(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setAddingBudget(true)
    await addBudget(user.uid, {
      label: bLabel.trim(),
      targetAmount: Number(bTarget),
      currency: bCurrency.trim() || 'KES',
      frequency: bFreq,
      deadline: bDeadline || undefined,
      emoji: bEmoji,
    })
    setBLabel(''); setBTarget(''); setBDeadline('')
    setShowBudgetForm(false)
    await reload()
    setAddingBudget(false)
  }

  async function handleAddTx(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !txBudgetId) return
    setAddingTx(true)
    await addTransaction(user.uid, {
      budgetId: txBudgetId,
      amount: Number(txAmount),
      note: txNote.trim(),
      date: txDate,
    })
    setTxAmount(''); setTxNote('')
    setShowTxForm(false)
    await reload()
    setAddingTx(false)
  }

  function spentFor(budgetId: string) {
    return transactions
      .filter((t) => t.budgetId === budgetId)
      .reduce((acc, t) => acc + t.amount, 0)
  }

  if (loading) return <p className="text-stone-400 text-sm">Loading…</p>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">💸 Budget</h1>
          <p className="text-stone-500 text-sm mt-1">Track goals and log spend</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setShowTxForm(!showTxForm); setShowBudgetForm(false) }} className="btn-secondary text-sm">
            + Log spend
          </button>
          <button onClick={() => { setShowBudgetForm(!showBudgetForm); setShowTxForm(false) }} className="btn-primary text-sm">
            + Goal
          </button>
        </div>
      </div>

      {/* New budget form */}
      <AnimatePresence>
        {showBudgetForm && (
          <motion.form
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            onSubmit={handleAddBudget}
            className="card space-y-3"
          >
            <h3 className="font-semibold text-sm">New budget goal</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="label">Label</label>
                <input className="input" value={bLabel} onChange={(e) => setBLabel(e.target.value)} placeholder="Eating out" required />
              </div>
              <div>
                <label className="label">Target amount</label>
                <input className="input" type="number" min={1} value={bTarget} onChange={(e) => setBTarget(e.target.value)} placeholder="2000" required />
              </div>
              <div>
                <label className="label">Currency</label>
                <input className="input" value={bCurrency} onChange={(e) => setBCurrency(e.target.value)} placeholder="KES" />
              </div>
              <div>
                <label className="label">Frequency</label>
                <select className="input" value={bFreq} onChange={(e) => setBFreq(e.target.value as BudgetFrequency)}>
                  {FREQUENCIES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Deadline (optional)</label>
                <input className="input" type="date" value={bDeadline} onChange={(e) => setBDeadline(e.target.value)} />
              </div>
              <div>
                <label className="label">Emoji</label>
                <div className="flex flex-wrap gap-2">
                  {EMOJIS.map((em) => (
                    <button
                      type="button"
                      key={em}
                      onClick={() => setBEmoji(em)}
                      className={clsx('text-xl rounded-lg p-1 transition', bEmoji === em ? 'bg-brand-100 ring-2 ring-brand-500' : 'hover:bg-stone-100')}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={addingBudget} className="btn-primary">{addingBudget ? 'Adding…' : 'Add goal'}</button>
              <button type="button" onClick={() => setShowBudgetForm(false)} className="btn-secondary">Cancel</button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Log transaction form */}
      <AnimatePresence>
        {showTxForm && (
          <motion.form
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            onSubmit={handleAddTx}
            className="card space-y-3"
          >
            <h3 className="font-semibold text-sm">Log spend</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="label">Budget</label>
                <select className="input" value={txBudgetId} onChange={(e) => setTxBudgetId(e.target.value)} required>
                  <option value="">Select…</option>
                  {budgets.map((b) => (
                    <option key={b.id} value={b.id}>{b.emoji} {b.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Amount</label>
                <input className="input" type="number" min={1} value={txAmount} onChange={(e) => setTxAmount(e.target.value)} placeholder="350" required />
              </div>
              <div>
                <label className="label">Note</label>
                <input className="input" value={txNote} onChange={(e) => setTxNote(e.target.value)} placeholder="Java House lunch" />
              </div>
              <div>
                <label className="label">Date</label>
                <input className="input" type="date" value={txDate} onChange={(e) => setTxDate(e.target.value)} required />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={addingTx} className="btn-primary">{addingTx ? 'Saving…' : 'Log'}</button>
              <button type="button" onClick={() => setShowTxForm(false)} className="btn-secondary">Cancel</button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Budget cards */}
      {budgets.length === 0 ? (
        <p className="text-stone-400 text-sm">No goals yet — add one above.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {budgets.map((b) => {
            const spent = spentFor(b.id)
            const pct = Math.min((spent / b.targetAmount) * 100, 100)
            const over = spent > b.targetAmount
            const related = transactions.filter((t) => t.budgetId === b.id).slice(0, 3)
            return (
              <motion.div
                key={b.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="card space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{b.emoji} {b.label}</p>
                    <p className="text-xs text-stone-400">{FREQUENCIES.find(f => f.value === b.frequency)?.label}{b.deadline ? ` · due ${b.deadline}` : ''}</p>
                  </div>
                  <button
                    onClick={async () => { await deleteBudget(user!.uid, b.id); await reload() }}
                    className="text-stone-300 hover:text-red-400 transition text-lg leading-none"
                    aria-label="Delete budget"
                  >
                    ×
                  </button>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className={over ? 'text-red-500 font-medium' : 'text-stone-600'}>
                      {b.currency} {spent.toLocaleString()} / {b.targetAmount.toLocaleString()}
                    </span>
                    <span className="text-stone-400">{Math.round(pct)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-stone-100">
                    <div
                      className={`h-2 rounded-full transition-all ${over ? 'bg-red-400' : 'bg-brand-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
                {related.length > 0 && (
                  <ul className="space-y-1">
                    {related.map((t) => (
                      <li key={t.id} className="flex items-center justify-between text-xs text-stone-500">
                        <span>{t.note || 'Spend'} · {t.date}</span>
                        <span className="flex items-center gap-1">
                          {b.currency} {t.amount.toLocaleString()}
                          <button
                            onClick={async () => { await deleteTransaction(user!.uid, t.id); await reload() }}
                            className="text-stone-300 hover:text-red-400 transition ml-1"
                          >
                            ×
                          </button>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
