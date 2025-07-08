"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { workOrdersAPI, avancesTrabajoAPI } from "@/lib/api-client"
import type { WorkOrder, WorkOrderStatus } from "@/types/work-order"
import { useAuth } from "./use-auth"
import { useProviderWorkData } from "./use-provider-work-data"
import { useRouter } from "next/navigation"

// Datos simulados de órdenes
const mockOrders: any[] = [
  {
    id: 456,
    numero: "456",
    fecha: "28/05/2025",
    campo: "Lafuente cue",
    actividad: "Quemas controladas",
    cantidad: "577.4 Ha",
    totalHectareas: 577.4,
    estado: 0, // emitida
    cod_empres: 14,
    propietario: "Propietario 1",
    emisor: "Admin",
    rodales: [
      { numero: "1", hectareas: 200.5 },
      { numero: "2", hectareas: 376.9 },
    ],
  },
  {
    id: 451,
    numero: "451",
    fecha: "26/05/2025",
    campo: "San jose",
    actividad: "Quemas controladas",
    cantidad: "3100 Ha",
    totalHectareas: 3100,
    estado: 0, // emitida
    cod_empres: 14,
    propietario: "Propietario 2",
    emisor: "Admin",
    rodales: [
      { numero: "1", hectareas: 1500 },
      { numero: "2", hectareas: 1600 },
    ],
  },
  {
    id: 396,
    numero: "396",
    fecha: "22/05/2025",
    campo: "San antonio",
    actividad: "Control de malezas pre plantacion",
    cantidad: "36.4 Ha",
    totalHectareas: 36.4,
    estado: 0, // emitida
    cod_empres: 14,
    propietario: "Propietario 3",
    emisor: "Admin",
    rodales: [{ numero: "1", hectareas: 36.4 }],
  },
  {
    id: 395,
    numero: "395",
    fecha: "22/05/2025",
    campo: "San antonio",
    actividad: "Plantacion",
    cantidad: "318.0 Ha",
    totalHectareas: 318.0,
    estado: 1, // progreso
    cod_empres: 14,
    propietario: "Propietario 3",
    emisor: "Admin",
    rodales: [{ numero: "1", hectareas: 318.0 }],
  },
  {
    id: 377,
    numero: "377",
    fecha: "20/05/2025",
    campo: "La nueva",
    actividad: "Plantacion",
    cantidad: "96.9 Ha",
    totalHectareas: 96.9,
    estado: 0, // emitida
    cod_empres: 14,
    propietario: "Propietario 4",
    emisor: "Admin",
    rodales: [{ numero: "1", hectareas: 96.9 }],
  },
]

// Clave para el último timestamp de actualización
const ORDERS_CACHE_KEY = "provider-orders-cache"
const ORDERS_TIMESTAMP_KEY = "provider-orders-timestamp"
const CACHE_DURATION = 30 * 60 * 1000 // 30 minutos en milisegundos

