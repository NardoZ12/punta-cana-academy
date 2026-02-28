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

  // 1. Obtener el usuario (Solo lee cookies, no hace consultas SQL)
  const { data: { user } } = await supabase.auth.getUser()
  const currentPath = request.nextUrl.pathname

  // 2. Proteger rutas del dashboard (Solo verificar que esté logueado)
  if (currentPath.startsWith('/dashboard')) {
    if (!user) {
      const redirectUrl = new URL('/login', request.url)
      return NextResponse.redirect(redirectUrl)
    }
    // Borramos toda la lógica de buscar en "profiles" desde aquí.
    // Esa responsabilidad se la dejamos a las páginas Server Components
  }

  // 3. Redirigir usuarios autenticados que van a login/registro
  if (['/login', '/registro'].includes(currentPath) && user) {
    const redirectUrl = new URL('/dashboard', request.url)
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}