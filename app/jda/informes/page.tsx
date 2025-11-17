"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { FilterIcon, RefreshCw, AlertTriangle, FileSpreadsheet, FileText, Calendar, Building, FileDown, UserCheck } from "lucide-react"
import { useJdaData } from "@/hooks/use-jda-data"
import { useAuth } from "@/hooks/use-auth"
import * as XLSX from "xlsx"
import { workOrdersAPI } from "@/lib/api-client"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { getActividadConEspecie } from "@/utils/especies-map"

type InformeAvance = {
  fecha: string;
  predio: string;
  rodal: string;
  actividad: string;
  supervisor: string;
  proveedor: string;
  haAvanzada: number;
  subtotal?: number;
  observaciones?: string;
};

type ResumenActividad = {
  actividad: string;
  haAvanzada: number;
};

type ResumenSupervisor = {
  supervisor: string;
  haAvanzada: number;
};

export default function InformesAvancesJdaPage() {
  const { user } = useAuth()
  const { jda, supervisores, proveedores, avances, loading, error, refetch } = useJdaData()
  
  // Estados para los filtros
  const [supervisorSeleccionado, setSupervisorSeleccionado] = useState("")
  const [actividadSeleccionada, setActividadSeleccionada] = useState("")
  const [fechaDesde, setFechaDesde] = useState("")
  const [fechaHasta, setFechaHasta] = useState("")
  const [generandoInforme, setGenerandoInforme] = useState(false)
  const [generandoPDF, setGenerandoPDF] = useState(false)
  
  // Obtener las órdenes originales (con rodales) desde la API
  const [ordenesOriginales, setOrdenesOriginales] = useState<any[]>([])
  

  
  // Debug: Log de datos cargados
  useEffect(() => {
    console.log("🔍 [JDA INFORMES DEBUG] JDA:", jda)
    console.log("🔍 [JDA INFORMES DEBUG] Supervisores:", supervisores)
    console.log("🔍 [JDA INFORMES DEBUG] Avances del JDA:", avances)
    console.log("🔍 [JDA INFORMES DEBUG] Total avances:", avances.length)
  }, [jda, supervisores, avances])

  // Cargar órdenes originales al montar el componente
  useEffect(() => {
    const cargarOrdenesOriginales = async () => {
      try {
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
        
        setOrdenesOriginales(todasLasOrdenes)
      } catch (error) {
        console.error('Error cargando órdenes originales:', error)
      }
    }
    cargarOrdenesOriginales()
  }, [])

  // Función helper para formatear fechas en zona horaria de Argentina
  const formatearFechaArgentina = (fechaString: string): string => {
    try {
      const fecha = new Date(fechaString);
      const fechaArgentina = new Date(fecha.getTime() + (3 * 60 * 60 * 1000));
      return fechaArgentina.toLocaleDateString("es-AR");
    } catch (error) {
      return new Date(fechaString).toLocaleDateString("es-AR");
    }
  };

  // Función para obtener el nombre del supervisor seleccionado
  const getNombreSupervisorSeleccionado = () => {
    if (!supervisorSeleccionado || supervisorSeleccionado === "all") {
      return "Seleccionar Supervisor"
    }
    const supervisor = supervisores.find((s) => String(s.id) === supervisorSeleccionado)
    return supervisor ? supervisor.nombre : "Supervisor no encontrado"
  }

  // Función para obtener el nombre de la actividad seleccionada
  const getNombreActividadSeleccionada = () => {
    if (!actividadSeleccionada || actividadSeleccionada === "all") {
      return "Seleccionar Actividad"
    }
    return actividadSeleccionada
  }

  // Obtener lista única de actividades disponibles
  const actividadesDisponibles = useMemo(() => {
    const actividades = new Set<string>()
    avances.forEach((avance) => {
      if (avance.actividad) {
        actividades.add(avance.actividad)
      }
    })
    return Array.from(actividades).sort()
  }, [avances])

  // Datos filtrados para el informe
  const datosInforme = useMemo(() => {
    let avancesFiltrados = [...avances]

    // Filtrar por supervisor
    if (supervisorSeleccionado && supervisorSeleccionado !== "all") {
      avancesFiltrados = avancesFiltrados.filter((avance) => {
        return Number(avance.supervisorId) === Number(supervisorSeleccionado)
      })
    }

    // Filtrar por actividad
    if (actividadSeleccionada && actividadSeleccionada !== "all") {
      avancesFiltrados = avancesFiltrados.filter((avance) => {
        return avance.actividad === actividadSeleccionada
      })
    }

    // Filtrar por fechas
    if (fechaDesde) {
      avancesFiltrados = avancesFiltrados.filter((avance) => {
        const avanceFecha = avance.fecha || avance.fechaRegistro || new Date().toISOString().split('T')[0]
        return avanceFecha >= fechaDesde
      })
    }

    if (fechaHasta) {
      avancesFiltrados = avancesFiltrados.filter((avance) => {
        const avanceFecha = avance.fecha || avance.fechaRegistro || new Date().toISOString().split('T')[0]
        return avanceFecha <= fechaHasta
      })
    }

    // Procesar datos para el informe
    const informeData: InformeAvance[] = []

    avancesFiltrados.forEach((avance) => {
      // Buscar la orden de trabajo correspondiente
      const orden = ordenesOriginales.find((o) => {
        const ordenId = String(o._id || "");
        const avanceOrdenId = String(avance.numeroOrden || avance.ordenTrabajoId || "");
        return ordenId === avanceOrdenId;
      });

      // Obtener nombre del supervisor
      const supervisor = supervisores.find((s) => Number(s.id) === Number(avance.supervisorId))
      const nombreSupervisor = supervisor?.nombre || "Sin supervisor"

      // Debug: Log del avance para entender la estructura
      console.log("🔍 [JDA DEBUG] Avance completo:", avance);
      console.log("🔍 [JDA DEBUG] Avance.actividad:", avance.actividad);
      console.log("🔍 [JDA DEBUG] Avance.especie:", avance.especie);
      console.log("🔍 [JDA DEBUG] Tipo de avance.especie:", typeof avance.especie);

      // Construir la actividad: si es plantación, concatenar con la especie
      const actividadFinal = getActividadConEspecie(avance.actividad || "", avance.especie) || "Sin especificar"
      console.log("🔍 [JDA DEBUG] Actividad final construida:", actividadFinal);

               informeData.push({
          fecha: avance.fecha || avance.fechaRegistro || new Date().toISOString().split("T")[0],
          predio: String(avance.predio || "Sin especificar"),
          rodal: String(avance.rodal || "Sin especificar"),
          actividad: actividadFinal,
          supervisor: nombreSupervisor,
          proveedor: String(avance.proveedor || avance.proveedorNombre || "Sin especificar"),
          haAvanzada: Number(avance.superficie ?? 0),
          observaciones: String(avance.observaciones || ""),
        })
    })

    // Ordenar por fecha, supervisor, predio, rodal
    return informeData.sort((a, b) => {
      if (a.fecha !== b.fecha) return new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
      if (a.supervisor !== b.supervisor) return a.supervisor.localeCompare(b.supervisor)
      if (a.predio !== b.predio) return a.predio.localeCompare(b.predio)
      return a.rodal.localeCompare(b.rodal)
    })
  }, [avances, supervisorSeleccionado, actividadSeleccionada, fechaDesde, fechaHasta, ordenesOriginales, supervisores])

  // Calcular resumen por actividades
  const resumenActividades = useMemo(() => {
    const resumen = new Map<string, number>()

    datosInforme.forEach((item) => {
      const actividad = item.actividad
      const haActual = resumen.get(actividad) || 0
      resumen.set(actividad, haActual + item.haAvanzada)
    })

    return Array.from(resumen.entries()).map(([actividad, haAvanzada]) => ({
      actividad,
      haAvanzada
    })).sort((a, b) => b.haAvanzada - a.haAvanzada)
  }, [datosInforme])

  // Calcular resumen por supervisores
  const resumenSupervisores = useMemo(() => {
    const resumen = new Map<string, number>()

    datosInforme.forEach((item) => {
      const supervisor = item.supervisor
      const haActual = resumen.get(supervisor) || 0
      resumen.set(supervisor, haActual + item.haAvanzada)
    })

    return Array.from(resumen.entries()).map(([supervisor, haAvanzada]) => ({
      supervisor,
      haAvanzada
    })).sort((a, b) => b.haAvanzada - a.haAvanzada)
  }, [datosInforme])

  // Función para generar y descargar el informe en Excel
  const generarInformeExcel = async () => {
    if (datosInforme.length === 0) {
      alert("No hay datos para generar el informe")
      return
    }

    setGenerandoInforme(true)

    try {
      // Crear libro de Excel
      const wb = XLSX.utils.book_new()

      // Hoja 1: Informe de Avance (formato similar al de la imagen)
      const informeData = [
        // Header del informe
        ["INFORME DE AVANCE - JEFE DE ÁREA"],
        [""],
        ["Período:", `${fechaDesde ? formatearFechaArgentina(fechaDesde) : "Inicio"} - ${fechaHasta ? formatearFechaArgentina(fechaHasta) : "Fin"}`],
        ["Supervisor:", supervisorSeleccionado !== "all" ? getNombreSupervisorSeleccionado() : "Todos los Supervisores"],
        ["Actividad:", actividadSeleccionada !== "all" ? getNombreActividadSeleccionada() : "Todas las Actividades"],
        [""],
        [""],
        // Resumen por supervisores
        ["RESUMEN POR SUPERVISORES"],
        ["", ""],
        ["Supervisor", "Ha Ava"],
        ...resumenSupervisores.map(item => [item.supervisor, Number(item.haAvanzada)]),
        [""],
        [""],
        // Resumen por actividades
        ["RESUMEN POR ACTIVIDADES"],
        ["", ""],
        ["Act.", "Ha Ava"],
        ...resumenActividades.map(item => [item.actividad, Number(item.haAvanzada)]),
        [""],
        [""],
        // Detalle por actividades
        ["DETALLE POR ACTIVIDADES"],
        ["", ""],
        ["Fecha", "Predio", "Rodal", "Actividad", "Supervisor", "Proveedor", "Ha Ava", "Subtotal", "Observaciones"],
        ...datosInforme.map(item => [
          formatearFechaArgentina(item.fecha),
          item.predio,
          item.rodal,
          item.actividad,
          item.supervisor,
          item.proveedor,
          Number(item.haAvanzada),
          "",
          item.observaciones || ""
        ])
      ]

      const ws = XLSX.utils.aoa_to_sheet(informeData)

      // Ajustar ancho de columna
      ws["!cols"] = [
        { wch: 12 }, // Fecha
        { wch: 15 }, // Predio
        { wch: 10 }, // Rodal
        { wch: 20 }, // Actividad
        { wch: 20 }, // Supervisor
        { wch: 20 }, // Proveedor
        { wch: 10 }, // Ha Ava
        { wch: 12 }, // Subtotal
        { wch: 30 }, // Observaciones (última columna)
      ]

      XLSX.utils.book_append_sheet(wb, ws, "Informe de Avance")

      // Hoja 2: Datos detallados
      const datosDetallados = datosInforme.map((item) => ({
        "FECHA": formatearFechaArgentina(item.fecha),
        "PREDIO": item.predio,
        "PREDIO VECINO": item.vecino || item.predioVecino || "-",
        "RODAL": item.rodal,
        "ACTIVIDAD": item.actividad,
        "SUPERVISOR": item.supervisor,
        "PROVEEDOR": item.proveedor,
        "HA AVANZADA": Number(item.haAvanzada),
        "OBSERVACIONES": item.observaciones || "",
      }))

      const wsDetalle = XLSX.utils.json_to_sheet(datosDetallados)
      wsDetalle["!cols"] = [
        { wch: 12 }, // FECHA
        { wch: 15 }, // PREDIO
        { wch: 18 }, // PREDIO VECINO
        { wch: 10 }, // RODAL
        { wch: 20 }, // ACTIVIDAD
        { wch: 20 }, // SUPERVISOR
        { wch: 20 }, // PROVEEDOR
        { wch: 12 }, // HA AVANZADA
        { wch: 30 }, // OBSERVACIONES (última columna)
      ]
      XLSX.utils.book_append_sheet(wb, wsDetalle, "Datos Detallados")

      // Generar y descargar archivo
      const wbArray = XLSX.write(wb, { bookType: "xlsx", type: "array" })
      const blob = new Blob([wbArray], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })

      // Generar nombre de archivo
      let fileName = "informe_avances_jda"
      if (fechaDesde || fechaHasta) {
        fileName += `_${fechaDesde || "inicio"}_${fechaHasta || "fin"}`
      }
      if (supervisorSeleccionado && supervisorSeleccionado !== "all") {
        const sup = supervisores.find((s) => String(s.id) === supervisorSeleccionado)
        if (sup) fileName += `_${sup.nombre.replace(/[^a-zA-Z0-9]/g, "_")}`
      }
      if (actividadSeleccionada && actividadSeleccionada !== "all") {
        fileName += `_${actividadSeleccionada.replace(/[^a-zA-Z0-9]/g, "_")}`
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

    } catch (error) {
      console.error("Error generando informe:", error)
      alert("Error al generar el informe")
    } finally {
      setGenerandoInforme(false)
    }
  }

  // Función para generar y descargar el informe en PDF
  const generarInformePDF = async () => {
    if (datosInforme.length === 0) {
      alert("No hay datos para generar el informe")
      return
    }

    setGenerandoPDF(true)

    try {
      // Crear nuevo documento PDF
      const doc = new jsPDF()
      
      // Configurar fuente y tamaños
      const titleFontSize = 16
      const subtitleFontSize = 12
      const normalFontSize = 10
      const smallFontSize = 8

      let yPosition = 20

      // Título principal
      doc.setFontSize(titleFontSize)
      doc.setFont("helvetica", "bold")
      doc.text("INFORME DE AVANCE - JEFE DE ÁREA", 105, yPosition, { align: "center" })
      yPosition += 15

      // Información del período, supervisor y actividad
      doc.setFontSize(normalFontSize)
      doc.setFont("helvetica", "normal")
      doc.text(`Período: ${fechaDesde ? formatearFechaArgentina(fechaDesde) : "Inicio"} - ${fechaHasta ? formatearFechaArgentina(fechaHasta) : "Fin"}`, 20, yPosition)
      yPosition += 8
      doc.text(`Supervisor: ${supervisorSeleccionado !== "all" ? getNombreSupervisorSeleccionado() : "Todos los Supervisores"}`, 20, yPosition)
      yPosition += 8
      doc.text(`Actividad: ${actividadSeleccionada !== "all" ? getNombreActividadSeleccionada() : "Todas las Actividades"}`, 20, yPosition)
      yPosition += 15

      // Resumen por supervisores
      doc.setFontSize(subtitleFontSize)
      doc.setFont("helvetica", "bold")
      doc.text("RESUMEN POR SUPERVISORES", 20, yPosition)
      yPosition += 10

      // Tabla de resumen por supervisores
      const resumenSupervisoresTableData = resumenSupervisores.map(item => [
        item.supervisor,
        item.haAvanzada.toFixed(1)
      ])

      autoTable(doc, {
        head: [["Supervisor", "Ha Ava"]],
        body: resumenSupervisoresTableData,
        startY: yPosition,
        styles: {
          fontSize: normalFontSize,
          cellPadding: 3,
        },
        headStyles: {
          fillColor: [66, 139, 202],
          textColor: 255,
          fontStyle: "bold",
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
      })

      yPosition = (doc as any).lastAutoTable.finalY + 15

      // Resumen por actividades
      doc.setFontSize(subtitleFontSize)
      doc.setFont("helvetica", "bold")
      doc.text("RESUMEN POR ACTIVIDADES", 20, yPosition)
      yPosition += 10

      // Tabla de resumen por actividades
      const resumenActividadesTableData = resumenActividades.map(item => [
        item.actividad,
        item.haAvanzada.toFixed(1)
      ])

      autoTable(doc, {
        head: [["Actividad", "Ha Ava"]],
        body: resumenActividadesTableData,
        startY: yPosition,
        styles: {
          fontSize: normalFontSize,
          cellPadding: 3,
        },
        headStyles: {
          fillColor: [66, 139, 202],
          textColor: 255,
          fontStyle: "bold",
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
      })

      yPosition = (doc as any).lastAutoTable.finalY + 15

      // Detalle por actividades
      doc.setFontSize(subtitleFontSize)
      doc.setFont("helvetica", "bold")
      doc.text("DETALLE POR ACTIVIDADES", 20, yPosition)
      yPosition += 10

      // Preparar datos para la tabla de detalle
      const detalleTableData = datosInforme.map(item => [
        formatearFechaArgentina(item.fecha),
        item.predio,
        item.rodal,
        item.actividad,
        item.supervisor,
        item.proveedor,
        item.haAvanzada.toFixed(1)
      ])

      // Tabla de detalle
      autoTable(doc, {
        head: [["Fecha", "Predio", "Rodal", "Actividad", "Supervisor", "Proveedor", "Ha Ava"]],
        body: detalleTableData,
        startY: yPosition,
        styles: {
          fontSize: smallFontSize,
          cellPadding: 2,
        },
        headStyles: {
          fillColor: [66, 139, 202],
          textColor: 255,
          fontStyle: "bold",
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        columnStyles: {
          0: { cellWidth: 18 }, // Fecha
          1: { cellWidth: 25 }, // Predio
          2: { cellWidth: 18 }, // Rodal
          3: { cellWidth: 30 }, // Actividad
          4: { cellWidth: 25 }, // Supervisor
          5: { cellWidth: 25 }, // Proveedor
          6: { cellWidth: 18 }, // Ha Ava
        },
        didDrawPage: function (data) {
          // Agregar numeración de páginas
          const pageCount = doc.getNumberOfPages()
          doc.setFontSize(8)
          doc.text(`Página ${data.pageNumber} de ${pageCount}`, data.settings.margin.left, doc.internal.pageSize.height - 10)
        },
      })

      // Generar nombre de archivo
      let fileName = "informe_avances_jda"
      if (fechaDesde || fechaHasta) {
        fileName += `_${fechaDesde || "inicio"}_${fechaHasta || "fin"}`
      }
      if (supervisorSeleccionado && supervisorSeleccionado !== "all") {
        const sup = supervisores.find((s) => String(s.id) === supervisorSeleccionado)
        if (sup) fileName += `_${sup.nombre.replace(/[^a-zA-Z0-9]/g, "_")}`
      }
      if (actividadSeleccionada && actividadSeleccionada !== "all") {
        fileName += `_${actividadSeleccionada.replace(/[^a-zA-Z0-9]/g, "_")}`
      }
      fileName += `_${new Date().toISOString().split("T")[0]}.pdf`

      // Descargar PDF
      doc.save(fileName)

    } catch (error) {
      console.error("Error generando PDF:", error)
      alert("Error al generar el PDF")
    } finally {
      setGenerandoPDF(false)
    }
  }

  // Función para limpiar filtros
  const limpiarFiltros = () => {
    setSupervisorSeleccionado("")
    setActividadSeleccionada("")
    setFechaDesde("")
    setFechaHasta("")
  }

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
          <h1 className="text-3xl font-bold text-blue-600">GENERADOR DE INFORMES DE AVANCES - JEFE DE ÁREA</h1>
          <p className="text-muted-foreground">
            Bienvenido, {jda?.nombre || user?.nombre || "Jefe de Área"} | Genera informes de avances por Supervisor, Actividad y período
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
            Filtros para el Informe
          </CardTitle>
          <CardDescription>Selecciona el Supervisor, Actividad y el período para generar el informe en Excel o PDF</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end mb-4">
            <div className="space-y-2">
              <Label htmlFor="supervisor" className="text-sm font-medium bg-blue-200 px-2 py-1 rounded">
                Supervisor
              </Label>
              <Select value={supervisorSeleccionado} onValueChange={setSupervisorSeleccionado}>
                <SelectTrigger>
                  <SelectValue>{getNombreSupervisorSeleccionado()}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los Supervisores</SelectItem>
                  {supervisores.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>{s.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="actividad" className="text-sm font-medium bg-green-200 px-2 py-1 rounded">
                Actividad
              </Label>
              <Select value={actividadSeleccionada} onValueChange={setActividadSeleccionada}>
                <SelectTrigger>
                  <SelectValue>{getNombreActividadSeleccionada()}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las Actividades</SelectItem>
                  {actividadesDisponibles.map((actividad) => (
                    <SelectItem key={actividad} value={actividad}>{actividad}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fecha-desde" className="text-sm font-medium bg-yellow-200 px-2 py-1 rounded">
                Fecha Desde
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
                Fecha Hasta
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
              <Label className="text-sm font-medium bg-gray-200 px-2 py-1 rounded">
                Total Registros
              </Label>
              <div className="text-2xl font-bold text-center text-blue-600">
                {datosInforme.length}
              </div>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button onClick={limpiarFiltros} variant="outline" size="sm">
              Limpiar Filtros
            </Button>
            <Button 
              onClick={generarInformeExcel} 
              variant="default" 
              size="sm" 
              disabled={datosInforme.length === 0 || generandoInforme}
              className="bg-green-600 hover:bg-green-700"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              {generandoInforme ? "Generando..." : "Generar Excel"}
            </Button>
            <Button 
              onClick={generarInformePDF} 
              variant="default" 
              size="sm" 
              disabled={datosInforme.length === 0 || generandoPDF}
              className="bg-red-600 hover:bg-red-700"
            >
              <FileDown className="h-4 w-4 mr-2" />
              {generandoPDF ? "Generando..." : "Generar PDF"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resumen de filtros aplicados */}
      {(supervisorSeleccionado || actividadSeleccionada || fechaDesde || fechaHasta) && (
        <div className="flex flex-wrap gap-2">
          {supervisorSeleccionado && supervisorSeleccionado !== "all" && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <UserCheck className="h-3 w-3" />
              Supervisor: {supervisores.find((s) => String(s.id) === supervisorSeleccionado)?.nombre}
            </Badge>
          )}
          {actividadSeleccionada && actividadSeleccionada !== "all" && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Building className="h-3 w-3" />
              Actividad: {actividadSeleccionada}
            </Badge>
          )}
          {fechaDesde && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Desde: {formatearFechaArgentina(fechaDesde)}
            </Badge>
          )}
          {fechaHasta && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Hasta: {formatearFechaArgentina(fechaHasta)}
            </Badge>
          )}
        </div>
      )}

      {/* Pestañas estilo Excel */}
      <Card className="max-w-6xl mx-auto">
        <CardContent className="p-0">
          <Tabs defaultValue="detalle" className="w-full">
            <div className="border-b">
              <TabsList className="grid w-full grid-cols-3 h-12 bg-gray-100">
                <TabsTrigger 
                  value="detalle" 
                  className="data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-none rounded-t-lg border-r border-gray-300"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Detalle Completo
                </TabsTrigger>
                <TabsTrigger 
                  value="resumen-supervisores" 
                  className="data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-none rounded-t-lg border-r border-gray-300"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Resumen por Supervisores
                </TabsTrigger>
                <TabsTrigger 
                  value="resumen-actividades" 
                  className="data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-none rounded-t-lg"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Resumen por Actividades
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="resumen-supervisores" className="p-4">
              <div className="space-y-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Resumen por Supervisores</h3>
                  <p className="text-sm text-gray-600">Total de hectáreas por supervisor</p>
                </div>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-blue-50">
                        <TableHead className="font-bold w-2/3">Supervisor</TableHead>
                        <TableHead className="font-bold text-right w-1/3">Ha Ava</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {resumenSupervisores.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={2} className="text-center py-8 text-muted-foreground">
                            No hay datos para mostrar
                          </TableCell>
                        </TableRow>
                      ) : (
                        resumenSupervisores.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{item.supervisor}</TableCell>
                            <TableCell className="text-right font-bold">{item.haAvanzada.toFixed(1)}</TableCell>
                          </TableRow>
                        ))
                      )}
                      {resumenSupervisores.length > 0 && (
                        <TableRow className="bg-gray-100 font-bold">
                          <TableCell>TOTAL:</TableCell>
                          <TableCell className="text-right">
                            {resumenSupervisores.reduce((sum, item) => sum + item.haAvanzada, 0).toFixed(1)}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="resumen-actividades" className="p-4">
              <div className="space-y-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Resumen por Actividades</h3>
                  <p className="text-sm text-gray-600">Total de hectáreas por tipo de actividad</p>
                </div>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-blue-50">
                        <TableHead className="font-bold w-2/3">Actividad</TableHead>
                        <TableHead className="font-bold text-right w-1/3">Ha Ava</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {resumenActividades.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={2} className="text-center py-8 text-muted-foreground">
                            No hay datos para mostrar
                          </TableCell>
                        </TableRow>
                      ) : (
                        resumenActividades.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{item.actividad}</TableCell>
                            <TableCell className="text-right font-bold">{item.haAvanzada.toFixed(1)}</TableCell>
                          </TableRow>
                        ))
                      )}
                      {resumenActividades.length > 0 && (
                        <TableRow className="bg-gray-100 font-bold">
                          <TableCell>TOTAL:</TableCell>
                          <TableCell className="text-right">
                            {resumenActividades.reduce((sum, item) => sum + item.haAvanzada, 0).toFixed(1)}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="detalle" className="p-4">
              <div className="space-y-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Detalle Completo de Avances</h3>
                  <p className="text-sm text-gray-600">Desglose detallado de avances con supervisor y proveedor</p>
                </div>
                <div className="rounded-md border max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-blue-50">
                        <TableHead className="font-bold">Fecha</TableHead>
                        <TableHead className="font-bold">Predio</TableHead>
                        <TableHead className="font-bold">Rodal</TableHead>
                        <TableHead className="font-bold">Actividad</TableHead>
                        <TableHead className="font-bold">Supervisor</TableHead>
                        <TableHead className="font-bold">Proveedor</TableHead>
                        <TableHead className="font-bold text-right">Ha Ava</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {datosInforme.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            No hay datos para mostrar
                          </TableCell>
                        </TableRow>
                      ) : (
                        datosInforme.slice(0, 20).map((item, index) => (
                          <TableRow key={index}>
                            <TableCell className="text-sm">{formatearFechaArgentina(item.fecha)}</TableCell>
                            <TableCell className="font-medium">{item.predio}</TableCell>
                            <TableCell>{item.rodal}</TableCell>
                            <TableCell>{item.actividad}</TableCell>
                            <TableCell className="font-medium text-blue-600">{item.supervisor}</TableCell>
                            <TableCell className="font-medium text-green-600">{item.proveedor}</TableCell>
                            <TableCell className="text-right">{item.haAvanzada.toFixed(1)}</TableCell>
                          </TableRow>
                        ))
                      )}
                      {datosInforme.length > 20 && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                            Mostrando 20 de {datosInforme.length} registros. Descarga el Excel para ver todos.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
