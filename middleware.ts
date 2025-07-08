import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Obtener la ruta actual
  const path = request.nextUrl.pathname

  // Rutas públicas que no requieren autenticación
  const publicRoutes = ["/login", "/", "/api"]
  
  // Verificar si es una ruta pública
  const isPublicRoute = publicRoutes.some(route => path.startsWith(route))
  
  if (isPublicRoute) {
    return NextResponse.next()
  }

  // Rutas privadas que requieren autenticación
  const privateRoutes = ["/admin", "/supervisor", "/proveedor"]
  const isPrivateRoute = privateRoutes.some(route => path.startsWith(route))

  if (isPrivateRoute) {
    // En una implementación real, verificarías una cookie de sesión o token JWT aquí
    // Por ahora, permitimos el acceso y la verificación se hace en el cliente
    // Esto es porque sessionStorage no está disponible en el middleware
    
    // TODO: Implementar verificación de cookies de sesión cuando se implemente
    // const sessionToken = request.cookies.get("session-token")
    // if (!sessionToken) {
    //   return NextResponse.redirect(new URL("/login", request.url))
    // }
    
    return NextResponse.next()
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
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}
