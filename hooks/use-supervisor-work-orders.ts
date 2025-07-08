"use client"

import { useState, useEffect } from "react"
import { workOrdersAPI, checkBackendStatus } from "@/lib/api-client"
import { useAuth } from "@/hooks/use-auth"

interface WorkOrder {
  id: string | number
  _id?: string | number
  actividad: string
  campo: string
  emisor?: string
  empresa?: string
  fecha: string
  cantidad: string
  supervisor?: string
  supervisor_id?: number
  usuario_id?: number
  estado?: number
  estado_nombre?: string
  encargado?: string
  zona?: string
  rodales?: Array<{
    cod_rodal: number
    tipo_uso: string
    especie: string
    supha: string
  }>
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

// Mapeo de emails de supervisores a sus IDs (basado en la información real)
const supervisorEmailToId: Record<string, number> = {
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

export function useSupervisorWorkOrders() {
  const { user } = useAuth()
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])
  const [allWorkOrders, setAllWorkOrders] = useState<WorkOrder[]>([]) // Para mantener todas las órdenes
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
  const [filterById, setFilterById] = useState("")

  const fetchAllWorkOrdersFromAllPages = async () => {
    let allOrders: any[] = []
    let totalPages = 1



    try {
      // Primero obtener la primera página para conocer el total de páginas
      const firstResponse = await workOrdersAPI.getAll({
        pagina: 1,
        limite: 20,
      })



      if (firstResponse && firstResponse.paginacion) {
        totalPages = firstResponse.paginacion.paginas || 1


        // Agregar órdenes de la primera página
        if (firstResponse.ordenes && Array.isArray(firstResponse.ordenes)) {
          allOrders = [...firstResponse.ordenes]

        }

        // Obtener el resto de las páginas
        for (let page = 2; page <= totalPages; page++) {
          try {


            const response = await workOrdersAPI.getAll({
              pagina: page,
              limite: 20,
            })

            if (response && response.ordenes && Array.isArray(response.ordenes)) {
              allOrders = [...allOrders, ...response.ordenes]

            }

            // Pequeña pausa para no sobrecargar el servidor
            await new Promise((resolve) => setTimeout(resolve, 100))
          } catch (pageError) {
            console.error(`❌ Error obteniendo página ${page}:`, pageError)
            // Continuar con las siguientes páginas aunque una falle
          }
        }
      } else {
        // Fallback: si no hay paginación, usar la respuesta como está
        if (Array.isArray(firstResponse)) {
          allOrders = firstResponse
        } else if (firstResponse.ordenes && Array.isArray(firstResponse.ordenes)) {
          allOrders = firstResponse.ordenes
        }
      }


      return allOrders
    } catch (err) {
      console.error("❌ Error obteniendo órdenes:", err)
      throw err
    }
  }

