"use client"

import { useState, useEffect } from "react"
import { reportesAPI } from "@/lib/api-client"

export function useReports() {
  const [ordenesPorZona, setOrdenesPorZona] = useState<any[]>([])
  const [ordenesPorEstado, setOrdenesPorEstado] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true)
      try {
        // Fetch reports in parallel
        const [zonasData, estadosData] = await Promise.all([
          reportesAPI.getOrdenesPorZona(),
          reportesAPI.getOrdenesPorEstado(),
        ])

        setOrdenesPorZona(zonasData)
        setOrdenesPorEstado(estadosData)
        setError(null)
      } catch (err) {
        console.error("Error fetching reports:", err)
        setError("Error al cargar los reportes")
      } finally {
        setLoading(false)
      }
    }

    fetchReports()
  }, [])

  // Transform data for charts
  const zonasChartData = ordenesPorZona.map((item) => ({
    zona: item.zona_nombre || "Sin zona",
    ordenes: item.cantidad || 0,
    hectareas: item.superficie_total || 0,
  }))

  const estadosChartData = ordenesPorEstado.map((item) => {
    let estado = "Pendiente"
    if (item.estado === 1) estado = "Aprobado"
    if (item.estado === 2) estado = "Finalizado"

    return {
      estado,
      value: item.cantidad || 0,
      hectareas: item.superficie_total || 0,
    }
  })

  return {
    zonasChartData,
    estadosChartData,
    loading,
    error,
  }
}
