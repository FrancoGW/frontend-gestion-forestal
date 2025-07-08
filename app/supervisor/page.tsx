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
import { useSupervisorData } from "@/hooks/use-supervisor-data"
import { useAuth } from "@/hooks/use-auth"
import * as XLSX from "xlsx"
import { getCuadrillaName } from "@/utils/getCuadrillaName"
import type { AvanceExtendido } from "@/types/AvanceExtendido"

export default function SupervisorDashboard() {
  const { user } = useAuth()
  const { supervisor, proveedores, ordenes, avances, loading, error, refetch } = useSupervisorData()

  // Estados para los filtros
  const [fechaDesde, setFechaDesde] = useState("")
  const [fechaHasta, setFechaHasta] = useState("")
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState("")
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
      "FECHA REGISTRO": new Date(item.fecha).toLocaleDateString("es-AR"),
      PREDIOS: item.predio,
      "ORDEN TR": item.ordenTrabajo,
      RODAL: item.rodal,
      ACTIVIDAD: item.actividad,
      PROGRESO: item.indicadorProgreso,
      ESTADO: item.estado,
      "CANTIDAD (HA)": item.cantidadHA.toFixed(2).replace(".", ","),
      SUBTOTAL: item.subtotal.toFixed(0),
      PROVEEDOR: item.proveedor,
      OBSERVACIONES: item.observaciones,
      CUADRILLA: getCuadrillaName({
        cuadrilla: item.cuadrilla,
        cuadrillaId: item.cuadrillaId,
        cuadrillaNombre: item.cuadrillaNombre,
      } as AvanceExtendido),
      JORNADA: item.jornada,
    }))

    excelData.push({
      "FECHA REGISTRO": "",
      PREDIOS: "",
      "ORDEN TR": "",
      RODAL: "",
      ACTIVIDAD: "",
      PROGRESO: "",
      ESTADO: "TOTALES:",
      "CANTIDAD (HA)": totales.totalHA.toFixed(2).replace(".", ","),
      SUBTOTAL: totales.totalSubtotal.toFixed(0),
      PROVEEDOR: "",
      OBSERVACIONES: "",
      CUADRILLA: "",
      JORNADA: "",
    })

    /* ------------------------------------------------------------------ */
    /* 2 ▸ Crear libro/hojas con XLSX utils                               */
    /* ------------------------------------------------------------------ */
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(excelData)

    // Ajuste opcional del ancho de columnas
    ws["!cols"] = [
      { wch: 15 },
      { wch: 20 },
      { wch: 12 },
      { wch: 10 },
      { wch: 30 },
      { wch: 12 },
      { wch: 15 },
      { wch: 15 },
      { wch: 12 },
      { wch: 25 },
      { wch: 30 },
      { wch: 15 },
      { wch: 10 },
    ]
    XLSX.utils.book_append_sheet(wb, ws, "Avances Progresivos")

    /* Hoja de resumen --------------------------------------------------- */
    const resumenData = [
      { CONCEPTO: "Total Registros", VALOR: totales.totalRegistros },
      { CONCEPTO: "Total Hectáreas", VALOR: totales.totalHA.toFixed(2).replace(".", ",") },
      { CONCEPTO: "Avances Progresivos", VALOR: totales.totalProgresivos },
      { CONCEPTO: "Terminados", VALOR: totales.totalCompletos },
      { CONCEPTO: "Pendientes", VALOR: totales.totalPendientes },
      { CONCEPTO: "Órdenes Únicas", VALOR: totales.ordenesUnicas },
      { CONCEPTO: "Proveedores Únicos", VALOR: totales.proveedoresUnicos },
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
  }

  // Datos filtrados y procesados para la tabla con lógica de avances progresivos
  const datosTabla = useMemo(() => {
    let avancesFiltrados = [...avances]

    // Filtrar por fecha
    if (fechaDesde) {
      avancesFiltrados = avancesFiltrados.filter((avance) => avance.fecha >= fechaDesde)
    }
    if (fechaHasta) {
      avancesFiltrados = avancesFiltrados.filter((avance) => avance.fecha <= fechaHasta)
    }

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
    const avancesProgresivos = []

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
      grupo.sort((a, b) => {
        const fechaA = new Date(a.fecha || a.fechaRegistro || new Date())
        const fechaB = new Date(b.fecha || b.fechaRegistro || new Date())
        return fechaA.getTime() - fechaB.getTime()
      })

      // Determinar si hay avances progresivos (múltiples registros para la misma tarea)
      const tieneAvancesProgresivos = grupo.length > 1

      grupo.forEach((avance, index) => {
        const estado = avance.estado || "Pendiente"
        const indicadorProgreso = `${index + 1}/${grupo.length}`

        avancesProgresivos.push({
          id: avance._id || avance.id || `${claveBase}-${index}`,
          fecha: avance.fecha || avance.fechaRegistro || new Date().toISOString().split("T")[0],
          predio: String(avance.predio || "Sin especificar"),
          ordenTrabajo: String(avance.numeroOrden || avance.ordenTrabajoId),
          rodal: String(avance.rodal || "Sin especificar"),
          actividad: String(avance.actividad || "Sin especificar"),
          estado: String(estado),
          cantidadHA: Number(avance.superficie) || 0,
          subtotal: Number(avance.superficie) || 0,
          proveedor: String(avance.proveedor || "Sin especificar"),
          esProgresivo: tieneAvancesProgresivos,
          indicadorProgreso,
          numeroAvance: index + 1,
          totalAvances: grupo.length,
          observaciones: String(avance.observaciones || ""),
          cuadrilla: String(avance.cuadrilla || ""),
          cuadrillaId: avance.cuadrillaId,
          cuadrillaNombre: avance.cuadrillaNombre,
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
    avances,
    fechaDesde,
    fechaHasta,
    proveedorSeleccionado,
    rodalSeleccionado,
    ordenSeleccionada,
    estadoSeleccionado,
    actividadSeleccionada,
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

    return {
      totalRegistros,
      totalHA,
      totalSubtotal,
      totalProgresivos,
      totalCompletos,
      totalPendientes,
      ordenesUnicas,
      proveedoresUnicos,
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
          <h1 className="text-3xl font-bold text-red-600">VISTA PARA EL SUPERVISOR</h1>
          <p className="text-muted-foreground">
            Bienvenido, {supervisor?.nombre || user?.nombre || "Supervisor"} | Resumen de avances progresivos por
            proveedor
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
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4 items-end mb-4">
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
      {(fechaDesde ||
        fechaHasta ||
        proveedorSeleccionado ||
        rodalSeleccionado ||
        ordenSeleccionada ||
        estadoSeleccionado ||
        actividadSeleccionada) && (
        <div className="flex flex-wrap gap-2">
          {fechaDesde && <Badge variant="secondary">Desde: {new Date(fechaDesde).toLocaleDateString("es-AR")}</Badge>}
          {fechaHasta && <Badge variant="secondary">Hasta: {new Date(fechaHasta).toLocaleDateString("es-AR")}</Badge>}
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
        </div>
      )}

      {/* Información de debug para proveedores */}
      <Card className="bg-gray-50">
        <CardContent className="p-4">
          <p className="text-sm text-gray-600">
            Debug Supervisor {supervisor?.nombre}: {proveedores.length} proveedores | {todosLosRodales.length}{" "}
            rodales | {todasLasOrdenes.length} órdenes | {avances.length} avances totales | {totales.totalProgresivos}{" "}
            progresivos
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Proveedores asignados: {proveedores.map((p) => p.nombre).join(", ")}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Avances por proveedor:{" "}
            {proveedores
              .map((p) => `${p.nombre}: ${avances.filter((a) => String(a.proveedor) === String(p.nombre)).length}`)
              .join(", ")}
          </p>
        </CardContent>
      </Card>

      {/* Tabla de datos */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen de Avances Progresivos</CardTitle>
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
                  <TableHead className="font-bold bg-green-200">FECHA REGISTRO</TableHead>
                  <TableHead className="font-bold bg-yellow-200">PREDIOS</TableHead>
                  <TableHead className="font-bold bg-blue-200">ORDEN TR</TableHead>
                  <TableHead className="font-bold bg-blue-200">RODAL</TableHead>
                  <TableHead className="font-bold bg-blue-200">ACTIVIDAD</TableHead>
                  <TableHead className="font-bold bg-orange-200">PROGRESO</TableHead>
                  <TableHead className="font-bold bg-purple-200">ESTADO</TableHead>
                  <TableHead className="font-bold bg-blue-200 text-right">CANTIDAD (HA)</TableHead>
                  <TableHead className="font-bold bg-blue-400 text-white text-right">SUBTOTAL</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {datosTabla.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No se encontraron registros con los filtros aplicados
                    </TableCell>
                  </TableRow>
                ) : (
                  datosTabla.map((item, index) => (
                    <TableRow
                      key={item.id}
                      className={`hover:bg-gray-50 ${
                        item.esProgresivo
                          ? item.numeroAvance === 1
                            ? "border-l-4 border-l-blue-500"
                            : "border-l-4 border-l-gray-300"
                          : ""
                      }`}
                    >
                      <TableCell className="text-sm">{new Date(item.fecha).toLocaleDateString("es-AR")}</TableCell>
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
                      <TableCell className="text-right">{item.cantidadHA.toFixed(1)}</TableCell>
                      <TableCell className="text-right bg-blue-100 font-medium">{item.subtotal.toFixed(0)}</TableCell>
                    </TableRow>
                  ))
                )}
                {datosTabla.length > 0 && (
                  <TableRow className="bg-gray-100 font-bold">
                    <TableCell colSpan={7} className="text-right">
                      TOTALES:
                    </TableCell>
                    <TableCell className="text-right">{totales.totalHA.toFixed(2)}</TableCell>
                    <TableCell className="text-right bg-blue-200">{totales.totalSubtotal.toFixed(0)}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
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
      </div>
    </div>
  )
}
