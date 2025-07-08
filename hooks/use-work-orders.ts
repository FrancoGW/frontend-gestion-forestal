"use client"

import { useState, useEffect } from "react"
import { workOrdersAPI, checkBackendStatus } from "@/lib/api-client"

interface WorkOrder {
  id: string
  actividad: string
  campo: string
  emisor?: string
  empresa?: string
  fecha: string
  cantidad: string
  proveedorAsignado?: string
  estado?: string
  proveedor?: string
}

interface BackendStatus {
  available: boolean
  message?: string
}

interface Pagination {
  currentPage: number
  totalPages: number
  totalItems: number
}

export function useWorkOrders() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])
  const [workOrdersProgress, setWorkOrdersProgress] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [backendStatus, setBackendStatus] = useState<BackendStatus | null>(null)
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
  })
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)

  const fetchWorkOrders = async (page = 1, search = "") => {
    try {
      setLoading(true)
      setError(null)

      console.log("Obteniendo órdenes de trabajo...", { page, search })

      // Verificar estado del backend primero
      const status = await checkBackendStatus()
      setBackendStatus(status)

      if (!status.available) {
        throw new Error(status.error || "Backend no disponible")
      }

      // Obtener órdenes de trabajo con parámetros
      const params: any = {
        pagina: page,
        limite: 20, // Mostrar 20 órdenes por página
      }

      if (search && search.trim()) {
        params.busqueda = search.trim()
      }

      const response = await workOrdersAPI.getAll(params)
      console.log("Respuesta de órdenes de trabajo:", response)

      // Manejar diferentes formatos de respuesta
      let orders = []
      let totalItems = 0
      let totalPages = 1

      if (Array.isArray(response)) {
        // Si la respuesta es un array directo
        orders = response
        totalItems = response.length
        totalPages = 1
      } else if (response.data && Array.isArray(response.data)) {
        // Si la respuesta tiene estructura { data: [], total: number, etc. }
        orders = response.data
        totalItems = response.total || response.data.length
        totalPages = response.totalPages || Math.ceil(totalItems / 20)
      } else if (response.ordenes && Array.isArray(response.ordenes)) {
        // Si la respuesta tiene estructura { ordenes: [], total: number, etc. }
        orders = response.ordenes
        totalItems = response.total || response.ordenes.length
        totalPages = response.totalPages || Math.ceil(totalItems / 20)
      }

      // Transformar los datos para que coincidan con la interfaz
      const transformedOrders = orders.map((order: any) => ({
        id: order._id || order.id,
        actividad: order.actividad || order.tipoActividad || "Sin actividad",
        campo: order.campo || order.nombreCampo || "Sin campo",
        emisor: order.emisor || order.usuarioEmisor || "",
        empresa: order.empresa || order.empresaEncargada || "",
        fecha: order.fecha || order.fechaCreacion || new Date().toLocaleDateString(),
        cantidad: order.cantidad || order.hectareas || order.superficie || "0",
        proveedorAsignado: order.proveedorAsignado || order.proveedor || "",
        estado: order.estado || "Pendiente",
      }))

      console.log("Órdenes transformadas:", transformedOrders)

      setWorkOrders(transformedOrders)
      setPagination({
        currentPage: page,
        totalPages: Math.max(1, totalPages),
        totalItems: totalItems,
      })

      // Calcular progreso mock para cada orden (esto debería venir del backend)
      const progressMap: Record<string, number> = {}
      transformedOrders.forEach((order) => {
        // Generar progreso basado en el estado
        if (order.estado === "Completado") {
          progressMap[order.id] = 100
        } else if (order.estado === "En Progreso") {
          progressMap[order.id] = Math.floor(Math.random() * 80) + 10 // 10-90%
        } else {
          progressMap[order.id] = 0
        }
      })
      setWorkOrdersProgress(progressMap)
    } catch (err: any) {
      console.error("Error al obtener órdenes de trabajo:", err)
      setError(err.message || "No se pudo conectar con el servidor.")
      setBackendStatus({
        available: false,
        message: err.message || "No se pudo conectar con el servidor.",
      })

      // En caso de error, mostrar datos vacíos
      setWorkOrders([])
      setWorkOrdersProgress({})
      setPagination({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
      })
    } finally {
      setLoading(false)
    }
  }

  const changePage = (page: number) => {
    if (page !== pagination.currentPage) {
      fetchWorkOrders(page, searchQuery)
    }
  }

  const retryConnection = () => {
    fetchWorkOrders(pagination.currentPage, searchQuery)
  }

  const performSearch = (query: string) => {
    setSearchQuery(query)
    setIsSearching(!!query.trim())
    fetchWorkOrders(1, query) // Reiniciar a la página 1 al buscar
  }

  const clearSearch = () => {
    setSearchQuery("")
    setIsSearching(false)
    fetchWorkOrders(1, "") // Reiniciar a la página 1 sin búsqueda
  }

  useEffect(() => {
    fetchWorkOrders()
  }, [])

  return {
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
  }
}
