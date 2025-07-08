"use client"

import type React from "react"
import { AdminSidebar } from "@/components/admin-sidebar"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [queryClient] = useState(() => new QueryClient())
  const { user, loading, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
   

    if (!loading) {
      if (!isAuthenticated || !user) {
        router.push("/login")
        return
      }

      if (user.rol !== "admin") {
        switch (user.rol) {
          case "provider":
            router.push("/proveedor")
            break
          case "supervisor":
            router.push("/supervisor")
            break
          default:
            router.push("/login")
        }
        return
      }

      }
  }, [user, loading, isAuthenticated, router])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-lg">Cargando...</div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !user || user.rol !== "admin") {
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
      <AdminSidebar>{children}</AdminSidebar>
    </QueryClientProvider>
  )
}
