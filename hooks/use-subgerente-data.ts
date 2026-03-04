import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { apiClient } from "@/lib/api-client"
import { workOrdersAPI, avancesTrabajoAPI, supervisorsAPI } from "@/lib/api-client"

interface SupervisorData {
  id: string
  nombre: string
  email: string
  telefono: string
  jdaId?: number
  jdaNombre?: string
}

interface ProveedorData {
  id: number
  nombre: string
  razonSocial: string
  fechaAsignacion: string
  cuit: string
  telefono: string
  email: string
}

interface OrdenData {
  id: number
  numero: string
  fecha: string
  campo: string
  actividad: string
  estado: string
  supervisor_id: number
  proveedor: string
  proveedorId: number
  superficie: number
}

interface AvanceData {
  _id: string
  ordenTrabajoId: number
  numeroOrden: string
  fecha: string
  fechaRegistro: string
  superficie: number
  cantidadPlantas: number
  cuadrilla: string
  cuadrillaNombre: string
  cantPersonal: number
  jornada: number
  observaciones: string
  usuario: string
  predio: string
  rodal: string
  actividad: string
  especie: string
  estado: string
  proveedor: string
  proveedorId: number
  proveedorNombre: string
  supervisorId: number
  supervisorNombre: string
  anioPlantacion?: number
}

interface JdaData {
  id: string
  nombre: string
  email: string
  telefono: string
  supervisoresAsignados: Array<{
    supervisorId: number
    nombre: string
    fechaAsignacion: string
  }>
}

