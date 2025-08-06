"use client"

import { useState, useEffect } from "react"
import { useAuth } from "./use-auth"
import { workOrdersAPI, avancesTrabajoAPI, apiClient } from "@/lib/api-client"

export interface SupervisorData {
  id: string
  nombre: string
  email?: string
  telefono?: string
}

export interface ProveedorData {
  id: number
  nombre: string
  razonSocial?: string
  cuit?: string
  telefono?: string
  email?: string
  empresa?: string
  fechaAsignacion?: string
}

export interface OrdenData {
  id: number
  numero: string
  fecha: string
  actividad: string
  campo: string
  proveedor: string
  proveedorId: number
  estado: string
  superficie?: number
  hectareas?: number
  descripcion?: string
  fechaInicio?: string
  fechaFin?: string
}

export interface AvanceData {
  _id?: string
  id?: string
  ordenTrabajoId: number
  numeroOrden?: string
  fecha: string
  fechaRegistro?: string
  createdAt?: string
  superficie: number
  cantidadPlantas?: number
  plantas?: number
  cuadrilla: string
  cuadrillaNombre?: string
  cantPersonal: number
  jornada: number
  observaciones?: string
  usuario?: string
  predio?: string
  campo?: string
  rodal?: string
  actividad?: string
  especie?: string
  estado: string
  proveedor?: string
  empresa?: string
  proveedorId?: number
  proveedorNombre?: string
}

