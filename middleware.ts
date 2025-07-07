import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  console.log('Middleware running for:', req.nextUrl.pathname)
  
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

  // Check for Supabase auth cookies (try different possible names)
  const hasAuthCookie = req.cookies.has('sb-access-token') || 
                       req.cookies.has('sb-refresh-token') ||
                       req.cookies.has('supabase-auth-token') ||
                       req.cookies.has('supabase-refresh-token') ||
                       req.cookies.has('access_token') ||
                       req.cookies.has('refresh_token')

  // Log all cookies for debugging
  const allCookies = req.cookies.getAll()
  console.log('Middleware cookies:', allCookies.map(c => c.name))

  console.log('Middleware check:', {
    pathname: req.nextUrl.pathname,
    isProtectedRoute,
    isAuthRoute,
    hasAuthCookie,
    cookieNames: allCookies.map(c => c.name)
  })

  // If accessing protected route without auth cookie, redirect to login
  if (isProtectedRoute && !hasAuthCookie) {
    console.log('Middleware: Redirecting to login (protected route without auth)')
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/login'
    return NextResponse.redirect(redirectUrl)
  }

  // If accessing auth routes with auth cookie, redirect to dashboard
  if (isAuthRoute && hasAuthCookie) {
    console.log('Middleware: Redirecting to dashboard (auth route with auth)')
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/dashboard'
    return NextResponse.redirect(redirectUrl)
  }

  console.log('Middleware: allowing request through')
  return NextResponse.next()
}

export const config = {
  matcher: [
    // Only run middleware on specific routes (temporarily excluding dashboard)
    '/upload/:path*',
    '/journal/:path*',
    '/login',
    '/auth/:path*'
  ],
} 