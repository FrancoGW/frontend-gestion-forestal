"use client"

import type React from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState, useEffect } from "react"
import { SupervisorSidebar } from "@/components/supervisor/supervisor-sidebar"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"

export default function SupervisorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [queryClient] = useState(() => new QueryClient())
  const { user, loading, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    console.log("🔍 SupervisorLayout - Verificando autenticación...")
    console.log("loading:", loading)
    console.log("isAuthenticated:", isAuthenticated)
    console.log("user:", user)

    if (!loading) {
      if (!isAuthenticated || !user) {
        console.log("❌ Usuario no autenticado, redirigiendo a login...")
        router.push("/login")
        return
      }

      if (user.rol !== "supervisor") {
        console.log("❌ Usuario no es supervisor, redirigiendo según rol...")
        switch (user.rol) {
          case "admin":
            router.push("/admin")
            break
          case "provider":
            router.push("/proveedor")
            break
          default:
            router.push("/login")
        }
        return
      }

      console.log("✅ Usuario supervisor autenticado correctamente")
    }
  }, [user, loading, isAuthenticated, router])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <div className="text-lg">Cargando...</div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !user || user.rol !== "supervisor") {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="text-lg">Verificando acceso...</div>
        </div>
      </div>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex h-screen bg-gray-50">
        <SupervisorSidebar />
        <main className="flex-1 ml-64 overflow-auto">
          <div className="p-6">{children}</div>
        </main>
      </div>
    </QueryClientProvider>
  )
}
