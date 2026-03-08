import { NextRequest, NextResponse } from 'next/server'

const PUBLIC_PATHS = ['/', '/auth/login', '/auth/signup']

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith('/api'))
  const session = req.cookies.get('session')

  if (!isPublic && !session) {
    return NextResponse.redirect(new URL('/auth/login', req.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
