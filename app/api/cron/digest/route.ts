/**
 * /api/cron/digest
 *
 * Triggered by Vercel Cron every Sunday at 05:00 UTC (08:00 EAT).
 * For each user whose digestDay matches today, it:
 *   1. Fetches their checklist, budgets + transactions, social intentions from Firestore (Admin SDK)
 *   2. Composes a warm HTML email
 *   3. Sends it via Brevo transactional API
 *
 * Security: requests must carry  Authorization: Bearer <CRON_SECRET>
 * (Vercel automatically adds this header when CRON_SECRET is set in project settings)
 */

import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

// ── Types mirrored from lib/firestore.ts (no client SDK on server) ────────────

interface UserDoc {
  email: string
  displayName: string
  digestDay: string
  semesterLabel: string
}

interface ChecklistItem {
  label: string
  category: string
  checked: boolean
}

interface Budget {
  label: string
  targetAmount: number
  currency: string
  frequency: string
  emoji?: string
  deadline?: string
}

interface Transaction {
  budgetId: string
  amount: number
}

interface SocialIntention {
  name: string
  why: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function todayDigestDay(): string {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  return days[new Date().getUTCDay()]
}

async function getUsersForDay(day: string): Promise<Array<{ uid: string } & UserDoc>> {
  const snap = await adminDb.collection('users').where('digestDay', '==', day).get()
  return snap.docs.map((d) => ({ uid: d.id, ...(d.data() as UserDoc) }))
}

async function fetchUserData(uid: string) {
  const [checklistSnap, budgetsSnap, txSnap, socialSnap] = await Promise.all([
    adminDb.collection('users').doc(uid).collection('checklists').orderBy('createdAt', 'asc').get(),
    adminDb.collection('users').doc(uid).collection('budgets').get(),
    adminDb.collection('users').doc(uid).collection('transactions').get(),
    adminDb.collection('users').doc(uid).collection('socialIntentions').orderBy('addedAt', 'asc').get(),
  ])

  const checklist = checklistSnap.docs.map((d) => d.data() as ChecklistItem)
  const budgets: Array<Budget & { id: string }> = budgetsSnap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Budget),
  }))
  const transactions = txSnap.docs.map((d) => d.data() as Transaction)
  const social = socialSnap.docs.map((d) => d.data() as SocialIntention)

  return { checklist, budgets, transactions, social }
}

// ── Email builder ─────────────────────────────────────────────────────────────

