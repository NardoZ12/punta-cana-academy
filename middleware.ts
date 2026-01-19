import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({ request })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({ request })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Proteger rutas del dashboard
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    if (!user) {
      const redirectUrl = new URL('/login', request.url)
      return NextResponse.redirect(redirectUrl)
    }

    // Obtener el tipo de usuario para redirigir correctamente
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', user.id)
        .single()

      const userType = profile?.user_type || 'student'
      const currentPath = request.nextUrl.pathname

      // Redirigir estudiantes que intentan acceder al dashboard de profesores
      if (currentPath.startsWith('/dashboard/teacher') && userType !== 'teacher') {
        const redirectUrl = new URL('/dashboard/student', request.url)
        return NextResponse.redirect(redirectUrl)
      }

      // Redirigir profesores que intentan acceder al dashboard de estudiantes
      if (currentPath.startsWith('/dashboard/student') && userType !== 'student') {
        const redirectUrl = new URL('/dashboard/teacher', request.url)
        return NextResponse.redirect(redirectUrl)
      }
    }
  }

  // Redirigir usuarios autenticados que van a login/registro a su dashboard correspondiente
  if (['/login', '/registro'].includes(request.nextUrl.pathname) && user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', user.id)
      .single()

    const userType = profile?.user_type || 'student'
    const redirectUrl = new URL(`/dashboard/${userType}`, request.url)
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}