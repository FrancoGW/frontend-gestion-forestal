"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  ChevronDown,
  ChevronRight,
  Calendar,
  Users,
  MapPin,
  Leaf,
  AlertCircle,
  Search,
  Filter,
  Eye,
  EyeOff,
  BarChart3,
  TrendingUp,
  CheckCircle2,
  Clock3,
  X,
  RefreshCw,
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useAuth } from "@/hooks/use-auth"
import { useSupervisorData } from "@/hooks/use-supervisor-data"

// Interfaces
interface AvanceDetallado {
  id: string
  ordenId: number
  numeroOrden: string
  fecha: string
  fechaRegistro: string
  superficie: number
  cantidadPlantas: number
  cuadrilla: string
  cuadrillaNombre?: string
  cantPersonal: number
  jornada: number
  observaciones?: string
  usuario?: string
  predio?: string
  rodal?: string
  actividad?: string
  especie?: string
  estado: string
  proveedorId: number
  proveedorNombre?: string
}

interface OrdenConAvances {
  id: number
  numero: string
  actividad: string
  campo: string
  proveedor: string
  proveedorId: number
  estado: string
  superficieTotal: number
  avances: AvanceDetallado[]
  superficieTrabajada: number
  porcentajeCompletado: number
  ultimoAvance?: string
  diasTrabajados: number
}

// Función para capitalizar texto
const capitalizeText = (text: string | null | undefined): string => {
  if (!text) return "Sin especificar"
  return String(text).charAt(0).toUpperCase() + String(text).slice(1).toLowerCase()
}

