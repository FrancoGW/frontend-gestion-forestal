"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Search, Calendar, MapPin, FileText, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import { workOrdersAPI, avancesTrabajoAPI } from "@/lib/api-client"

// Cache externo para compartir datos entre páginas
declare global {
  var globalProviderCache: {
    ordenes: any[] | null
    avances: any[] | null
    lastFetch: number
    isLoading: boolean
  }
}

if (typeof window !== "undefined") {
  window.globalProviderCache = window.globalProviderCache || {
    ordenes: null,
    avances: null,
    lastFetch: 0,
    isLoading: false,
  }
}

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

export default function ProveedorOrdenesPage() {
  const params = useParams()
  const router = useRouter()
  const providerId = params.providerId as string

  const [ordenes, setOrdenes] = useState<any[]>([])
  const [filteredOrdenes, setFilteredOrdenes] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [proveedorNombre, setProveedorNombre] = useState<string>("")
  const [loadingProgress, setLoadingProgress] = useState({ current: 0, total: 0, phase: "" })

  // Función para filtrar órdenes por estado
  const filterOrdersByStatus = (orders: any[]) => {
    return orders.filter((orden: any) => {
      const estado = orden.estado_nombre || orden.estado || ""
      const estadoUpper = estado.toUpperCase()

      // Excluir órdenes ejecutadas y anuladas
      if (estadoUpper === "EJECUTADA" || estadoUpper === "ANULADA") {
        return false
      }

      return true
    })
  }

  // Función optimizada para obtener datos con cache
  const fetchDataWithCache = async () => {
    const cache = typeof window !== "undefined" ? window.globalProviderCache : null
    const now = Date.now()

    // Si tenemos datos en cache y no han expirado, usarlos
    if (cache && cache.ordenes && cache.avances && now - cache.lastFetch < CACHE_DURATION) {
      return {
        ordenes: cache.ordenes,
        avances: cache.avances,
      }
    }

    // Si ya se está cargando, esperar
    if (cache && cache.isLoading) {
      return new Promise((resolve) => {
        const checkCache = () => {
          if (!cache.isLoading && cache.ordenes) {
            resolve({
              ordenes: cache.ordenes,
              avances: cache.avances,
            })
          } else {
            setTimeout(checkCache, 100)
          }
        }
        checkCache()
      })
    }

    if (cache) {
      cache.isLoading = true
    }

    try {
      setLoadingProgress({ current: 0, total: 2, phase: "Iniciando carga..." })

      // 1. Cargar avances primero (más rápido)
      setLoadingProgress({ current: 1, total: 2, phase: "Cargando avances..." })
      const avancesData = await fetchAllAvances()

      // 2. Cargar órdenes con estrategia optimizada
      setLoadingProgress({ current: 2, total: 2, phase: "Cargando órdenes..." })
      const ordenesData = await fetchAllWorkOrdersOptimized()

      // Guardar en cache
      if (cache) {
        cache.ordenes = ordenesData
        cache.avances = avancesData
        cache.lastFetch = now
        cache.isLoading = false
      }

      return {
        ordenes: ordenesData,
        avances: avancesData,
      }
    } catch (error) {
      if (cache) {
        cache.isLoading = false
      }
      throw error
    }
  }

  // Función optimizada para cargar órdenes con requests paralelos
  const fetchAllWorkOrdersOptimized = async () => {
    try {
      // Primero obtenemos la primera página para conocer la paginación
      const firstPageResponse = await workOrdersAPI.getAll({ pagina: 1, limite: 50 })

      let allOrders = []
      let totalPages = 1

      // Extraer datos de la primera página
      if (firstPageResponse.ordenes && Array.isArray(firstPageResponse.ordenes)) {
        allOrders = [...firstPageResponse.ordenes]
      }

      // Obtener información de paginación
      if (firstPageResponse.paginacion) {
        totalPages = firstPageResponse.paginacion.paginas || 1
      }

      setLoadingProgress({ current: 1, total: totalPages, phase: `Cargando órdenes (1/${totalPages})...` })

      // Si hay más páginas, cargarlas en paralelo (en lotes)
      if (totalPages > 1) {
        const BATCH_SIZE = 5 // Cargar 5 páginas en paralelo

        for (let startPage = 2; startPage <= totalPages; startPage += BATCH_SIZE) {
          const endPage = Math.min(startPage + BATCH_SIZE - 1, totalPages)
          const pagePromises = []

          // Crear promesas para el lote actual
          for (let page = startPage; page <= endPage; page++) {
            pagePromises.push(
              workOrdersAPI
                .getAll({ pagina: page, limite: 50 })
                .then((response) => ({ page, data: response.ordenes || [] }))
                .catch((error) => ({ page, data: [], error })),
            )
          }

          // Esperar a que se complete el lote
          const batchResults = await Promise.all(pagePromises)

          // Procesar resultados del lote
          batchResults.forEach((result) => {
            if (result.data && Array.isArray(result.data)) {
              allOrders = [...allOrders, ...result.data]
            }
          })

          setLoadingProgress({
            current: endPage,
            total: totalPages,
            phase: `Cargando órdenes (${endPage}/${totalPages})...`,
          })

          // Pequeña pausa entre lotes para no sobrecargar el servidor
          if (endPage < totalPages) {
            await new Promise((resolve) => setTimeout(resolve, 200))
          }
        }
      }

      return allOrders
    } catch (error) {
      throw error
    }
  }

  // Función para obtener avances (optimizada)
  const fetchAllAvances = async () => {
    try {
      const firstPageResponse = await avancesTrabajoAPI.getAll({ pagina: 1, limite: 100 })

      let allAvances = []
      let totalPages = 1

      // Extraer datos de la primera página
      if (Array.isArray(firstPageResponse)) {
        allAvances = [...firstPageResponse]
      } else if (firstPageResponse.avances && Array.isArray(firstPageResponse.avances)) {
        allAvances = [...firstPageResponse.avances]
      } else if (firstPageResponse.data && Array.isArray(firstPageResponse.data)) {
        allAvances = [...firstPageResponse.data]
      }

      // Obtener información de paginación si existe
      if (firstPageResponse.paginacion) {
        totalPages = firstPageResponse.paginacion.paginas || 1
      }

      // Si hay más páginas, cargarlas en paralelo
      if (totalPages > 1) {
        const pagePromises = []
        for (let page = 2; page <= totalPages; page++) {
          pagePromises.push(
            avancesTrabajoAPI
              .getAll({ pagina: page, limite: 100 })
              .then((response) => {
                if (Array.isArray(response)) return response
                if (response.avances && Array.isArray(response.avances)) return response.avances
                if (response.data && Array.isArray(response.data)) return response.data
                return []
              })
              .catch(() => []),
          )
        }

        const results = await Promise.all(pagePromises)
        results.forEach((pageAvances) => {
          allAvances = [...allAvances, ...pageAvances]
        })
      }

      return allAvances
    } catch (error) {
      return []
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const { ordenes: todasLasOrdenes, avances: avancesData } = await fetchDataWithCache()

        // Convertir providerId a número para comparación
        const providerIdNum = Number.parseInt(providerId)

        // Buscar órdenes del proveedor específico
        const ordenesDelProveedor = todasLasOrdenes.filter(
          (orden) => orden.cod_empres === providerIdNum || orden.cod_empres === providerId,
        )

        // Aplicar filtro de estados
        const ordenesFiltradas = filterOrdersByStatus(ordenesDelProveedor)

        // Procesar resultados
        if (ordenesFiltradas.length > 0) {
          setProveedorNombre(ordenesFiltradas[0].empresa || `Proveedor ${providerId}`)

          // Enriquecer con avances
          const ordenesConAvances = ordenesFiltradas.map((orden) => {
            const avancesOrden = avancesData.filter((avance) => {
              const ordenTrabajoId = avance.ordenTrabajoId || avance.ordenId || avance.orden_id
              return (
                ordenTrabajoId === orden._id ||
                ordenTrabajoId === orden.id ||
                String(ordenTrabajoId) === String(orden._id)
              )
            })

            let porcentajeAvance = 0
            if (avancesOrden.length > 0) {
              const superficieTotal = Number.parseFloat(orden.cantidad) || 0
              const superficieCompletada = avancesOrden.reduce(
                (total, avance) => total + (Number.parseFloat(avance.superficie) || 0),
                0,
              )

              if (superficieTotal > 0) {
                porcentajeAvance = Math.min(100, Math.round((superficieCompletada / superficieTotal) * 100))
              }
            }

            return {
              ...orden,
              avances: avancesOrden,
              porcentajeAvance,
              estado: porcentajeAvance === 100 ? "Completada" : avancesOrden.length > 0 ? "En progreso" : "Pendiente",
            }
          })

          // Ordenar por fecha
          ordenesConAvances.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())

          setOrdenes(ordenesConAvances)
          setFilteredOrdenes(ordenesConAvances)
        } else {
          setOrdenes([])
          setFilteredOrdenes([])
          setProveedorNombre(`Proveedor ${providerId}`)
        }

        setIsLoading(false)
        setLoadingProgress({ current: 0, total: 0, phase: "" })
      } catch (error) {
        setError(error.message || "Error al cargar los datos")
        setIsLoading(false)
        setLoadingProgress({ current: 0, total: 0, phase: "" })
      }
    }

    fetchData()
  }, [providerId])

  // Filtrar órdenes por búsqueda
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredOrdenes(ordenes)
    } else {
      const searchTermLower = searchTerm.toLowerCase()
      const filtered = ordenes.filter(
        (orden) =>
          orden.actividad?.toLowerCase().includes(searchTermLower) ||
          orden.campo?.toLowerCase().includes(searchTermLower) ||
          orden._id?.toString().includes(searchTermLower),
      )
      setFilteredOrdenes(filtered)
    }
  }, [searchTerm, ordenes])

  const getEstadoBadge = (estado) => {
    switch (estado) {
      case "Completada":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">{estado}</Badge>
      case "En progreso":
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200">{estado}</Badge>
      default:
        return <Badge variant="outline">{estado}</Badge>
    }
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <h2 className="text-lg font-semibold text-red-700 mb-2">Error al cargar los datos</h2>
        <p className="text-red-600">{error}</p>
        <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
          Recargar página
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Órdenes de {proveedorNombre}</h1>
          <p className="text-muted-foreground">
            Gestione y visualice las órdenes de trabajo asignadas a este proveedor
          </p>
          <p className="text-xs text-muted-foreground">
            Proveedor ID: {providerId} | Órdenes encontradas: {filteredOrdenes.length}
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push("/admin/avances")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a Proveedores
        </Button>
      </div>

      <hr className="border-t border-gray-200" />

      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por actividad, campo o ID..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {loadingProgress.total > 0 && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{loadingProgress.phase}</p>
                    <p className="text-sm text-muted-foreground">
                      {loadingProgress.current} de {loadingProgress.total}
                    </p>
                    <Progress value={(loadingProgress.current / loadingProgress.total) * 100} className="mt-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="pb-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-10 w-20" />
                  <Skeleton className="h-10 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredOrdenes.length === 0 ? (
        <div className="text-center py-10">
          <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No se encontraron órdenes</h3>
          <p className="text-muted-foreground">
            No hay órdenes de trabajo asignadas a este proveedor o no coinciden con los criterios de búsqueda.
          </p>
          <div className="mt-4 text-sm text-gray-500">
            <p>Proveedor ID: {providerId}</p>
            <p>Se analizaron todas las páginas de órdenes disponibles.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground mb-4">
            Mostrando {filteredOrdenes.length} órdenes de trabajo para el proveedor {providerId}
          </div>
          {filteredOrdenes.map((orden) => (
            <Card key={orden._id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      Orden #{orden._id} - {orden.actividad}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {orden.campo} - {orden.zona}
                    </CardDescription>
                  </div>
                  {getEstadoBadge(orden.estado)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Fecha</p>
                    <p className="text-sm font-medium flex items-center">
                      <Calendar className="mr-1 h-3.5 w-3.5" />
                      {new Date(orden.fecha).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Cantidad</p>
                    <p className="text-sm font-medium">
                      {orden.cantidad} {orden.unidad}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progreso:</span>
                    <span className="font-medium">{orden.porcentajeAvance}%</span>
                  </div>
                  <Progress value={orden.porcentajeAvance} className="h-2" />
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="flex items-center">
                      <FileText className="mr-1 h-3.5 w-3.5" />
                      {orden.avances.length} avances
                    </Badge>
                  </div>
                  <Link href={`/admin/avances/proveedor/${providerId}/orden/${orden._id}`} passHref>
                    <Button size="sm" className="h-9">
                      Ver Avances
                      <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
