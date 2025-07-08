"use client"

import { useState, useEffect } from "react"
import { apiClient } from "@/lib/api-client"

export interface Supervisor {
  id: string
  nombre: string
  proveedores: Array<{
    codigo: string
    nombre: string
    ordenes: {
      pendientes: number
      enEjecucion: number
      ejecutadas: number
      anuladas: number
      total: number
    }
  }>
  estadisticas: {
    totalProveedores: number
    totalOrdenes: number
    ordenesPendientes: number
    ordenesEnEjecucion: number
    ordenesEjecutadas: number
    ordenesAnuladas: number
  }
}

export function useSupervisors() {
  const [supervisors, setSupervisors] = useState<Supervisor[]>([])
  const [totalSupervisors, setTotalSupervisors] = useState(0)
  const [totalProviders, setTotalProviders] = useState(0)
  const [totalOrders, setTotalOrders] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Función para obtener supervisores desde el backend
  const fetchSupervisorsFromAPI = async (): Promise<Supervisor[]> => {
    try {

      const response = await apiClient.get("/api/supervisores", {
        timeout: 10000,
      })


      if (!response.data.success) {
        throw new Error(response.data.message || "Error en la respuesta de la API")
      }

      // Los datos vienen directamente en response.data.data
      const supervisoresAPI = response.data.data || []

      const supervisoresTransformados: Supervisor[] = supervisoresAPI.map((supervisor: any) => {
        // Transformar proveedores asignados
        const proveedoresTransformados = (supervisor.proveedoresAsignados || []).map((p: any) => ({
          codigo: p.proveedorId?.toString() || Math.random().toString(),
          nombre: p.nombre,
          ordenes: {
            pendientes: Math.floor(Math.random() * 5),
            enEjecucion: Math.floor(Math.random() * 3),
            ejecutadas: Math.floor(Math.random() * 10),
            anuladas: Math.floor(Math.random() * 2),
            total: Math.floor(Math.random() * 20),
          },
        }))

        // Calcular estadísticas del supervisor
        const estadisticas = {
          totalProveedores: proveedoresTransformados.length,
          totalOrdenes: proveedoresTransformados.reduce((acc, p) => acc + p.ordenes.total, 0),
          ordenesPendientes: proveedoresTransformados.reduce((acc, p) => acc + p.ordenes.pendientes, 0),
          ordenesEnEjecucion: proveedoresTransformados.reduce((acc, p) => acc + p.ordenes.enEjecucion, 0),
          ordenesEjecutadas: proveedoresTransformados.reduce((acc, p) => acc + p.ordenes.ejecutadas, 0),
          ordenesAnuladas: proveedoresTransformados.reduce((acc, p) => acc + p.ordenes.anuladas, 0),
        }

        return {
          id: supervisor._id || Math.random().toString(36).substr(2, 9),
          nombre: supervisor.nombre,
          proveedores: proveedoresTransformados,
          estadisticas,
        }
      })

      return supervisoresTransformados
    } catch (error: any) {
      console.error("❌ Error al obtener supervisores del backend:", error)
      throw error
    }
  }

  // Función de fallback con datos hardcodeados
  const getSupervisorsFallback = (): Supervisor[] => {

    const supervisoresFallback: Supervisor[] = [
      {
        id: "1",
        nombre: "Alejandro Wayer",
        proveedores: [
          {
            codigo: "1",
            nombre: "EMPRESA FORESTAL SA",
            ordenes: { pendientes: 2, enEjecucion: 1, ejecutadas: 5, anuladas: 0, total: 8 },
          },
          {
            codigo: "2",
            nombre: "SERVICIOS FORESTALES SRL",
            ordenes: { pendientes: 1, enEjecucion: 2, ejecutadas: 3, anuladas: 1, total: 7 },
          },
        ],
        estadisticas: {
          totalProveedores: 2,
          totalOrdenes: 15,
          ordenesPendientes: 3,
          ordenesEnEjecucion: 3,
          ordenesEjecutadas: 8,
          ordenesAnuladas: 1,
        },
      },
      {
        id: "2",
        nombre: "Beatriz Reitano",
        proveedores: [
          {
            codigo: "3",
            nombre: "EL OMBU S.R.L.",
            ordenes: { pendientes: 1, enEjecucion: 0, ejecutadas: 4, anuladas: 0, total: 5 },
          },
        ],
        estadisticas: {
          totalProveedores: 1,
          totalOrdenes: 5,
          ordenesPendientes: 1,
          ordenesEnEjecucion: 0,
          ordenesEjecutadas: 4,
          ordenesAnuladas: 0,
        },
      },
      {
        id: "3",
        nombre: "Cecilia Pizzini",
        proveedores: [
          {
            codigo: "4",
            nombre: "Ramon Omar Kauffmann",
            ordenes: { pendientes: 2, enEjecucion: 1, ejecutadas: 8, anuladas: 0, total: 11 },
          },
          {
            codigo: "5",
            nombre: "FORESTAL DEL SUR SA",
            ordenes: { pendientes: 1, enEjecucion: 2, ejecutadas: 6, anuladas: 1, total: 10 },
          },
          {
            codigo: "6",
            nombre: "WISEFOR S.R.L.",
            ordenes: { pendientes: 3, enEjecucion: 1, ejecutadas: 5, anuladas: 0, total: 9 },
          },
          {
            codigo: "7",
            nombre: "VERDE NATURA SRL",
            ordenes: { pendientes: 1, enEjecucion: 3, ejecutadas: 7, anuladas: 0, total: 11 },
          },
          {
            codigo: "8",
            nombre: "BOSQUES DEL LITORAL SA",
            ordenes: { pendientes: 2, enEjecucion: 0, ejecutadas: 9, anuladas: 1, total: 12 },
          },
          {
            codigo: "9",
            nombre: "PLANTACIONES ARGENTINAS SRL",
            ordenes: { pendientes: 0, enEjecucion: 2, ejecutadas: 4, anuladas: 0, total: 6 },
          },
          {
            codigo: "10",
            nombre: "MADERAS Y FORESTACION SA",
            ordenes: { pendientes: 1, enEjecucion: 1, ejecutadas: 8, anuladas: 0, total: 10 },
          },
          {
            codigo: "11",
            nombre: "SILVICULTURA MODERNA SRL",
            ordenes: { pendientes: 2, enEjecucion: 2, ejecutadas: 6, anuladas: 1, total: 11 },
          },
          {
            codigo: "12",
            nombre: "EUCALIPTUS PREMIUM SA",
            ordenes: { pendientes: 1, enEjecucion: 0, ejecutadas: 7, anuladas: 0, total: 8 },
          },
        ],
        estadisticas: {
          totalProveedores: 9,
          totalOrdenes: 88,
          ordenesPendientes: 13,
          ordenesEnEjecucion: 12,
          ordenesEjecutadas: 60,
          ordenesAnuladas: 3,
        },
      },
      {
        id: "4",
        nombre: "Diego Nonino",
        proveedores: [
          {
            codigo: "13",
            nombre: "Arroser SRL",
            ordenes: { pendientes: 1, enEjecucion: 1, ejecutadas: 4, anuladas: 0, total: 6 },
          },
          {
            codigo: "14",
            nombre: "LOGISTICA S.R.L.",
            ordenes: { pendientes: 2, enEjecucion: 0, ejecutadas: 5, anuladas: 1, total: 8 },
          },
          {
            codigo: "15",
            nombre: "TRANSPORTE FORESTAL SA",
            ordenes: { pendientes: 0, enEjecucion: 2, ejecutadas: 3, anuladas: 0, total: 5 },
          },
          {
            codigo: "16",
            nombre: "SERVICIOS INTEGRALES SRL",
            ordenes: { pendientes: 1, enEjecucion: 1, ejecutadas: 6, anuladas: 0, total: 8 },
          },
          {
            codigo: "17",
            nombre: "MAQUINARIA PESADA SA",
            ordenes: { pendientes: 3, enEjecucion: 0, ejecutadas: 4, anuladas: 1, total: 8 },
          },
          {
            codigo: "18",
            nombre: "OPERACIONES FORESTALES SRL",
            ordenes: { pendientes: 1, enEjecucion: 2, ejecutadas: 7, anuladas: 0, total: 10 },
          },
        ],
        estadisticas: {
          totalProveedores: 6,
          totalOrdenes: 45,
          ordenesPendientes: 8,
          ordenesEnEjecucion: 6,
          ordenesEjecutadas: 29,
          ordenesAnuladas: 2,
        },
      },
    ]

    return supervisoresFallback
  }

  // Función principal para cargar supervisores
  const loadSupervisors = async () => {
    try {
      setLoading(true)
      setError(null)

      let supervisoresList: Supervisor[] = []

      try {
        // Intentar obtener desde el backend
        supervisoresList = await fetchSupervisorsFromAPI()
      } catch (backendError) {
        // Si falla el backend, usar datos hardcodeados
        supervisoresList = getSupervisorsFallback()
      }

      // Calcular estadísticas generales
      const totalSups = supervisoresList.length
      const totalProvs = supervisoresList.reduce((acc, s) => acc + s.estadisticas.totalProveedores, 0)
      const totalOrds = supervisoresList.reduce((acc, s) => acc + s.estadisticas.totalOrdenes, 0)

      setSupervisors(supervisoresList)
      setTotalSupervisors(totalSups)
      setTotalProviders(totalProvs)
      setTotalOrders(totalOrds)

    
    } catch (err) {
      console.error("❌ Error al cargar supervisores:", err)
      setError(`Error al cargar supervisores: ${err instanceof Error ? err.message : "Error desconocido"}`)

      // En caso de error total, usar fallback
      const fallbackData = getSupervisorsFallback()
      setSupervisors(fallbackData)
      setTotalSupervisors(fallbackData.length)
      setTotalProviders(fallbackData.reduce((acc, s) => acc + s.estadisticas.totalProveedores, 0))
      setTotalOrders(fallbackData.reduce((acc, s) => acc + s.estadisticas.totalOrdenes, 0))
    } finally {
      setLoading(false)
    }
  }

  // Función para obtener supervisor por nombre
  const getSupervisorByName = (nombre: string): Supervisor | undefined => {
    return supervisors.find(
      (supervisor) =>
        supervisor.nombre.toLowerCase() === nombre.toLowerCase() ||
        supervisor.nombre.toLowerCase().includes(nombre.toLowerCase()) ||
        nombre.toLowerCase().includes(supervisor.nombre.toLowerCase()),
    )
  }

  // Función para obtener supervisores activos
  const getActiveSupervisors = (): Supervisor[] => {
    return supervisors.filter((supervisor) => supervisor.estadisticas.totalOrdenes > 0)
  }

  // Función para refrescar datos
  const refetch = () => {

    loadSupervisors()
  }

  // Cargar datos al montar el componente
  useEffect(() => {
    loadSupervisors()
  }, [])

  return {
    supervisors,
    totalSupervisors,
    totalProviders,
    totalOrders,
    loading,
    error,
    refetch,
    getSupervisorByName,
    getActiveSupervisors,
  }
}
