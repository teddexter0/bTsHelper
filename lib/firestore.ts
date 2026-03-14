import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import { db } from './firebase'

// ── Types ──────────────────────────────────────────────────────────────────

export type ChecklistCategory = 'stationery' | 'clothing' | 'household' | 'other'

export interface ChecklistItem {
  id: string
  label: string
  category: ChecklistCategory
  checked: boolean
  createdAt: Timestamp
}

export type BudgetFrequency = 'weekly' | 'monthly' | 'one-time'

export interface Budget {
  id: string
  label: string
  targetAmount: number
  currency: string
  frequency: BudgetFrequency
  deadline?: string
  emoji?: string
}

export interface Transaction {
  id: string
  budgetId: string
  amount: number
  note: string
  date: string
}

export interface SocialIntention {
  id: string
  name: string
  why: string
  addedAt: Timestamp
}

// ── Checklist ──────────────────────────────────────────────────────────────

export async function getChecklistItems(uid: string): Promise<ChecklistItem[]> {
  const snap = await getDocs(
    query(collection(db, 'users', uid, 'checklists'), orderBy('createdAt', 'asc')),
  )
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ChecklistItem))
}

export async function addChecklistItem(
  uid: string,
  label: string,
  category: ChecklistCategory,
) {
  await addDoc(collection(db, 'users', uid, 'checklists'), {
    label,
    category,
    checked: false,
    createdAt: serverTimestamp(),
  })
}

export async function toggleChecklistItem(uid: string, itemId: string, checked: boolean) {
  await updateDoc(doc(db, 'users', uid, 'checklists', itemId), { checked })
}

export async function deleteChecklistItem(uid: string, itemId: string) {
  await deleteDoc(doc(db, 'users', uid, 'checklists', itemId))
}

export async function updateChecklistItem(
  uid: string,
  itemId: string,
  label: string,
  category: ChecklistCategory,
) {
  await updateDoc(doc(db, 'users', uid, 'checklists', itemId), { label, category })
}

// ── Budgets ────────────────────────────────────────────────────────────────

export async function getBudgets(uid: string): Promise<Budget[]> {
  const snap = await getDocs(collection(db, 'users', uid, 'budgets'))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Budget))
}

export async function addBudget(uid: string, data: Omit<Budget, 'id'>) {
  await addDoc(collection(db, 'users', uid, 'budgets'), data)
}

export async function deleteBudget(uid: string, budgetId: string) {
  await deleteDoc(doc(db, 'users', uid, 'budgets', budgetId))
}

// ── Transactions ───────────────────────────────────────────────────────────

export async function getTransactions(uid: string): Promise<Transaction[]> {
  const snap = await getDocs(
    query(collection(db, 'users', uid, 'transactions'), orderBy('date', 'desc')),
  )
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Transaction))
}

export async function addTransaction(uid: string, data: Omit<Transaction, 'id'>) {
  await addDoc(collection(db, 'users', uid, 'transactions'), data)
}

export async function deleteTransaction(uid: string, txId: string) {
  await deleteDoc(doc(db, 'users', uid, 'transactions', txId))
}

// ── Social intentions ──────────────────────────────────────────────────────

export async function getSocialIntentions(uid: string): Promise<SocialIntention[]> {
  const snap = await getDocs(
    query(collection(db, 'users', uid, 'socialIntentions'), orderBy('addedAt', 'asc')),
  )
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as SocialIntention))
}

export async function addSocialIntention(uid: string, name: string, why: string) {
  await addDoc(collection(db, 'users', uid, 'socialIntentions'), {
    name,
    why,
    addedAt: serverTimestamp(),
  })
}

export async function deleteSocialIntention(uid: string, personId: string) {
  await deleteDoc(doc(db, 'users', uid, 'socialIntentions', personId))
}