export function useSubgerenteData() {
  const { user } = useAuth()
  const [jefesDeArea, setJefesDeArea] = useState<JdaData[]>([])
  const [supervisores, setSupervisores] = useState<SupervisorData[]>([])
  const [proveedores, setProveedores] = useState<ProveedorData[]>([])
  const [ordenes, setOrdenes] = useState<OrdenData[]>([])
  const [avances, setAvances] = useState<AvanceData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadJdasCompletos = async (jdaIds: number[]): Promise<JdaData[]> => {
    const resultados: JdaData[] = []
    for (const jdaId of jdaIds) {
      try {
        const res = await apiClient.get(`/api/jefes_de_area/${jdaId}`)
        const data = res.data
        if (data && (data._id !== undefined || data.email)) {
          resultados.push({
            id: String(data._id ?? data.id ?? ""),
            nombre: data.nombre || "",
            email: data.email || "",
            telefono: data.telefono || "",
            supervisoresAsignados: data.supervisoresAsignados || [],
          })
        }
      } catch (e) {
        console.warn(`No se pudo cargar JDA ${jdaId}:`, e)
      }
    }
    return resultados
  }

  const loadProveedores = async (supervisoresIds: number[]): Promise<ProveedorData[]> => {
    try {
      const proveedoresUnicos = new Map<number, ProveedorData>()
      let pagina = 1
      let totalPaginas = 1
      let todasLasOrdenes: any[] = []

      do {
        const response = await workOrdersAPI.getAll({ pagina, limite: 100 })
        let ordenesData: any[] = []
        if (response) {
          if (Array.isArray(response)) ordenesData = response
          else if (response.data && Array.isArray(response.data)) ordenesData = response.data
          else if (response.ordenes && Array.isArray(response.ordenes)) ordenesData = response.ordenes
        }
        todasLasOrdenes = todasLasOrdenes.concat(ordenesData)
        totalPaginas = response?.paginacion?.paginas ?? 1
        pagina++
      } while (pagina <= totalPaginas)

      const ordenesFiltradas = todasLasOrdenes.filter((orden: any) => {
        const supervisorId = Number(orden.supervisor_id || orden.supervisorId || orden.usuario_id)
        return supervisoresIds.includes(supervisorId)
      })

      ordenesFiltradas.forEach((orden: any) => {
        const proveedorId = Number(orden.cod_empres || orden.proveedorId || orden.empresaId || 0)
        const nombre = orden.empresa || orden.proveedor || "Sin nombre"
        if (proveedorId && !proveedoresUnicos.has(proveedorId)) {
          proveedoresUnicos.set(proveedorId, {
            id: proveedorId,
            nombre,
            razonSocial: nombre,
            fechaAsignacion: orden.fecha || new Date().toISOString(),
            cuit: "",
            telefono: "",
            email: "",
          })
        }
      })

      const responseAvances = await avancesTrabajoAPI.getAll()
      let avancesData: any[] = []
      if (responseAvances) {
        if (Array.isArray(responseAvances)) avancesData = responseAvances
        else if (responseAvances.data && Array.isArray(responseAvances.data)) avancesData = responseAvances.data
        else if (responseAvances.avances && Array.isArray(responseAvances.avances)) avancesData = responseAvances.avances
      }
      const avancesFiltrados = avancesData.filter((avance: any) =>
        supervisoresIds.includes(Number(avance.supervisorId))
      )
      avancesFiltrados.forEach((avance: any) => {
        const proveedorId = Number(avance.proveedorId || 0)
        const nombre = avance.proveedor || avance.proveedorNombre || "Sin nombre"
        if (proveedorId && !proveedoresUnicos.has(proveedorId)) {
          proveedoresUnicos.set(proveedorId, {
            id: proveedorId,
            nombre,
            razonSocial: nombre,
            fechaAsignacion: avance.fecha || new Date().toISOString(),
            cuit: "",
            telefono: "",
            email: "",
          })
        }
      })

      return Array.from(proveedoresUnicos.values())
    } catch (err) {
      console.error("Error al cargar proveedores (subgerente):", err)
      return []
    }
  }

  const loadOrdenes = async (supervisoresIds: number[], jdaIdsExtra: number[] = []): Promise<OrdenData[]> => {
    try {
      let pagina = 1
      let totalPaginas = 1
      let todasLasOrdenes: any[] = []

      do {
        const response = await workOrdersAPI.getAll({ pagina, limite: 100 })
        let ordenesData: any[] = []
        if (response) {
          if (Array.isArray(response)) ordenesData = response
          else if (response.data && Array.isArray(response.data)) ordenesData = response.data
          else if (response.ordenes && Array.isArray(response.ordenes)) ordenesData = response.ordenes
        }
        todasLasOrdenes = todasLasOrdenes.concat(ordenesData)
        totalPaginas = response?.paginacion?.paginas ?? 1
        pagina++
      } while (pagina <= totalPaginas)

      // Incluir órdenes de supervisores actuales Y de JDAs que antes eran supervisores
      const idsPermitidos = new Set([...supervisoresIds, ...jdaIdsExtra])
      const ordenesFiltradas = todasLasOrdenes.filter((orden: any) => {
        const supervisorId = Number(orden.supervisor_id || orden.supervisorId || orden.usuario_id)
        return idsPermitidos.has(supervisorId)
      })

      const proveedoresData = await loadProveedores(supervisoresIds)
      const proveedorMap = new Map(proveedoresData.map((p) => [p.id, p]))

      return ordenesFiltradas.map((orden: any) => {
        const proveedorId = Number(orden.proveedor_id || orden.proveedorId || orden.empresa_id || orden.cod_empres)
        const proveedor = proveedorMap.get(proveedorId)
        return {
          id: orden._id || orden.id,
          numero: orden.numero_orden?.toString() || orden._id?.toString() || orden.id?.toString(),
          fecha: orden.fecha || new Date().toISOString(),
          campo: orden.campo || orden.campo_nombre || "Sin especificar",
          actividad: orden.actividad || orden.actividad_nombre || "Sin especificar",
          estado: orden.estado_nombre?.toLowerCase() || "pendiente",
          supervisor_id: orden.supervisor_id || orden.supervisorId || orden.usuario_id || 0,
          proveedor: proveedor?.nombre || orden.empresa || "Sin proveedor",
          proveedorId,
          superficie: Number(orden.totalHectareas || orden.cantidad || 0),
        }
      })
    } catch (err) {
      console.error("Error al cargar órdenes (subgerente):", err)
      return []
    }
  }

  const loadAvances = async (
    ordenesData: OrdenData[],
    supervisoresIds: number[],
    jdaIdsNum: number[]
  ): Promise<AvanceData[]> => {
    try {
      const response = await avancesTrabajoAPI.getAll()
      let avancesData: any[] = []
      if (response) {
        if (Array.isArray(response)) avancesData = response
        else if (response.data && Array.isArray(response.data)) avancesData = response.data
        else if (response.avances && Array.isArray(response.avances)) avancesData = response.avances
      }
      const ordenIds = new Set(ordenesData.map((o) => o.id))
      const ordenMap = new Map(ordenesData.map((o) => [o.id, o]))
      const setSupervisores = new Set(supervisoresIds)
      const setJdas = new Set(jdaIdsNum)

      const avancesFiltrados = avancesData.filter((avance: any) => {
        const ordenId = Number(avance.ordenTrabajoId || avance.orden_id)
        const supervisorId = Number(avance.supervisorId ?? avance.supervisor_id ?? 0)
        if (ordenIds.has(ordenId)) return true
        if (supervisorId && setSupervisores.has(supervisorId)) return true
        if (supervisorId && setJdas.has(supervisorId)) return true
        return false
      })

      return avancesFiltrados.map((avance: any) => {
        const ordenId = Number(avance.ordenTrabajoId || avance.orden_id)
        const orden = ordenMap.get(ordenId)
        const supervisorId = Number(avance.supervisorId ?? avance.supervisor_id ?? 0)
        return {
          _id: avance._id || avance.id,
          ordenTrabajoId: ordenId,
          numeroOrden: avance.numeroOrden || orden?.numero || "",
          fecha: avance.fecha || new Date().toISOString(),
          fechaRegistro: avance.fechaRegistro || avance.createdAt || new Date().toISOString(),
          superficie: Number(avance.superficie || 0),
          cantidadPlantas: Number(avance.cantidadPlantas || 0),
          cuadrilla: avance.cuadrilla || "",
          cuadrillaNombre: avance.cuadrillaNombre || avance.cuadrilla || "",
          cantPersonal: Number(avance.cantPersonal || 0),
          jornada: Number(avance.jornada || 0),
          observaciones: avance.observaciones || "",
          usuario: avance.usuario || "Sistema",
          predio: avance.predio || orden?.campo || "",
          rodal: avance.rodal || "",
          actividad: avance.actividad || orden?.actividad || "",
          especie: avance.especie || "",
          estado: avance.estado || "Pendiente",
          proveedor: avance.proveedor || orden?.proveedor || "",
          proveedorId: Number(avance.proveedorId || orden?.proveedorId || 0),
          proveedorNombre: avance.proveedorNombre || orden?.proveedor || "",
          supervisorId,
          supervisorNombre: avance.supervisorNombre || "",
          anioPlantacion: avance.anioPlantacion ? Number(avance.anioPlantacion) : undefined,
        }
      })
    } catch (err) {
      console.error("Error al cargar avances (subgerente):", err)
      return []
    }
  }

  const loadAllData = async () => {
    if (!user || user.rol !== "subgerente") {
      setLoading(false)
      return
    }

    const asignados = user.jefesDeAreaAsignados || []
    if (asignados.length === 0) {
      setJefesDeArea([])
      setSupervisores([])
      setProveedores([])
      setOrdenes([])
      setAvances([])
      setLoading(false)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const jdaIds = asignados
        .map((a) => (typeof a.jdaId === "number" ? a.jdaId : Number(a.jdaId)))
        .filter((id) => !Number.isNaN(id) && id > 0)
      const jdas = await loadJdasCompletos(jdaIds)
      setJefesDeArea(jdas)

      const supervisoresIds: number[] = []
      let supervisoresList: SupervisorData[] = []
      jdas.forEach((jda) => {
        (jda.supervisoresAsignados || []).forEach((s: any) => {
          const sid = Number(s.supervisorId)
          if (sid && !supervisoresIds.includes(sid)) {
            supervisoresIds.push(sid)
            supervisoresList.push({
              id: String(sid),
              nombre: s.nombre || "",
              email: "",
              telefono: "",
              jdaId: Number(jda.id),
              jdaNombre: jda.nombre,
            })
          }
        })
      })

      // Buscar ex-supervisores promovidos a JDA: cruzar por email y nombre
      // para incluir su antiguo supervisorId en el filtro de avances
      try {
        const todosSupervisores: any[] = await supervisorsAPI.getAll()
        if (Array.isArray(todosSupervisores) && todosSupervisores.length > 0) {
          // Normalizar: minúsculas sin espacios para comparar
          const norm = (s?: string) => (s || "").toLowerCase().trim()
          jdas.forEach((jda) => {
            const jdaEmail = norm(jda.email)
            const jdaNombre = norm(jda.nombre)
            todosSupervisores.forEach((sup: any) => {
              const supId = Number(sup._id ?? sup.id ?? 0)
              if (!supId || supervisoresIds.includes(supId)) return
              const supEmail = norm(sup.email)
              const supNombre = norm(sup.nombre)
              // Coincidencia por email (más fiable) o por nombre completo
              if (
                (jdaEmail && supEmail && jdaEmail === supEmail) ||
                (jdaNombre && supNombre && (jdaNombre === supNombre || jdaNombre.startsWith(supNombre) || supNombre.startsWith(jdaNombre)))
              ) {
                supervisoresIds.push(supId)
                if (!supervisoresList.find((s) => s.id === String(supId))) {
                  supervisoresList.push({
                    id: String(supId),
                    nombre: jda.nombre,
                    email: jda.email,
                    telefono: "",
                    jdaNombre: jda.nombre,
                  })
                }
              }
            })
          })
        }
      } catch (_e) {
        // Si falla la carga de supervisores extra, continuamos sin ellos
      }

      const proveedoresData = await loadProveedores(supervisoresIds)
      setProveedores(proveedoresData)

      const ordenesData = await loadOrdenes(supervisoresIds, jdaIds)
      setOrdenes(ordenesData)

      const avancesData = await loadAvances(ordenesData, supervisoresIds, jdaIds)

      const idsEnLista = new Set(supervisoresList.map((s) => Number(s.id)))
      const agregados = new Map<number, string>()
      avancesData.forEach((av) => {
        const sid = Number(av.supervisorId)
        if (sid && !idsEnLista.has(sid) && !agregados.has(sid)) {
          const nombre =
            av.supervisorNombre ||
            jdas.find((j) => Number(j.id) === sid)?.nombre ||
            asignados.find((a) => Number(a.jdaId) === sid)?.nombre ||
            `Supervisor ${sid}`
          agregados.set(sid, nombre)
        }
      })
      agregados.forEach((nombre, sid) => {
        supervisoresList = [...supervisoresList, { id: String(sid), nombre, email: "", telefono: "" }]
      })

      setSupervisores(supervisoresList)
      setAvances(avancesData)
    } catch (err: any) {
      console.error("Error al cargar datos del subgerente:", err)
      setError(err.message || "Error al cargar los datos")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAllData()
  }, [user?.id, user?.jefesDeAreaAsignados?.length])

  return {
    jefesDeArea,
    supervisores,
    proveedores,
    ordenes,
    avances,
    loading,
    error,
    refetch: loadAllData,
  }
}
