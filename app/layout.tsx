import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/lib/auth-context'

export const metadata: Metadata = {
  title: 'bTsHelper — Back to Uni, sorted.',
  description: 'Set your semester intentions once. Get a gentle weekly nudge to stay on track.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🎓</text></svg>" />
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