// Función para capitalizar la primera letra
const capitalizeFirstLetter = (str: string): string => {
  if (!str) return ""
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export function useProviderOrders() {
  const router = useRouter()
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  // Asegurarse de que providerId sea un número válido mayor que 0
  const providerId = user?.providerId && user.providerId > 0 ? user.providerId : null
  const [orders, setOrders] = useState<WorkOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dataFetched, setDataFetched] = useState(false)
  const [orderProgress, setOrderProgress] = useState<Record<number, number>>({})
  const apiCallInProgress = useRef(false) // Para evitar llamadas simultáneas
  const redirectAttempted = useRef(false) // Para evitar múltiples redirecciones

  // Obtener la función getWorkProgressByOrderId del hook useProviderWorkData
  const { getWorkProgressByOrderId } = useProviderWorkData()

  // Redirigir al login si no hay usuario autenticado
  useEffect(() => {
    // Solo intentar redirigir una vez y solo después de que la autenticación haya terminado de cargar
    if (!authLoading && !isAuthenticated && !redirectAttempted.current) {
      redirectAttempted.current = true
      router.push("/login")
    }
  }, [authLoading, isAuthenticated, router])

  // Función para verificar si los datos en caché son válidos
  const isCacheValid = useCallback(() => {
    const timestamp = localStorage.getItem(ORDERS_TIMESTAMP_KEY)
    if (!timestamp) return false

    const lastUpdate = Number.parseInt(timestamp, 10)
    const now = Date.now()

    // Caché válido por 30 minutos
    return now - lastUpdate < CACHE_DURATION
  }, [])

  // Función para mapear una orden de la API al formato de la aplicación
  const mapOrderFromAPI = useCallback((apiOrder: any): WorkOrder => {
    // Extraer el ID del proveedor (cod_empres) y asegurarse de que sea un número
    const proveedorId =
      typeof apiOrder.cod_empres === "number"
        ? apiOrder.cod_empres
        : typeof apiOrder.cod_empres === "string"
          ? Number.parseInt(apiOrder.cod_empres, 10)
          : 0

    // Mapear el estado numérico al estado de texto
    let estado: WorkOrderStatus = "emitida"
    switch (apiOrder.estado) {
      case 0:
        estado = "emitida"
        break
      case 1:
        estado = "progreso"
        break
      case 2:
        estado = "revision"
        break
      case 3:
        estado = "finalizado"
        break
      default:
        estado = "emitida"
    }

    // Calcular la superficie total sumando las hectáreas de todos los rodales
    const totalHectareas = (apiOrder.rodales || []).reduce(
      (sum: number, rodal: any) => sum + (Number.parseFloat(rodal.supha) || 0),
      0,
    )

    return {
      id: apiOrder._id || apiOrder.id || Math.floor(Math.random() * 1000) + 300,
      numero: apiOrder._id?.toString() || `OT-${Math.floor(Math.random() * 1000)}`,
      fecha: (() => {
        // Intentar diferentes formatos de fecha
        const possibleDates = [
          apiOrder.fecha,
          apiOrder.fechaEmision,
          apiOrder.fecha_emision,
          apiOrder.createdAt,
          apiOrder.created_at,
        ].filter((date) => date != null)

        for (const dateValue of possibleDates) {
          try {
            // Si es un string, intentar parsearlo
            if (typeof dateValue === "string") {
              // Verificar si es una fecha ISO válida
              if (dateValue.includes("T") || dateValue.includes("-")) {
                const parsedDate = new Date(dateValue)
                if (!isNaN(parsedDate.getTime())) {
                  return parsedDate.toLocaleDateString("es-AR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })
                }
              }

              // Intentar formato DD/MM/YYYY
              if (dateValue.includes("/")) {
                const [day, month, year] = dateValue.split("/")
                const parsedDate = new Date(Number.parseInt(year), Number.parseInt(month) - 1, Number.parseInt(day))
                if (!isNaN(parsedDate.getTime())) {
                  return parsedDate.toLocaleDateString("es-AR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })
                }
              }
            }

            // Si es un número (timestamp)
            if (typeof dateValue === "number") {
              const parsedDate = new Date(dateValue)
              if (!isNaN(parsedDate.getTime())) {
                return parsedDate.toLocaleDateString("es-AR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })
              }
            }

            // Si es un objeto Date
            if (dateValue instanceof Date && !isNaN(dateValue.getTime())) {
              return dateValue.toLocaleDateString("es-AR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })
            }
          } catch (error) {
            console.warn("Error parsing date:", dateValue, error)
            continue
          }
        }

        // Si no se pudo parsear ninguna fecha, usar fecha actual
        return new Date().toLocaleDateString("es-AR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      })(),
      emisor: capitalizeFirstLetter(apiOrder.emisor || apiOrder.supervisor_nombre || "No asignado"),
      propietario: capitalizeFirstLetter(apiOrder.propietario || "No especificado"),
      propietarioId: apiOrder.cod_propie?.toString() || "",
      campo: capitalizeFirstLetter(apiOrder.campo || "No especificado"),
      campoId: apiOrder.cod_campo?.toString() || "",
      rodales:
        apiOrder.rodales?.map((rodal: any) => ({
          numero: rodal.cod_rodal?.toString() || "",
          hectareas: Number.parseFloat(rodal.supha) || 0,
          tipoUso: capitalizeFirstLetter(rodal.tipo_uso || ""),
          especie: capitalizeFirstLetter(rodal.especie || ""),
        })) || [],
      totalHectareas: totalHectareas || Number.parseFloat(apiOrder.cantidad) || 0,
      empresaServicio: capitalizeFirstLetter(apiOrder.empresa || ""),
      cuit: "",
      telefono: "",
      email: "",
      actividad: capitalizeFirstLetter(apiOrder.actividad || ""),
      actividadId: apiOrder.cod_activi?.toString() || "",
      cantidad: apiOrder.cantidad ? `${apiOrder.cantidad} ${apiOrder.unidad || "HA"}` : "0 HA",
      descripcionActividad: apiOrder.notas || "",
      aspectosSocioAmbientales: apiOrder.ambiental
        ? apiOrder.ambiental.map((a: any) => capitalizeFirstLetter(a.aspecto || ""))
        : [],
      // IMPORTANTE: Siempre inicializar como "emitida" independientemente del estado en la API
      estado: "emitida",
      proveedorAsignado: capitalizeFirstLetter(apiOrder.empresa || ""),
      proveedorId: proveedorId,
      cod_empres: proveedorId,
      supervisor_id: apiOrder.supervisor_id || apiOrder.supervisorId || null,
      mapaUrl: "/forest-canopy-map.png",
      ubicacionUrl: `https://maps.google.com/?q=-27.${Math.floor(Math.random() * 9000) + 1000},-55.${
        Math.floor(Math.random() * 9000) + 1000
      }`,
      datosActividad: {},
    }
  }, [])

  // Función para obtener todas las páginas de órdenes - CORREGIDA PARA MANEJAR LA ESTRUCTURA DE RESPUESTA
  const fetchAllOrders = useCallback(async () => {
    if (apiCallInProgress.current) return [];

    apiCallInProgress.current = true;
    try {
      // Traer la primera página
      const firstPageResponse = await workOrdersAPI.getAll({ pagina: 1 });
      let ordenes = Array.isArray(firstPageResponse.ordenes)
        ? firstPageResponse.ordenes
        : [];
      const paginas = firstPageResponse.paginacion?.paginas || 1;

      // Si hay más páginas, traerlas
      if (paginas > 1) {
        const pagePromises = [];
        for (let page = 2; page <= paginas; page++) {
          pagePromises.push(workOrdersAPI.getAll({ pagina: page }));
        }
        const pageResponses = await Promise.all(pagePromises);
        pageResponses.forEach((response) => {
          if (Array.isArray(response.ordenes)) {
            ordenes = ordenes.concat(response.ordenes);
          }
        });
      }

      localStorage.setItem(ORDERS_CACHE_KEY, JSON.stringify(ordenes));
      localStorage.setItem(ORDERS_TIMESTAMP_KEY, Date.now().toString());
      apiCallInProgress.current = false;
      return ordenes;
    } catch (error) {
      apiCallInProgress.current = false;
      return [];
    }
  }, []);

  // Cargar los avances para todas las órdenes
  const loadAllProgress = useCallback(async () => {
    if (!providerId || orders.length === 0) return {}

    try {
      // Obtener todos los avances
      const allProgress = await avancesTrabajoAPI.getAll()

      if (Array.isArray(allProgress)) {
        // Crear un objeto para almacenar el progreso total por orden
        const progressByOrder: Record<number, number> = {}

        // Procesar cada avance
        allProgress.forEach((avance) => {
          const orderId = avance.ordenTrabajoId
          const superficie = avance.superficie || 0

          // Sumar la superficie al total de la orden
          if (orderId) {
            progressByOrder[orderId] = (progressByOrder[orderId] || 0) + superficie
          }
        })

        setOrderProgress(progressByOrder)
        return progressByOrder
      }
      return {}
    } catch (error) {
      return {}
    }
  }, [providerId, orders])

  // Función para actualizar los estados de las órdenes según los avances registrados
  const updateOrderStatesBasedOnProgress = useCallback(
    (ordersToUpdate: WorkOrder[], progressByOrder: Record<number, number>): WorkOrder[] => {
      return ordersToUpdate.map((order) => {
        // Obtener el progreso total para esta orden
        const totalProgress = progressByOrder[order.id] || 0

        // REGLA 1: Si no hay avances, el estado debe ser "emitida"
        if (totalProgress === 0) {
          return { ...order, estado: "emitida" as WorkOrderStatus }
        }

        // REGLA 2: Si hay avances pero no completan la superficie total, el estado debe ser "progreso"
        if (totalProgress > 0 && totalProgress < order.totalHectareas) {
          return { ...order, estado: "progreso" as WorkOrderStatus }
        }

        // REGLA 3: Si los avances completan o superan la superficie total, el estado debe ser "revision"
        if (totalProgress >= order.totalHectareas && order.estado !== "finalizado") {
          return { ...order, estado: "revision" as WorkOrderStatus }
        }

        // Si el estado es "finalizado", mantenerlo
        return order
      })
    },
    [],
  )

  // Función para forzar una recarga de datos
  const forceRefresh = useCallback(() => {
    // Limpiar todas las cachés relacionadas con órdenes
    localStorage.removeItem(ORDERS_CACHE_KEY)
    localStorage.removeItem(ORDERS_TIMESTAMP_KEY)

    // Limpiar caché específica del proveedor
    if (providerId) {
      const cacheKey = `provider-orders-${providerId}`
      localStorage.removeItem(cacheKey)
    }

    setDataFetched(false)
  }, [providerId])

  // Fetch orders assigned to provider from API
  useEffect(() => {
    if (authLoading || !isAuthenticated) {
      return
    }

    if (dataFetched && isCacheValid()) {
      return
    }

    if (!providerId) {
      setError("ID de proveedor no disponible. No se pueden cargar órdenes.")
      setOrders([])
      setLoading(false)
      setDataFetched(true)
      return
    }

    const fetchOrders = async () => {
      if (apiCallInProgress.current) {
        return
      }
      setLoading(true)
      try {
        // Cache por proveedor
        const cacheKey = `provider-orders-${providerId}`
        const cachedOrders = localStorage.getItem(cacheKey)
        if (cachedOrders && isCacheValid()) {
          const parsedOrders = JSON.parse(cachedOrders)
          setOrders(parsedOrders)
          setError(null)
          setLoading(false)
          setDataFetched(true)
          return
        }

        // Traer todas las páginas de órdenes
        const allOrdersData = await fetchAllOrders()
        if (!allOrdersData || allOrdersData.length === 0) {
          setOrders([])
          setError("No se encontraron órdenes asignadas a este proveedor.")
          setLoading(false)
          setDataFetched(true)
          return
        }

        // Transformar y filtrar por proveedor
        const transformedOrders = allOrdersData.map((order: any) => mapOrderFromAPI(order))
       
        const filteredOrders = transformedOrders.filter((order: any) => {
          const orderProviderId =
            typeof order.cod_empres === "number"
              ? order.cod_empres
              : typeof order.cod_empres === "string"
                ? Number.parseInt(order.cod_empres, 10)
                : 0
         
          return orderProviderId === providerId
        })
       
        if (filteredOrders.length === 0) {
          setOrders([])
          setError("No se encontraron órdenes asignadas a este proveedor.")
          setLoading(false)
          setDataFetched(true)
          return
        }

        // Cargar avances y actualizar estados
        const progressData = await loadAllProgress()
        const ordersWithCorrectStates = updateOrderStatesBasedOnProgress(filteredOrders, progressData)
        setOrders(ordersWithCorrectStates)
        localStorage.setItem(cacheKey, JSON.stringify(ordersWithCorrectStates))
        setError(null)
        setLoading(false)
        setDataFetched(true)
      } catch (err) {
        setError("Error al cargar las órdenes del proveedor.")
        setOrders([])
        setLoading(false)
        setDataFetched(true)
      }
    }

    fetchOrders()
  }, [
    providerId,
    dataFetched,
    fetchAllOrders,
    mapOrderFromAPI,
    updateOrderStatesBasedOnProgress,
    isCacheValid,
    authLoading,
    isAuthenticated,
    loadAllProgress,
  ])

  // Función para obtener una orden por ID
  const getOrderById = useCallback(
    (id: number | string) => {
      const numericId = typeof id === "string" ? Number.parseInt(id, 10) : id
      return orders.find((order) => order.id === numericId) || null
    },
    [orders],
  )

  // Función para actualizar el estado de una orden
  const updateOrderStatus = useCallback(
    async (orderId: number, newStatus: WorkOrderStatus) => {
      try {
        // Actualizar localmente
        setOrders((prevOrders) =>
          prevOrders.map((order) => (order.id === orderId ? { ...order, estado: newStatus } : order)),
        )

        // Actualizar en localStorage
        if (providerId) {
          const cacheKey = `provider-orders-${providerId}`
          const cachedOrders = localStorage.getItem(cacheKey)
          if (cachedOrders) {
            const parsedOrders = JSON.parse(cachedOrders)
            const updatedOrders = parsedOrders.map((order) =>
              order.id === orderId ? { ...order, estado: newStatus } : order,
            )
            localStorage.setItem(cacheKey, JSON.stringify(updatedOrders))
          }
        }

        return { success: true }
      } catch (error) {
        return { success: false }
      }
    },
    [providerId],
  )

  return {
    orders,
    loading,
    error,
    getOrderById,
    updateOrderStatus,
    forceRefresh,
    providerId, // Exponer el ID del proveedor para depuración
    orderProgress, // Exponer el progreso de las órdenes
  }
}

// Añadir tipado para window global para el control de logs
declare global {
  interface Window {
    loggedOrderGeneration?: boolean
  }
}
