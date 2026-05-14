import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:8081',
  'http://localhost:8082',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:8081',
  'http://127.0.0.1:8082',
  'https://hormuud-platform.vercel.app',
  'https://hormuud-electrical-services.vercel.app',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // CORS handling for API routes
  if (pathname.startsWith('/api')) {
    const origin = request.headers.get('origin') || ''
    const isAllowed = allowedOrigins.includes(origin)

    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': isAllowed ? origin : '',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        },
      })
    }

    const response = NextResponse.next()
    if (isAllowed) {
      response.headers.set('Access-Control-Allow-Origin', origin)
    }
    return response
  }

  // Auth protection for admin routes
  if (pathname.startsWith('/admin')) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('redirect', pathname)
      return NextResponse.redirect(url)
    }
  }

  // Redirect logged-in users away from login page
  if (pathname === '/login') {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/login', '/api/:path*'],
}