// Función para formatear fechas
const formatDateArgentina = (dateString: string): string => {
  try {
    if (dateString.includes("/")) return dateString
    if (dateString.includes("-")) {
      const parts = dateString.split("T")[0].split("-")
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`
      }
    }
    const date = new Date(dateString + "T00:00:00")
    if (isNaN(date.getTime())) return dateString
    return format(date, "dd/MM/yyyy", { locale: es })
  } catch (error) {
    return dateString
  }
}

// Función para formatear fecha y hora
const formatDateTimeArgentina = (dateString: string): string => {
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return dateString
    return format(date, "dd/MM/yyyy HH:mm", { locale: es })
  } catch (error) {
    return dateString
  }
}

// Función para generar ID corto
const generateShortId = (objectId: string): string => {
  if (!objectId || objectId.length < 8) return objectId
  const shortHex = objectId.slice(-8)
  const decimal = Number.parseInt(shortHex, 16)
  const base36 = decimal.toString(36).toUpperCase()
  return `AV-${base36}`
}

export default function SupervisorAvancesPage() {
  const { user } = useAuth()
  const { supervisor, proveedores, ordenes, avances, loading, error, refetch } = useSupervisorData()

  // Estados de filtros
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedProveedor, setSelectedProveedor] = useState<string>("all")
  const [selectedEstado, setSelectedEstado] = useState<string>("all")
  const [selectedActividad, setSelectedActividad] = useState<string>("all")
  const [dateFrom, setDateFrom] = useState<string>("")
  const [dateTo, setDateTo] = useState<string>("")

  // Estados de UI
  const [expandedOrders, setExpandedOrders] = useState<Set<number>>(new Set())
  const [showAllExpanded, setShowAllExpanded] = useState(false)

  // Procesar datos para crear órdenes con avances
  const ordenesConAvances = useMemo(() => {
    if (ordenes.length === 0) {
      return []
    }

    // Crear mapa de órdenes
    const ordenesMap = new Map<number, OrdenConAvances>()

    // Inicializar todas las órdenes
    ordenes.forEach((orden) => {
      ordenesMap.set(orden.id, {
        id: orden.id,
        numero: orden.numero,
        actividad: orden.actividad,
        campo: orden.campo,
        proveedor: orden.proveedor,
        proveedorId: orden.proveedorId,
        estado: orden.estado,
        superficieTotal: orden.superficie || 0,
        avances: [],
        superficieTrabajada: 0,
        porcentajeCompletado: 0,
        diasTrabajados: 0,
      })
    })

    // Agregar avances a las órdenes correspondientes
    avances.forEach((avance) => {
      const orden = ordenesMap.get(avance.ordenTrabajoId)
      if (orden) {
        console.log('Avance:', avance, 'Orden:', orden);
        const avanceDetallado: AvanceDetallado = {
          id: avance._id || avance.id || Math.random().toString(),
          ordenId: avance.ordenTrabajoId,
          numeroOrden: avance.numeroOrden || orden.numero,
          fecha: avance.fecha,
          fechaRegistro: avance.fechaRegistro || avance.createdAt || new Date().toISOString(),
          superficie: avance.superficie,
          cantidadPlantas: avance.cantidadPlantas || 0,
          cuadrilla: avance.cuadrilla,
          cuadrillaNombre: avance.cuadrillaNombre,
          cantPersonal: avance.cantPersonal,
          jornada: avance.jornada,
          observaciones: avance.observaciones,
          usuario: avance.usuario || "Sistema",
          predio: avance.predio,
          rodal: avance.rodal,
          actividad: avance.actividad,
          especie: avance.especie,
          estado: avance.estado,
          proveedorId: orden.proveedorId,
          proveedorNombre: avance.proveedorNombre || orden.proveedor,
        }

        orden.avances.push(avanceDetallado)
      }
    })

    // Calcular estadísticas para cada orden
    ordenesMap.forEach((orden) => {
      // Ordenar avances por fecha (más reciente primero)
      orden.avances.sort((a, b) => b.fecha.localeCompare(a.fecha))

      // Calcular superficie trabajada
      orden.superficieTrabajada = orden.avances.reduce((sum, avance) => sum + avance.superficie, 0)

      // Calcular porcentaje
      if (orden.superficieTotal > 0) {
        orden.porcentajeCompletado = Math.min(100, (orden.superficieTrabajada / orden.superficieTotal) * 100)
      }

      // Días trabajados (fechas únicas)
      const fechasUnicas = new Set(orden.avances.map((a) => a.fecha))
      orden.diasTrabajados = fechasUnicas.size

      // Último avance
      if (orden.avances.length > 0) {
        const ultimoAvance = orden.avances[orden.avances.length - 1]
        orden.ultimoAvance = formatDateArgentina(ultimoAvance.fecha)
      }
    })

    const resultado = Array.from(ordenesMap.values()).sort(
      (a, b) => b.diasTrabajados - a.diasTrabajados || b.avances.length - a.avances.length,
    )

    return resultado
  }, [ordenes, avances])

  // Función para expandir/contraer orden
  const toggleOrder = (orderId: number) => {
    const newExpanded = new Set(expandedOrders)
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId)
    } else {
      newExpanded.add(orderId)
    }
    setExpandedOrders(newExpanded)
  }

  // Función para expandir/contraer todas
  const toggleAllOrders = () => {
    if (showAllExpanded) {
      setExpandedOrders(new Set())
    } else {
      const allIds = new Set(filteredOrdenes.map((orden) => orden.id))
      setExpandedOrders(allIds)
    }
    setShowAllExpanded(!showAllExpanded)
  }

  // Función para limpiar filtros
  const clearFilters = () => {
    setSearchTerm("")
    setSelectedProveedor("all")
    setSelectedEstado("all")
    setSelectedActividad("all")
    setDateFrom("")
    setDateTo("")
  }

  // Filtrar órdenes
  const filteredOrdenes = useMemo(() => {
    return ordenesConAvances.filter((orden) => {
      // Filtro por búsqueda
      let matchesSearch = true
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        matchesSearch =
          orden.numero.toLowerCase().includes(searchLower) ||
          orden.actividad.toLowerCase().includes(searchLower) ||
          orden.campo.toLowerCase().includes(searchLower) ||
          orden.proveedor.toLowerCase().includes(searchLower) ||
          orden.avances.some(
            (avance) =>
              avance.observaciones?.toLowerCase().includes(searchLower) ||
              avance.cuadrilla?.toLowerCase().includes(searchLower),
          )
      }

      // Filtro por proveedor
      let matchesProveedor = true
      if (selectedProveedor !== "all") {
        matchesProveedor = orden.proveedorId === Number(selectedProveedor)
      }

      // Filtro por estado
      let matchesEstado = true
      if (selectedEstado !== "all") {
        if (selectedEstado === "con-avances") {
          matchesEstado = orden.avances.length > 0
        } else if (selectedEstado === "sin-avances") {
          matchesEstado = orden.avances.length === 0
        } else if (selectedEstado === "terminado") {
          matchesEstado = orden.avances.some((a) => a.estado === "R7 (terminado)")
        } else if (selectedEstado === "pendiente") {
          matchesEstado = orden.avances.every((a) => a.estado !== "R7 (terminado)")
        }
      }

      // Filtro por actividad
      let matchesActividad = true
      if (selectedActividad !== "all") {
        matchesActividad =
          orden.actividad.toLowerCase().includes(selectedActividad.toLowerCase()) ||
          orden.avances.some((avance) => avance.actividad?.toLowerCase().includes(selectedActividad.toLowerCase()))
      }

      // Filtro por fechas
      let matchesDateRange = true
      if (dateFrom || dateTo) {
        const hasAvancesInRange = orden.avances.some((avance) => {
          const avanceDate = new Date(avance.fecha + "T00:00:00")

          if (dateFrom && dateTo) {
            const fromDate = new Date(dateFrom + "T00:00:00")
            const toDate = new Date(dateTo + "T23:59:59")
            return avanceDate >= fromDate && avanceDate <= toDate
          } else if (dateFrom) {
            const fromDate = new Date(dateFrom + "T00:00:00")
            return avanceDate >= fromDate
          } else if (dateTo) {
            const toDate = new Date(dateTo + "T23:59:59")
            return avanceDate <= toDate
          }
          return true
        })
        matchesDateRange = hasAvancesInRange
      }

      return matchesSearch && matchesProveedor && matchesEstado && matchesActividad && matchesDateRange
    })
  }, [ordenesConAvances, searchTerm, selectedProveedor, selectedEstado, selectedActividad, dateFrom, dateTo])

  // Obtener lista única de proveedores
  const proveedoresUnicos = useMemo(() => {
    return Array.from(new Set(ordenesConAvances.map((o) => ({ id: o.proveedorId, nombre: o.proveedor })))).filter(
      (p) => p.id > 0,
    )
  }, [ordenesConAvances])

  // Obtener lista única de actividades
  const actividadesUnicas = useMemo(() => {
    const actividades = new Set<string>()
    ordenesConAvances.forEach((orden) => {
      if (orden.actividad) actividades.add(orden.actividad)
      orden.avances.forEach((avance) => {
        if (avance.actividad) actividades.add(avance.actividad)
      })
    })
    return Array.from(actividades).sort()
  }, [ordenesConAvances])

  // Calcular estadísticas generales
  const estadisticas = useMemo(() => {
    const totalOrdenes = filteredOrdenes.length
    const ordenesConAvancesCount = filteredOrdenes.filter((o) => o.avances.length > 0).length
    const totalAvances = filteredOrdenes.reduce((sum, o) => sum + o.avances.length, 0)
    const superficieTotalTrabajada = filteredOrdenes.reduce((sum, o) => sum + o.superficieTrabajada, 0)

    return {
      totalOrdenes,
      ordenesConAvancesCount,
      totalAvances,
      superficieTotalTrabajada,
    }
  }, [filteredOrdenes])

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
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
          <h1 className="text-3xl font-bold">Log Detallado de Avances</h1>
          <p className="text-muted-foreground">
            Supervisor: {supervisor?.nombre || user?.nombre || "PIZZINI"} | Seguimiento día a día del progreso
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={refetch} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
          <Button
            onClick={toggleAllOrders}
            variant="outline"
            size="sm"
            className="flex items-center gap-2 bg-transparent"
          >
            {showAllExpanded ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showAllExpanded ? "Contraer Todo" : "Expandir Todo"}
          </Button>
        </div>
      </div>

      {/* Estadísticas Generales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Órdenes</p>
                <p className="text-2xl font-bold">{estadisticas.totalOrdenes}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Con Avances</p>
                <p className="text-2xl font-bold">{estadisticas.ordenesConAvancesCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Registros</p>
                <p className="text-2xl font-bold">{estadisticas.totalAvances}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">Superficie Total</p>
                <p className="text-2xl font-bold">{estadisticas.superficieTotalTrabajada.toFixed(1)} ha</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros de Búsqueda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {/* Búsqueda */}
            <div className="space-y-2">
              <Label htmlFor="search">Búsqueda</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  type="search"
                  placeholder="Buscar..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Proveedor */}
            <div className="space-y-2">
              <Label htmlFor="proveedor">Proveedor</Label>
              <Select value={selectedProveedor} onValueChange={setSelectedProveedor}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los proveedores</SelectItem>
                  {proveedores.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>{p.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Estado */}
            <div className="space-y-2">
              <Label htmlFor="estado">Estado</Label>
              <Select value={selectedEstado} onValueChange={setSelectedEstado}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="con-avances">Con avances</SelectItem>
                  <SelectItem value="sin-avances">Sin avances</SelectItem>
                  <SelectItem value="terminado">Terminado</SelectItem>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Actividad */}
            <div className="space-y-2">
              <Label htmlFor="actividad">Actividad</Label>
              <Select value={selectedActividad} onValueChange={setSelectedActividad}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las actividades</SelectItem>
                  {actividadesUnicas.map((actividad) => (
                    <SelectItem key={actividad} value={actividad}>
                      {actividad}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Fecha Desde */}
            <div className="space-y-2">
              <Label htmlFor="date-from">Desde</Label>
              <Input id="date-from" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>

            {/* Fecha Hasta */}
            <div className="space-y-2">
              <Label htmlFor="date-to">Hasta</Label>
              <Input id="date-to" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>

            {/* Limpiar Filtros */}
            <div className="flex items-end">
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="w-full bg-transparent"
                disabled={
                  !searchTerm &&
                  selectedProveedor === "all" &&
                  selectedEstado === "all" &&
                  selectedActividad === "all" &&
                  !dateFrom &&
                  !dateTo
                }
              >
                <X className="h-4 w-4 mr-1" />
                Limpiar
              </Button>
            </div>
          </div>

          {/* Contador de resultados */}
          <div className="mt-4 text-sm text-muted-foreground">
            Mostrando {filteredOrdenes.length} de {ordenesConAvances.length} órdenes
            {(searchTerm ||
              selectedProveedor !== "all" ||
              selectedEstado !== "all" ||
              selectedActividad !== "all" ||
              dateFrom ||
              dateTo) &&
              " (filtrado)"}
          </div>
        </CardContent>
      </Card>

      {/* Lista de Órdenes con Avances */}
      <div className="space-y-4">
        {filteredOrdenes.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No se encontraron órdenes</h3>
              <p className="text-muted-foreground">
                {ordenesConAvances.length === 0
                  ? "No hay órdenes disponibles. Verifica la conexión con el backend."
                  : "Intenta ajustar los filtros de búsqueda"}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredOrdenes.map((orden) => {
            const isExpanded = expandedOrders.has(orden.id)

            return (
              <Card
                key={orden.id}
                className={`transition-all duration-200 ${
                  orden.avances.length === 0
                    ? "border-gray-200"
                    : orden.avances.some((a) => a.estado === "R7 (terminado)")
                      ? "border-green-200 bg-green-50/30"
                      : "border-blue-200 bg-blue-50/30"
                }`}
              >
                {/* Header clickeable */}
                <CardHeader
                  className="cursor-pointer hover:bg-gray-50/50 transition-colors"
                  onClick={() => toggleOrder(orden.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {isExpanded ? (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      )}

                      <div>
                        <CardTitle className="text-lg">
                          Orden #{orden.numero} - {orden.actividad}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-4 mt-1">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {orden.campo}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {orden.proveedor}
                          </span>
                          {orden.ultimoAvance && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              Último: {orden.ultimoAvance}
                            </span>
                          )}
                        </CardDescription>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Estadísticas rápidas */}
                      <div className="text-right text-sm">
                        <div className="font-medium">
                          {orden.diasTrabajados} día{orden.diasTrabajados !== 1 ? "s" : ""}
                        </div>
                        <div className="text-muted-foreground">
                          {orden.avances.length} registro{orden.avances.length !== 1 ? "s" : ""}
                        </div>
                      </div>

                      {/* Progreso */}
                      {orden.superficieTotal > 0 && (
                        <div className="w-32">
                          <div className="flex justify-between text-xs mb-1">
                            <span>{orden.superficieTrabajada.toFixed(1)} ha</span>
                            <span>{orden.porcentajeCompletado.toFixed(0)}%</span>
                          </div>
                          <Progress value={orden.porcentajeCompletado} className="h-2" />
                        </div>
                      )}

                      {/* Badge de estado */}
                      <Badge
                        variant={orden.avances.length === 0 ? "secondary" : "default"}
                        className={
                          orden.avances.length === 0
                            ? "bg-gray-100 text-gray-700"
                            : orden.avances.some((a) => a.estado === "R7 (terminado)")
                              ? "bg-green-100 text-green-800"
                              : "bg-blue-100 text-blue-800"
                        }
                      >
                        {orden.avances.length === 0
                          ? "Sin avances"
                          : orden.avances.some((a) => a.estado === "R7 (terminado)")
                            ? "Terminado"
                            : "En progreso"}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                {/* Contenido expandible */}
                {isExpanded && (
                  <CardContent className="pt-0">
                    {orden.avances.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Clock3 className="h-8 w-8 mx-auto mb-2" />
                        <p>No hay avances registrados para esta orden</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Tabla de avances */}
                        <div className="border rounded-lg overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-gray-50">
                                <TableHead className="font-semibold">Fecha Registro</TableHead>
                                <TableHead className="font-semibold">Fecha Trabajo</TableHead>
                                <TableHead className="font-semibold">Cuadrilla</TableHead>
                                <TableHead className="font-semibold">Actividad</TableHead>
                                <TableHead className="font-semibold">Estado</TableHead>
                                <TableHead className="font-semibold">Superficie</TableHead>
                                <TableHead className="font-semibold">Cantidad</TableHead>
                                <TableHead className="font-semibold">Personal</TableHead>
                                <TableHead className="font-semibold">Jornada</TableHead>
                                <TableHead className="font-semibold">Observaciones</TableHead>
                                <TableHead className="font-semibold">Proveedor</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {orden.avances.map((avance, index) => (
                                <TableRow key={avance.id} className="hover:bg-gray-50/50">
                                  <TableCell className="text-sm">
                                    {formatDateTimeArgentina(avance.fechaRegistro)}
                                  </TableCell>
                                  <TableCell className="font-medium">{formatDateArgentina(avance.fecha)}</TableCell>
                                  <TableCell>{capitalizeText(avance.cuadrilla)}</TableCell>
                                  <TableCell className="text-sm">{capitalizeText(avance.actividad)}</TableCell>
                                  <TableCell>
                                    <Badge
                                      variant={avance.estado === "R7 (terminado)" ? "default" : "secondary"}
                                      className={
                                        avance.estado === "R7 (terminado)"
                                          ? "bg-green-100 text-green-800 border-green-200"
                                          : "bg-yellow-100 text-yellow-800 border-yellow-200"
                                      }
                                    >
                                      {avance.estado === "R7 (terminado)" ? "Terminado" : "Pendiente"}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="font-mono">{avance.superficie.toFixed(4)} ha</TableCell>
                                  <TableCell>
                                    {avance.cantidadPlantas > 0 ? (
                                      <div className="flex items-center gap-1">
                                        <Leaf className="h-3 w-3 text-green-600" />
                                        <span>{avance.cantidadPlantas.toLocaleString()}</span>
                                      </div>
                                    ) : (
                                      <span className="text-muted-foreground">-</span>
                                    )}
                                  </TableCell>
                                  <TableCell>{avance.cantPersonal}</TableCell>
                                  <TableCell>{avance.jornada} hs</TableCell>
                                  <TableCell className="max-w-xs">
                                    {avance.observaciones ? (
                                      <span className="text-sm italic truncate block">{avance.observaciones}</span>
                                    ) : (
                                      <span className="text-muted-foreground">-</span>
                                    )}
                                  </TableCell>
                                  <TableCell>{avance.proveedorNombre || orden.proveedor || "Sin asignar"}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>

                        {/* Resumen de la orden */}
                        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                          <h4 className="font-medium mb-2">Resumen de la Orden</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Total días:</span>
                              <div className="font-medium">{orden.diasTrabajados}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Total registros:</span>
                              <div className="font-medium">{orden.avances.length}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Superficie trabajada:</span>
                              <div className="font-medium">{orden.superficieTrabajada.toFixed(2)} ha</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Progreso:</span>
                              <div className="font-medium">{orden.porcentajeCompletado.toFixed(1)}%</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