  const fetchWorkOrders = async (search = "", idFilter = "") => {
    try {
      setLoading(true)
      setError(null)



      // Determinar el ID del supervisor a partir del email antes de cualquier filtrado
      const supervisorIdFromEmail = user?.email ? supervisorEmailToId[user.email.toLowerCase()] : null
      const supervisorId = supervisorIdFromEmail ?? (typeof user?.id === "number" ? user.id : null)

      // Verificar estado del backend
      const status = await checkBackendStatus()
      setBackendStatus(status)

      if (!status.available) {
        throw new Error(status.error || "Backend no disponible")
      }

      // Obtener TODAS las órdenes de trabajo de TODAS las páginas
      const allOrdersFromAPI = await fetchAllWorkOrdersFromAllPages()



      // Transformar los datos
      const transformedOrders = allOrdersFromAPI.map((order: any) => ({
        id: order._id || order.id,
        _id: order._id || order.id,
        actividad: order.actividad || order.tipoActividad || "Sin actividad",
        campo: order.campo || order.nombreCampo || "Sin campo",
        emisor: order.emisor || order.usuarioEmisor || "",
        empresa: order.empresa || order.empresaEncargada || "",
        fecha: order.fecha || order.fechaCreacion || new Date().toLocaleDateString(),
        cantidad: order.cantidad || order.hectareas || order.superficie || "0",
        supervisor: order.supervisor || "",
        supervisor_id: order.supervisor_id || order.supervisorId,
        usuario_id: order.usuario_id || order.usuarioId,
        estado: order.estado,
        estado_nombre: order.estado_nombre || order.estadoNombre,
        encargado: order.encargado || "",
        zona: order.zona || "",
        rodales: order.rodales || [],
      }))



      // Guardar todas las órdenes
      setAllWorkOrders(transformedOrders)

      // Aplicar filtros
      let filteredOrders = transformedOrders

      // Filtro por ID específico EXACTO (tiene prioridad)
      if (idFilter && idFilter.trim()) {

        filteredOrders = transformedOrders.filter((order) => {
          const orderId = String(order.id || order._id || "")
          const matches = orderId === idFilter.trim() // COINCIDENCIA EXACTA
          if (matches) {
            
          }
          return matches
        })
        
      } else {
        // Filtro por supervisor (SIEMPRE aplicar cuando no hay filtro por ID)

        

        if (supervisorId) {
          filteredOrders = transformedOrders.filter((order) => {
            // Filtrar por supervisor_id o usuario_id (coincidencia exacta)
            const matchesId =
              order.supervisor_id === supervisorId ||
              order.usuario_id === supervisorId ||
              Number(order.supervisor_id) === Number(supervisorId) ||
              Number(order.usuario_id) === Number(supervisorId)

            if (matchesId) {
             
            }

            return matchesId
          })

          
        } else {
          console.warn("⚠️ No se pudo determinar el ID del supervisor")
          filteredOrders = []
        }

        // Aplicar búsqueda de texto si existe (sobre las órdenes ya filtradas por supervisor)
        if (search && search.trim()) {
          const searchTerm = search.toLowerCase()
          

          filteredOrders = filteredOrders.filter(
            (order) =>
              order.actividad.toLowerCase().includes(searchTerm) ||
              order.campo.toLowerCase().includes(searchTerm) ||
              order.empresa?.toLowerCase().includes(searchTerm) ||
              String(order.id).toLowerCase().includes(searchTerm) ||
              order.supervisor?.toLowerCase().includes(searchTerm) ||
              order.emisor?.toLowerCase().includes(searchTerm),
          )
          
        }
      }

      setWorkOrders(filteredOrders)
      setPagination({
        currentPage: 1,
        totalPages: 1,
        totalItems: filteredOrders.length,
      })

      
    } catch (err: any) {
      console.error("❌ Error al obtener órdenes de trabajo:", err)
      setError(err.message || "No se pudo conectar con el servidor.")
      setBackendStatus({
        available: false,
        message: err.message || "No se pudo conectar con el servidor.",
      })

      setWorkOrders([])
      setAllWorkOrders([])
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
      fetchWorkOrders(searchQuery, filterById)
    }
  }

  const retryConnection = () => {
    fetchWorkOrders(searchQuery, filterById)
  }

  const performSearch = (query: string) => {
    setSearchQuery(query)
    setIsSearching(!!query.trim())
    setFilterById("") // Limpiar filtro por ID al buscar
    fetchWorkOrders(query, "")
  }

  const clearSearch = () => {
    setSearchQuery("")
    setIsSearching(false)
    setFilterById("")
    fetchWorkOrders("", "")
  }

  const filterByOrderId = (orderId: string) => {
    setFilterById(orderId)
    setSearchQuery("") // Limpiar búsqueda al filtrar por ID
    setIsSearching(false)
    fetchWorkOrders("", orderId)
  }

  const clearIdFilter = () => {
    setFilterById("")
    fetchWorkOrders(searchQuery, "")
  }

  useEffect(() => {
    if (user) {
      fetchWorkOrders()
    }
  }, [user])

  return {
    workOrders,
    allWorkOrders,
    loading,
    error,
    backendStatus,
    pagination,
    searchQuery,
    isSearching,
    filterById,
    changePage,
    retryConnection,
    performSearch,
    clearSearch,
    filterByOrderId,
    clearIdFilter,
  }
}
