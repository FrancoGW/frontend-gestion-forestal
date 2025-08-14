"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { FilterIcon, RefreshCw, AlertTriangle, FileSpreadsheet, CheckCircle, XCircle, Clock } from "lucide-react"
import { useSupervisorData } from "@/hooks/use-supervisor-data"
import { useAuth } from "@/hooks/use-auth"
import * as XLSX from "xlsx"
import { getCuadrillaName } from "@/utils/getCuadrillaName"
import type { AvanceExtendido } from "@/types/AvanceExtendido"
import { useCuadrillas } from "@/hooks/use-cuadrillas"
import { useSupervisionState, type EstadoSupervision } from "@/hooks/use-supervision-state"
import { workOrdersAPI } from "@/lib/api-client"

type DatosTablaItem = {
  id: string;
  fecha: string;
  predio: string;
  ordenTrabajo: string;
  rodal: string;
  actividad: string;
  estado: string;
  cantidadHA: number;
  subtotal: number;
  proveedor: string;
  proveedorId?: string;
  esProgresivo: boolean;
  indicadorProgreso: string;
  numeroAvance: number;
  totalAvances: number;
  observaciones: string;
  cuadrilla: string;
  cuadrillaId?: string;
  cuadrillaNombre?: string;
  jornada: number;
  rodalHa?: number; // Added for GIS HA
};

