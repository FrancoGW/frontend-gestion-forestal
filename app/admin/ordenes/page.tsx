"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import * as XLSX from "xlsx"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Pagination, PaginationContent, PaginationItem, PaginationLink } from "@/components/ui/pagination"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageLoader } from "@/components/ui/page-loader"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useWorkOrders } from "@/hooks/use-work-orders"
import { AlertCircle, FileSpreadsheet, Search, RefreshCcw, CloudDownload } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { workOrdersAPI } from "@/lib/api-client"

// Función para traer todas las órdenes paginando
async function fetchAllWorkOrders(): Promise<any[]> {
  let pagina = 1
  let todasLasOrdenes: any[] = []
  let totalPaginas = 1
  do {
    const response = await workOrdersAPI.getAll({ pagina, limite: 100 })
    const ordenes = response.ordenes || response.data || []
    todasLasOrdenes = todasLasOrdenes.concat(ordenes)
    totalPaginas = response.paginacion?.paginas || 1
    // Log para depuración
    console.log(`Página ${pagina} de ${totalPaginas}, órdenes recibidas: ${ordenes.length}, total acumulado: ${todasLasOrdenes.length}`)
    pagina++
  } while (pagina <= totalPaginas)
  // Log final para depuración
  console.log(`Total de órdenes obtenidas: ${todasLasOrdenes.length}`)
  return todasLasOrdenes
}

