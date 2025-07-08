"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Users,
  Building2,
  FileText,
  ChevronDown,
  ChevronUp,
  Search,
  User,
  TrendingUp,
  Clock,
  CheckCircle,
  Filter,
} from "lucide-react"
import { useSupervisors } from "@/hooks/use-supervisors"

export default function SupervisoresPage() {
  const { supervisors, totalSupervisors, totalProviders, totalOrders, loading, error } = useSupervisors()

  const [searchTerm, setSearchTerm] = useState("")
  const [expandedSupervisors, setExpandedSupervisors] = useState<Set<string>>(new Set())
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("name")

  const filteredSupervisors = supervisors
    .filter((supervisor) => {
      const matchesSearch =
        supervisor.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supervisor.proveedores.some((provider) => provider.nombre.toLowerCase().includes(searchTerm.toLowerCase()))

      if (!matchesSearch) return false

      if (statusFilter === "all") return true
      if (statusFilter === "active")
        return supervisor.estadisticas.ordenesPendientes + supervisor.estadisticas.ordenesEnEjecucion > 0
      if (statusFilter === "completed") return supervisor.estadisticas.ordenesEjecutadas > 0
      if (statusFilter === "no-orders") return supervisor.estadisticas.totalOrdenes === 0

      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.nombre.localeCompare(b.nombre)
        case "orders-desc":
          return b.estadisticas.totalOrdenes - a.estadisticas.totalOrdenes
        case "orders-asc":
          return a.estadisticas.totalOrdenes - b.estadisticas.totalOrdenes
        case "providers-desc":
          return b.estadisticas.totalProveedores - a.estadisticas.totalProveedores
        default:
          return 0
      }
    })

  const toggleAllSupervisors = () => {
    if (expandedSupervisors.size > 0) {
      // Si hay alguno expandido, contraer todos
      setExpandedSupervisors(new Set())
    } else {
      // Si no hay ninguno expandido, expandir todos
      const allIds = new Set(filteredSupervisors.map((s) => s.id))
      setExpandedSupervisors(allIds)
    }
  }

  const toggleSupervisor = (supervisorId: string) => {
    const newExpanded = new Set(expandedSupervisors)
    if (newExpanded.has(supervisorId)) {
      newExpanded.delete(supervisorId)
    } else {
      newExpanded.add(supervisorId)
    }
    setExpandedSupervisors(newExpanded)
  }

  const getFilterText = (value: string) => {
    switch (value) {
      case "all":
        return "Todos"
      case "active":
        return "Con órdenes activas"
      case "completed":
        return "Con órdenes completadas"
      case "no-orders":
        return "Sin órdenes"
      default:
        return "Todos"
    }
  }

  const getSortText = (value: string) => {
    switch (value) {
      case "name":
        return "Nombre A-Z"
      case "orders-desc":
        return "Más órdenes"
      case "orders-asc":
        return "Menos órdenes"
      case "providers-desc":
        return "Más proveedores"
      default:
        return "Nombre A-Z"
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Supervisores</h1>
          <p className="text-muted-foreground">Lista de supervisores y sus proveedores asignados</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Supervisores</h1>
          <p className="text-muted-foreground">Lista de supervisores y sus proveedores asignados</p>
        </div>

        <Card className="bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">Error al cargar los datos: {error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Supervisores</h1>
          <p className="text-muted-foreground">Lista de supervisores y sus proveedores asignados</p>
        </div>
      </div>

      {/* Estadísticas generales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Supervisores</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSupervisors}</div>
            <p className="text-xs text-muted-foreground">Supervisores activos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Proveedores</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProviders}</div>
            <p className="text-xs text-muted-foreground">Empresas proveedoras</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Órdenes</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <p className="text-xs text-muted-foreground">Órdenes de trabajo</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Promedio por Supervisor</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalSupervisors > 0 ? Math.round(totalOrders / totalSupervisors) : 0}
            </div>
            <p className="text-xs text-muted-foreground">Órdenes por supervisor</p>
          </CardContent>
        </Card>
      </div>

      {/* Controles y filtros */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar supervisor o proveedor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue>{getFilterText(statusFilter)}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Con órdenes activas</SelectItem>
              <SelectItem value="completed">Con órdenes completadas</SelectItem>
              <SelectItem value="no-orders">Sin órdenes</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue>{getSortText(sortBy)}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Nombre A-Z</SelectItem>
              <SelectItem value="orders-desc">Más órdenes</SelectItem>
              <SelectItem value="orders-asc">Menos órdenes</SelectItem>
              <SelectItem value="providers-desc">Más proveedores</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={toggleAllSupervisors}>
            {expandedSupervisors.size > 0 ? (
              <>
                <ChevronUp className="h-4 w-4 mr-2" />
                Contraer Todos
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-2" />
                Expandir Todos
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Lista de supervisores */}
      {filteredSupervisors.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              {searchTerm || statusFilter !== "all"
                ? "No se encontraron supervisores que coincidan con los filtros aplicados."
                : "No se encontraron supervisores en las órdenes de trabajo."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredSupervisors.map((supervisor) => {
            const isExpanded = expandedSupervisors.has(supervisor.id)

            return (
              <Card key={supervisor.id}>
                <CardHeader
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => toggleSupervisor(supervisor.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-blue-600" />
                      <div>
                        <CardTitle className="text-lg">{supervisor.nombre}</CardTitle>
                        <CardDescription>
                          {supervisor.proveedores.length} proveedor(es) • {supervisor.estadisticas.totalOrdenes}{" "}
                          orden(es)
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <Badge variant="outline" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          {supervisor.estadisticas.ordenesPendientes + supervisor.estadisticas.ordenesEnEjecucion}{" "}
                          activas
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          {supervisor.estadisticas.ordenesEjecutadas} ejecutadas
                        </Badge>
                      </div>
                      <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="pt-0">
                    <div className="space-y-4">
                      {/* Estadísticas del supervisor */}
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-4 bg-muted/30 rounded-lg">
                        <div className="text-center">
                          <div className="text-lg font-semibold text-blue-600">
                            {supervisor.estadisticas.ordenesPendientes}
                          </div>
                          <div className="text-xs text-muted-foreground">Pendientes</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-orange-600">
                            {supervisor.estadisticas.ordenesEnEjecucion}
                          </div>
                          <div className="text-xs text-muted-foreground">En Ejecución</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-green-600">
                            {supervisor.estadisticas.ordenesEjecutadas}
                          </div>
                          <div className="text-xs text-muted-foreground">Ejecutadas</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-red-600">
                            {supervisor.estadisticas.ordenesAnuladas}
                          </div>
                          <div className="text-xs text-muted-foreground">Anuladas</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold">{supervisor.estadisticas.totalOrdenes}</div>
                          <div className="text-xs text-muted-foreground">Total</div>
                        </div>
                      </div>

                      {/* Lista de proveedores */}
                      <div>
                        <h4 className="font-medium mb-3">Proveedores Asignados</h4>
                        <div className="grid gap-3 md:grid-cols-2">
                          {supervisor.proveedores.map((proveedor) => (
                            <div key={proveedor.codigo} className="border rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Building2 className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium text-sm">{proveedor.nombre}</span>
                                </div>
                                <Badge variant="secondary" className="text-xs">
                                  #{proveedor.codigo}
                                </Badge>
                              </div>

                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Pendientes:</span>
                                  <span className="font-medium text-blue-600">{proveedor.ordenes.pendientes}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">En Ejecución:</span>
                                  <span className="font-medium text-orange-600">{proveedor.ordenes.enEjecucion}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Ejecutadas:</span>
                                  <span className="font-medium text-green-600">{proveedor.ordenes.ejecutadas}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Total:</span>
                                  <span className="font-medium">{proveedor.ordenes.total}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
