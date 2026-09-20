import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const token =
    request.cookies.get('payload-token')?.value ||
    request.cookies.get('payload-viewer-token')?.value

  if (pathname === '/scalar' || pathname.startsWith('/scalar/')) {
    if (!token) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('next', pathname)
      return NextResponse.redirect(loginUrl)
    }
    return NextResponse.next()
  }

  if (pathname.startsWith('/api/openapi') || pathname.startsWith('/api/vendor-docs')) {
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/scalar',
    '/scalar/:path*',
    '/api/openapi/:path*',
    '/api/vendor-docs/:path*',
  ],
}