export default function WorkOrdersPage() {
  const router = useRouter()
  const {
    workOrders,
    workOrdersProgress,
    loading,
    error,
    backendStatus,
    pagination,
    searchQuery,
    isSearching,
    changePage,
    retryConnection,
    performSearch,
    clearSearch,
    rawWorkOrders,
  } = useWorkOrders()

  const [localSearchQuery, setLocalSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [syncing, setSyncing] = useState(false)
  const { toast } = useToast()

  // Manejar la búsqueda
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    performSearch(localSearchQuery)
  }

  // Sincronizar órdenes desde GIS (misma URL que consume el sistema)
  const handleSyncFromGIS = async () => {
    setSyncing(true)
    try {
      const from = "2025-01-12"
      const res = await fetch(`/api/ordenesTrabajoAPI/sync?from=${encodeURIComponent(from)}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Error al sincronizar")
      toast({
        title: "Base de datos actualizada",
        description: `Sincronizadas ${data.cantidad ?? 0} órdenes (${data.nuevas ?? 0} nuevas, ${data.actualizadas ?? 0} actualizadas).`,
      })
      retryConnection()
    } catch (err: any) {
      toast({
        title: "Error al sincronizar",
        description: err.message || "No se pudo actualizar desde GIS.",
        variant: "destructive",
      })
    } finally {
      setSyncing(false)
    }
  }

  // Manejar cambio en el input de búsqueda
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setLocalSearchQuery(value)

    // Si el campo está vacío, limpiar la búsqueda inmediatamente
    if (!value.trim()) {
      clearSearch()
    }
  }

  const handleExport = async () => {
    const allOrders = await fetchAllWorkOrders()
    const dataToExport = allOrders.flatMap((order: any) => {
      const rodales = order.rodales && order.rodales.length > 0 ? order.rodales : [{}]
      const insumos = order.insumos && order.insumos.length > 0 ? order.insumos : [{}]
      const ambiental = order.ambiental && order.ambiental.length > 0 ? order.ambiental : [{}]

      const maxRows = Math.max(rodales.length, insumos.length, ambiental.length)
      const rows = []

      for (let i = 0; i < maxRows; i++) {
        rows.push({
          ...order,
          "Rodal Codigo": rodales[i]?.cod_rodal || "",
          "Rodal Uso": rodales[i]?.tipo_uso || "",
          "Rodal Especie": rodales[i]?.especie || "",
          "Rodal Supha": rodales[i]?.supha || "",
          "Insumo Nombre": insumos[i]?.insumo || "",
          "Insumo Dosis": insumos[i]?.dosis || "",
          "Aspecto Ambiental": ambiental[i]?.aspecto || "",
          "Riesgo Ambiental": ambiental[i]?.riesgo ?? "",
        })
      }

      return rows
    })

    const worksheet = XLSX.utils.json_to_sheet(dataToExport)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Ordenes de Trabajo")
    XLSX.writeFile(workbook, "ordenes_de_trabajo.xlsx")
  }

  // Filtrar órdenes según la pestaña activa (solo si no estamos buscando)
  const filteredOrders = isSearching
    ? workOrders
    : workOrders.filter((order) => {
        if (activeTab === "all") return true
        if (activeTab === "assigned") return !!order.proveedorAsignado
        if (activeTab === "unassigned") return !order.proveedorAsignado
        return true
      })

  // Renderizar el estado de carga
  if (loading) {
    return (
      <div className="space-y-6">
        <PageLoader message="Cargando órdenes..." submessage="Obteniendo órdenes de trabajo" />
      </div>
    )
  }

  // Renderizar el estado de error
  if (error || (backendStatus && !backendStatus.available)) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Órdenes de Trabajo</h1>
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
        <h1 className="text-3xl font-bold tracking-tight">Órdenes de Trabajo</h1>
        {isSearching && (
          <div className="text-sm text-muted-foreground">Mostrando resultados de búsqueda para "{searchQuery}"</div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex gap-2">
          {!isSearching && (
            <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="all">Todas</TabsTrigger>
                <TabsTrigger value="assigned">Asignadas</TabsTrigger>
                <TabsTrigger value="unassigned">Sin Asignar</TabsTrigger>
              </TabsList>
            </Tabs>
          )}
          <Button onClick={handleExport} variant="outline" className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Exportar a Excel
          </Button>
          <Button
            onClick={handleSyncFromGIS}
            disabled={syncing}
            variant="outline"
            className="flex items-center gap-2"
            title="Actualizar órdenes desde GIS (from=2025-01-12)"
          >
            <CloudDownload className={`h-4 w-4 ${syncing ? "animate-pulse" : ""}`} />
            {syncing ? "Sincronizando..." : "Actualizar desde GIS"}
          </Button>
        </div>

        <form onSubmit={handleSearch} className="flex w-full sm:w-auto gap-2">
          <div className="relative">
            <Input
              placeholder="Buscar en todas las órdenes..."
              value={localSearchQuery}
              onChange={handleSearchChange}
              className="sm:w-[300px] pr-10"
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
      </div>

      {filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileSpreadsheet className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              {isSearching
                ? `No se encontraron órdenes que coincidan con "${searchQuery}"`
                : "No se encontraron órdenes de trabajo."}
            </p>
            {isSearching && (
              <Button
                variant="link"
                onClick={() => {
                  setLocalSearchQuery("")
                  clearSearch()
                }}
              >
                Limpiar búsqueda
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
                  <TableHead>Emisor</TableHead>
                  <TableHead>Empresa Encargada</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Hectáreas</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.id}</TableCell>
                    <TableCell>{order.actividad}</TableCell>
                    <TableCell>{order.campo}</TableCell>
                    <TableCell>{order.emisor || "Sin emisor"}</TableCell>
                    <TableCell>{order.empresa || "Sin empresa"}</TableCell>
                    <TableCell>{order.fecha}</TableCell>
                    <TableCell>{order.cantidad}</TableCell>
                    <TableCell>
                      <Link href={`/admin/ordenes/${order.id}`}>
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

          {/* {!isSearching && pagination.totalPages > 1 && (
            <Pagination className="mt-8">
              <PaginationContent>
                {pagination.currentPage > 1 && (
                  <PaginationItem>
                    <PaginationLink onClick={() => changePage(pagination.currentPage - 1)}>Anterior</PaginationLink>
                  </PaginationItem>
                )}

                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  let pageNum
                  if (pagination.totalPages <= 5) {
                    pageNum = i + 1
                  } else if (pagination.currentPage <= 3) {
                    pageNum = i + 1
                  } else if (pagination.currentPage >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + i
                  } else {
                    pageNum = pagination.currentPage - 2 + i
                  }

                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationLink isActive={pageNum === pagination.currentPage} onClick={() => changePage(pageNum)}>
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  )
                })}

                {pagination.currentPage < pagination.totalPages && (
                  <PaginationItem>
                    <PaginationLink onClick={() => changePage(pagination.currentPage + 1)}>Siguiente</PaginationLink>
                  </PaginationItem>
                )}
              </PaginationContent>
            </Pagination>
          )} */}
        </>
      )}
    </div>
  )
}
