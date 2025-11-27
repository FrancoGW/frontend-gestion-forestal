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
import { FilterIcon, RefreshCw, AlertTriangle, FileSpreadsheet, FileText, Calendar, Building, FileDown } from "lucide-react"
import { useSupervisorData } from "@/hooks/use-supervisor-data"
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
  haAvanzada: number;
  subtotal?: number;
  observaciones?: string;
};

type ResumenActividad = {
  actividad: string;
  haAvanzada: number;
};

export default function InformesAvancesPage() {
  const { user } = useAuth()
  const { supervisor, proveedores, avances, loading, error, refetch } = useSupervisorData()
  
  // Estados para los filtros
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState("")
  const [fechaDesde, setFechaDesde] = useState("")
  const [fechaHasta, setFechaHasta] = useState("")
  const [generandoInforme, setGenerandoInforme] = useState(false)
  const [generandoPDF, setGenerandoPDF] = useState(false)
  
  // Obtener las órdenes originales (con rodales) desde la API
  const [ordenesOriginales, setOrdenesOriginales] = useState<any[]>([])
  

  
  // Debug: Log de datos cargados
  useEffect(() => {
    console.log("🔍 [INFORMES DEBUG] Supervisor:", supervisor)
    console.log("🔍 [INFORMES DEBUG] Proveedores dinámicos:", proveedores)
    console.log("🔍 [INFORMES DEBUG] Avances del supervisor:", avances)
    console.log("🔍 [INFORMES DEBUG] Total avances:", avances.length)
  }, [supervisor, proveedores, avances])

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


  // Función para obtener el nombre del proveedor seleccionado
  const getNombreProveedorSeleccionado = () => {
    if (!proveedorSeleccionado || proveedorSeleccionado === "all") {
      return "Seleccionar EMSEFOR"
    }
    const proveedor = proveedores.find((p) => String(p.id) === proveedorSeleccionado)
    return proveedor ? proveedor.nombre : "EMSEFOR no encontrado"
  }

  // Datos filtrados para el informe
  const datosInforme = useMemo(() => {
    let avancesFiltrados = [...avances]

    // Filtrar por proveedor
    if (proveedorSeleccionado && proveedorSeleccionado !== "all") {
      avancesFiltrados = avancesFiltrados.filter((avance) => {
        return Number(avance.proveedorId) === Number(proveedorSeleccionado)
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

      // Debug: Log del avance para entender la estructura
      console.log("🔍 [DEBUG] Avance completo:", avance);
      console.log("🔍 [DEBUG] Avance.actividad:", avance.actividad);
      console.log("🔍 [DEBUG] Avance.especie:", avance.especie);
      console.log("🔍 [DEBUG] Tipo de avance.especie:", typeof avance.especie);

      // Construir la actividad: si es plantación, concatenar con la especie
      const actividadFinal = getActividadConEspecie(avance.actividad || "", avance.especie) || "Sin especificar"
      console.log("🔍 [DEBUG] Actividad final construida:", actividadFinal);

      informeData.push({
        fecha: avance.fecha || avance.fechaRegistro || new Date().toISOString().split("T")[0],
        predio: String(avance.predio || avance.campo || "Sin especificar"),
        rodal: String(avance.rodal || "Sin especificar"),
        actividad: actividadFinal,
        haAvanzada: Number(avance.superficie ?? 0),
        observaciones: String(avance.observaciones || ""),
      })
    })

    // Ordenar por fecha, predio, rodal
    return informeData.sort((a, b) => {
      if (a.fecha !== b.fecha) return new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
      if (a.predio !== b.predio) return a.predio.localeCompare(b.predio)
      return a.rodal.localeCompare(b.rodal)
    })
  }, [avances, proveedorSeleccionado, fechaDesde, fechaHasta, ordenesOriginales])

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
        ["INFORME DE AVANCE"],
        [""],
        ["Período:", `${fechaDesde ? formatDateArgentina(fechaDesde) : "Inicio"} - ${fechaHasta ? formatDateArgentina(fechaHasta) : "Fin"}`],
        ["EMSEFOR:", proveedorSeleccionado !== "all" ? getNombreProveedorSeleccionado() : "Todos los EMSEFOR"],
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
        ["Fecha", "Predio", "Rodal", "Actividad", "Ha Ava", "Subtotal", "Observaciones"],
        ...datosInforme.map(item => [
          formatDateArgentina(item.fecha),
          item.predio,
          item.rodal,
          item.actividad,
          Number(item.haAvanzada),
          "",
          item.observaciones || ""
        ])
      ]

      const ws = XLSX.utils.aoa_to_sheet(informeData)

      // Ajustar ancho de columnas
      ws["!cols"] = [
        { wch: 12 }, // Fecha
        { wch: 15 }, // Predio
        { wch: 10 }, // Rodal
        { wch: 20 }, // Actividad
        { wch: 10 }, // Ha Ava
        { wch: 12 }, // Subtotal
        { wch: 30 }, // Observaciones (última columna)
      ]

      XLSX.utils.book_append_sheet(wb, ws, "Informe de Avance")

      // Hoja 2: Datos detallados
      const datosDetallados = datosInforme.map((item) => ({
        "FECHA": formatDateArgentina(item.fecha),
        "PREDIO": item.predio,
        "PREDIO VECINO": item.vecino || item.predioVecino || "-",
        "RODAL": item.rodal,
        "ACTIVIDAD": item.actividad,
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
        { wch: 12 }, // HA AVANZADA
        { wch: 30 }, // OBSERVACIONES (última columna)
      ]
      XLSX.utils.book_append_sheet(wb, wsDetalle, "Datos Detallados")

      // Generar y descargar archivo
      const wbArray = XLSX.write(wb, { bookType: "xlsx", type: "array" })
      const blob = new Blob([wbArray], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })

      // Generar nombre de archivo
      let fileName = "informe_avances"
      if (fechaDesde || fechaHasta) {
        fileName += `_${fechaDesde || "inicio"}_${fechaHasta || "fin"}`
      }
      if (proveedorSeleccionado && proveedorSeleccionado !== "all") {
        const prov = proveedores.find((p) => String(p.id) === proveedorSeleccionado)
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
      doc.text("INFORME DE AVANCE", 105, yPosition, { align: "center" })
      yPosition += 15

      // Información del período y EMSEFOR
      doc.setFontSize(normalFontSize)
      doc.setFont("helvetica", "normal")
      doc.text(`Período: ${fechaDesde ? formatDateArgentina(fechaDesde) : "Inicio"} - ${fechaHasta ? formatDateArgentina(fechaHasta) : "Fin"}`, 20, yPosition)
      yPosition += 8
      doc.text(`EMSEFOR: ${proveedorSeleccionado !== "all" ? getNombreProveedorSeleccionado() : "Todos los EMSEFOR"}`, 20, yPosition)
      yPosition += 15

      // Resumen por actividades
      doc.setFontSize(subtitleFontSize)
      doc.setFont("helvetica", "bold")
      doc.text("RESUMEN POR ACTIVIDADES", 20, yPosition)
      yPosition += 10

      // Tabla de resumen
      const resumenTableData = resumenActividades.map(item => [
        item.actividad,
        item.haAvanzada.toFixed(1)
      ])

      autoTable(doc, {
        head: [["Actividad", "Ha Ava"]],
        body: resumenTableData,
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
        formatDateArgentina(item.fecha),
        item.predio,
        item.rodal,
        item.actividad,
        item.haAvanzada.toFixed(1)
      ])

      // Tabla de detalle
      autoTable(doc, {
        head: [["Fecha", "Predio", "Rodal", "Actividad", "Ha Ava"]],
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
          0: { cellWidth: 20 }, // Fecha
          1: { cellWidth: 30 }, // Predio
          2: { cellWidth: 20 }, // Rodal
          3: { cellWidth: 40 }, // Actividad
          4: { cellWidth: 20 }, // Ha Ava
        },
        didDrawPage: function (data) {
          // Agregar numeración de páginas
          const pageCount = doc.getNumberOfPages()
          doc.setFontSize(8)
          doc.text(`Página ${data.pageNumber} de ${pageCount}`, data.settings.margin.left, doc.internal.pageSize.height - 10)
        },
      })

      // Generar nombre de archivo
      let fileName = "informe_avances"
      if (fechaDesde || fechaHasta) {
        fileName += `_${fechaDesde || "inicio"}_${fechaHasta || "fin"}`
      }
      if (proveedorSeleccionado && proveedorSeleccionado !== "all") {
        const prov = proveedores.find((p) => String(p.id) === proveedorSeleccionado)
        if (prov) fileName += `_${prov.nombre.replace(/[^a-zA-Z0-9]/g, "_")}`
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
    setProveedorSeleccionado("")
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
          <h1 className="text-3xl font-bold text-red-600">GENERADOR DE INFORMES DE AVANCES</h1>
          <p className="text-muted-foreground">
            Bienvenido, {supervisor?.nombre || user?.nombre || "Supervisor"} | Genera informes de avances por EMSEFOR y período
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
          <CardDescription>Selecciona el EMSEFOR y el período para generar el informe en Excel o PDF</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end mb-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="proveedor" className="text-sm font-medium bg-blue-200 px-2 py-1 rounded">
                EMSEFOR
              </Label>
              <Select value={proveedorSeleccionado} onValueChange={setProveedorSeleccionado}>
                <SelectTrigger>
                  <SelectValue>{getNombreProveedorSeleccionado()}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los EMSEFOR</SelectItem>
                  {proveedores.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>{p.nombre}</SelectItem>
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
      {(proveedorSeleccionado || fechaDesde || fechaHasta) && (
        <div className="flex flex-wrap gap-2">
          {proveedorSeleccionado && proveedorSeleccionado !== "all" && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Building className="h-3 w-3" />
              EMSEFOR: {proveedores.find((p) => String(p.id) === proveedorSeleccionado)?.nombre}
            </Badge>
          )}
          {fechaDesde && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Desde: {formatDateArgentina(fechaDesde)}
            </Badge>
          )}
          {fechaHasta && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Hasta: {formatDateArgentina(fechaHasta)}
            </Badge>
          )}
        </div>
      )}

      {/* Pestañas estilo Excel */}
      <Card className="max-w-4xl mx-auto">
        <CardContent className="p-0">
          <Tabs defaultValue="resumen" className="w-full">
            <div className="border-b">
              <TabsList className="grid w-full grid-cols-2 h-12 bg-gray-100">
                <TabsTrigger 
                  value="resumen" 
                  className="data-[state=active]:bg-red-500 data-[state=active]:text-white data-[state=active]:shadow-none rounded-t-lg border-r border-gray-300"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Resumen por Actividades
                </TabsTrigger>
                <TabsTrigger 
                  value="detalle" 
                  className="data-[state=active]:bg-red-500 data-[state=active]:text-white data-[state=active]:shadow-none rounded-t-lg"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Detalle por Actividades
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="resumen" className="p-4">
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
                  <h3 className="text-lg font-semibold text-gray-900">Detalle por Actividades</h3>
                  <p className="text-sm text-gray-600">Desglose detallado de avances</p>
                </div>
                <div className="rounded-md border max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-blue-50">
                        <TableHead className="font-bold">Fecha</TableHead>
                        <TableHead className="font-bold">Predio</TableHead>
                        <TableHead className="font-bold">Rodal</TableHead>
                        <TableHead className="font-bold">Año P.</TableHead>
                        <TableHead className="font-bold">Actividad</TableHead>
                        <TableHead className="font-bold text-right">Ha Ava</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {datosInforme.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No hay datos para mostrar
                          </TableCell>
                        </TableRow>
                      ) : (
                        datosInforme.slice(0, 20).map((item, index) => (
                          <TableRow key={index}>
                            <TableCell className="text-sm">{formatDateArgentina(item.fecha)}</TableCell>
                            <TableCell className="font-medium">{item.predio}</TableCell>
                            <TableCell>{item.rodal}</TableCell>
                            <TableCell>{item.anioPlantacion || "-"}</TableCell>
                            <TableCell>{item.actividad}</TableCell>
                            <TableCell className="text-right">{item.haAvanzada.toFixed(1)}</TableCell>
                          </TableRow>
                        ))
                      )}
                      {datosInforme.length > 20 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
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