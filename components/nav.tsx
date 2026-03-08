'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import clsx from 'clsx'

const links = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/checklist', label: 'Checklist' },
  { href: '/budget', label: 'Budget' },
  { href: '/social', label: 'Social' },
  { href: '/settings', label: 'Settings' },
]

export default function Nav() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()

  async function handleLogout() {
    await logout()
    document.cookie = 'session=; Max-Age=0; path=/'
    router.push('/auth/login')
  }

  if (!user) return null

  return (
    <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/dashboard" className="font-bold text-brand-500 text-lg tracking-tight">
          bTsHelper
        </Link>
        <nav className="hidden sm:flex items-center gap-1">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={clsx(
                'rounded-lg px-3 py-1.5 text-sm font-medium transition',
                pathname === href
                  ? 'bg-brand-50 text-brand-600'
                  : 'text-stone-600 hover:bg-stone-100',
              )}
            >
              {label}
            </Link>
          ))}
        </nav>
        <button onClick={handleLogout} className="text-sm text-stone-500 hover:text-stone-900 transition">
          Sign out
        </button>
      </div>
      {/* Mobile nav */}
      <div className="flex sm:hidden overflow-x-auto border-t px-2 py-1 gap-1">
        {links.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={clsx(
              'shrink-0 rounded-lg px-3 py-1 text-xs font-medium transition',
              pathname === href ? 'bg-brand-50 text-brand-600' : 'text-stone-600',
            )}
          >
            {label}
          </Link>
        ))}
      </div>
    </header>
  )
}
