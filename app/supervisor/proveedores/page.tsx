"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Users, Search, Phone, Mail, Building2, AlertCircle, RefreshCw, FileText, TrendingUp } from "lucide-react"
import { useSupervisorData } from "@/hooks/use-supervisor-data"
import { useAuth } from "@/hooks/use-auth"
import Link from "next/link"

export default function SupervisorProveedoresPage() {
  const { user } = useAuth()
  const { supervisor, proveedores, ordenes, avances, loading, error, refetch } = useSupervisorData()

  // Estados de filtros
  const [searchTerm, setSearchTerm] = useState("")

  // Procesar datos de proveedores con información básica
  const proveedoresConInfo = useMemo(() => {
    return proveedores.map((proveedor) => {
      // Órdenes del proveedor
      const ordenesProveedor = ordenes.filter((orden) => orden.proveedorId === proveedor.id)

      // Avances del proveedor
      const avancesProveedor = avances.filter((avance) => {
        const orden = ordenes.find((o) => o.id === avance.ordenTrabajoId)
        return orden?.proveedorId === proveedor.id
      })

      // Estado básico
      const tieneAvances = avancesProveedor.length > 0
      const tieneOrdenes = ordenesProveedor.length > 0

      return {
        ...proveedor,
        tieneAvances,
        tieneOrdenes,
      }
    })
  }, [proveedores, ordenes, avances])

  // Filtrar proveedores
  const proveedoresFiltrados = useMemo(() => {
    return proveedoresConInfo.filter((proveedor) => {
      if (!searchTerm) return true

      const searchLower = searchTerm.toLowerCase()
      return (
        proveedor.nombre.toLowerCase().includes(searchLower) ||
        proveedor.razonSocial?.toLowerCase().includes(searchLower) ||
        proveedor.cuit?.toLowerCase().includes(searchLower) ||
        proveedor.email?.toLowerCase().includes(searchLower)
      )
    })
  }, [proveedoresConInfo, searchTerm])

  // Estadísticas básicas para el header
  const estadisticasBasicas = useMemo(() => {
    const totalProveedores = proveedoresFiltrados.length
    const proveedoresActivos = proveedoresFiltrados.filter((p) => p.tieneAvances).length

    return {
      totalProveedores,
      proveedoresActivos,
    }
  }, [proveedoresFiltrados])

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Mis Proveedores</h1>
          <p className="text-muted-foreground">
            Supervisor: {supervisor?.nombre || user?.nombre || "PIZZINI"} | Gestión y seguimiento de proveedores
            asignados
          </p>
        </div>
        <Button onClick={refetch} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
      </div>

      {/* Estadísticas Básicas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Proveedores</p>
                <p className="text-2xl font-bold">{estadisticasBasicas.totalProveedores}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Activos</p>
                <p className="text-2xl font-bold">{estadisticasBasicas.proveedoresActivos}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Buscar Proveedores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Búsqueda</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  type="search"
                  placeholder="Buscar por nombre, razón social, CUIT o email..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="mt-4 text-sm text-muted-foreground">
            Mostrando {proveedoresFiltrados.length} de {proveedoresConInfo.length} proveedores
            {searchTerm && " (filtrado)"}
          </div>
        </CardContent>
      </Card>

      {/* Lista de Proveedores */}
      <div className="space-y-4">
        {proveedoresFiltrados.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No se encontraron proveedores</h3>
              <p className="text-muted-foreground">
                {proveedoresConInfo.length === 0
                  ? "No hay proveedores asignados"
                  : "Intenta ajustar los filtros de búsqueda"}
              </p>
            </CardContent>
          </Card>
        ) : (
          proveedoresFiltrados.map((proveedor) => (
            <Card key={proveedor.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{proveedor.nombre}</CardTitle>
                    <CardDescription className="flex items-center gap-4 mt-1">
                      {proveedor.razonSocial && (
                        <span className="flex items-center gap-1">
                          <Building2 className="h-4 w-4" />
                          {proveedor.razonSocial}
                        </span>
                      )}
                      {proveedor.cuit && <span>CUIT: {proveedor.cuit}</span>}
                    </CardDescription>
                  </div>

                  <div className="flex gap-2">
                    <Badge
                      variant={proveedor.tieneAvances ? "default" : "secondary"}
                      className={proveedor.tieneAvances ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"}
                    >
                      {proveedor.tieneAvances ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                {/* Información de contacto */}
                {(proveedor.telefono || proveedor.email) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {proveedor.telefono && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{proveedor.telefono}</span>
                      </div>
                    )}
                    {proveedor.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{proveedor.email}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Enlaces */}
                <div className="flex justify-end gap-2">
                  <Link href="/supervisor/ordenes">
                    <Button variant="outline" size="sm">
                      <FileText className="h-4 w-4 mr-1" />
                      Ver Órdenes
                    </Button>
                  </Link>
                  <Link href="/supervisor/avances">
                    <Button variant="outline" size="sm">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      Ver Avances
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
