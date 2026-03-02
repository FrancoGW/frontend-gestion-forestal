"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: ("admin" | "subgerente" | "supervisor" | "provider" | "jda")[]
  redirectTo?: string
}

export function ProtectedRoute({ children, allowedRoles = [], redirectTo = "/login" }: ProtectedRouteProps) {
  const { user, isAuthenticated, loading } = useAuth()
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    if (loading) return

    console.log("🔐 Verificando acceso protegido...")
    console.log("Usuario:", user)
    console.log("Autenticado:", isAuthenticated)
    console.log("Roles permitidos:", allowedRoles)

    if (!isAuthenticated || !user) {
      console.log("❌ Usuario no autenticado, redirigiendo a login")
      router.push(redirectTo)
      return
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(user.rol)) {
      console.log(`❌ Usuario con rol "${user.rol}" no autorizado para roles: ${allowedRoles.join(", ")}`)
      // Redirigir según el rol del usuario
      switch (user.rol) {
        case "admin":
          router.push("/admin")
          break
        case "subgerente":
          router.push("/subgerente")
          break
        case "supervisor":
          router.push("/supervisor")
          break
        case "provider":
          router.push("/proveedor")
          break
        case "jda":
          router.push("/jda")
          break
        default:
          router.push("/login")
      }
      return
    }

    console.log("✅ Usuario autorizado")
    setIsAuthorized(true)
  }, [user, isAuthenticated, loading, allowedRoles, router, redirectTo])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p>Verificando autenticación...</p>
        </div>
      </div>
    )
  }

  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p>Verificando permisos...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
