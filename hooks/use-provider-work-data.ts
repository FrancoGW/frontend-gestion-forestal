"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { useAuth } from "./use-auth"
import { avancesTrabajoAPI } from "@/lib/api-client"
import { useToast } from "@/components/ui/use-toast"
import type { PodaWorkData } from "@/types/provider-work-data"

export interface WorkProgressEntry {
  id: string
  orderId: number
  fecha: string
  superficie: number
  cantidadPlantas: number
  cuadrilla: string
  cantPersonal: number
  jornada: number
  observaciones?: string
  usuario: string
  createdAt: string
  predio?: string
  rodal?: string
}

export function useProviderWorkData() {
  const { user } = useAuth()
  const { toast } = useToast()
  const providerId = user?.providerId || 1
  const apiCallInProgress = useRef(false)
  const lastFetchTime = useRef<number>(0)

  // Estado para los datos
  const [workProgress, setWorkProgress] = useState<WorkProgressEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isOfflineMode, setIsOfflineMode] = useState(false)

  // Función para cargar los avances desde el servidor
  const fetchWorkProgress = useCallback(
    async (force = false) => {
      // Evitar múltiples llamadas simultáneas
      if (apiCallInProgress.current) {
        console.log("Ya hay una llamada en progreso, omitiendo...")
        return
      }

      // Verificar si debemos recargar (cada 5 minutos o forzado)
      const now = Date.now()
      if (lastFetchTime.current && !force && now - lastFetchTime.current < 5 * 60 * 1000) {
        console.log("Datos recientes, omitiendo recarga")
        return
      }

      apiCallInProgress.current = true
      setLoading(true)
      setError(null)

      try {
        console.log(`Obteniendo avances para el proveedor ${providerId}...`)

        // Llamada directa al endpoint
        const response = await avancesTrabajoAPI.getByProviderId(providerId)

        console.log("Respuesta de avances:", response)

        if (response && Array.isArray(response)) {
          // Mapear los datos del servidor al formato local
          const serverData = response.map((item) => ({
            id: item._id || item.id,
            orderId: item.ordenTrabajoId,
            fecha: item.fecha,
            superficie: item.superficie,
            cantidadPlantas: item.cantidadPlantas || 0,
            cuadrilla: item.cuadrilla || "",
            cantPersonal: item.cantPersonal || 0,
            jornada: item.jornada || 0,
            observaciones: item.observaciones || "",
            usuario: item.usuario || "Sistema",
            createdAt: item.fechaRegistro || item.createdAt || new Date().toISOString(),
            predio: item.predio || "",
            rodal: item.rodal || "",
          }))

          console.log("Datos procesados:", serverData)
          setWorkProgress(serverData)
          lastFetchTime.current = now
          setIsOfflineMode(false)
        } else {
          console.warn("Respuesta no válida:", response)
          setIsOfflineMode(true)
        }
      } catch (err) {
        console.error("Error al obtener avances:", err)
        setError("No se pudieron cargar los avances de trabajo")
        setIsOfflineMode(true)
      } finally {
        setLoading(false)
        apiCallInProgress.current = false
      }
    },
    [providerId],
  )

  // Cargar datos al iniciar (solo una vez)
  useEffect(() => {
    fetchWorkProgress()
  }, []) // Dependencias vacías para ejecutar solo una vez

  // Función para obtener avances por orden (sin logs repetitivos)
  const getWorkProgressByOrderId = useCallback(
    (orderId: number) => {
      const result = workProgress.filter((entry) => entry.orderId === orderId)
      // Solo log si es la primera vez que se busca esta orden
      if (result.length === 0) {
        console.log(`No se encontraron avances para la orden ${orderId}`)
      }
      return result
    },
    [workProgress],
  )

  // Función para obtener avances por orden directamente del servidor
  const fetchWorkProgressByOrderId = useCallback(async (orderId: number) => {
    // Evitar llamadas duplicadas
    if (apiCallInProgress.current) {
      console.log("API call in progress, skipping...")
      return []
    }

    try {
      apiCallInProgress.current = true
      console.log(`Obteniendo avances para la orden ${orderId} directamente del servidor...`)
      const response = await avancesTrabajoAPI.getByOrderId(orderId)

      if (response && Array.isArray(response)) {
        // Mapear los datos del servidor al formato local
        const serverData = response.map((item) => ({
          id: item._id || item.id,
          orderId: item.ordenTrabajoId,
          fecha: item.fecha,
          superficie: item.superficie,
          cantidadPlantas: item.cantidadPlantas || 0,
          cuadrilla: item.cuadrilla || "",
          cantPersonal: item.cantPersonal || 0,
          jornada: item.jornada || 0,
          observaciones: item.observaciones || "",
          usuario: item.usuario || "Sistema",
          createdAt: item.fechaRegistro || item.createdAt || new Date().toISOString(),
          predio: item.predio || "",
          rodal: item.rodal || "",
        }))

        console.log(`Avances obtenidos directamente para orden ${orderId}:`, serverData)

        // Actualizar el estado con los nuevos datos
        setWorkProgress((prev) => {
          // Filtrar los avances existentes para esta orden
          const filteredProgress = prev.filter((entry) => entry.orderId !== orderId)
          // Añadir los nuevos avances
          return [...filteredProgress, ...serverData]
        })

        return serverData
      }
      return []
    } catch (err) {
      console.error(`Error al obtener avances para la orden ${orderId}:`, err)
      return []
    } finally {
      apiCallInProgress.current = false
    }
  }, [])

  // Función para calcular el total de hectáreas trabajadas
  const getTotalWorkedArea = useCallback(
    (orderId: number) => {
      const entries = getWorkProgressByOrderId(orderId)
      return entries.reduce((total, entry) => total + entry.superficie, 0)
    },
    [getWorkProgressByOrderId],
  )

  // Función para calcular hectáreas trabajadas por rodal
  const getWorkedAreaByRodal = useCallback(
    (orderId: number, rodalId: string) => {
      const entries = getWorkProgressByOrderId(orderId)
      return entries.filter((entry) => entry.rodal === rodalId).reduce((total, entry) => total + entry.superficie, 0)
    },
    [getWorkProgressByOrderId],
  )

  // Función para agregar un nuevo avance
  const addWorkProgress = useCallback(
    async (orderId: number, data: PodaWorkData) => {
      try {
        setLoading(true)
        setError(null)

        console.log("🔍 DEBUGGING DATOS RECIBIDOS:")
        console.log("- orderId:", orderId)
        console.log("- data completa:", data)
        console.log("- data.cuadrilla:", data.cuadrilla)

        // Validar datos básicos
        if (!data.fecha || !data.rodal || data.superficie <= 0) {
          setError("Datos de avance incompletos o inválidos")
          return { success: false, error: "Datos de avance incompletos o inválidos" }
        }

        // Validar específicamente la cuadrilla - AHORA USANDO data.cuadrillaId
        const cuadrillaId = data.cuadrillaId
        if (!cuadrillaId || cuadrillaId.trim() === "") {
          console.error("❌ CUADRILLA ID VACÍA:")
          console.error("- data.cuadrillaId:", data.cuadrillaId)
          setError("Debe seleccionar una cuadrilla")
          return { success: false, error: "Debe seleccionar una cuadrilla" }
        }

        // Obtener el nombre del proveedor para el registro
        const providerName = user?.nombre || "Proveedor sin nombre"

        // Preparar datos para enviar al servidor - INCLUIR TODOS LOS CAMPOS DE LA PLANTILLA
        const serverData = {
          ordenTrabajoId: orderId,
          proveedorId: providerId,
          fecha: data.fecha,
          superficie: Number(data.superficie),
          cuadrillaId: data.cuadrillaId, // Send the cuadrillaId to the API
          cuadrilla: data.cuadrilla, // Also send the name for display
          cantPersonal: Number(data.cantPersonal || 0),
          jornada: Number(data.jornada || 8),
          observaciones: data.observaciones || "",
          usuario: providerName,
          rodal: data.rodal,
          actividad: data.actividad || "PLANTACION",
          // CAMPOS ESPECÍFICOS DE LA PLANTILLA DE PLANTACIÓN
          vivero: data.vivero || "",
          // ✅ CAMBIO: Asegurar que enviamos el NOMBRE de la especie
          especie: data.especie || data.especie_forestal || "",
          clon: data.clon || "",
          cantidadPlantas: Number(data.cantidadPlantas || data.plantas || 0),
          altura_poda: Number(data.altura_poda || 0),
          // CAMPOS ESPECÍFICOS DE LA PLANTILLA DE PODA
          tipoPoda: data.tipoPoda || "",
          altura_poda: Number(data.altura_poda || 0),
          plantas: Number(data.plantas || data.cantidadPlantas || 0),
          densidad_poda: Number(data.densidad || 0),
          predio: data.predio || "",
          seccion: data.seccion || "",
          // ✅ NUEVO: Incluir información de ensayo
          rodalEnsayo: data.rodalEnsayo || false,
          // CAMPOS ADICIONALES QUE PODRÍAN ESTAR EN LA PLANTILLA
          seccion: data.seccion || "",
          // Incluir cualquier campo adicional de la plantilla dinámicamente
          ...Object.keys(data).reduce((acc, key) => {
            // Incluir campos que no están ya mapeados arriba
            const mappedFields = [
              "fecha",
              "superficie",
              "cuadrilla",
              "cuadrillaId",
              "cantPersonal",
              "jornada",
              "observaciones",
              "rodal",
              "actividad",
              "vivero",
              "especie",
              "especie_forestal",
              "especie_nombre",
              "especie_forestal_nombre",
              "clon",
              "cantidadPlantas",
              "plantas",
              "altura_poda",
              "predio",
              "seccion",
              "rodalEnsayo",
              "tipoPoda",
              "densidad",
            ]

            if (!mappedFields.includes(key) && data[key] !== undefined && data[key] !== null && data[key] !== "") {
              acc[key] = data[key]
            }
            return acc
          }, {}),
        }

        console.log("📤 DATOS FINALES PARA ENVIAR:")
        console.log("- cuadrillaId:", serverData.cuadrillaId)
        console.log("- cuadrilla (nombre):", serverData.cuadrilla)
        console.log("- datos completos:", serverData)

        // Validación final antes de enviar - AHORA USANDO cuadrillaId
        if (!serverData.cuadrillaId || serverData.cuadrillaId.trim() === "") {
          console.error("❌ VALIDACIÓN FINAL FALLIDA: cuadrillaId vacío")
          setError("Error: ID de cuadrilla no válido")
          return { success: false, error: "Error: ID de cuadrilla no válido" }
        }

        try {
          // Enviar al servidor
          const response = await avancesTrabajoAPI.create(serverData)
          console.log("✅ Respuesta del servidor al crear avance:", response)

          // Mejorar la validación de la respuesta
          if (response) {
            // Crear entrada local con el ID del servidor
            const responseId = response._id || response.id || `temp-${Date.now()}`

            const newEntry: WorkProgressEntry = {
              id: responseId,
              orderId,
              fecha: data.fecha,
              superficie: Number(data.superficie),
              cantidadPlantas: Number(data.cantidadPlantas || 0),
              cuadrilla: data.cuadrilla,
              cantPersonal: Number(data.cantPersonal || 0),
              jornada: Number(data.jornada || 8),
              observaciones: data.observaciones || "",
              usuario: providerName,
              createdAt: response.fechaRegistro || new Date().toISOString(),
              predio: data.predio,
              rodal: data.rodal,
            }

            // Actualizar estado local
            setWorkProgress((prev) => [...prev, newEntry])

            toast({
              title: "Avance registrado",
              description: "El avance se ha registrado correctamente en el servidor",
            })

            return { success: true, data: newEntry }
          } else {
            throw new Error("Respuesta vacía del servidor")
          }
        } catch (apiError) {
          console.error("❌ Error detallado al enviar avance:", apiError)

          // Extraer mensaje de error detallado
          const errorMessage = "Error al registrar el avance en el servidor"
          let errorDetails = ""

          if (apiError.response?.data) {
            console.error("Respuesta de error del servidor:", apiError.response.data)

            if (typeof apiError.response.data === "string") {
              errorDetails = apiError.response.data
            } else if (apiError.response.data.message) {
              errorDetails = apiError.response.data.message
            } else if (apiError.response.data.error) {
              errorDetails = apiError.response.data.error
            }
          }

          const fullErrorMessage = errorDetails ? `${errorMessage}: ${errorDetails}` : errorMessage

          toast({
            title: "Error al registrar avance",
            description: fullErrorMessage,
            variant: "destructive",
          })

          return { success: false, error: fullErrorMessage }
        }
      } catch (err) {
        console.error("Error general al registrar avance:", err)
        const errorMessage = err.message || "Error al registrar el avance de trabajo"
        setError(errorMessage)
        return { success: false, error: errorMessage }
      } finally {
        setLoading(false)
      }
    },
    [providerId, user, toast],
  )

  // Función para sincronizar con el servidor
  const syncWithServer = useCallback(async () => {
    if (isSyncing) return { success: false, error: "Ya hay una sincronización en progreso" }

    setIsSyncing(true)

    try {
      await fetchWorkProgress(true)
      return { success: true }
    } catch (err) {
      console.error("Error al sincronizar con el servidor:", err)
      return { success: false, error: "Error al sincronizar con el servidor" }
    } finally {
      setIsSyncing(false)
    }
  }, [fetchWorkProgress, isSyncing])

  return {
    workProgress,
    loading,
    error,
    isSyncing,
    isOfflineMode,
    getWorkProgressByOrderId,
    fetchWorkProgressByOrderId,
    getTotalWorkedArea,
    getWorkedAreaByRodal,
    addWorkProgress,
    syncWithServer,
    forceRefresh: () => fetchWorkProgress(true),
  }
}