export function useSupervisorData() {
  const { user } = useAuth()

  // Estados principales
  const [supervisor, setSupervisor] = useState<SupervisorData | null>(null)
  const [proveedores, setProveedores] = useState<ProveedorData[]>([])
  const [ordenes, setOrdenes] = useState<OrdenData[]>([])
  const [avances, setAvances] = useState<AvanceData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Función para obtener el ID numérico del supervisor basado en el email
  const getSupervisorIdFromEmail = (email: string): number | null => {
    const emailToIdMap: { [key: string]: number } = {
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

    return emailToIdMap[email.toLowerCase()] || null
  }

  // Función para cargar datos del supervisor
  const loadSupervisorData = async () => {
    // Usar los datos del usuario autenticado
    const supervisorData: SupervisorData = {
      id: user?.id || "supervisor-1",
      nombre: user?.nombre || "Supervisor",
      email: user?.email || "supervisor@example.com",
      telefono: user?.telefono || "+54 11 1234-5678",
    }

    setSupervisor(supervisorData)
    return supervisorData
  }

  // Función para enriquecer datos de proveedores con información completa
  const enriquecerDatosProveedores = async (proveedoresBasicos: ProveedorData[]): Promise<ProveedorData[]> => {
    try {
      const response = await apiClient.get("/api/supervisores")
      if (response.data && response.data.success) {
        const supervisoresAPI = response.data.data || []
        
        // Crear un mapa de todos los proveedores disponibles
        const proveedoresCompletos = new Map<number, any>()
        supervisoresAPI.forEach((supervisor: any) => {
          const proveedoresAsignados = supervisor.proveedoresAsignados || []
          proveedoresAsignados.forEach((p: any) => {
            const proveedorId = Number(p.proveedorId)
            if (!proveedoresCompletos.has(proveedorId)) {
              proveedoresCompletos.set(proveedorId, {
                id: proveedorId,
                nombre: p.nombre || "Sin nombre",
                razonSocial: p.nombre || "Sin razón social",
                fechaAsignacion: p.fechaAsignacion,
                cuit: p.cuit || "",
                telefono: p.telefono || "",
                email: p.email || "",
              })
            }
          })
        })

        // Enriquecer los proveedores básicos con datos completos
        return proveedoresBasicos.map(proveedor => {
          const proveedorCompleto = proveedoresCompletos.get(proveedor.id)
          if (proveedorCompleto) {
            return {
              ...proveedor,
              cuit: proveedorCompleto.cuit || proveedor.cuit,
              telefono: proveedorCompleto.telefono || proveedor.telefono,
              email: proveedorCompleto.email || proveedor.email,
            }
          }
          return proveedor
        })
      }
      return proveedoresBasicos
    } catch (err) {
      console.error("Error al enriquecer datos de proveedores:", err)
      return proveedoresBasicos
    }
  }

  // Función para cargar proveedores dinámicamente desde órdenes y avances de trabajo
  const loadProveedores = async (supervisorData: SupervisorData) => {
    try {
      // Obtener el ID del supervisor
      const supervisorId = getSupervisorIdFromEmail(supervisorData.email || "")
      if (!supervisorId) {
        console.log("No se encontró supervisorId, devolviendo array vacío")
        setProveedores([])
        return []
      }

      const proveedoresUnicos = new Map<number, any>()

      // 1. Obtener proveedores desde las órdenes de trabajo
      const responseOrdenes = await workOrdersAPI.getAll()
      let ordenesData = []

      if (responseOrdenes) {
        if (Array.isArray(responseOrdenes)) {
          ordenesData = responseOrdenes
        } else if (responseOrdenes.data && Array.isArray(responseOrdenes.data)) {
          ordenesData = responseOrdenes.data
        } else if (responseOrdenes.ordenes && Array.isArray(responseOrdenes.ordenes)) {
          ordenesData = responseOrdenes.ordenes
        } else if (responseOrdenes.results && Array.isArray(responseOrdenes.results)) {
          ordenesData = responseOrdenes.results
        }
      }

      // Filtrar órdenes por supervisor_id
      const ordenesDelSupervisor = ordenesData.filter((orden: any) => {
        return supervisorId && (orden.supervisor_id === supervisorId || orden.usuario_id === supervisorId)
      })

      console.log(`Órdenes encontradas para supervisor ${supervisorId}:`, ordenesDelSupervisor.length)

      // Extraer proveedores únicos de las órdenes del supervisor
      ordenesDelSupervisor.forEach((orden: any) => {
        const proveedorId = Number(orden.cod_empres || orden.proveedorId || orden.empresaId || 0)
        const proveedorNombre = orden.empresa || orden.proveedor || "Sin nombre"
        
        if (proveedorId && !proveedoresUnicos.has(proveedorId)) {
          proveedoresUnicos.set(proveedorId, {
            id: proveedorId,
            nombre: proveedorNombre,
            razonSocial: proveedorNombre,
            fechaAsignacion: orden.fecha || new Date().toISOString(),
            cuit: "",
            telefono: "",
            email: "",
            fuente: "orden"
          })
        }
      })

      // 2. Obtener proveedores desde los avances de trabajo
      const responseAvances = await avancesTrabajoAPI.getAll()
      let avancesData = []

      if (responseAvances) {
        if (Array.isArray(responseAvances)) {
          avancesData = responseAvances
        } else if (responseAvances.data && Array.isArray(responseAvances.data)) {
          avancesData = responseAvances.data
        } else if (responseAvances.avances && Array.isArray(responseAvances.avances)) {
          avancesData = responseAvances.avances
        } else if (responseAvances.results && Array.isArray(responseAvances.results)) {
          avancesData = responseAvances.results
        }
      }

      // Filtrar avances por supervisorId
      const avancesDelSupervisor = avancesData.filter((avance: any) => Number(avance.supervisorId) === supervisorId)
      
      console.log(`Avances encontrados para supervisor ${supervisorId}:`, avancesDelSupervisor.length)

      // Extraer proveedores únicos de los avances del supervisor
      avancesDelSupervisor.forEach((avance: any) => {
        const proveedorId = Number(avance.proveedorId || 0)
        const proveedorNombre = avance.proveedor || avance.proveedorNombre || "Sin nombre"
        
        if (proveedorId && !proveedoresUnicos.has(proveedorId)) {
          proveedoresUnicos.set(proveedorId, {
            id: proveedorId,
            nombre: proveedorNombre,
            razonSocial: proveedorNombre,
            fechaAsignacion: avance.fecha || new Date().toISOString(),
            cuit: "",
            telefono: "",
            email: "",
            fuente: "avance"
          })
        }
      })

      const proveedoresBasicos = Array.from(proveedoresUnicos.values())
      console.log(`Proveedores dinámicos encontrados para supervisor ${supervisorId}:`, proveedoresBasicos)
      console.log(`Total proveedores únicos: ${proveedoresBasicos.length}`)
      
      // Enriquecer con datos completos desde la API de supervisores
      const proveedoresData = await enriquecerDatosProveedores(proveedoresBasicos)
      
      setProveedores(proveedoresData)
      return proveedoresData
    } catch (err) {
      console.error("Error al cargar proveedores dinámicamente:", err)
      setProveedores([])
      return []
    }
  }

  // Función para cargar órdenes de trabajo
  const loadOrdenes = async (proveedoresData: ProveedorData[]) => {
    try {
      const response = await workOrdersAPI.getAll()
      let ordenesData = []

      if (response) {
        if (Array.isArray(response)) {
          ordenesData = response
        } else if (response.data && Array.isArray(response.data)) {
          ordenesData = response.data
        } else if (response.ordenes && Array.isArray(response.ordenes)) {
          ordenesData = response.ordenes
        } else if (response.results && Array.isArray(response.results)) {
          ordenesData = response.results
        }
      }

     

      // Obtener el ID del supervisor dinámicamente
      const supervisorId = getSupervisorIdFromEmail(supervisor?.email || "")
     

      // Filtrar órdenes por supervisor_id
      const ordenesFiltradas = ordenesData.filter((orden: any) => {
        // Filtrado principal por supervisor_id
        if (supervisorId && (orden.supervisor_id === supervisorId || orden.usuario_id === supervisorId)) {
          return true
        }

        // Filtrado de respaldo por nombre
        const supervisorNombre = supervisor?.nombre || ""
        if (supervisorNombre && (orden.supervisor === supervisorNombre || orden.emisor === supervisorNombre)) {
          return true
        }

        return false
      })

     

      const proveedorMap = new Map(proveedoresData.map((p) => [p.id, p]))

      // Transformar órdenes filtradas
      const ordenesTransformadas = ordenesFiltradas
        .map((orden: any) => {
          const proveedorId = Number(orden.cod_empres || orden.proveedorId || orden.empresaId || 0)
          const proveedor = proveedorMap.get(proveedorId)

          let superficieTotal = 0
          if (orden.rodales && Array.isArray(orden.rodales)) {
            superficieTotal = orden.rodales.reduce((sum: number, rodal: any) => {
              return sum + (Number(rodal.supha) || Number(rodal.superficie) || 0)
            }, 0)
          }

          if (superficieTotal === 0 && orden.cantidad) {
            superficieTotal = Number(orden.cantidad) || 0
          }

          const rawOrderId = orden._id ?? orden.id ?? orden.numero_orden ?? orden.numero ?? undefined

          let idSafe: number
          if (typeof rawOrderId === "string") {
            if (/^[a-fA-F0-9]{24}$/.test(rawOrderId)) {
              idSafe = Number.parseInt(rawOrderId.slice(-6), 16)
            } else {
              const asNum = Number(rawOrderId)
              idSafe = isNaN(asNum) ? Math.floor(Math.random() * 100000) : asNum
            }
          } else if (typeof rawOrderId === "number") {
            idSafe = rawOrderId
          } else {
            idSafe = Math.floor(Math.random() * 100000)
          }

          const numeroOrden = String(rawOrderId ?? idSafe)

          const ordenTransformada: OrdenData = {
            id: idSafe,
            numero: numeroOrden,
            fecha: orden.fecha || new Date().toISOString().split("T")[0],
            actividad: orden.actividad || orden.actividad_nombre || "Sin especificar",
            campo: orden.campo || orden.campo_nombre || "Sin especificar",
            proveedor: proveedor?.nombre || orden.empresa || "Sin asignar",
            proveedorId,
            estado: getEstadoNombre(orden.estado) || orden.estado_nombre || "Pendiente",
            superficie: superficieTotal,
            hectareas: superficieTotal,
            descripcion: orden.descripcion || orden.notas || "",
            fechaInicio: orden.fechaInicio || orden.fecha,
            fechaFin: orden.fechaFin,
          }

          return ordenTransformada
        })
        .filter(Boolean) as OrdenData[]

     
      setOrdenes(ordenesTransformadas)
      return ordenesTransformadas
    } catch (err) {
      console.error("❌ Error al cargar órdenes:", err)
      return []
    }
  }

  // Función para cargar avances
  const loadAvances = async (proveedoresData: ProveedorData[], ordenesData: OrdenData[]) => {
    try {
      const response = await avancesTrabajoAPI.getAll()
      let avancesData = []

      if (response) {
        if (Array.isArray(response)) {
          avancesData = response
        } else if (response.data && Array.isArray(response.data)) {
          avancesData = response.data
        } else if (response.avances && Array.isArray(response.avances)) {
          avancesData = response.avances
        } else if (response.results && Array.isArray(response.results)) {
          avancesData = response.results
        }
      }

      // Obtener el ID del supervisor logueado
      const supervisorId = getSupervisorIdFromEmail(user?.email || "")
      console.log('Email del usuario:', user?.email)
      console.log('Supervisor ID encontrado:', supervisorId)
      console.log('Total avances antes del filtro:', avancesData.length)
      
      if (!supervisorId) {
        console.log('No se encontró supervisorId, devolviendo array vacío')
        setAvances([])
        return []
      }

      // Filtrar avances por supervisorId
      const avancesFiltrados = avancesData.filter((avance: any) => Number(avance.supervisorId) === supervisorId)
      console.log('Avances después del filtro por supervisorId:', avancesFiltrados.length)
      
      const avancesTransformados = avancesFiltrados
        .map((avance: any) => {
          const ordenId = Number(avance.ordenTrabajoId)
          let orden = ordenesData.find((o) => o.id === ordenId)
          if (!orden) {
            // Si no encuentra la orden, crear una orden básica con datos del avance
            orden = {
              id: ordenId,
              numero: String(ordenId),
              fecha: avance.fecha || new Date().toISOString().split("T")[0],
              actividad: avance.actividad || "Sin especificar",
              campo: avance.predio || avance.campo || "Sin especificar",
              proveedor: avance.proveedor || "Sin asignar",
              proveedorId: Number(avance.proveedorId) || 0,
              estado: avance.estado || "Pendiente",
              superficie: Number(avance.superficie) || 0,
              hectareas: Number(avance.superficie) || 0,
              descripcion: avance.observaciones || "",
              fechaInicio: avance.fecha || "",
              fechaFin: avance.fecha || "",
            }
          }
          const avanceTransformado: AvanceData = {
            _id: avance._id,
            id: avance.id || avance._id,
            ordenTrabajoId: ordenId,
            numeroOrden: orden.numero,
            fecha: avance.fecha || new Date().toISOString().split("T")[0],
            fechaRegistro: avance.fechaRegistro || avance.createdAt || new Date().toISOString(),
            superficie: Number(avance.superficie) || Number(avance.cantidad) || 0,
            cantidadPlantas: Number(avance.cantidadPlantas || avance.plantas) || 0,
            cuadrilla: avance.cuadrilla || "",
            cuadrillaNombre: avance.cuadrillaNombre,
            cantPersonal: Number(avance.cantPersonal) || 0,
            jornada: Number(avance.jornada) || 0,
            observaciones: avance.observaciones || "",
            usuario: avance.usuario || "Sistema",
            predio: avance.predio || avance.campo || orden.campo,
            rodal: avance.rodal || "",
            actividad: avance.actividad || orden.actividad,
            especie: avance.especie || "",
            estado: avance.estado || "Pendiente",
            proveedor: avance.proveedor || orden.proveedor,
            proveedorId: avance.proveedorId || orden.proveedorId,
            proveedorNombre: avance.proveedorNombre || "",
          }
          return avanceTransformado
        })
     
      setAvances(avancesTransformados)
      return avancesTransformados
    } catch (err) {
      console.error("❌ Error al cargar avances:", err)
      return []
    }
  }

  // Función principal para cargar todos los datos
  const loadAllData = async () => {
    try {
      setLoading(true)
      setError(null)

     

      const supervisorData = await loadSupervisorData()
      const proveedoresData = await loadProveedores(supervisorData)
      const ordenesData = await loadOrdenes(proveedoresData)
      await loadAvances(proveedoresData, ordenesData)

     
    } catch (err) {
      console.error("❌ Error en carga de datos:", err)
      setError(`Error al cargar datos: ${err instanceof Error ? err.message : "Error desconocido"}`)
    } finally {
      setLoading(false)
    }
  }

  // Función para refrescar datos
  const refetch = () => {
   
    loadAllData()
  }

  // Cargar datos al montar el componente
  useEffect(() => {
    if (user) {
      loadAllData()
    }
  }, [user])

  // Función para obtener nombre del estado
  const getEstadoNombre = (estado: number | string): string => {
    if (typeof estado === "string") return estado

    const estados: Record<number, string> = {
      "-1": "ANULADA",
      0: "PENDIENTE",
      1: "EN EJECUCIÓN",
      2: "EJECUTADA",
      3: "CANCELADA",
      4: "FINALIZADA",
    }

    return estados[estado] || "DESCONOCIDO"
  }

  return {
    supervisor,
    proveedores,
    ordenes,
    avances,
    loading,
    error,
    refetch,
  }
}
