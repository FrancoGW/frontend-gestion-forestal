"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useSupervisorWorkOrders } from "@/hooks/use-supervisor-work-orders"
import { AlertCircle, FileSpreadsheet, Search, RefreshCcw, X, Hash } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAuth } from "@/hooks/use-auth"

export default function SupervisorOrdersPage() {
  const { user } = useAuth()
  const {
    workOrders,
    allWorkOrders,
    loading,
    error,
    backendStatus,
    pagination,
    searchQuery,
    isSearching,
    filterById,
    retryConnection,
    performSearch,
    clearSearch,
    filterByOrderId,
    clearIdFilter,
  } = useSupervisorWorkOrders()

  const [localSearchQuery, setLocalSearchQuery] = useState("")
  const [localIdFilter, setLocalIdFilter] = useState("")

  // Manejar la búsqueda general
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    performSearch(localSearchQuery)
  }

  // Manejar la búsqueda por ID EXACTO
  const handleIdFilter = (e: React.FormEvent) => {
    e.preventDefault()
    if (localIdFilter.trim()) {
      filterByOrderId(localIdFilter.trim())
    }
  }

  // Manejar cambio en el input de búsqueda
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setLocalSearchQuery(value)

    if (!value.trim()) {
      clearSearch()
    }
  }

  // Manejar cambio en el filtro por ID
  const handleIdFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setLocalIdFilter(value)

    if (!value.trim()) {
      clearIdFilter()
    }
  }

  // Función para obtener el color del badge según el estado
  const getStatusBadge = (estado: number | undefined, estadoNombre: string | undefined) => {
    if (estado === 0) return <Badge variant="secondary">Pendiente</Badge>
    if (estado === 1)
      return (
        <Badge variant="default" className="bg-blue-500">
          En Ejecución
        </Badge>
      )
    if (estado === 2)
      return (
        <Badge variant="default" className="bg-green-500">
          Ejecutada
        </Badge>
      )
    if (estado === 3) return <Badge variant="destructive">Cancelada</Badge>
    if (estado === -1) return <Badge variant="destructive">Anulada</Badge>
    return <Badge variant="outline">{estadoNombre || "Sin estado"}</Badge>
  }

  // Renderizar el estado de carga
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">
            <Skeleton className="h-9 w-64" />
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(6)
            .fill(0)
            .map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <CardHeader className="p-4">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      </div>
    )
  }

  // Renderizar el estado de error
  if (error || (backendStatus && !backendStatus.available)) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Mis Órdenes de Trabajo</h1>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error || backendStatus?.message || "No se pudo conectar con el servidor."}
          </AlertDescription>
        </Alert>

        <div className="flex justify-center">
          <Button onClick={retryConnection} className="flex items-center gap-2">
            <RefreshCcw className="h-4 w-4" />
            Reintentar conexión
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center h-full p-10">
      <h1 className="text-3xl font-bold mb-4">Órdenes de Trabajo</h1>
      <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 rounded px-6 py-4 text-lg font-semibold shadow">
        Estamos trabajando en esta vista.
      </div>
    </div>
  )
}
