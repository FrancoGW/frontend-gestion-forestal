"use client"

import type React from "react"
import { useAuth } from "@/hooks/use-auth"
import { ProviderSidebar } from "@/components/provider/provider-sidebar"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function ProviderLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    console.log("🔍 ProviderLayout - Verificando autenticación...")
    console.log("loading:", loading)
    console.log("isAuthenticated:", isAuthenticated)
    console.log("user:", user)

    if (!loading) {
      if (!isAuthenticated || !user) {
        console.log("❌ Usuario no autenticado, redirigiendo a login...")
        router.push("/login")
        return
      }

      if (user.rol !== "provider") {
        console.log("❌ Usuario no es proveedor, redirigiendo según rol...")
        switch (user.rol) {
          case "admin":
            router.push("/admin")
            break
          case "supervisor":
            router.push("/supervisor")
            break
          default:
            router.push("/login")
        }
        return
      }

      console.log("✅ Usuario proveedor autenticado correctamente")
    }
  }, [user, loading, isAuthenticated, router])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <div className="text-lg">Cargando...</div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !user || user.rol !== "provider") {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="text-lg">Verificando acceso...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen">
      <ProviderSidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
