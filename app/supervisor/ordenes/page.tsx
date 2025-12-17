"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { PageLoader } from "@/components/ui/page-loader"
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
        <PageLoader message="Cargando órdenes..." submessage="Obteniendo tus órdenes de trabajo" />
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mis Órdenes de Trabajo</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Usuario: {user?.name || user?.email || "No identificado"}
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          {filterById && `Filtrando por ID: ${filterById}`}
          {isSearching && `Búsqueda: "${searchQuery}"`}
          {!filterById && !isSearching && `Total: ${pagination.totalItems} órdenes`}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {/* Filtro por ID EXACTO */}
        <form onSubmit={handleIdFilter} className="flex gap-2">
          <div className="relative flex-1">
            <Input
              placeholder="Buscar por ID exacto (ej: 22)..."
              value={localIdFilter}
              onChange={handleIdFilterChange}
              className="pr-10"
            />
            <Hash className="h-4 w-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          </div>
          <Button type="submit" disabled={!localIdFilter.trim()}>
            Filtrar por ID
          </Button>
          {filterById && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setLocalIdFilter("")
                clearIdFilter()
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </form>

        {/* Búsqueda general */}
        {!filterById && (
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Input
                placeholder="Buscar en mis órdenes..."
                value={localSearchQuery}
                onChange={handleSearchChange}
                className="pr-10"
              />
              <Search className="h-4 w-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            </div>
            <Button type="submit" disabled={!localSearchQuery.trim()}>
              Buscar
            </Button>
            {isSearching && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setLocalSearchQuery("")
                  clearSearch()
                }}
              >
                Limpiar
              </Button>
            )}
          </form>
        )}
      </div>

      {workOrders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileSpreadsheet className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              {filterById
                ? `No se encontró ninguna orden con ID exacto "${filterById}"`
                : isSearching
                  ? `No se encontraron órdenes que coincidan con "${searchQuery}"`
                  : "No tienes órdenes de trabajo asignadas."}
            </p>
            {(filterById || isSearching) && (
              <Button
                variant="link"
                onClick={() => {
                  setLocalSearchQuery("")
                  setLocalIdFilter("")
                  clearSearch()
                  clearIdFilter()
                }}
              >
                Ver todas mis órdenes
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Actividad</TableHead>
                  <TableHead>Campo</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Hectáreas</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.id}</TableCell>
                    <TableCell>{order.actividad}</TableCell>
                    <TableCell>{order.campo}</TableCell>
                    <TableCell>{order.empresa || "Sin empresa"}</TableCell>
                    <TableCell>{order.fecha}</TableCell>
                    <TableCell>{order.cantidad}</TableCell>
                    <TableCell>{getStatusBadge(order.estado, order.estado_nombre)}</TableCell>
                    <TableCell>
                      <Link href={`/supervisor/ordenes/${order.id}`}>
                        <Button variant="outline" size="sm">
                          Ver detalles
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {/* Debug info mejorada */}
      <div className="text-xs text-muted-foreground bg-muted p-3 rounded space-y-1">
        <div>
          <strong>Debug Info:</strong>
        </div>
        <div>• Total órdenes en API (todas las páginas): {allWorkOrders.length}</div>
        <div>• Órdenes filtradas por supervisor: {pagination.totalItems}</div>
        <div>• Órdenes mostradas: {workOrders.length}</div>
        <div>
          • Usuario: {user?.email} (ID: {user?.id})
        </div>
        <div>
          • Supervisor ID mapeado:{" "}
          {user?.email
            ? user.email.toLowerCase() in
              {
                "cecilia.pizzini@supervisor.com": 44,
                "alejandro.wayer@supervisor.com": 21,
                "diego.nonino@supervisor.com": 56,
                "beatriz.reitano@supervisor.com": 39,
                "carlos.bardelli@supervisor.com": 65,
                "armando.gamboa@supervisor.com": 49,
                "gabriel.cardozo@supervisor.com": 36,
                "gonzalo.alvarez@supervisor.com": 47,
                "helian.lytwyn@supervisor.com": 45,
                "luis.arriola@supervisor.com": 42,
                "martin.spriegel@supervisor.com": 33,
                "martin.alvarez@supervisor.com": 50,
                "paula.montenegro@supervisor.com": 38,
                "santiago.gouin@supervisor.com": 52,
                "ulises.cosoli@supervisor.com": 43,
                "fernando.doval@supervisor.com": 51,
                "javier.avendano@supervisor.com": 53,
                "fabio.cancian@supervisor.com": 69,
              }
              ? {
                  "cecilia.pizzini@supervisor.com": 44,
                  "alejandro.wayer@supervisor.com": 21,
                  "diego.nonino@supervisor.com": 56,
                  "beatriz.reitano@supervisor.com": 39,
                  "carlos.bardelli@supervisor.com": 65,
                  "armando.gamboa@supervisor.com": 49,
                  "gabriel.cardozo@supervisor.com": 36,
                  "gonzalo.alvarez@supervisor.com": 47,
                  "helian.lytwyn@supervisor.com": 45,
                  "luis.arriola@supervisor.com": 42,
                  "martin.spriegel@supervisor.com": 33,
                  "martin.alvarez@supervisor.com": 50,
                  "paula.montenegro@supervisor.com": 38,
                  "santiago.gouin@supervisor.com": 52,
                  "ulises.cosoli@supervisor.com": 43,
                  "fernando.doval@supervisor.com": 51,
                  "javier.avendano@supervisor.com": 53,
                  "fabio.cancian@supervisor.com": 69,
                }[user.email.toLowerCase()]
              : "No mapeado"
            : "Sin email"}
        </div>
        <div>
          • Filtro activo:{" "}
          {filterById ? `ID exacto: ${filterById}` : isSearching ? `Búsqueda: ${searchQuery}` : "Supervisor"}
        </div>
        <div>• Búsqueda por ID: {filterById ? "EXACTA (===)" : "No activa"}</div>
      </div>
    </div>
  )
}
