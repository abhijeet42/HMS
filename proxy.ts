import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // If not authenticated and trying to access a protected route, redirect to login
  if (!user && !pathname.startsWith('/login') && !pathname.startsWith('/forgot-password') && !pathname.startsWith('/reset-password') && pathname !== '/') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // If authenticated, get the user role from profiles
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role

    // If user has no profile or invalid role, redirect to login (or sign out) to prevent infinite redirect loops
    if (role !== 'admin' && role !== 'student') {
      const response = NextResponse.redirect(new URL('/login?error=no-profile', request.url))
      return response
    }

    // Redirect root to appropriate dashboard
    if (pathname === '/' || pathname === '/login') {
      if (role === 'admin') {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url))
      } else if (role === 'student') {
        return NextResponse.redirect(new URL('/student/dashboard', request.url))
      }
    }

    // Protect admin routes from students
    if (pathname.startsWith('/admin') && role !== 'admin') {
      return NextResponse.redirect(new URL('/student/dashboard', request.url))
    }

    // Protect student routes from admin (admin has all access, so only restrict if needed)
    if (pathname.startsWith('/student') && role !== 'student' && role !== 'admin') {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public files (manifest, icons, sw.js etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|icons|sw.js|.*\\.png$|.*\\.svg$).*)',
  ],
}