export default function SupervisorDashboard() {
  const { user } = useAuth()
  const { supervisor, proveedores, ordenes, avances, loading, error, refetch } = useSupervisorData()
  const { cuadrillas } = useCuadrillas();
  
  // Función helper para formatear fechas en zona horaria de Argentina
  const formatearFechaArgentina = (fechaString: string): string => {
    try {
      const fecha = new Date(fechaString);
      // Ajustar para zona horaria de Argentina (UTC-3)
      const fechaArgentina = new Date(fecha.getTime() + (3 * 60 * 60 * 1000));
      return fechaArgentina.toLocaleDateString("es-AR");
    } catch (error) {
      return new Date(fechaString).toLocaleDateString("es-AR");
    }
  };
  
  // Obtener las órdenes originales (con rodales) desde la API
  const [ordenesOriginales, setOrdenesOriginales] = useState<any[]>([])
  
  // Cargar órdenes originales al montar el componente
  useEffect(() => {
    const cargarOrdenesOriginales = async () => {
      try {
        // Cargar todas las páginas de órdenes
        let pagina = 1
        let todasLasOrdenes: any[] = []
        let totalPaginas = 1
        
        do {
          const response = await workOrdersAPI.getAll({ pagina, limite: 100 })
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
          
          todasLasOrdenes = todasLasOrdenes.concat(ordenesData)
          totalPaginas = response.paginacion?.paginas || 1
          pagina++
        } while (pagina <= totalPaginas)
        
        console.log('📋 Órdenes originales cargadas:', todasLasOrdenes.length)
        console.log('📋 Ejemplo de orden:', todasLasOrdenes[0])
        
        setOrdenesOriginales(todasLasOrdenes)
      } catch (error) {
        console.error('Error cargando órdenes originales:', error)
      }
    }
    cargarOrdenesOriginales()
  }, [])
  
  const { 
    getPeriodoActual, 
    getPeriodosDisponibles, 
    getEstadoSupervision, 
    getEstadoSupervisionTexto,
    marcarEstadoSupervision,
    getAvancesPendientes,
    getAvancesAprobados,
    getAvancesRechazados,
    loading: loadingSupervision
  } = useSupervisionState(supervisor?.id || user?.id || "")

  // Estados para los filtros
  const [fechaDesde, setFechaDesde] = useState("")
  const [fechaHasta, setFechaHasta] = useState("")
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState("")
  const [rodalSeleccionado, setRodalSeleccionado] = useState("")
  const [ordenSeleccionada, setOrdenSeleccionada] = useState("")
  const [estadoSeleccionado, setEstadoSeleccionado] = useState("")
  const [actividadSeleccionada, setActividadSeleccionada] = useState("")
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState("actual")
  const [estadoSupervisionSeleccionado, setEstadoSupervisionSeleccionado] = useState("all")

  // Obtener todos los proveedores únicos de las órdenes (no solo los que están en el array proveedores)
  const todosLosProveedores = useMemo(() => {
    const proveedoresMap = new Map()

    // Agregar proveedores del array principal
    proveedores.forEach((proveedor) => {
      const key = `${proveedor.id}-${proveedor.nombre}`
      if (!proveedoresMap.has(key)) {
        proveedoresMap.set(key, {
          id: proveedor.id,
          nombre: proveedor.nombre || proveedor.razonSocial || `Proveedor ${proveedor.id}`,
        })
      }
    })

    // Agregar proveedores que aparecen en los avances, pero solo si no existen ya
    avances.forEach((avance) => {
      if (avance.proveedor) {
        const proveedorNombre = String(avance.proveedor)
        const proveedorId = avance.proveedorId || proveedorNombre
        const key = `${proveedorId}-${proveedorNombre}`

        // Solo agregar si no existe ya un proveedor con el mismo nombre
        const existeNombre = Array.from(proveedoresMap.values()).some((p) => p.nombre === proveedorNombre)

        if (!proveedoresMap.has(key) && !existeNombre) {
          proveedoresMap.set(key, {
            id: proveedorId,
            nombre: proveedorNombre,
          })
        }
      }
    })

    return Array.from(proveedoresMap.values()).sort((a, b) => String(a.nombre).localeCompare(String(b.nombre)))
  }, [proveedores, avances])

  // Obtener todos los rodales únicos
  const todosLosRodales = useMemo(() => {
    const rodalesSet = new Set()
    avances.forEach((avance) => {
      if (avance.rodal) {
        rodalesSet.add(String(avance.rodal))
      }
    })
    return Array.from(rodalesSet).sort((a, b) => String(a).localeCompare(String(b)))
  }, [avances])

  // Obtener todas las órdenes únicas
  const todasLasOrdenes = useMemo(() => {
    const ordenesSet = new Map()
    avances.forEach((avance) => {
      if (avance.numeroOrden) {
        ordenesSet.set(avance.numeroOrden, {
          numero: String(avance.numeroOrden),
          id: avance.ordenTrabajoId,
        })
      }
    })
    return Array.from(ordenesSet.values()).sort((a, b) => String(a.numero).localeCompare(String(b.numero)))
  }, [avances])

  // Estados únicos
  const todosLosEstados = ["Pendiente", "R7 (terminado)"]

  // Estados de supervisión
  const estadosSupervision = [
    { value: "all", label: "Todos los estados" },
    { value: "pendiente_revision", label: "Pendiente" },
    { value: "aprobado", label: "Aprobado" },
    { value: "rechazado", label: "Rechazado" }
  ]

  // Obtener períodos disponibles
  const periodosDisponibles = getPeriodosDisponibles()

  // Obtener todas las actividades únicas
  const todasLasActividades = useMemo(() => {
    const actividadesSet = new Set()

    // Agregar actividades de los avances
    avances.forEach((avance) => {
      if (avance.actividad) {
        actividadesSet.add(String(avance.actividad))
      }
    })

    return Array.from(actividadesSet).sort((a, b) => String(a).localeCompare(String(b)))
  }, [avances])

  // Función para obtener el nombre del proveedor seleccionado
  const getNombreProveedorSeleccionado = () => {
    if (!proveedorSeleccionado || proveedorSeleccionado === "all") {
      return "Seleccionar proveedor"
    }
    const proveedor = todosLosProveedores.find((p) => String(p.id) === proveedorSeleccionado)
    return proveedor ? proveedor.nombre : "Proveedor no encontrado"
  }

  // Función para exportar a Excel (100 % client-side)
  const exportarExcel = () => {
    if (datosTabla.length === 0) {
      alert("No hay datos para exportar")
      return
    }

    /* ------------------------------------------------------------------ */
    /* 1 ▸ Preparar datos en formato JSON → hoja de Excel                 */
    /* ------------------------------------------------------------------ */
    const excelData = datosTabla.map((item) => ({
      "FECHA REGISTRO": formatearFechaArgentina(item.fecha),
      PROVEEDOR: item.proveedor,
      PREDIOS: item.predio,
      "ORDEN TR": item.ordenTrabajo,
      RODAL: item.rodal,
      ACTIVIDAD: item.actividad,
      PROGRESO: item.indicadorProgreso,
      ESTADO: item.estado,
      "ESTADO SUPERVISIÓN": getEstadoSupervisionTexto(getEstadoSupervision(item.id)),
      "CANTIDAD (HA)": Number(item.cantidadHA),
      "GIS HA": item.rodalHa ? Number(item.rodalHa) : "-",
      SUBTOTAL: Number(item.subtotal),
      CUADRILLA: item.cuadrillaNombre || item.cuadrilla || "Sin cuadrilla",
      JORNADA: Number(item.jornada),
      OBSERVACIONES: item.observaciones,
    }))

    excelData.push({
      "FECHA REGISTRO": "",
      PREDIOS: "",
      "ORDEN TR": "",
      RODAL: "",
      ACTIVIDAD: "",
      PROGRESO: "",
      ESTADO: "TOTALES:",
      "ESTADO SUPERVISIÓN": "",
      "CANTIDAD (HA)": Number(totales.totalHA),
      "GIS HA": "",
      SUBTOTAL: Number(totales.totalSubtotal),
      PROVEEDOR: "",
      CUADRILLA: "",
      JORNADA: 0,
      OBSERVACIONES: "",
    })

    /* ------------------------------------------------------------------ */
    /* 2 ▸ Crear libro/hojas con XLSX utils                               */
    /* ------------------------------------------------------------------ */
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(excelData)

    // Ajuste opcional del ancho de columnas
    ws["!cols"] = [
      { wch: 15 }, // FECHA REGISTRO
      { wch: 20 }, // PROVEEDOR
      { wch: 12 }, // PREDIOS
      { wch: 10 }, // ORDEN TR
      { wch: 30 }, // RODAL
      { wch: 12 }, // ACTIVIDAD
      { wch: 15 }, // PROGRESO
      { wch: 15 }, // ESTADO
      { wch: 18 }, // ESTADO SUPERVISIÓN
      { wch: 12 }, // CANTIDAD (HA)
      { wch: 10 }, // GIS HA
      { wch: 25 }, // SUBTOTAL
      { wch: 15 }, // CUADRILLA
      { wch: 10 }, // JORNADA
      { wch: 30 }, // OBSERVACIONES (ahora última columna)
    ]
    XLSX.utils.book_append_sheet(wb, ws, "Avances Progresivos")

    /* Hoja de resumen --------------------------------------------------- */
    const resumenData = [
      { CONCEPTO: "Total Registros", VALOR: Number(totales.totalRegistros) },
      { CONCEPTO: "Total Hectáreas", VALOR: Number(totales.totalHA) },
      { CONCEPTO: "Avances Progresivos", VALOR: Number(totales.totalProgresivos) },
      { CONCEPTO: "Terminados", VALOR: Number(totales.totalCompletos) },
      { CONCEPTO: "Pendientes", VALOR: Number(totales.totalPendientes) },
      { CONCEPTO: "Pendientes Revisión", VALOR: Number(totales.totalPendientesRevision) },
      { CONCEPTO: "Aprobados", VALOR: Number(totales.totalAprobados) },
      { CONCEPTO: "Rechazados", VALOR: Number(totales.totalRechazados) },
      { CONCEPTO: "Órdenes Únicas", VALOR: Number(totales.ordenesUnicas) },
      { CONCEPTO: "Proveedores Únicos", VALOR: Number(totales.proveedoresUnicos) },
    ]

    if (
      fechaDesde ||
      fechaHasta ||
      proveedorSeleccionado ||
      rodalSeleccionado ||
      ordenSeleccionada ||
      estadoSeleccionado ||
      actividadSeleccionada
    ) {
      resumenData.push({ CONCEPTO: "", VALOR: "" })
      resumenData.push({ CONCEPTO: "FILTROS APLICADOS", VALOR: "" })

      if (fechaDesde)
        resumenData.push({ CONCEPTO: "Fecha Desde", VALOR: new Date(fechaDesde).toLocaleDateString("es-AR") })
      if (fechaHasta)
        resumenData.push({ CONCEPTO: "Fecha Hasta", VALOR: new Date(fechaHasta).toLocaleDateString("es-AR") })
      if (proveedorSeleccionado && proveedorSeleccionado !== "all") {
        const prov = todosLosProveedores.find((p) => String(p.id) === proveedorSeleccionado)
        resumenData.push({ CONCEPTO: "Proveedor", VALOR: prov?.nombre ?? proveedorSeleccionado })
      }
      if (rodalSeleccionado && rodalSeleccionado !== "all")
        resumenData.push({ CONCEPTO: "Rodal", VALOR: rodalSeleccionado })
      if (ordenSeleccionada && ordenSeleccionada !== "all")
        resumenData.push({ CONCEPTO: "Orden", VALOR: ordenSeleccionada })
      if (estadoSeleccionado && estadoSeleccionado !== "all")
        resumenData.push({ CONCEPTO: "Estado", VALOR: estadoSeleccionado })
      if (actividadSeleccionada && actividadSeleccionada !== "all")
        resumenData.push({ CONCEPTO: "Actividad", VALOR: actividadSeleccionada })
    }

    const wsResumen = XLSX.utils.json_to_sheet(resumenData)
    wsResumen["!cols"] = [{ wch: 25 }, { wch: 20 }]
    XLSX.utils.book_append_sheet(wb, wsResumen, "Resumen")

    /* ------------------------------------------------------------------ */
    /* 3 ▸ Generar ArrayBuffer y descargar como Blob (sin fs/Deno)        */
    /* ------------------------------------------------------------------ */
    const wbArray = XLSX.write(wb, { bookType: "xlsx", type: "array" })
    const blob = new Blob([wbArray], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })

    // Generar nombre de archivo
    let fileName = "resumen_avances_supervisor"
    if (fechaDesde || fechaHasta) fileName += `_${fechaDesde || "inicio"}_${fechaHasta || "fin"}`
    if (proveedorSeleccionado && proveedorSeleccionado !== "all") {
      const prov = todosLosProveedores.find((p) => String(p.id) === proveedorSeleccionado)
      if (prov) fileName += `_${prov.nombre.replace(/[^a-zA-Z0-9]/g, "_")}`
    }
    fileName += `_${new Date().toISOString().split("T")[0]}.xlsx`

    // Crear link temporal para descarga
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Función para limpiar filtros
  const limpiarFiltros = () => {
    setFechaDesde("")
    setFechaHasta("")
    setProveedorSeleccionado("")
    setRodalSeleccionado("")
    setOrdenSeleccionada("")
    setEstadoSeleccionado("")
    setActividadSeleccionada("")
    setPeriodoSeleccionado("actual")
    setEstadoSupervisionSeleccionado("all")
  }

  // Datos filtrados y procesados para la tabla con lógica de avances progresivos
  const datosTabla = useMemo(() => {
    console.log('Total avances disponibles:', avances.length)
    console.log('Período seleccionado:', periodoSeleccionado)
    
    let avancesFiltrados = [...avances]

    // Filtrar por período - solo si no es "actual" (que muestra todos)
    if (periodoSeleccionado !== "actual" && periodoSeleccionado !== "personalizado") {
      const periodoSeleccionadoObj = periodosDisponibles.find(p => {
        if (periodoSeleccionado === "anterior") return p.nombre.includes("Anterior")
        if (periodoSeleccionado === "siguiente") return p.nombre.includes("Siguiente")
        return false
      })
      
      if (periodoSeleccionadoObj) {
        const desdeStr = periodoSeleccionadoObj.desde.toISOString().split('T')[0]
        const hastaStr = periodoSeleccionadoObj.hasta.toISOString().split('T')[0]
        avancesFiltrados = avancesFiltrados.filter((avance) => {
          const avanceFecha = avance.fecha || avance.fechaRegistro || new Date().toISOString().split('T')[0]
          return avanceFecha >= desdeStr && avanceFecha <= hastaStr
        })
      }
    } else if (periodoSeleccionado === "personalizado") {
      // Filtrar por fecha personalizada
      if (fechaDesde) {
        avancesFiltrados = avancesFiltrados.filter((avance) => avance.fecha >= fechaDesde)
      }
      if (fechaHasta) {
        avancesFiltrados = avancesFiltrados.filter((avance) => avance.fecha <= fechaHasta)
      }
    }
    // Si es "actual", no filtrar por fecha (mostrar todos)
    
    console.log('Avances después del filtro de período:', avancesFiltrados.length)

    // Filtrar por proveedor
    if (proveedorSeleccionado && proveedorSeleccionado !== "all" && proveedorSeleccionado !== "") {
      avancesFiltrados = avancesFiltrados.filter((avance) => {
        return Number(avance.proveedorId) === Number(proveedorSeleccionado)
      })
    }

    // Filtrar por rodal
    if (rodalSeleccionado && rodalSeleccionado !== "all") {
      avancesFiltrados = avancesFiltrados.filter((avance) => String(avance.rodal) === rodalSeleccionado)
    }

    // Filtrar por orden
    if (ordenSeleccionada && ordenSeleccionada !== "all") {
      avancesFiltrados = avancesFiltrados.filter((avance) => String(avance.numeroOrden) === ordenSeleccionada)
    }

    // Filtrar por estado
    if (estadoSeleccionado && estadoSeleccionado !== "all") {
      avancesFiltrados = avancesFiltrados.filter((avance) => String(avance.estado) === estadoSeleccionado)
    }

    // Filtrar por actividad
    if (actividadSeleccionada && actividadSeleccionada !== "all") {
      avancesFiltrados = avancesFiltrados.filter((avance) => String(avance.actividad) === actividadSeleccionada)
    }

    // Procesar avances progresivos
    const avancesProgresivos: DatosTablaItem[] = []

    // Agrupar por clave base (predio-orden-rodal-actividad) para identificar trabajos relacionados
    const gruposPorClave = new Map()

    avancesFiltrados.forEach((avance) => {
      const claveBase = `${avance.predio || "Sin especificar"}-${avance.numeroOrden || avance.ordenTrabajoId}-${avance.rodal || "Sin especificar"}-${avance.actividad || "Sin especificar"}`

      if (!gruposPorClave.has(claveBase)) {
        gruposPorClave.set(claveBase, [])
      }

      gruposPorClave.get(claveBase).push(avance)
    })

    // Procesar cada grupo para mostrar avances progresivos
    gruposPorClave.forEach((grupo, claveBase) => {
      // Ordenar por fecha para mostrar progresión temporal
      grupo.sort((a: any, b: any) => {
        const fechaA = new Date(a.fecha || a.fechaRegistro || new Date())
        const fechaB = new Date(b.fecha || b.fechaRegistro || new Date())
        return fechaA.getTime() - fechaB.getTime()
      })

      // Determinar si hay avances progresivos (múltiples registros para la misma tarea)
      const tieneAvancesProgresivos = grupo.length > 1

      grupo.forEach((avance: any, index: number) => {
        console.log('🔍 Procesando avance:', {
          numeroOrden: avance.numeroOrden,
          ordenTrabajoId: avance.ordenTrabajoId,
          rodal: avance.rodal,
          predio: avance.predio
        });
        const estado = avance.estado || "Pendiente"
        const indicadorProgreso = `${index + 1}/${grupo.length}`
        // En el mapeo de avances progresivos (dentro de datosTabla):
        // Reemplazar la lógica de proveedorNombre por:
        let proveedorNombre = "Sin asignar";
        if (avance.proveedorNombre) {
          proveedorNombre = String(avance.proveedorNombre);
        } else if (avance.proveedor) {
          proveedorNombre = String(avance.proveedor);
        } else if (avance.proveedorId) {
          proveedorNombre = String(avance.proveedorId);
        }
        // Usar cuadrillaNombre si existe, si no cuadrilla, si no 'Sin cuadrilla'
        let cuadrillaNombre = avance.cuadrillaNombre || avance.cuadrilla || "Sin cuadrilla"
        
        // Buscar la orden de trabajo correspondiente en las órdenes originales
        // El avance.numeroOrden contiene el _id de la orden de trabajo
        const orden = ordenesOriginales.find((o) => {
          const ordenId = String(o._id || "");
          const avanceOrdenId = String(avance.numeroOrden || avance.ordenTrabajoId || "");
          
          return ordenId === avanceOrdenId;
        });
        
        // Buscar el rodal correspondiente dentro de la orden
        let rodalHa = undefined;
        if (orden && Array.isArray(orden.rodales)) {
          const rodalObj = orden.rodales.find((r: any) => {
            // Buscar por cod_rodal que es el campo correcto según la estructura
            const rodalCodigo = String(r.cod_rodal || "");
            const avanceRodal = String(avance.rodal || "");
            
            return rodalCodigo === avanceRodal;
          });
          
          if (rodalObj) {
            // Obtener el valor de supha que contiene las hectáreas
            rodalHa = Number(rodalObj.supha || 0);
            
            // Log para depuración
            console.log(`✅ Encontrado rodal ${avance.rodal} en orden ${avance.numeroOrden}:`, {
              rodal: avance.rodal,
              orden: avance.numeroOrden,
              rodalHa: rodalHa,
              rodalObj: rodalObj
            });
          } else {
            // Log para depuración cuando no se encuentra el rodal
            console.log(`❌ No se encontró rodal ${avance.rodal} en orden ${avance.numeroOrden}`, {
              rodal: avance.rodal,
              orden: avance.numeroOrden,
              ordenRodales: orden.rodales
            });
          }
        } else {
          // Log para depuración cuando no se encuentra la orden
          console.log(`❌ No se encontró orden para avance:`, {
            rodal: avance.rodal,
            orden: avance.numeroOrden,
            ordenesDisponibles: ordenesOriginales.length
          });
        }
        
        avancesProgresivos.push({
          id: avance._id || avance.id || `${claveBase}-${index}`,
          fecha: avance.fecha || avance.fechaRegistro || new Date().toISOString().split("T")[0],
          predio: String(avance.predio || avance.campo || "Sin especificar"),
          ordenTrabajo: String(avance.numeroOrden || avance.ordenTrabajoId),
          rodal: String(avance.rodal || "Sin especificar"),
          actividad: String(avance.actividad || "Sin especificar"),
          estado: String(estado),
          cantidadHA: Number(avance.superficie ?? 0),
          subtotal: Number(avance.superficie ?? 0),
          proveedor: proveedorNombre,
          proveedorId: avance.proveedorId ? String(avance.proveedorId) : undefined,
          esProgresivo: tieneAvancesProgresivos,
          indicadorProgreso,
          numeroAvance: index + 1,
          totalAvances: grupo.length,
          observaciones: String(avance.observaciones || ""),
          cuadrilla: String(avance.cuadrilla || ""),
          cuadrillaId: avance.cuadrillaId ? String(avance.cuadrillaId) : undefined,
          cuadrillaNombre: cuadrillaNombre,
          jornada: Number(avance.jornada) || 0,
          rodalHa: rodalHa,
        })
      })
    })

    // Filtrar por estado de supervisión
    let avancesFiltradosPorSupervision = avancesProgresivos
    if (estadoSupervisionSeleccionado && estadoSupervisionSeleccionado !== "all") {
      avancesFiltradosPorSupervision = avancesProgresivos.filter((item) => {
        const estadoSupervision = getEstadoSupervision(item.id)
        return estadoSupervision === estadoSupervisionSeleccionado
      })
    }

    console.log('Avances progresivos finales:', avancesFiltradosPorSupervision.length)

    // Ordenar por predio, luego por orden, luego por rodal, luego por fecha
    return avancesFiltradosPorSupervision.sort((a, b) => {
      if (a.predio !== b.predio) return a.predio.localeCompare(b.predio)
      if (a.ordenTrabajo !== b.ordenTrabajo) return a.ordenTrabajo.localeCompare(b.ordenTrabajo)
      if (a.rodal !== b.rodal) return a.rodal.localeCompare(b.rodal)
      return new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
    })
  }, [
    avances,
    fechaDesde,
    fechaHasta,
    periodoSeleccionado,
    periodosDisponibles,
    proveedorSeleccionado,
    rodalSeleccionado,
    ordenSeleccionada,
    estadoSeleccionado,
    actividadSeleccionada,
    estadoSupervisionSeleccionado,
    getEstadoSupervision,
    proveedores,
    cuadrillas,
    ordenes,
    ordenesOriginales,
  ])

  // Calcular totales
  const totales = useMemo(() => {
    const totalRegistros = datosTabla.length
    const totalHA = datosTabla.reduce((sum, item) => sum + item.cantidadHA, 0)
    const totalSubtotal = datosTabla.reduce((sum, item) => sum + item.subtotal, 0)

    // Contar avances progresivos (aquellos que tienen más de 1 avance para la misma tarea)
    const totalProgresivos = datosTabla.filter((item) => item.esProgresivo && item.totalAvances > 1).length

    // Contar por estado
    const totalCompletos = datosTabla.filter((item) => item.estado === "R7 (terminado)").length
    const totalPendientes = datosTabla.filter((item) => item.estado === "Pendiente").length

    // Contar por estado de supervisión
    const totalPendientesRevision = datosTabla.filter((item) => getEstadoSupervision(item.id) === "pendiente_revision").length
    const totalAprobados = datosTabla.filter((item) => getEstadoSupervision(item.id) === "aprobado").length
    const totalRechazados = datosTabla.filter((item) => getEstadoSupervision(item.id) === "rechazado").length

    // Contar órdenes únicas
    const ordenesUnicas = new Set(datosTabla.map((item) => item.ordenTrabajo)).size

    // Contar proveedores únicos
    const proveedoresUnicos = new Set(datosTabla.map((item) => item.proveedor)).size

    return {
      totalRegistros,
      totalHA,
      totalSubtotal,
      totalProgresivos,
      totalCompletos,
      totalPendientes,
      totalPendientesRevision,
      totalAprobados,
      totalRechazados,
      ordenesUnicas,
      proveedoresUnicos,
    }
  }, [datosTabla, getEstadoSupervision])

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-red-600">VISTA PARA EL SUPERVISOR</h1>
          <p className="text-muted-foreground">
            Bienvenido, {supervisor?.nombre || user?.nombre || "Supervisor"} | Resumen de Avances
          </p>
        </div>
        <Button onClick={refetch} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FilterIcon className="h-5 w-5" />
            Filtros de Búsqueda
          </CardTitle>
          <CardDescription>Selecciona los criterios para filtrar los datos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-9 gap-4 items-end mb-4">
            <div className="space-y-2">
              <Label htmlFor="periodo" className="text-sm font-medium bg-blue-200 px-2 py-1 rounded">
                Período
              </Label>
              <Select value={periodoSeleccionado} onValueChange={setPeriodoSeleccionado}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="anterior">Período Anterior</SelectItem>
                  <SelectItem value="actual">Período Actual</SelectItem>
                  <SelectItem value="siguiente">Período Siguiente</SelectItem>
                  <SelectItem value="personalizado">Fechas Personalizadas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {periodoSeleccionado === "personalizado" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="fecha-desde" className="text-sm font-medium bg-yellow-200 px-2 py-1 rounded">
                    Desde
                  </Label>
                  <Input
                    id="fecha-desde"
                    type="date"
                    value={fechaDesde}
                    onChange={(e) => setFechaDesde(e.target.value)}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fecha-hasta" className="text-sm font-medium bg-yellow-200 px-2 py-1 rounded">
                    Hasta
                  </Label>
                  <Input
                    id="fecha-hasta"
                    type="date"
                    value={fechaHasta}
                    onChange={(e) => setFechaHasta(e.target.value)}
                    className="w-full"
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="proveedor" className="text-sm font-medium bg-yellow-200 px-2 py-1 rounded">
                EMSEFOR
              </Label>
              <Select value={proveedorSeleccionado} onValueChange={setProveedorSeleccionado}>
                <SelectTrigger>
                  <SelectValue>{getNombreProveedorSeleccionado()}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los proveedores</SelectItem>
                  {proveedores.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>{p.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rodal" className="text-sm font-medium bg-green-200 px-2 py-1 rounded">
                Rodal
              </Label>
              <Select value={rodalSeleccionado} onValueChange={setRodalSeleccionado}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar rodal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los rodales</SelectItem>
                  {todosLosRodales.map((rodal) => (
                    <SelectItem key={rodal} value={String(rodal)}>
                      {rodal}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="orden" className="text-sm font-medium bg-blue-200 px-2 py-1 rounded">
                Orden
              </Label>
              <Select value={ordenSeleccionada} onValueChange={setOrdenSeleccionada}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar orden" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las órdenes</SelectItem>
                  {todasLasOrdenes.map((orden) => (
                    <SelectItem key={orden.numero} value={String(orden.numero)}>
                      {orden.numero}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="estado" className="text-sm font-medium bg-purple-200 px-2 py-1 rounded">
                Estado
              </Label>
              <Select value={estadoSeleccionado} onValueChange={setEstadoSeleccionado}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  {todosLosEstados.map((estado) => (
                    <SelectItem key={estado} value={estado}>
                      {estado}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="actividad" className="text-sm font-medium bg-pink-200 px-2 py-1 rounded">
                Actividad
              </Label>
              <Select value={actividadSeleccionada} onValueChange={setActividadSeleccionada}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar actividad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las actividades</SelectItem>
                  {todasLasActividades.map((actividad) => (
                    <SelectItem key={actividad} value={String(actividad)}>
                      {actividad}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="estado-supervision" className="text-sm font-medium bg-red-200 px-2 py-1 rounded">
                Estado Supervisión
              </Label>
              <Select value={estadoSupervisionSeleccionado} onValueChange={setEstadoSupervisionSeleccionado}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  {estadosSupervision.map((estado) => (
                    <SelectItem key={estado.value} value={estado.value}>
                      {estado.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button onClick={limpiarFiltros} variant="outline" size="sm">
              Limpiar Filtros
            </Button>
            <Button onClick={exportarExcel} variant="outline" size="sm" disabled={datosTabla.length === 0}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Exportar Excel
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resumen de filtros aplicados */}
      {(periodoSeleccionado !== "actual" ||
        (periodoSeleccionado === "personalizado" && (fechaDesde || fechaHasta)) ||
        proveedorSeleccionado ||
        rodalSeleccionado ||
        ordenSeleccionada ||
        estadoSeleccionado ||
        actividadSeleccionada ||
        estadoSupervisionSeleccionado !== "all") && (
        <div className="flex flex-wrap gap-2">
          {periodoSeleccionado !== "actual" && (
            <Badge variant="secondary">
              Período: {periodoSeleccionado === "anterior" ? "Anterior" : 
                       periodoSeleccionado === "siguiente" ? "Siguiente" : 
                       periodoSeleccionado === "personalizado" ? "Personalizado" : "Actual"}
            </Badge>
          )}
          {periodoSeleccionado === "personalizado" && fechaDesde && (
            <Badge variant="secondary">Desde: {new Date(fechaDesde).toLocaleDateString("es-AR")}</Badge>
          )}
          {periodoSeleccionado === "personalizado" && fechaHasta && (
            <Badge variant="secondary">Hasta: {new Date(fechaHasta).toLocaleDateString("es-AR")}</Badge>
          )}
          {proveedorSeleccionado && proveedorSeleccionado !== "all" && (
            <Badge variant="secondary">
              Proveedor: {proveedores.find((p) => String(p.id) === proveedorSeleccionado)?.nombre}
            </Badge>
          )}
          {rodalSeleccionado && rodalSeleccionado !== "all" && (
            <Badge variant="secondary">Rodal: {rodalSeleccionado}</Badge>
          )}
          {ordenSeleccionada && ordenSeleccionada !== "all" && (
            <Badge variant="secondary">Orden: {ordenSeleccionada}</Badge>
          )}
          {estadoSeleccionado && estadoSeleccionado !== "all" && (
            <Badge variant="secondary">Estado: {estadoSeleccionado}</Badge>
          )}
          {actividadSeleccionada && actividadSeleccionada !== "all" && (
            <Badge variant="secondary">Actividad: {actividadSeleccionada}</Badge>
          )}
          {estadoSupervisionSeleccionado && estadoSupervisionSeleccionado !== "all" && (
            <Badge variant="secondary">
              Estado Supervisión: {estadosSupervision.find(e => e.value === estadoSupervisionSeleccionado)?.label}
            </Badge>
          )}
        </div>
      )}

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-9 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{totales.totalRegistros}</div>
            <div className="text-sm text-muted-foreground">Registros</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{totales.totalHA.toFixed(1)}</div>
            <div className="text-sm text-muted-foreground">Total Hectáreas</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{totales.totalProgresivos}</div>
            <div className="text-sm text-muted-foreground">Avances Progresivos</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{totales.totalCompletos}</div>
            <div className="text-sm text-muted-foreground">Terminados</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{totales.totalPendientes}</div>
            <div className="text-sm text-muted-foreground">Pendientes</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{totales.totalPendientesRevision}</div>
            <div className="text-sm text-muted-foreground">Pendientes Revisión</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{totales.totalAprobados}</div>
            <div className="text-sm text-muted-foreground">Aprobados</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{totales.totalRechazados}</div>
            <div className="text-sm text-muted-foreground">Rechazados</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{totales.ordenesUnicas}</div>
            <div className="text-sm text-muted-foreground">Órdenes Únicas</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de datos */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen de Avances</CardTitle>
          <CardDescription>
            {loading ? (
              "Cargando datos..."
            ) : (
              <>
                Mostrando {datosTabla.length} registros de {totales.ordenesUnicas} órdenes | {totales.proveedoresUnicos}{" "}
                proveedores | Total: {totales.totalHA.toFixed(2)} ha | Progresivos: {totales.totalProgresivos} |
                Terminados: {totales.totalCompletos} | Pendientes: {totales.totalPendientes}
              </>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-blue-50">
                  <TableHead className="font-bold bg-green-200">Fech. Registo</TableHead>
                  <TableHead className="font-bold bg-pink-200">Prov.</TableHead>
                  <TableHead className="font-bold bg-yellow-200">Predios</TableHead>
                  <TableHead className="font-bold bg-blue-200">Ord. Tr.</TableHead>
                  <TableHead className="font-bold bg-blue-200">Rodal</TableHead>
                  <TableHead className="font-bold bg-blue-200">Act.</TableHead>
                  <TableHead className="font-bold bg-orange-200">Progreso</TableHead>
                  <TableHead className="font-bold bg-purple-200">Estado</TableHead>
                  <TableHead className="font-bold bg-red-200">Esta. Sup</TableHead>
                  <TableHead className="font-bold bg-blue-200 text-right">Cantidad (ha)</TableHead>
                  <TableHead className="font-bold bg-blue-200 text-right">Gis. HA</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {datosTabla.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center py-8 text-muted-foreground">
                      No se encontraron registros con los filtros aplicados
                    </TableCell>
                  </TableRow>
                ) : (
                  datosTabla.map((item, index: number) => (
                    <TableRow
                      key={String(item.id)}
                      className={`hover:bg-gray-50 ${
                        item.esProgresivo
                          ? item.numeroAvance === 1
                            ? "border-l-4 border-l-blue-500"
                            : "border-l-4 border-l-gray-300"
                          : ""
                      }`}
                    >
                      <TableCell className="text-sm">{formatearFechaArgentina(item.fecha)}</TableCell>
                      <TableCell className="font-medium">{item.proveedor}</TableCell>
                      <TableCell className="font-medium">{item.predio}</TableCell>
                      <TableCell>{item.ordenTrabajo}</TableCell>
                      <TableCell>{item.rodal}</TableCell>
                      <TableCell>{item.actividad}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            item.esProgresivo
                              ? "bg-blue-100 text-blue-800 border-blue-300"
                              : "bg-gray-100 text-gray-600"
                          }
                        >
                          {item.indicadorProgreso}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={item.estado === "R7 (terminado)" ? "default" : "secondary"}
                          className={
                            item.estado === "R7 (terminado)"
                              ? "bg-green-500 hover:bg-green-600"
                              : "bg-yellow-500 hover:bg-yellow-600 text-black"
                          }
                        >
                          {item.estado}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Select
                            value={getEstadoSupervision(item.id)}
                            onValueChange={(value) => 
                              marcarEstadoSupervision(item.id, value as EstadoSupervision)
                            }
                          >
                            <SelectTrigger className="w-36">
                              <SelectValue>
                                {getEstadoSupervisionTexto(getEstadoSupervision(item.id))}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent className="w-36">
                              <SelectItem value="pendiente_revision" className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-yellow-600" />
                                <span>Pendiente</span>
                              </SelectItem>
                              <SelectItem value="aprobado" className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <span>Aprobado</span>
                              </SelectItem>
                              <SelectItem value="rechazado" className="flex items-center gap-2">
                                <XCircle className="h-4 w-4 text-red-600" />
                                <span>Rechazado</span>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{item.cantidadHA.toFixed(1)}</TableCell>
                      <TableCell className="text-right">{item.rodalHa ? item.rodalHa.toFixed(1) : "-"}</TableCell>
                    </TableRow>
                  ))
                )}
                {datosTabla.length > 0 && (
                  <TableRow className="bg-gray-100 font-bold">
                    <TableCell colSpan={11} className="text-right">
                      TOTALES:
                    </TableCell>
                    <TableCell className="text-right">{totales.totalHA.toFixed(2)}</TableCell>
                    <TableCell className="text-right bg-blue-200">{/* Total GIS HA */}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

    </div>
  )
}