function buildEmailHtml(
  user: UserDoc,
  checklist: ChecklistItem[],
  budgets: Array<Budget & { id: string }>,
  transactions: Transaction[],
  social: SocialIntention[],
): string {
  const done = checklist.filter((i) => i.checked)
  const pending = checklist.filter((i) => !i.checked)

  const budgetRows = budgets.map((b) => {
    const spent = transactions
      .filter((t) => t.budgetId === b.id)
      .reduce((acc, t) => acc + t.amount, 0)
    const pct = b.targetAmount > 0 ? Math.round((spent / b.targetAmount) * 100) : 0
    const over = spent > b.targetAmount
    const status = over ? '⚠️ over budget' : pct >= 80 ? '⚡ almost there' : pct >= 40 ? '📈 on track' : '✅ looking good'
    return `
      <tr>
        <td style="padding:6px 0;color:#374151;">${b.emoji ?? '💰'} ${b.label}</td>
        <td style="padding:6px 0;text-align:right;color:${over ? '#ef4444' : '#374151'};">
          ${b.currency} ${spent.toLocaleString()} / ${b.targetAmount.toLocaleString()} — ${status}
        </td>
      </tr>`
  })

  const pendingList = pending
    .slice(0, 8)
    .map((i) => `<li style="margin:2px 0;color:#374151;">${i.label}</li>`)
    .join('')

  const morePending = pending.length > 8 ? `<li style="color:#9ca3af;">+${pending.length - 8} more…</li>` : ''

  const socialList = social
    .map((p) => `<li style="margin:4px 0;color:#374151;"><strong>${p.name}</strong>${p.why ? ` — ${p.why}` : ''}</li>`)
    .join('')

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Your weekly bTsHelper digest</title>
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Inter,system-ui,sans-serif;color:#111827;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">

          <!-- Header -->
          <tr>
            <td style="background:#f4603a;padding:28px 32px;">
              <h1 style="margin:0;font-size:22px;color:#ffffff;font-weight:700;">Your week, sorted 👋</h1>
              <p style="margin:6px 0 0;color:#fde8e2;font-size:14px;">${user.semesterLabel}</p>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding:24px 32px 0;">
              <p style="margin:0;font-size:15px;color:#374151;">
                Hey <strong>${user.displayName.split(' ')[0]}</strong>, here's where you're at this week.
              </p>
            </td>
          </tr>

          <!-- Checklist section -->
          <tr>
            <td style="padding:24px 32px 0;">
              <h2 style="margin:0 0 12px;font-size:16px;color:#111827;">📦 Checklist</h2>
              ${
                checklist.length === 0
                  ? '<p style="color:#9ca3af;font-size:14px;">Nothing on your checklist yet.</p>'
                  : `<p style="margin:0 0 8px;font-size:14px;color:#374151;">
                      ✅ Done: <strong>${done.length}</strong> items &nbsp;·&nbsp;
                      ⏳ Pending: <strong>${pending.length}</strong> items
                    </p>
                    ${pending.length > 0 ? `<ul style="margin:8px 0 0;padding-left:18px;font-size:13px;">${pendingList}${morePending}</ul>` : '<p style="font-size:14px;color:#16a34a;">All packed! 🎉</p>'}`
              }
            </td>
          </tr>

          <!-- Budget section -->
          <tr>
            <td style="padding:24px 32px 0;">
              <h2 style="margin:0 0 12px;font-size:16px;color:#111827;">💸 Budget check</h2>
              ${
                budgets.length === 0
                  ? '<p style="color:#9ca3af;font-size:14px;">No budget goals set yet.</p>'
                  : `<table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;">${budgetRows.join('')}</table>`
              }
            </td>
          </tr>

          <!-- Social section -->
          <tr>
            <td style="padding:24px 32px 0;">
              <h2 style="margin:0 0 12px;font-size:16px;color:#111827;">👥 Social</h2>
              ${
                social.length === 0
                  ? '<p style="color:#9ca3af;font-size:14px;">No social intentions set yet.</p>'
                  : `<p style="margin:0 0 8px;font-size:14px;color:#374151;">You wanted to make time for:</p>
                    <ul style="margin:0;padding-left:18px;font-size:13px;">${socialList}</ul>`
              }
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:28px 32px;border-top:1px solid #f3f4f6;margin-top:24px;">
              <p style="margin:0;font-size:13px;color:#6b7280;">
                See you next week,<br>
                <strong style="color:#f4603a;">bTsHelper</strong>
              </p>
              <p style="margin:12px 0 0;font-size:11px;color:#9ca3af;">
                You're receiving this because you signed up at btshelper.vercel.app.
                To stop receiving these emails, visit your
                <a href="{{unsubscribe}}" style="color:#9ca3af;">settings</a>.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// ── Brevo sender ──────────────────────────────────────────────────────────────

async function sendEmail(to: string, toName: string, subject: string, html: string) {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': process.env.BREVO_API_KEY!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: 'bTsHelper', email: 'hello@btshelper.com' },
      to: [{ email: to, name: toName }],
      subject,
      htmlContent: html,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Brevo error (${res.status}): ${err}`)
  }
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  // 1. Auth check
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Determine target day (can be overridden via ?day=monday for testing)
  const { searchParams } = new URL(req.url)
  const day = searchParams.get('day') ?? todayDigestDay()

  // 3. Load eligible users
  let users: Array<{ uid: string } & UserDoc>
  try {
    users = await getUsersForDay(day)
  } catch (err) {
    console.error('[digest] Firestore query failed:', err)
    return NextResponse.json({ error: 'Firestore query failed' }, { status: 500 })
  }

  if (users.length === 0) {
    return NextResponse.json({ sent: 0, message: `No users with digestDay=${day}` })
  }

  // 4. Send digest for each user
  const results: { uid: string; status: 'ok' | 'error'; error?: string }[] = []

  await Promise.allSettled(
    users.map(async (user) => {
      try {
        const { checklist, budgets, transactions, social } = await fetchUserData(user.uid)
        const html = buildEmailHtml(user, checklist, budgets, transactions, social)
        const subject = `Your week, sorted 👋 — ${user.semesterLabel}`
        await sendEmail(user.email, user.displayName, subject, html)
        results.push({ uid: user.uid, status: 'ok' })
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        console.error(`[digest] Failed for uid=${user.uid}:`, message)
        results.push({ uid: user.uid, status: 'error', error: message })
      }
    }),
  )

  const sent = results.filter((r) => r.status === 'ok').length
  const failed = results.filter((r) => r.status === 'error').length

  return NextResponse.json({
    day,
    total: users.length,
    sent,
    failed,
    results,
  })
}
