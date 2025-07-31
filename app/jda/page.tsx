"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { FilterIcon, RefreshCw, AlertTriangle, FileSpreadsheet } from "lucide-react"
import { useJdaData } from "@/hooks/use-jda-data"
import { useAuth } from "@/hooks/use-auth"
import * as XLSX from "xlsx"
import { getCuadrillaName } from "@/utils/getCuadrillaName"
import type { AvanceExtendido } from "@/types/AvanceExtendido"
import { useCuadrillas } from "@/hooks/use-cuadrillas"

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
  supervisor: string;
  supervisorId?: string;
  esProgresivo: boolean;
  indicadorProgreso: string;
  numeroAvance: number;
  totalAvances: number;
  observaciones: string;
  cuadrilla: string;
  cuadrillaId?: string;
  cuadrillaNombre?: string;
  jornada: number;
};

export default function JdaDashboard() {
  const { user } = useAuth()
  const { jda, supervisores, proveedores, ordenes, avances, loading, error, refetch } = useJdaData()
  const { cuadrillas } = useCuadrillas();

  // Estados para los filtros
  const [fechaDesde, setFechaDesde] = useState("")
  const [fechaHasta, setFechaHasta] = useState("")
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState("")
  const [supervisorSeleccionado, setSupervisorSeleccionado] = useState("")
  const [rodalSeleccionado, setRodalSeleccionado] = useState("")
  const [ordenSeleccionada, setOrdenSeleccionada] = useState("")
  const [estadoSeleccionado, setEstadoSeleccionado] = useState("")
  const [actividadSeleccionada, setActividadSeleccionada] = useState("")

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
      const proveedorId = avance.proveedorId || avance.proveedor;
      if (proveedorId) {
        const proveedorNombre = avance.proveedorNombre || avance.proveedor || `Proveedor ${proveedorId}`;
        const key = `${proveedorId}-${proveedorNombre}`;
        const existeNombre = Array.from(proveedoresMap.values()).some((p) => p.nombre === proveedorNombre);
        if (!proveedoresMap.has(key) && !existeNombre) {
          proveedoresMap.set(key, {
            id: proveedorId,
            nombre: proveedorNombre,
          })
        }
      }
    })

    return Array.from(proveedoresMap.values()).sort((a, b) => String(a.nombre).localeCompare(String(b.nombre)))
  }, [proveedores, avances, jda])

  // Obtener todos los supervisores únicos
  const todosLosSupervisores = useMemo(() => {
    const supervisoresMap = new Map()

    // Agregar supervisores del array principal (solo si tienen nombre real)
    supervisores.forEach((supervisor) => {
      if (supervisor.nombre && supervisor.nombre.trim() !== "") {
        const key = `${supervisor.id}-${supervisor.nombre}`
        if (!supervisoresMap.has(key)) {
          supervisoresMap.set(key, {
            id: String(supervisor.id),
            nombre: supervisor.nombre,
          })
        }
      }
    })

    // Agregar supervisores asignados al JDA (solo si tienen nombre real)
    if (jda && Array.isArray(jda.supervisoresAsignados)) {
      jda.supervisoresAsignados.forEach((s) => {
        if (s.nombre && s.nombre.trim() !== "" && !s.nombre.includes("Supervisor ")) {
          const key = `${s.supervisorId}-${s.nombre}`
          if (!supervisoresMap.has(key)) {
            supervisoresMap.set(key, {
              id: String(s.supervisorId),
              nombre: s.nombre,
            })
          }
        }
      })
    }

    // Agregar supervisores que aparecen en los avances, pero solo si tienen nombre real
    avances.forEach((avance) => {
      const supervisorId = avance.supervisorId;
      if (supervisorId && avance.supervisorNombre && avance.supervisorNombre.trim() !== "" && !avance.supervisorNombre.includes("Supervisor ")) {
        const supervisorNombre = avance.supervisorNombre;
        const key = `${supervisorId}-${supervisorNombre}`;
        const existeNombre = Array.from(supervisoresMap.values()).some((s) => s.nombre === supervisorNombre);
        if (!supervisoresMap.has(key) && !existeNombre) {
          supervisoresMap.set(key, {
            id: String(supervisorId),
            nombre: supervisorNombre,
          })
        }
      }
    })

    return Array.from(supervisoresMap.values()).sort((a, b) => String(a.nombre).localeCompare(String(b.nombre)))
  }, [supervisores, avances, jda])

  // Obtener todos los rodales únicos
  const todosLosRodales = useMemo(() => {
    const rodalesSet = new Set<string>()
    avances.forEach((avance) => {
      if (avance.rodal) {
        rodalesSet.add(String(avance.rodal))
      }
    })
    return Array.from(rodalesSet).sort()
  }, [avances])

  // Obtener todas las órdenes únicas
  const todasLasOrdenes = useMemo(() => {
    const ordenesSet = new Set<string>()
    avances.forEach((avance) => {
      if (avance.numeroOrden) {
        ordenesSet.add(String(avance.numeroOrden))
      }
    })
    return Array.from(ordenesSet).sort()
  }, [avances])

  // Obtener todas las actividades únicas
  const todasLasActividades = useMemo(() => {
    const actividadesSet = new Set<string>()
    avances.forEach((avance) => {
      if (avance.actividad) {
        actividadesSet.add(String(avance.actividad))
      }
    })
    return Array.from(actividadesSet).sort()
  }, [avances])

  // Función para obtener el nombre del proveedor seleccionado
  const getNombreProveedorSeleccionado = () => {
    if (proveedorSeleccionado === "all") return "Todos los proveedores"
    const proveedor = proveedores.find((p) => String(p.id) === proveedorSeleccionado)
    return proveedor ? proveedor.nombre : "Seleccionar proveedor"
  }

  // Función para obtener el nombre del supervisor seleccionado
  const getNombreSupervisorSeleccionado = () => {
    if (supervisorSeleccionado === "all") return "Todos los supervisores"
    const supervisor = todosLosSupervisores.find((s) => String(s.id) === supervisorSeleccionado)
    return supervisor ? supervisor.nombre : "Seleccionar supervisor"
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
      "FECHA REGISTRO": new Date(item.fecha).toLocaleDateString("es-AR"),
      "ORDEN TR": item.ordenTrabajo,
      SUPERVISOR: item.supervisor,
      PREDIOS: item.predio,
      RODAL: item.rodal,
      ACTIVIDAD: item.actividad,
      PROVEEDOR: item.proveedor,
      CUADRILLA: item.cuadrillaNombre || item.cuadrilla || "Sin cuadrilla",
      "CANTIDAD (HA)": item.cantidadHA.toFixed(2).replace(".", ","),
      ESTADO: item.estado,
      JORNALES: item.jornada,
    }))

    excelData.push({
      "FECHA REGISTRO": "",
      "ORDEN TR": "",
      SUPERVISOR: "",
      PREDIOS: "",
      RODAL: "",
      ACTIVIDAD: "",
      PROVEEDOR: "",
      CUADRILLA: "",
      "CANTIDAD (HA)": totales.totalHA.toFixed(2).replace(".", ","),
      ESTADO: "TOTALES:",
      JORNALES: 0,
    })

    /* ------------------------------------------------------------------ */
    /* 2 ▸ Crear libro/hojas con XLSX utils                               */
    /* ------------------------------------------------------------------ */
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(excelData)

    /* ------------------------------------------------------------------ */
    /* 3 ▸ Ajustar ancho de columnas automáticamente                       */
    /* ------------------------------------------------------------------ */
    const columnWidths = [
      { wch: 12 }, // FECHA REGISTRO
      { wch: 10 }, // ORDEN TR
      { wch: 15 }, // SUPERVISOR
      { wch: 15 }, // PREDIOS
      { wch: 8 },  // RODAL
      { wch: 20 }, // ACTIVIDAD
      { wch: 20 }, // PROVEEDOR
      { wch: 15 }, // CUADRILLA
      { wch: 12 }, // CANTIDAD (HA)
      { wch: 12 }, // ESTADO
      { wch: 8 },  // JORNALES
    ]
    ws["!cols"] = columnWidths

    /* ------------------------------------------------------------------ */
    /* 4 ▸ Agregar hoja al libro y descargar                              */
    /* ------------------------------------------------------------------ */
    XLSX.utils.book_append_sheet(wb, ws, "Avances JDA")
    XLSX.writeFile(wb, `avances_jda_${new Date().toISOString().split("T")[0]}.xlsx`)
  }

  // Filtrar avances según los criterios seleccionados
  const avancesFiltrados = useMemo(() => {
    return avances.filter((avance) => {
      // Filtro por fecha desde
      if (fechaDesde && avance.fecha < fechaDesde) return false

      // Filtro por fecha hasta
      if (fechaHasta && avance.fecha > fechaHasta) return false

      // Filtro por proveedor
      if (proveedorSeleccionado && proveedorSeleccionado !== "all") {
        if (String(avance.proveedorId) !== proveedorSeleccionado) return false
      }

      // Filtro por supervisor
      if (supervisorSeleccionado && supervisorSeleccionado !== "all") {
        if (String(avance.supervisorId) !== supervisorSeleccionado) return false
      }

      // Filtro por rodal
      if (rodalSeleccionado && rodalSeleccionado !== "all") {
        if (String(avance.rodal) !== rodalSeleccionado) return false
      }

      // Filtro por orden
      if (ordenSeleccionada && ordenSeleccionada !== "all") {
        if (String(avance.numeroOrden) !== ordenSeleccionada) return false
      }

      // Filtro por estado
      if (estadoSeleccionado && estadoSeleccionado !== "all") {
        if (String(avance.estado).toLowerCase() !== estadoSeleccionado.toLowerCase()) return false
      }

      // Filtro por actividad
      if (actividadSeleccionada && actividadSeleccionada !== "all") {
        if (String(avance.actividad).toLowerCase() !== actividadSeleccionada.toLowerCase()) return false
      }

      return true
    })
  }, [avances, fechaDesde, fechaHasta, proveedorSeleccionado, supervisorSeleccionado, rodalSeleccionado, ordenSeleccionada, estadoSeleccionado, actividadSeleccionada])

  // Agrupar avances por clave única (predio + orden + rodal + actividad)
  const datosTabla = useMemo(() => {
    const gruposPorClave = new Map<string, any[]>()

    avancesFiltrados.forEach((avance) => {
      const clave = `${avance.predio}-${avance.numeroOrden}-${avance.rodal}-${avance.actividad}`
      if (!gruposPorClave.has(clave)) {
        gruposPorClave.set(clave, [])
      }
      gruposPorClave.get(clave)!.push(avance)
    })

    const avancesProgresivos: DatosTablaItem[] = []

    gruposPorClave.forEach((grupo, claveBase) => {
      // Ordenar avances por fecha
      grupo.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())

      const tieneAvancesProgresivos = grupo.length > 1

      grupo.forEach((avance: any, index: number) => {
        console.log('Avance dashboard:', avance);
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

        // Obtener nombre del supervisor usando todosLosSupervisores o jda.supervisoresAsignados
        let supervisorNombre = "Sin asignar";
        if (avance.supervisorNombre) {
          supervisorNombre = String(avance.supervisorNombre);
        } else {
          // Buscar supervisor por ID en la lista de todosLosSupervisores
          const supervisor = todosLosSupervisores.find(s => String(s.id) === String(avance.supervisorId));
          if (supervisor) {
            supervisorNombre = supervisor.nombre;
          } else if (jda && Array.isArray(jda.supervisoresAsignados)) {
            // Buscar en la colección de jefes de área
            const supervisorJda = jda.supervisoresAsignados.find(s => String(s.supervisorId) === String(avance.supervisorId));
            if (supervisorJda) {
              supervisorNombre = supervisorJda.nombre;
            }
          }
        }

        // Usar cuadrillaNombre si existe, si no cuadrilla, si no 'Sin cuadrilla'
        let cuadrillaNombre = avance.cuadrillaNombre || avance.cuadrilla || "Sin cuadrilla"

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
          supervisor: supervisorNombre,
          supervisorId: avance.supervisorId ? String(avance.supervisorId) : undefined,
          esProgresivo: tieneAvancesProgresivos,
          indicadorProgreso,
          numeroAvance: index + 1,
          totalAvances: grupo.length,
          observaciones: String(avance.observaciones || ""),
          cuadrilla: String(avance.cuadrilla || ""),
          cuadrillaId: avance.cuadrillaId ? String(avance.cuadrillaId) : undefined,
          cuadrillaNombre: cuadrillaNombre,
          jornada: Number(avance.jornada) || 0,
        })
      })
    })

    // Ordenar por predio, luego por orden, luego por rodal, luego por fecha
    return avancesProgresivos.sort((a, b) => {
      if (a.predio !== b.predio) return a.predio.localeCompare(b.predio)
      if (a.ordenTrabajo !== b.ordenTrabajo) return a.ordenTrabajo.localeCompare(b.ordenTrabajo)
      if (a.rodal !== b.rodal) return a.rodal.localeCompare(b.rodal)
      return new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
    })
  }, [
    avancesFiltrados,
    supervisores,
    cuadrillas,
    todosLosSupervisores,
    jda,
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

    // Contar órdenes únicas
    const ordenesUnicas = new Set(datosTabla.map((item) => item.ordenTrabajo)).size

    // Contar proveedores únicos
    const proveedoresUnicos = new Set(datosTabla.map((item) => item.proveedor)).size

    // Contar supervisores únicos
    const supervisoresUnicos = new Set(datosTabla.map((item) => item.supervisor)).size

    return {
      totalRegistros,
      totalHA,
      totalSubtotal,
      totalProgresivos,
      totalCompletos,
      totalPendientes,
      ordenesUnicas,
      proveedoresUnicos,
      supervisoresUnicos,
    }
  }, [datosTabla])

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
          <h1 className="text-3xl font-bold text-red-600">VISTA PARA JEFE DE AREA</h1>
          <p className="text-muted-foreground">
            Bienvenido, {jda?.nombre || user?.nombre || "Jefe de Área"} | Resumen de avances progresivos por
            proveedor y supervisor
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
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-8 gap-4 items-end mb-4">
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

            <div className="space-y-2">
              <Label htmlFor="supervisor" className="text-sm font-medium bg-yellow-200 px-2 py-1 rounded">
                SUPERVISOR
              </Label>
              <Select value={supervisorSeleccionado} onValueChange={setSupervisorSeleccionado}>
                <SelectTrigger>
                  <SelectValue>{getNombreSupervisorSeleccionado()}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los supervisores</SelectItem>
                  {todosLosSupervisores.map((s) => (
                    <SelectItem key={String(s.id)} value={String(s.id)}>{s.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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
                  {todosLosProveedores.map((p) => (
                    <SelectItem key={String(p.id)} value={String(p.id)}>{p.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rodal" className="text-sm font-medium bg-yellow-200 px-2 py-1 rounded">
                RODAL
              </Label>
              <Select value={rodalSeleccionado} onValueChange={setRodalSeleccionado}>
                <SelectTrigger>
                  <SelectValue>{rodalSeleccionado === "all" ? "Todos los rodales" : rodalSeleccionado || "Seleccionar rodal"}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los rodales</SelectItem>
                  {todosLosRodales.map((rodal) => (
                    <SelectItem key={rodal} value={rodal}>
                      {rodal}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="orden" className="text-sm font-medium bg-yellow-200 px-2 py-1 rounded">
                ORDEN
              </Label>
              <Select value={ordenSeleccionada} onValueChange={setOrdenSeleccionada}>
                <SelectTrigger>
                  <SelectValue>{ordenSeleccionada === "all" ? "Todas las órdenes" : ordenSeleccionada || "Seleccionar orden"}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las órdenes</SelectItem>
                  {todasLasOrdenes.map((orden) => (
                    <SelectItem key={String(orden)} value={String(orden)}>
                      {String(orden)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="estado" className="text-sm font-medium bg-yellow-200 px-2 py-1 rounded">
                ESTADO
              </Label>
              <Select value={estadoSeleccionado} onValueChange={setEstadoSeleccionado}>
                <SelectTrigger>
                  <SelectValue>{estadoSeleccionado === "all" ? "Todos los estados" : estadoSeleccionado || "Seleccionar estado"}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="en progreso">En Progreso</SelectItem>
                  <SelectItem value="completado">Completado</SelectItem>
                  <SelectItem value="r7 (terminado)">R7 (Terminado)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="actividad" className="text-sm font-medium bg-yellow-200 px-2 py-1 rounded">
                ACTIVIDAD
              </Label>
              <Select value={actividadSeleccionada} onValueChange={setActividadSeleccionada}>
                <SelectTrigger>
                  <SelectValue>{actividadSeleccionada === "all" ? "Todas las actividades" : actividadSeleccionada || "Seleccionar actividad"}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las actividades</SelectItem>
                  {todasLasActividades.map((actividad) => (
                    <SelectItem key={String(actividad)} value={String(actividad)}>
                      {String(actividad)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => {
                setFechaDesde("")
                setFechaHasta("")
                setProveedorSeleccionado("")
                setSupervisorSeleccionado("")
                setRodalSeleccionado("")
                setOrdenSeleccionada("")
                setEstadoSeleccionado("")
                setActividadSeleccionada("")
              }}
              variant="outline"
              size="sm"
            >
              Limpiar Filtros
            </Button>
            <Button onClick={exportarExcel} variant="outline" size="sm">
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Exportar Excel
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
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
            <div className="text-2xl font-bold text-purple-600">{totales.ordenesUnicas}</div>
            <div className="text-sm text-muted-foreground">Órdenes Únicas</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-indigo-600">{totales.supervisoresUnicos}</div>
            <div className="text-sm text-muted-foreground">Supervisores</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de datos */}
      <Card>
        <CardHeader>
          <CardTitle>Avances de Trabajo</CardTitle>
          <CardDescription>
            Mostrando {datosTabla.length} registros de avances progresivos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Orden</TableHead>
                  <TableHead>Supervisor</TableHead>
                  <TableHead>Predio</TableHead>
                  <TableHead>Rodal</TableHead>
                  <TableHead>Actividad</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Cuadrilla</TableHead>
                  <TableHead className="text-right">Ha</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Jornales</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {datosTabla.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                      No hay avances que coincidan con los filtros seleccionados
                    </TableCell>
                  </TableRow>
                ) : (
                  datosTabla.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{new Date(item.fecha).toLocaleDateString("es-AR")}</TableCell>
                      <TableCell>{item.ordenTrabajo}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {item.supervisor}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.predio}</TableCell>
                      <TableCell>{item.rodal}</TableCell>
                      <TableCell>{item.actividad}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {item.proveedor}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.cuadrillaNombre}</TableCell>
                      <TableCell className="text-right">{item.cantidadHA.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            item.estado === "R7 (terminado)" || item.estado === "completado"
                              ? "default"
                              : item.estado === "en progreso"
                              ? "secondary"
                              : "outline"
                          }
                          className={
                            item.estado === "R7 (terminado)" || item.estado === "completado"
                              ? "bg-green-100 text-green-800 border-green-200 text-xs"
                              : item.estado === "en progreso"
                              ? "bg-gray-100 text-gray-700 text-xs"
                              : "text-xs"
                          }
                        >
                          {item.estado}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.jornada}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

    </div>
  )
}
