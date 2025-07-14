import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { apiClient } from "@/lib/api-client"
import { workOrdersAPI, avancesTrabajoAPI } from "@/lib/api-client"

interface SupervisorData {
  id: string
  nombre: string
  email: string
  telefono: string
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

export function useJdaData() {
  const { user } = useAuth()
  const [jda, setJda] = useState<JdaData | null>(null)
  const [supervisores, setSupervisores] = useState<SupervisorData[]>([])
  const [proveedores, setProveedores] = useState<ProveedorData[]>([])
  const [ordenes, setOrdenes] = useState<OrdenData[]>([])
  const [avances, setAvances] = useState<AvanceData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Función para obtener el ID numérico del jefe de área basado en el email
  const getJdaIdFromEmail = (email: string): number | null => {
    const emailToIdMap: { [key: string]: number } = {
      "alejandro@sistema.com": 1234,
      // Agregar más mapeos según sea necesario
    }
    return emailToIdMap[email.toLowerCase()] || null
  }

  // Función para obtener datos del jefe de área
  const loadJdaData = async (): Promise<JdaData | null> => {
    if (!user?.email) return null

    try {
      // Mostrar el email y el ID que se va a buscar
      const jdaId = getJdaIdFromEmail(user.email)
      console.log("[JDA-DEBUG] Email del usuario:", user.email)
      console.log("[JDA-DEBUG] ID de jefe de área calculado:", jdaId)
      if (jdaId) {
        const response = await apiClient.get(`/api/jefes_de_area/${jdaId}`)
        console.log("[JDA-DEBUG] Respuesta cruda de la API de jefes_de_area:", response.data)
        const data = response.data.data || response.data // Soporta ambas estructuras
        if (data) {
          return {
            id: data._id || jdaId.toString(),
            nombre: data.nombre || user.nombre || "Jefe de Área",
            email: data.email || user.email,
            telefono: data.telefono || "+54 11 3333-3333",
            supervisoresAsignados: data.supervisoresAsignados || []
          }
        }
      }

      // Fallback con datos del usuario
      return {
        id: user.id || "jda-1",
        nombre: user.nombre || "Jefe de Área",
        email: user.email || "jda@sistema.com",
        telefono: user.telefono || "+54 11 3333-3333",
        supervisoresAsignados: []
      }
    } catch (err) {
      console.error("Error al cargar datos del JDA:", err)
      return null
    }
  }

  // Función para obtener supervisores asignados
  const loadSupervisores = async (jdaData: JdaData): Promise<SupervisorData[]> => {
    try {
      const response = await apiClient.get("/api/supervisores")
      if (response.data && response.data.success) {
        const supervisoresAPI = response.data.data || []
        const supervisoresIds = new Set(jdaData.supervisoresAsignados.map(s => s.supervisorId))
        
        return supervisoresAPI
          .filter((s: any) => supervisoresIds.has(s._id))
          .map((s: any) => ({
            id: s._id.toString(),
            nombre: s.nombre,
            email: s.email,
            telefono: s.telefono
          }))
      }
      return []
    } catch (err) {
      console.error("Error al cargar supervisores:", err)
      return []
    }
  }

  // Función para obtener proveedores de todos los supervisores
  const loadProveedores = async (supervisoresData: SupervisorData[]): Promise<ProveedorData[]> => {
    try {
      const response = await apiClient.get("/api/supervisores")
      if (response.data && response.data.success) {
        const supervisoresAPI = response.data.data || []
        const supervisoresIds = new Set(supervisoresData.map(s => parseInt(s.id)))
        
        const proveedoresUnicos = new Map<number, ProveedorData>()
        
        supervisoresAPI
          .filter((s: any) => supervisoresIds.has(s._id))
          .forEach((supervisor: any) => {
            const proveedoresAsignados = supervisor.proveedoresAsignados || []
            proveedoresAsignados.forEach((p: any) => {
              const proveedorId = Number(p.proveedorId)
              if (!proveedoresUnicos.has(proveedorId)) {
                proveedoresUnicos.set(proveedorId, {
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
        
        return Array.from(proveedoresUnicos.values())
      }
      return []
    } catch (err) {
      console.error("Error al cargar proveedores:", err)
      return []
    }
  }

  // Función para cargar todas las páginas de órdenes de trabajo
  const loadOrdenes = async (proveedoresData: ProveedorData[], supervisoresIds: number[]): Promise<OrdenData[]> => {
    try {
      let pagina = 1;
      let totalPaginas = 1;
      let todasLasOrdenes: any[] = [];

      do {
        const response = await workOrdersAPI.getAll({ pagina, limite: 100 });
        let ordenesData: any[] = [];
        if (response) {
          if (Array.isArray(response)) {
            ordenesData = response;
          } else if (response.data && Array.isArray(response.data)) {
            ordenesData = response.data;
          } else if (response.ordenes && Array.isArray(response.ordenes)) {
            ordenesData = response.ordenes;
          }
        }
        todasLasOrdenes = todasLasOrdenes.concat(ordenesData);
        // Detectar paginación
        if (response && response.paginacion) {
          totalPaginas = response.paginacion.paginas || 1;
        } else {
          totalPaginas = 1;
        }
        pagina++;
      } while (pagina <= totalPaginas);

      const proveedorIds = new Set(proveedoresData.map((p) => p.id));
      const proveedorMap = new Map(proveedoresData.map((p) => [p.id, p]));

      // Filtrar órdenes por supervisor_id de los supervisores asignados al JDA
      const ordenesFiltradas = todasLasOrdenes.filter((orden: any) => {
        const supervisorId = Number(orden.supervisor_id || orden.supervisorId || orden.usuario_id);
        return supervisoresIds.includes(supervisorId);
      });

      return ordenesFiltradas.map((orden: any) => {
        const proveedorId = Number(orden.proveedor_id || orden.proveedorId || orden.empresa_id || orden.cod_empres);
        const proveedor = proveedorMap.get(proveedorId);
        return {
          id: orden._id || orden.id,
          numero: orden.numero_orden?.toString() || orden._id?.toString() || orden.id?.toString(),
          fecha: orden.fecha || new Date().toISOString(),
          campo: orden.campo || orden.campo_nombre || "Sin especificar",
          actividad: orden.actividad || orden.actividad_nombre || "Sin especificar",
          estado: orden.estado_nombre?.toLowerCase() || "pendiente",
          supervisor_id: orden.supervisor_id || orden.supervisorId || orden.usuario_id || 0,
          proveedor: proveedor?.nombre || orden.empresa || "Sin proveedor",
          proveedorId: proveedorId,
          superficie: Number(orden.totalHectareas || orden.cantidad || 0)
        };
      });
    } catch (err) {
      console.error("Error al cargar órdenes:", err);
      return [];
    }
  };

  // Función para cargar avances de trabajo
  const loadAvances = async (ordenesData: OrdenData[]): Promise<AvanceData[]> => {
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
        }
      }

      const ordenIds = new Set(ordenesData.map((o) => o.id))
      const ordenMap = new Map(ordenesData.map((o) => [o.id, o]))

      // Filtrar avances por órdenes asignadas
      const avancesFiltrados = avancesData.filter((avance: any) => {
        const ordenId = Number(avance.ordenTrabajoId || avance.orden_id)
        return ordenIds.has(ordenId)
      })

      return avancesFiltrados.map((avance: any) => {
        const ordenId = Number(avance.ordenTrabajoId || avance.orden_id)
        const orden = ordenMap.get(ordenId)
        
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
          supervisorId: Number(avance.supervisorId || orden?.supervisor_id || 0),
          supervisorNombre: avance.supervisorNombre || ""
        }
      })
    } catch (err) {
      console.error("Error al cargar avances:", err)
      return []
    }
  }

  // Función principal para cargar todos los datos
  const loadAllData = async () => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      // 1. Cargar datos del JDA
      const jdaData = await loadJdaData()
      if (!jdaData) {
        throw new Error("No se pudieron cargar los datos del Jefe de Área")
      }
      setJda(jdaData)
      console.log("[JDA] Supervisores asignados al jefe de área:", jdaData.supervisoresAsignados)

      // 2. Obtener los IDs de los supervisores asignados
      const supervisoresIds = jdaData.supervisoresAsignados.map(s => Number(s.supervisorId)).filter(Boolean)
      console.log("[JDA] IDs de supervisores asignados:", supervisoresIds)

      // 3. Cargar todos los avances de trabajo
      const responseAvances = await avancesTrabajoAPI.getAll()
      let avancesData = []
      if (responseAvances) {
        if (Array.isArray(responseAvances)) {
          avancesData = responseAvances
        } else if (responseAvances.data && Array.isArray(responseAvances.data)) {
          avancesData = responseAvances.data
        } else if (responseAvances.avances && Array.isArray(responseAvances.avances)) {
          avancesData = responseAvances.avances
        }
      }
      console.log("[JDA] Total avances de trabajo cargados:", avancesData.length)

      // 4. Filtrar avances: solo los que tengan supervisorId de los supervisores del JDA
      const avancesFiltrados: AvanceData[] = avancesData.filter((avance: any) => {
        const supervisorId = Number(avance.supervisorId)
        return supervisoresIds.includes(supervisorId)
      }).map((avance: any) => {
        return {
          _id: avance._id || avance.id,
          ordenTrabajoId: Number(avance.ordenTrabajoId || avance.orden_id),
          numeroOrden: avance.numeroOrden || "",
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
          predio: avance.predio || "",
          rodal: avance.rodal || "",
          actividad: avance.actividad || "",
          especie: avance.especie || "",
          estado: avance.estado || "Pendiente",
          proveedor: avance.proveedor || "",
          proveedorId: Number(avance.proveedorId || 0),
          proveedorNombre: avance.proveedorNombre || "",
          supervisorId: Number(avance.supervisorId || 0),
          supervisorNombre: avance.supervisorNombre || ""
        }
      })
      setAvances(avancesFiltrados)
      console.log("[JDA] Avances filtrados finales:", avancesFiltrados)

      // 5. Cargar órdenes de trabajo filtradas por supervisores asignados
      const proveedoresData = await loadProveedores(supervisoresIds.map(id => ({ id: id, nombre: "", razonSocial: "", fechaAsignacion: "", cuit: "", telefono: "", email: "" })))
      const ordenesData = await loadOrdenes(proveedoresData, supervisoresIds)
      setOrdenes(ordenesData)

    } catch (err: any) {
      console.error("Error al cargar datos del JDA:", err)
      setError(err.message || "Error al cargar los datos")
    } finally {
      setLoading(false)
    }
  }

  // Función para recargar datos
  const refetch = () => {
    loadAllData()
  }

  useEffect(() => {
    loadAllData()
  }, [user])

  return {
    jda,
    supervisores,
    proveedores,
    ordenes,
    avances,
    loading,
    error,
    refetch
  }
} 