"use client"

import { useState, useEffect } from "react"
import { apiClient } from "@/lib/api-client"

interface WorkOrder {
  _id: number
  actividad: string
  campo: string
  cantidad: string
  cod_empres: number
  emisor: string
  empresa: string
  supervisor: string
  supervisor_id: number
  estado: number
  estado_nombre: string
  fecha: string
  zona: string
  propietario: string
  rodales: Array<{
    cod_rodal: number
    tipo_uso: string
    especie: string | null
    supha: string
  }>
}

interface WorkOrdersResponse {
  ordenes: WorkOrder[]
  paginacion: {
    total: number
    pagina: number
    limite: number
    paginas: number
  }
}

export function useAllWorkOrders() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAllOrders = async () => {
      setLoading(true)
      setError(null)

      try {
        console.log("🔄 Iniciando carga de todas las órdenes de trabajo...")

        // Primero obtener la primera página para saber cuántas páginas hay
        const firstPageResponse = await apiClient.get<WorkOrdersResponse>("/api/ordenesTrabajoAPI", {
          params: { pagina: 1, limite: 20 },
        })

        const { paginacion } = firstPageResponse.data
        const totalPages = paginacion.paginas

        console.log(`📊 Total de páginas: ${totalPages}, Total de órdenes: ${paginacion.total}`)

        // Crear array de promesas para todas las páginas
        const pagePromises = []
        for (let page = 1; page <= totalPages; page++) {
          pagePromises.push(
            apiClient.get<WorkOrdersResponse>("/api/ordenesTrabajoAPI", {
              params: { pagina: page, limite: 20 },
            }),
          )
        }

        // Ejecutar todas las peticiones en paralelo
        console.log(`🚀 Cargando ${totalPages} páginas en paralelo...`)
        const responses = await Promise.all(pagePromises)

        // Combinar todas las órdenes
        const allOrders: WorkOrder[] = []
        responses.forEach((response, index) => {
          console.log(`📦 Página ${index + 1}: ${response.data.ordenes.length} órdenes`)
          allOrders.push(...response.data.ordenes)
        })

        console.log(`✅ Total de órdenes cargadas: ${allOrders.length}`)
        setWorkOrders(allOrders)
      } catch (err) {
        console.error("❌ Error al cargar todas las órdenes:", err)
        setError(err instanceof Error ? err.message : "Error desconocido")
      } finally {
        setLoading(false)
      }
    }

    fetchAllOrders()
  }, [])

  return { workOrders, loading, error }
}
