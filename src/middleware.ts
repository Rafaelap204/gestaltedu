import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Route patterns
const PUBLIC_ROUTES = [
  '/marketplace',
  '/terms',
  '/privacy',
  '/login',
  '/register',
  '/forgot-password',
]

const AUTH_ROUTES = ['/login', '/register', '/forgot-password']

// Reserved subdomains that should not be treated as members area
const RESERVED_SUBDOMAINS = [
  'www', 'app', 'admin', 'teacher', 'api', 'mail', 'ftp',
  'staging', 'dev', 'test', 'gestalt', 'gestaltedu', 'localhost',
]

// Helper to check if path matches pattern
function matchesPattern(path: string, patterns: string[]): boolean {
  return patterns.some(pattern => {
    if (pattern.endsWith('/*')) {
      return path.startsWith(pattern.slice(0, -1))
    }
    return path === pattern || path.startsWith(`${pattern}/`)
  })
}

// Check if route is public
function isPublicRoute(path: string): boolean {
  // API webhooks are always public
  if (path.startsWith('/api/webhooks/')) return true
  
  // Course and checkout pages are public
  if (path.startsWith('/course/')) return true
  if (path.startsWith('/checkout/')) return true
  
  // Members area landing pages are public (but inner pages require auth)
  if (path === '/members-area' || path.startsWith('/members-area/')) {
    // Only the course landing page is public, watch pages require auth
    return !path.includes('/watch')
  }
  
  return matchesPattern(path, PUBLIC_ROUTES)
}

// Check if route is an auth route
function isAuthRoute(path: string): boolean {
  return matchesPattern(path, AUTH_ROUTES)
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Skip auth check during build/static generation
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    // Allow all requests during build
    return supabaseResponse
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // ====================
  // Subdomain routing for Members Area
  // ====================
  const hostname = request.headers.get('host') || ''
  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'localhost:3000'
  
  // Check if the request is via a subdomain
  if (hostname && hostname !== baseDomain && hostname !== `www.${baseDomain}`) {
    const subdomain = hostname.split('.')[0]
    
    // Only process if it looks like a valid subdomain and not reserved
    if (subdomain && !RESERVED_SUBDOMAINS.includes(subdomain) && !hostname.includes('localhost')) {
      // Look up subdomain in courses table
      const { data: course } = await supabase
        .from('courses')
        .select('id, members_area_enabled')
        .eq('members_area_subdomain', subdomain)
        .single()
      
      if (course && course.members_area_enabled) {
        const path = request.nextUrl.pathname
        
        // If accessing root of subdomain, redirect to members area
        if (path === '/' || path === '') {
          // Check if user is authenticated
          const { data: { user } } = await supabase.auth.getUser()
          
          if (!user) {
            // Redirect to login with redirect back to this subdomain
            const loginUrl = new URL('/login', request.url)
            loginUrl.searchParams.set('redirect', `/members-area/${course.id}`)
            return NextResponse.redirect(loginUrl)
          }
          
          // Authenticated user: rewrite to members area
          const rewriteUrl = new URL(`/members-area/${course.id}`, request.url)
          return NextResponse.rewrite(rewriteUrl)
        }
      }
    }
  }

  // ====================
  // Regular route handling
  // ====================

  // Get user session
  const { data: { user } } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  // Redirect root to login
  if (path === '/') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Allow public routes
  if (isPublicRoute(path)) {
    // If user is authenticated and trying to access auth routes, redirect based on role
    if (user && isAuthRoute(path)) {
      // Get user role for redirect
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .single()
      
      const userRole = profile?.role || 'student'
      let redirectPath = '/app'
      
      if (userRole === 'admin') {
        redirectPath = '/admin'
      } else if (userRole === 'teacher') {
        redirectPath = '/teacher'
      }
      
      return NextResponse.redirect(new URL(redirectPath, request.url))
    }
    return supabaseResponse
  }

  // Protected routes - require authentication
  if (!user) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirect', path)
    return NextResponse.redirect(redirectUrl)
  }

  // Get user role from profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  const userRole = profile?.role || 'student'

  // Role-based access control
  if (path.startsWith('/admin/') || path === '/admin') {
    if (userRole !== 'admin') {
      // Redirect to appropriate dashboard based on role
      const redirectPath = userRole === 'teacher' ? '/teacher' : '/app'
      return NextResponse.redirect(new URL(`${redirectPath}?error=unauthorized`, request.url))
    }
  }

  if (path.startsWith('/teacher/') || path === '/teacher') {
    if (userRole !== 'teacher' && userRole !== 'admin') {
      return NextResponse.redirect(new URL('/app?error=unauthorized', request.url))
    }
  }

  // /app/* routes require any authenticated user (already checked above)

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
