'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/lib/auth-context'
import {
  getChecklistItems,
  addChecklistItem,
  toggleChecklistItem,
  deleteChecklistItem,
  updateChecklistItem,
  ChecklistItem,
  ChecklistCategory,
} from '@/lib/firestore'
import clsx from 'clsx'

const CATEGORIES: { value: ChecklistCategory; label: string; emoji: string }[] = [
  { value: 'stationery', label: 'Stationery', emoji: '✏️' },
  { value: 'clothing', label: 'Clothing', emoji: '👕' },
  { value: 'household', label: 'Household', emoji: '🏠' },
  { value: 'other', label: 'Other', emoji: '📦' },
]

export default function ChecklistPage() {
  const { user } = useAuth()
  const [items, setItems] = useState<ChecklistItem[]>([])
  const [label, setLabel] = useState('')
  const [category, setCategory] = useState<ChecklistCategory>('stationery')
  const [filter, setFilter] = useState<ChecklistCategory | 'all'>('all')
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState('')
  const [editCategory, setEditCategory] = useState<ChecklistCategory>('stationery')

  useEffect(() => {
    if (!user) return
    getChecklistItems(user.uid).then((data) => {
      setItems(data)
      setLoading(false)
    })
  }, [user])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!label.trim() || !user) return
    setAdding(true)
    await addChecklistItem(user.uid, label.trim(), category)
    const updated = await getChecklistItems(user.uid)
    setItems(updated)
    setLabel('')
    setAdding(false)
  }

  async function handleToggle(item: ChecklistItem) {
    if (!user) return
    await toggleChecklistItem(user.uid, item.id, !item.checked)
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, checked: !i.checked } : i)),
    )
  }

  function startEdit(item: ChecklistItem) {
    setEditingId(item.id)
    setEditLabel(item.label)
    setEditCategory(item.category)
  }

  async function handleEdit(item: ChecklistItem) {
    if (!user || !editLabel.trim()) return
    await updateChecklistItem(user.uid, item.id, editLabel.trim(), editCategory)
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, label: editLabel.trim(), category: editCategory } : i)),
    )
    setEditingId(null)
  }

  async function handleDelete(id: string) {
    if (!user) return
    await deleteChecklistItem(user.uid, id)
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  const visible = filter === 'all' ? items : items.filter((i) => i.category === filter)
  const done = visible.filter((i) => i.checked).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">📦 Packing checklist</h1>
        <p className="text-stone-500 text-sm mt-1">
          {done}/{visible.length} items packed
        </p>
      </div>

      {/* Add form */}
      <form onSubmit={handleAdd} className="card flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          className="input flex-1"
          placeholder="Add an item…"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
        <select
          className="input sm:w-40"
          value={category}
          onChange={(e) => setCategory(e.target.value as ChecklistCategory)}
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.emoji} {c.label}
            </option>
          ))}
        </select>
        <button type="submit" disabled={adding} className="btn-primary shrink-0">
          {adding ? 'Adding…' : 'Add'}
        </button>
      </form>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('all')}
          className={clsx(
            'rounded-full px-3 py-1 text-xs font-medium border transition',
            filter === 'all' ? 'bg-brand-500 text-white border-brand-500' : 'bg-white text-stone-600',
          )}
        >
          All
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            onClick={() => setFilter(c.value)}
            className={clsx(
              'rounded-full px-3 py-1 text-xs font-medium border transition',
              filter === c.value ? 'bg-brand-500 text-white border-brand-500' : 'bg-white text-stone-600',
            )}
          >
            {c.emoji} {c.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-stone-400 text-sm">Loading…</p>
      ) : visible.length === 0 ? (
        <p className="text-stone-400 text-sm">No items yet — add something above.</p>
      ) : (
        <ul className="space-y-2">
          <AnimatePresence>
            {visible.map((item) => (
              <motion.li
                key={item.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -16 }}
                className="card flex items-center gap-3 py-3 px-4"
              >
                {editingId === item.id ? (
                  <>
                    <input
                      autoFocus
                      type="text"
                      className="input flex-1 text-sm py-1"
                      value={editLabel}
                      onChange={(e) => setEditLabel(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleEdit(item)
                        if (e.key === 'Escape') setEditingId(null)
                      }}
                    />
                    <select
                      className="input text-sm py-1 w-32"
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value as ChecklistCategory)}
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.emoji} {c.label}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleEdit(item)}
                      className="text-green-500 hover:text-green-600 transition text-sm font-medium"
                      aria-label="Save"
                    >
                      ✓
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="text-stone-300 hover:text-stone-500 transition text-lg leading-none"
                      aria-label="Cancel"
                    >
                      ×
                    </button>
                  </>
                ) : (
                  <>
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={() => handleToggle(item)}
                      className="h-4 w-4 rounded accent-brand-500 cursor-pointer"
                    />
                    <span className={clsx('flex-1 text-sm', item.checked && 'line-through text-stone-400')}>
                      {item.label}
                    </span>
                    <span className="text-xs text-stone-400">
                      {CATEGORIES.find((c) => c.value === item.category)?.emoji}
                    </span>
                    <button
                      onClick={() => startEdit(item)}
                      className="text-stone-300 hover:text-brand-500 transition text-sm leading-none"
                      aria-label="Edit"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-stone-300 hover:text-red-400 transition text-lg leading-none"
                      aria-label="Delete"
                    >
                      ×
                    </button>
                  </>
                )}
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  )
}
