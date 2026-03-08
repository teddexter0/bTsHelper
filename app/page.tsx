import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'bTsHelper — Back to uni, sorted.',
  description: 'Set your semester intentions once. Get a gentle weekly nudge to stay on track.',
}

const pillars = [
  {
    emoji: '📦',
    title: 'Packing checklist',
    desc: 'Stationery, clothes, household items — organised by category, checked off as you go.',
  },
  {
    emoji: '💸',
    title: 'Budget planner',
    desc: 'Set spending goals (eating out, savings targets) and log spend against each one.',
  },
  {
    emoji: '👥',
    title: 'Social intentions',
    desc: 'Note who you want to make time for this semester, and why. No calendar, no stress.',
  },
  {
    emoji: '📬',
    title: 'Weekly digest',
    desc: 'Every Sunday morning: a warm email with your checklist status, budget check, and social reminder.',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-stone-50">
      {/* Nav */}
      <header className="mx-auto max-w-5xl px-4 py-5 flex items-center justify-between">
        <span className="font-bold text-brand-500 text-lg tracking-tight">bTsHelper</span>
        <div className="flex items-center gap-3">
          <Link href="/auth/login" className="text-sm text-stone-600 hover:text-stone-900 transition font-medium">
            Sign in
          </Link>
          <Link href="/auth/signup" className="btn-primary text-sm">
            Get started free
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-3xl px-4 pt-20 pb-16 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold leading-tight text-stone-900">
          Back to uni,{' '}
          <span className="text-brand-500">sorted.</span>
        </h1>
        <p className="mt-5 text-lg text-stone-500 max-w-xl mx-auto">
          Set your semester intentions once — packing list, budget, who to hang out with —
          and get a gentle weekly email to keep you honest with yourself.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/auth/signup" className="btn-primary text-base px-7 py-3">
            Start your semester →
          </Link>
          <Link href="/auth/login" className="btn-secondary text-base px-7 py-3">
            Sign in
          </Link>
        </div>
      </section>

      {/* Pillars */}
      <section className="mx-auto max-w-5xl px-4 pb-24">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {pillars.map((p) => (
            <div key={p.title} className="card hover:shadow-md transition">
              <p className="text-3xl mb-3">{p.emoji}</p>
              <h3 className="font-semibold text-stone-900 mb-1">{p.title}</h3>
              <p className="text-sm text-stone-500 leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Email preview */}
      <section className="bg-white border-y">
        <div className="mx-auto max-w-3xl px-4 py-20 text-center">
          <h2 className="text-2xl font-bold mb-3">The Sunday digest</h2>
          <p className="text-stone-500 mb-8">A quiet check-in that arrives before the week starts. No notifications, no pings.</p>
          <div className="text-left mx-auto max-w-md card border-2 border-brand-100 font-mono text-sm text-stone-600 space-y-3">
            <p className="font-bold text-stone-900 text-base">Your week, sorted 👋 — Sem 1 2026</p>
            <p className="text-stone-400 text-xs">Hey Alex, here's where you're at this week.</p>
            <div>
              <p className="font-semibold text-stone-800">📦 CHECKLIST</p>
              <p>✅ Done: 12 items</p>
              <p>⏳ Still pending: Bedsheet, Extension cord, Notebook</p>
            </div>
            <div>
              <p className="font-semibold text-stone-800">💸 BUDGET</p>
              <p>🍔 Eating out: KES 1,400 / 2,000 — on track ✅</p>
              <p>🎧 AirPods: KES 6,200 / 15,000 — 41% 📈</p>
            </div>
            <div>
              <p className="font-semibold text-stone-800">👥 SOCIAL</p>
              <p>Make time for: Amara, Kevin, Aunt Rose</p>
            </div>
            <p className="text-stone-400 text-xs">See you next week, bTsHelper</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-xl px-4 py-20 text-center">
        <h2 className="text-2xl font-bold mb-3">Ready to set up your semester?</h2>
        <p className="text-stone-500 mb-6">Takes 2 minutes. Free, always.</p>
        <Link href="/auth/signup" className="btn-primary text-base px-8 py-3">
          Get started →
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t py-6 text-center text-xs text-stone-400">
        bTsHelper · Made for students · Free forever
      </footer>
    </div>
  )
}
