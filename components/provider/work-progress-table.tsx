"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Edit, Trash2, FileSpreadsheet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { avancesTrabajoAPI } from "@/lib/api-client"
import * as XLSX from "xlsx"

interface WorkProgressTableProps {
  workOrderId?: string
  providerId?: string
  onEdit?: (avance: any) => void
  onDelete?: (avanceId: string) => void
  refreshTrigger?: number
  showFilters?: boolean
  title?: string
  description?: string
}

export function WorkProgressTable({
  workOrderId,
  providerId,
  onEdit,
  onDelete,
  refreshTrigger,
  showFilters = true,
  title = "Registro de Avances",
  description = "Historial completo de todos los avances registrados",
}: WorkProgressTableProps) {
  const [avances, setAvances] = useState<any[]>([])
  const [filteredAvances, setFilteredAvances] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  // Función para cargar avances
  const loadAvances = async () => {
    try {
      setLoading(true)
      setError(null)

      let data: any[] = []

      if (workOrderId) {
        // Cargar avances de una orden específica
        data = await avancesTrabajoAPI.getByOrderId({ id: workOrderId })
      } else if (providerId) {
        // Cargar avances de un proveedor específico
        data = await avancesTrabajoAPI.getByProviderId(providerId)
      } else {
        // Cargar todos los avances
        data = await avancesTrabajoAPI.getAll()
      }

      // Asegurar que data sea un array
      const avancesArray = Array.isArray(data) ? data : []

      // Ordenar por fecha (más reciente primero)
      const sortedAvances = avancesArray.sort((a, b) => {
        const dateA = new Date(a.fecha || 0).getTime()
        const dateB = new Date(b.fecha || 0).getTime()
        return dateB - dateA
      })

      setAvances(sortedAvances)
      setFilteredAvances(sortedAvances)
    } catch (err: any) {
      console.error("Error loading avances:", err)
      setError(err.message || "Error al cargar los avances")
      setAvances([])
      setFilteredAvances([])
    } finally {
      setLoading(false)
    }
  }

  // Cargar avances al montar el componente y cuando cambie refreshTrigger
  useEffect(() => {
    loadAvances()
  }, [workOrderId, providerId, refreshTrigger])

  // Filtrar avances cuando cambien los filtros
  useEffect(() => {
    let filtered = [...avances]

    // Filtro por búsqueda
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (avance) =>
          (avance.cuadrilla || "").toLowerCase().includes(searchLower) ||
          (avance.actividad || "").toLowerCase().includes(searchLower) ||
          (avance.predio || "").toLowerCase().includes(searchLower) ||
          (avance.especie || "").toLowerCase().includes(searchLower) ||
          (avance.rodal || "").toString().toLowerCase().includes(searchLower) ||
          (avance.observaciones || "").toLowerCase().includes(searchLower),
      )
    }

    // Filtro por fecha desde
    if (dateFrom) {
      const fromDate = new Date(dateFrom)
      filtered = filtered.filter((avance) => {
        const avanceDate = new Date(avance.fecha)
        return avanceDate >= fromDate
      })
    }

    // Filtro por fecha hasta
    if (dateTo) {
      const toDate = new Date(dateTo)
      toDate.setHours(23, 59, 59, 999) // Incluir todo el día
      filtered = filtered.filter((avance) => {
        const avanceDate = new Date(avance.fecha)
        return avanceDate <= toDate
      })
    }

    setFilteredAvances(filtered)
  }, [avances, searchTerm, dateFrom, dateTo])

  // Función para formatear fecha
  const formatDate = (dateString: string) => {
    if (!dateString) return "No especificada"
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: es })
    } catch (e) {
      return dateString
    }
  }

  // ✅ NUEVO: Función para obtener el color del badge según el estado
  const getEstadoBadge = (estado: string) => {
    const estadoLower = (estado || "pendiente").toLowerCase()

    if (estadoLower.includes("terminado") || estadoLower.includes("r7")) {
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
          {estado || "Terminado"}
        </Badge>
      )
    } else {
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          <span className="w-2 h-2 bg-yellow-500 rounded-full mr-1"></span>
          {estado || "Pendiente"}
        </Badge>
      )
    }
  }

  // Función para exportar a Excel
  const exportToExcel = () => {
    try {
      // Preparar datos para Excel
      const excelData = filteredAvances.map((avance, index) => ({
        "#": index + 1,
        ID: avance._id || avance.id || "",
        Fecha: formatDate(avance.fecha),
        Cuadrilla: avance.cuadrilla || "",
        Predio: avance.predio || "",
        "Predio vecino": avance.vecino || avance.predioVecino || "",
        Rodal: avance.rodal || "",
        Actividad: avance.actividad || "",
        Especie: avance.especie || "",
        "Año P.": Number(avance.anioPlantacion || 0) || "-",
        Bandejas: avance.cantidadBandejas || "-",
        Plantas: Number(avance.cantidadPlantas || avance.plantas || 0),
        "GIS (ha)": Number(avance.superficie || 0),
        "Sup (ha)": Number(avance.superficie || 0),
        Personal: Number(avance.cantPersonal || 0),
        Jornadas: Number(avance.jornada || 0),
        Estado: avance.estado || "Pendiente", // ✅ NUEVO: Incluir estado en Excel
        Observaciones: avance.observaciones || "",
      }))

      // Crear libro de Excel
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(excelData)

      // Ajustar ancho de columnas
      const wscols = [
        { wch: 5 }, // #
        { wch: 15 }, // ID
        { wch: 12 }, // Fecha
        { wch: 15 }, // Cuadrilla
        { wch: 15 }, // Predio
        { wch: 18 }, // Predio vecino
        { wch: 8 }, // Rodal
        { wch: 20 }, // Actividad
        { wch: 15 }, // Especie
        { wch: 10 }, // Año P.
        { wch: 10 }, // Bandejas
        { wch: 10 }, // Plantas
        { wch: 10 }, // GIS (ha)
        { wch: 10 }, // Sup (ha)
        { wch: 10 }, // Personal
        { wch: 10 }, // Jornadas
        { wch: 12 }, // Estado
        { wch: 30 }, // Observaciones
      ]
      ws["!cols"] = wscols

      XLSX.utils.book_append_sheet(wb, ws, "Avances")

      // Generar nombre de archivo
      const fileName = `avances-${format(new Date(), "yyyy-MM-dd")}.xlsx`

      // Descargar archivo
      XLSX.writeFile(wb, fileName)
    } catch (error) {
      console.error("Error al exportar:", error)
      alert("Error al exportar a Excel")
    }
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Button variant="outline" onClick={exportToExcel} className="h-9">
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Exportar Excel
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {showFilters && (
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Buscar avances..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <div>
                <label className="text-sm font-medium">Desde:</label>
                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-auto" />
              </div>
              <div>
                <label className="text-sm font-medium">Hasta:</label>
                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-auto" />
              </div>
            </div>
          </div>
        )}

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">ID</TableHead>
                <TableHead>Cuadrilla</TableHead>
                <TableHead>Predio</TableHead>
                <TableHead>Actividad</TableHead>
                <TableHead>Especie</TableHead>
                <TableHead className="w-[80px] text-center">Rodal</TableHead>
                <TableHead className="w-[80px] text-center">Año P.</TableHead>
                <TableHead className="w-[100px] text-center">Bandejas</TableHead>
                <TableHead className="w-[100px] text-center">Plantas</TableHead>
                <TableHead className="w-[100px] text-center">GIS (ha)</TableHead>
                <TableHead className="w-[100px] text-center">Sup (ha)</TableHead>
                <TableHead className="w-[100px] text-center">Personal</TableHead>
                <TableHead className="w-[100px] text-center">Jornadas</TableHead>
                {/* ✅ NUEVO: Columna Estado */}
                <TableHead className="w-[120px] text-center">Estado</TableHead>
                <TableHead className="w-[120px] text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                // Skeleton loading
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell className="text-center">
                      <Skeleton className="h-4 w-12 mx-auto" />
                    </TableCell>
                    <TableCell className="text-center">
                      <Skeleton className="h-4 w-12 mx-auto" />
                    </TableCell>
                    <TableCell className="text-center">
                      <Skeleton className="h-4 w-12 mx-auto" />
                    </TableCell>
                    <TableCell className="text-center">
                      <Skeleton className="h-4 w-12 mx-auto" />
                    </TableCell>
                    <TableCell className="text-center">
                      <Skeleton className="h-4 w-12 mx-auto" />
                    </TableCell>
                    <TableCell className="text-center">
                      <Skeleton className="h-4 w-12 mx-auto" />
                    </TableCell>
                    <TableCell className="text-center">
                      <Skeleton className="h-4 w-12 mx-auto" />
                    </TableCell>
                    <TableCell className="text-center">
                      <Skeleton className="h-4 w-12 mx-auto" />
                    </TableCell>
                    {/* ✅ NUEVO: Skeleton para Estado */}
                    <TableCell className="text-center">
                      <Skeleton className="h-6 w-20 mx-auto" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-8 w-20 ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredAvances.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={15} className="text-center py-8 text-muted-foreground">
                    {searchTerm || dateFrom || dateTo
                      ? "No se encontraron avances con los filtros aplicados"
                      : "No hay avances registrados"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredAvances.map((avance) => (
                  <TableRow key={avance._id || avance.id}>
                    <TableCell className="font-mono text-xs">
                      {(avance._id || avance.id || "").toString().slice(-6).toUpperCase()}
                    </TableCell>
                    <TableCell>{avance.cuadrilla || "-"}</TableCell>
                    <TableCell>{avance.predio || "-"}</TableCell>
                    <TableCell>
                      <div className="max-w-[200px] truncate" title={avance.actividad}>
                        {avance.actividad || "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[150px] truncate" title={avance.especie}>
                        {avance.especie || "-"}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">{avance.rodal || "-"}</TableCell>
                    <TableCell className="text-center">{avance.anioPlantacion || "-"}</TableCell>
                    <TableCell className="text-center">{avance.cantidadBandejas || "-"}</TableCell>
                    <TableCell className="text-center">{avance.cantidadPlantas || avance.plantas || 0}</TableCell>
                    <TableCell className="text-center">{Number(avance.superficie || 0).toFixed(1)}</TableCell>
                    <TableCell className="text-center">{Number(avance.superficie || 0).toFixed(1)}</TableCell>
                    <TableCell className="text-center">{avance.cantPersonal || 0}</TableCell>
                    <TableCell className="text-center">{avance.jornada || 0}</TableCell>
                    {/* ✅ NUEVO: Mostrar Estado con badge */}
                    <TableCell className="text-center">{getEstadoBadge(avance.estado)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {onEdit && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(avance)}
                            className="h-8 w-8 p-0"
                            title="Editar avance"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {onDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDelete(avance._id || avance.id)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            title="Eliminar avance"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {!loading && filteredAvances.length > 0 && (
          <div className="mt-4 text-sm text-muted-foreground">
            Mostrando {filteredAvances.length} de {avances.length} avances
          </div>
        )}
      </CardContent>
    </Card>
  )
}
