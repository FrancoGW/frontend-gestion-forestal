"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

export default function ProviderDashboard() {
  const router = useRouter()
  const { user, isAuthenticated, loading } = useAuth()

  // Redirigir al login si no hay usuario autenticado
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login")
    }
  }, [loading, isAuthenticated, router])

  // Mostrar pantalla de carga mientras se verifica la autenticación
  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-1/3" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-2/3" />
          </CardContent>
        </Card>
      </div>
    )
  }

  // Si no hay usuario autenticado, no mostrar nada (se redirigirá)
  if (!isAuthenticated || !user) {
    return null
  }

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Panel de Control del Proveedor</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            Bienvenido, <strong>{user.nombre}</strong>. Desde aquí puedes gestionar tus órdenes de trabajo y reportes.
          </p>
          <div className="grid grid-cols-1 gap-4">
            <Button onClick={() => router.push("/proveedor/ordenes")} className="w-full">
              Ver Órdenes de Trabajo
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
