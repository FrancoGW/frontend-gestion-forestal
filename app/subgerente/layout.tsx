"use client"

import type React from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState, useEffect } from "react"
import { SubgerenteSidebar } from "@/components/subgerente/subgerente-sidebar"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"

export default function SubgerenteLayout({
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
      if (user.rol !== "subgerente") {
        switch (user.rol) {
          case "admin":
            router.push("/admin")
            break
          case "provider":
            router.push("/proveedor")
            break
          case "supervisor":
          case "jda":
            router.push("/jda")
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <div className="text-lg">Cargando...</div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !user || user.rol !== "subgerente") {
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
        <SubgerenteSidebar />
        <main className="flex-1 ml-64 overflow-auto">
          <div className="p-6">{children}</div>
        </main>
      </div>
    </QueryClientProvider>
  )
}
