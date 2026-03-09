"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import * as XLSX from "xlsx"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useWorkOrders } from "@/hooks/use-work-orders"
import { AlertCircle, FileSpreadsheet, Search, RefreshCcw, CloudDownload, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { workOrdersAPI } from "@/lib/api-client"

async function fetchAllWorkOrders(): Promise<any[]> {
  let pagina = 1
  let todasLasOrdenes: any[] = []
  let totalPaginas = 1
  do {
    const response = await workOrdersAPI.getAll({ pagina, limite: 100 })
    const ordenes = response.ordenes || response.data || []
    todasLasOrdenes = todasLasOrdenes.concat(ordenes)
    totalPaginas = response.paginacion?.paginas || 1
    pagina++
  } while (pagina <= totalPaginas)
  return todasLasOrdenes
}

export default function WorkOrdersPage() {
  const router = useRouter()
  const {
    workOrders,
    loading,
    error,
    backendStatus,
    searchQuery,
    isSearching,
    retryConnection,
    performSearch,
    clearSearch,
  } = useWorkOrders()

  const [localSearchQuery, setLocalSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [syncing, setSyncing] = useState(false)
  const [lastSync, setLastSync] = useState<Date | null>(null)
  const { toast } = useToast()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    performSearch(localSearchQuery)
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setLocalSearchQuery(value)
    if (!value.trim()) clearSearch()
  }

  const handleSyncFromGIS = async () => {
    setSyncing(true)
    try {
      const res = await fetch(`/api/ordenesTrabajoAPI/sync?force=1`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Error al sincronizar")
      setLastSync(new Date())
      toast({
        title: "Base de datos actualizada",
        description: `${data.cantidad ?? 0} órdenes sincronizadas (${data.nuevas ?? 0} nuevas, ${data.actualizadas ?? 0} actualizadas).`,
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

  const handleExport = async () => {
    const allOrders = await fetchAllWorkOrders()
    const dataToExport = allOrders.flatMap((order: any) => {
      const rodales = order.rodales?.length ? order.rodales : [{}]
      const insumos = order.insumos?.length ? order.insumos : [{}]
      const ambiental = order.ambiental?.length ? order.ambiental : [{}]
      const maxRows = Math.max(rodales.length, insumos.length, ambiental.length)
      return Array.from({ length: maxRows }, (_, i) => ({
        ...order,
        "Rodal Codigo": rodales[i]?.cod_rodal || "",
        "Rodal Uso": rodales[i]?.tipo_uso || "",
        "Rodal Especie": rodales[i]?.especie || "",
        "Rodal Supha": rodales[i]?.supha || "",
        "Insumo Nombre": insumos[i]?.insumo || "",
        "Insumo Dosis": insumos[i]?.dosis || "",
        "Aspecto Ambiental": ambiental[i]?.aspecto || "",
        "Riesgo Ambiental": ambiental[i]?.riesgo ?? "",
      }))
    })
    const worksheet = XLSX.utils.json_to_sheet(dataToExport)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Ordenes de Trabajo")
    XLSX.writeFile(workbook, "ordenes_de_trabajo.xlsx")
  }

  const filteredOrders = isSearching
    ? workOrders
    : workOrders.filter((order) => {
        if (activeTab === "all") return true
        if (activeTab === "assigned") return !!order.proveedorAsignado
        if (activeTab === "unassigned") return !order.proveedorAsignado
        return true
      })

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-7 w-56" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-36" />
            <Skeleton className="h-9 w-40" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-72" />
          <Skeleton className="h-9 w-32 ml-auto" />
        </div>
        <div className="border rounded-sm">
          <div className="flex gap-4 px-4 py-3 border-b bg-muted/30">
            {["ID", "Actividad", "Campo", "Emisor", "Empresa", "Fecha", "Ha", ""].map((h) => (
              <Skeleton key={h} className="h-4 w-20" />
            ))}
          </div>
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="flex gap-4 px-4 py-3 border-b last:border-b-0">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-20 ml-auto" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error || (backendStatus && !backendStatus.available)) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">Órdenes de Trabajo</h1>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error de conexión</AlertTitle>
          <AlertDescription>{error || backendStatus?.message || "No se pudo conectar con el servidor."}</AlertDescription>
        </Alert>
        <Button onClick={retryConnection} variant="outline" className="flex items-center gap-2">
          <RefreshCcw className="h-4 w-4" />
          Reintentar
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Órdenes de Trabajo</h1>
          <p className="text-sm text-muted-foreground">
            {lastSync
              ? `Última sincronización: ${lastSync.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}`
              : "Sincronización automática a las 8:00 y 15:00 hs"}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button onClick={handleExport} variant="outline" size="sm" className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Exportar a Excel
          </Button>
          <Button
            onClick={handleSyncFromGIS}
            disabled={syncing}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <CloudDownload className={`h-4 w-4 ${syncing ? "animate-pulse" : ""}`} />
            {syncing ? "Sincronizando..." : "Actualizar desde GIS"}
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        {!isSearching && (
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="h-9">
              <TabsTrigger value="all" className="text-xs px-3">
                Todas
                <Badge variant="secondary" className="ml-1.5 text-xs rounded-sm px-1.5">{workOrders.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="assigned" className="text-xs px-3">
                Asignadas
                <Badge variant="secondary" className="ml-1.5 text-xs rounded-sm px-1.5">{workOrders.filter(o => !!o.proveedorAsignado).length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="unassigned" className="text-xs px-3">
                Sin Asignar
                <Badge variant="secondary" className="ml-1.5 text-xs rounded-sm px-1.5">{workOrders.filter(o => !o.proveedorAsignado).length}</Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}

        <form onSubmit={handleSearch} className="flex gap-2 sm:ml-auto">
          <div className="relative">
            <Input
              placeholder="Buscar en todas las órdenes..."
              value={localSearchQuery}
              onChange={handleSearchChange}
              className="w-64 pr-8 h-9 text-sm rounded-sm"
            />
            <Search className="h-3.5 w-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          </div>
          <Button type="submit" disabled={!localSearchQuery.trim()} size="sm" className="rounded-sm">
            Buscar
          </Button>
          {isSearching && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-sm"
              onClick={() => { setLocalSearchQuery(""); clearSearch() }}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </form>
      </div>

      {isSearching && (
        <p className="text-sm text-muted-foreground">
          {filteredOrders.length} resultado{filteredOrders.length !== 1 ? "s" : ""} para &quot;{searchQuery}&quot;
        </p>
      )}

      {filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-14">
            <FileSpreadsheet className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground text-center">
              {isSearching
                ? `No se encontraron órdenes para "${searchQuery}"`
                : "No se encontraron órdenes de trabajo."}
            </p>
            {isSearching && (
              <Button variant="link" size="sm" onClick={() => { setLocalSearchQuery(""); clearSearch() }}>
                Limpiar búsqueda
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="border rounded-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="text-xs font-medium w-16">ID</TableHead>
                <TableHead className="text-xs font-medium">Actividad</TableHead>
                <TableHead className="text-xs font-medium">Campo</TableHead>
                <TableHead className="text-xs font-medium">Emisor</TableHead>
                <TableHead className="text-xs font-medium">Empresa Encargada</TableHead>
                <TableHead className="text-xs font-medium w-24">Fecha</TableHead>
                <TableHead className="text-xs font-medium w-16 text-right">Ha</TableHead>
                <TableHead className="text-xs font-medium w-24 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id} className="text-sm">
                  <TableCell className="font-mono text-xs text-muted-foreground">{order.id}</TableCell>
                  <TableCell className="font-medium">{order.actividad}</TableCell>
                  <TableCell className="text-muted-foreground">{order.campo}</TableCell>
                  <TableCell className="text-muted-foreground">{order.emisor || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{order.empresa || "—"}</TableCell>
                  <TableCell className="text-muted-foreground tabular-nums">{order.fecha}</TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">{order.cantidad || "—"}</TableCell>
                  <TableCell className="text-right">
                    <Link href={`/admin/ordenes/${order.id}`}>
                      <Button variant="ghost" size="sm" className="h-7 text-xs rounded-sm">
                        Ver detalles
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
