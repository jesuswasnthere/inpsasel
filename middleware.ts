import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Reemplaza requireAuth + isPublicRequest de Express.
 * Protege todas las rutas excepto /login.
 * Refresca la sesión de Supabase en cada request para evitar expiraciones.
 */
export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
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

  // IMPORTANTE: no usar getSession() aquí — puede ser falseado.
  // getUser() hace una validación contra el servidor de Supabase.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const isLoginPage = pathname === '/login'

  // Sin sesión y no es la página de login → redirigir a /login
  if (!user && !isLoginPage) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Con sesión activa en /login → redirigir a /menu
  if (user && isLoginPage) {
    const menuUrl = request.nextUrl.clone()
    menuUrl.pathname = '/menu'
    menuUrl.searchParams.delete('next')
    return NextResponse.redirect(menuUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Aplica a todas las rutas EXCEPTO:
     * - _next/static (assets estáticos de Next.js)
     * - _next/image (optimización de imágenes)
     * - favicon.ico
     * - Archivos de imagen (png, jpg, svg, etc.)
     */
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
