import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  // Define protected routes
  const protectedRoutes = ['/dashboard', '/upload', '/journal']
  const isProtectedRoute = protectedRoutes.some(route => 
    req.nextUrl.pathname.startsWith(route)
  )

  // Define auth routes (login, callback)
  const authRoutes = ['/login', '/auth/callback']
  const isAuthRoute = authRoutes.some(route => 
    req.nextUrl.pathname.startsWith(route)
  )

  // Check for Supabase auth cookies
  const hasAuthCookie = req.cookies.has('sb-access-token') || 
                       req.cookies.has('sb-refresh-token')

  // If accessing protected route without auth cookie, redirect to login
  if (isProtectedRoute && !hasAuthCookie) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/login'
    return NextResponse.redirect(redirectUrl)
  }

  // If accessing auth routes with auth cookie, redirect to dashboard
  if (isAuthRoute && hasAuthCookie) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/dashboard'
    return NextResponse.redirect(redirectUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
} 