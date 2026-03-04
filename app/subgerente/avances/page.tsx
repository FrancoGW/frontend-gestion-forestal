"use client"

import { useMemo, useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useSubgerenteData } from "@/hooks/use-subgerente-data"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, ChevronLeft, ChevronRight, FileSpreadsheet, FileText } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import * as XLSX from "xlsx"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { formatDateArgentina } from "@/utils/date-utils"
import { useToast } from "@/hooks/use-toast"

const AVANCES_POR_PAGINA = 50

export default function SubgerenteAvancesPage() {
  const { avances, proveedores, jefesDeArea, supervisores, loading, error } = useSubgerenteData()
  const [fechaDesde, setFechaDesde] = useState("")
  const [fechaHasta, setFechaHasta] = useState("")
  const [jdaSeleccionado, setJdaSeleccionado] = useState<string>("all")
  const [supervisorSeleccionado, setSupervisorSeleccionado] = useState<string>("all")
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState<string>("all")
  const [actividadSeleccionada, setActividadSeleccionada] = useState<string>("all")
  const [predioSeleccionado, setPredioSeleccionado] = useState<string>("all")
  const [paginaActual, setPaginaActual] = useState(1)

  useEffect(() => {
    setPaginaActual(1)
  }, [fechaDesde, fechaHasta, jdaSeleccionado, supervisorSeleccionado, proveedorSeleccionado, actividadSeleccionada, predioSeleccionado])

  useEffect(() => {
    if (jdaSeleccionado !== "all") setSupervisorSeleccionado("all")
  }, [jdaSeleccionado])
  useEffect(() => {
    if (supervisorSeleccionado !== "all") setProveedorSeleccionado("all")
  }, [supervisorSeleccionado])

  const supervisoresIdsDelJda = useMemo(() => {
    if (jdaSeleccionado === "all") return null
    const jda = jefesDeArea?.find((j) => String(j.id) === jdaSeleccionado)
    if (!jda?.supervisoresAsignados?.length) return new Set<number>()
    return new Set(jda.supervisoresAsignados.map((s) => Number(s.supervisorId)))
  }, [jefesDeArea, jdaSeleccionado])

  const supervisoresDisponibles = useMemo(() => {
    if (!supervisores?.length) return []
    if (jdaSeleccionado === "all") return supervisores
    return supervisores.filter((s) => supervisoresIdsDelJda?.has(Number(s.id)))
  }, [supervisores, jdaSeleccionado, supervisoresIdsDelJda])

  const avancesPorPeriodoYJerarquia = useMemo(() => {
    let list = [...(avances || [])]
    if (fechaDesde) {
      const desde = new Date(fechaDesde)
      desde.setHours(0, 0, 0, 0)
      list = list.filter((av) => new Date(av.fecha) >= desde)
    }
    if (fechaHasta) {
      const hasta = new Date(fechaHasta)
      hasta.setHours(23, 59, 59, 999)
      list = list.filter((av) => new Date(av.fecha) <= hasta)
    }
    if (jdaSeleccionado !== "all" && supervisoresIdsDelJda) {
      list = list.filter((av) => supervisoresIdsDelJda.has(Number(av.supervisorId)))
    }
    if (supervisorSeleccionado !== "all") {
      const sid = Number(supervisorSeleccionado)
      list = list.filter((av) => Number(av.supervisorId) === sid)
    }
    return list
  }, [
    avances,
    fechaDesde,
    fechaHasta,
    jdaSeleccionado,
    supervisorSeleccionado,
    supervisoresIdsDelJda,
  ])

  const proveedoresDisponibles = useMemo(() => {
    const seen = new Map<number, { id: number; nombre: string }>()
    avancesPorPeriodoYJerarquia.forEach((av) => {
      const id = Number(av.proveedorId)
      if (id && !seen.has(id)) {
        seen.set(id, {
          id,
          nombre: av.proveedorNombre || av.proveedor || "Sin nombre",
        })
      }
    })
    return Array.from(seen.values()).sort((a, b) => a.nombre.localeCompare(b.nombre))
  }, [avancesPorPeriodoYJerarquia])

  const actividadesDisponibles = useMemo(() => {
    const set = new Set<string>()
    avancesPorPeriodoYJerarquia.forEach((av) => {
      const a = (av.actividad || "").trim()
      if (a) set.add(a)
    })
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [avancesPorPeriodoYJerarquia])

  const prediosDisponibles = useMemo(() => {
    const set = new Set<string>()
    avancesPorPeriodoYJerarquia.forEach((av) => {
      const p = (av.predio || "").trim()
      if (p) set.add(p)
    })
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [avancesPorPeriodoYJerarquia])

  const avancesFiltrados = useMemo(() => {
    let list = avancesPorPeriodoYJerarquia
    if (proveedorSeleccionado !== "all") {
      const pid = Number(proveedorSeleccionado)
      list = list.filter((av) => Number(av.proveedorId) === pid)
    }
    if (actividadSeleccionada !== "all") {
      list = list.filter(
        (av) => (av.actividad || "").trim().toLowerCase() === actividadSeleccionada.trim().toLowerCase()
      )
    }
    if (predioSeleccionado !== "all") {
      list = list.filter(
        (av) => (av.predio || "").trim().toLowerCase() === predioSeleccionado.trim().toLowerCase()
      )
    }
    // Ordenar por fecha descendente (más reciente primero)
    return [...list].sort((a, b) => {
      const da = new Date(a.fecha || 0).getTime()
      const db2 = new Date(b.fecha || 0).getTime()
      return db2 - da
    })
  }, [avancesPorPeriodoYJerarquia, proveedorSeleccionado, actividadSeleccionada, predioSeleccionado])

  const chartData = useMemo(() => {
    const map = new Map<string, number>()
    avancesFiltrados.forEach((av) => {
      const nombre = (av.actividad || "").trim() || "Sin actividad"
      const ha = Number(av.superficie) || 0
      map.set(nombre, (map.get(nombre) ?? 0) + ha)
    })
    return Array.from(map.entries())
      .map(([actividad, ha]) => ({ actividad, ha }))
      .sort((a, b) => b.ha - a.ha)
  }, [avancesFiltrados])

  const totalHa = useMemo(
    () => avancesFiltrados.reduce((sum, av) => sum + (Number(av.superficie) || 0), 0),
    [avancesFiltrados]
  )

  const mapaSupervisorNombre = useMemo(() => {
    const map = new Map<number, string>()
    supervisores?.forEach((s) => map.set(Number(s.id), s.nombre || ""))
    jefesDeArea?.forEach((jda) =>
      jda.supervisoresAsignados?.forEach((s) =>
        map.set(Number(s.supervisorId), s.nombre || map.get(Number(s.supervisorId)) || "")
      )
    )
    return map
  }, [supervisores, jefesDeArea])

  const mapaJdaPorSupervisor = useMemo(() => {
    const map = new Map<number, string>()
    supervisores?.forEach((s) => {
      if (s.jdaNombre) map.set(Number(s.id), s.jdaNombre)
    })
    jefesDeArea?.forEach((jda) =>
      jda.supervisoresAsignados?.forEach((s) => {
        if (!map.has(Number(s.supervisorId))) map.set(Number(s.supervisorId), jda.nombre || "")
      })
    )
    return map
  }, [supervisores, jefesDeArea])

  const totalPaginas = Math.max(1, Math.ceil(avancesFiltrados.length / AVANCES_POR_PAGINA))
  const avancesPaginados = useMemo(
    () =>
      avancesFiltrados.slice(
        (paginaActual - 1) * AVANCES_POR_PAGINA,
        paginaActual * AVANCES_POR_PAGINA
      ),
    [avancesFiltrados, paginaActual]
  )

  const { toast } = useToast()

  const filaParaExport = (av: (typeof avancesFiltrados)[0]) => ({
    "Jefe de área": mapaJdaPorSupervisor.get(Number(av.supervisorId)) || "-",
    Supervisor: av.supervisorNombre || mapaSupervisorNombre.get(Number(av.supervisorId)) || "-",
    Proveedor: av.proveedorNombre || av.proveedor || "-",
    Orden: av.numeroOrden || String(av.ordenTrabajoId),
    Fecha: formatDateArgentina(av.fecha),
    Predio: av.predio || "-",
    Actividad: av.actividad || "-",
    Ha: Number(av.superficie) ?? 0,
    Observaciones: av.observaciones || "",
  })

  const exportarExcel = () => {
    if (avancesFiltrados.length === 0) {
      toast({
        title: "Sin datos",
        description: "No hay avances para exportar con los filtros actuales.",
        variant: "destructive",
      })
      return
    }
    try {
      const wb = XLSX.utils.book_new()
      const datos = avancesFiltrados.map(filaParaExport)
      const ws = XLSX.utils.json_to_sheet(datos)
      ws["!cols"] = [
        { wch: 18 },
        { wch: 22 },
        { wch: 22 },
        { wch: 10 },
        { wch: 12 },
        { wch: 20 },
        { wch: 35 },
        { wch: 8 },
        { wch: 40 },
      ]
      XLSX.utils.book_append_sheet(wb, ws, "Avances")
      const nombre = `avances_subgerente_${fechaDesde || "desde"}_${fechaHasta || "hasta"}_${new Date().toISOString().split("T")[0]}.xlsx`
      XLSX.writeFile(wb, nombre)
      toast({
        title: "Excel exportado",
        description: `Se exportaron ${avancesFiltrados.length} registro(s).`,
      })
    } catch (e) {
      console.error(e)
      toast({
        title: "Error al exportar",
        description: "No se pudo generar el archivo Excel.",
        variant: "destructive",
      })
    }
  }

  const exportarPDF = () => {
    if (avancesFiltrados.length === 0) {
      toast({
        title: "Sin datos",
        description: "No hay avances para exportar con los filtros actuales.",
        variant: "destructive",
      })
      return
    }
    try {
      const doc = new jsPDF({ orientation: "landscape" })
      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      doc.text("Reporte de avances - Subgerente", 14, 15)
      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
      doc.text(
        `Período: ${fechaDesde ? formatDateArgentina(fechaDesde) : "—"} a ${fechaHasta ? formatDateArgentina(fechaHasta) : "—"} · ${avancesFiltrados.length} registro(s) · ${totalHa.toFixed(1)} ha`,
        14,
        22
      )
      const body = avancesFiltrados.map((av) => [
        mapaJdaPorSupervisor.get(Number(av.supervisorId)) || "-",
        av.supervisorNombre || mapaSupervisorNombre.get(Number(av.supervisorId)) || "-",
        av.proveedorNombre || av.proveedor || "-",
        av.numeroOrden || String(av.ordenTrabajoId),
        formatDateArgentina(av.fecha),
        (av.predio || "-").substring(0, 15),
        (av.actividad || "-").substring(0, 20),
        Number(av.superficie ?? 0).toFixed(1),
      ])
      autoTable(doc, {
        head: [["Jefe de área", "Supervisor", "Proveedor", "Orden", "Fecha", "Predio", "Actividad", "Ha"]],
        body,
        startY: 28,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [20, 128, 120], textColor: 255, fontStyle: "bold" },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        columnStyles: {
          0: { cellWidth: 22 },
          1: { cellWidth: 25 },
          2: { cellWidth: 25 },
          3: { cellWidth: 14 },
          4: { cellWidth: 18 },
          5: { cellWidth: 22 },
          6: { cellWidth: 35 },
          7: { cellWidth: 12 },
        },
        didDrawPage: (data) => {
          doc.setFontSize(8)
          doc.text(
            `Página ${data.pageNumber} de ${(doc as any).internal.getNumberOfPages()}`,
            data.settings.margin.left,
            doc.internal.pageSize.height - 8
          )
        },
      })
      const nombre = `avances_subgerente_${new Date().toISOString().split("T")[0]}.pdf`
      doc.save(nombre)
      toast({
        title: "PDF exportado",
        description: `Se exportaron ${avancesFiltrados.length} registro(s).`,
      })
    } catch (e) {
      console.error(e)
      toast({
        title: "Error al exportar",
        description: "No se pudo generar el PDF.",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Avances</h1>
        <p className="text-gray-600 mt-1">
          Hectáreas avanzadas por actividad. Filtrá por período, proveedor y actividad.
        </p>
      </div>

      {/* Gráfico de barras horizontales */}
      <Card>
        <CardHeader>
          <CardTitle>Ha avanzadas por actividad</CardTitle>
          <CardDescription>
            Total {totalHa.toLocaleString("es-AR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} ha en{" "}
            {avancesFiltrados.length} registro(s). Los filtros de abajo aplican al gráfico y a la tabla.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <p className="text-sm text-gray-500 py-8 text-center">No hay datos para mostrar con los filtros actuales.</p>
          ) : (
            <ChartContainer
              config={{
                ha: { label: "Hectáreas", color: "hsl(173, 58%, 39%)" },
              }}
              className="h-[520px] w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={chartData}
                  margin={{ top: 16, right: 80, left: 220, bottom: 16 }}
                  barCategoryGap="12%"
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" unit=" ha" tickFormatter={(v) => `${v}`} />
                  <YAxis type="category" dataKey="actividad" width={200} tick={{ fontSize: 12 }} />
                  <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => (
                      <span>
                        {Number(value).toLocaleString("es-AR", {
                          minimumFractionDigits: 1,
                          maximumFractionDigits: 1,
                        })}{" "}
                        ha
                      </span>
                    )}
                  />
                }
              />
                  <Bar dataKey="ha" name="Ha" fill="hsl(173, 58%, 39%)" radius={[0, 4, 4, 0]}>
                  <LabelList
                    dataKey="ha"
                    position="right"
                    formatter={(v: number) => `${Number(v).toLocaleString("es-AR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} ha`}
                    style={{ fill: "#0f766e", fontWeight: 600, fontSize: 11 }}
                  />
                </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>
            Período, JDA, supervisor, proveedor, actividad y predio. El resultado muestra las ha avanzadas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-6">
            <div>
              <Label htmlFor="fecha-desde">Desde</Label>
              <Input
                id="fecha-desde"
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                className="w-40"
              />
            </div>
            <div>
              <Label htmlFor="fecha-hasta">Hasta</Label>
              <Input
                id="fecha-hasta"
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                className="w-40"
              />
            </div>
            <div>
              <Label htmlFor="jda">Jefe de área</Label>
              <Select value={jdaSeleccionado} onValueChange={setJdaSeleccionado}>
                <SelectTrigger id="jda" className="w-48">
                  <SelectValue placeholder="Todos">
                    {jdaSeleccionado === "all"
                      ? "Todos los JDAs"
                      : jefesDeArea?.find((j) => String(j.id) === jdaSeleccionado)?.nombre}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los JDAs</SelectItem>
                  {(jefesDeArea || []).map((j) => (
                    <SelectItem key={j.id} value={String(j.id)}>
                      {j.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="supervisor">Supervisor</Label>
              <Select
                value={supervisorSeleccionado}
                onValueChange={setSupervisorSeleccionado}
                disabled={jdaSeleccionado !== "all" && supervisoresDisponibles.length === 0}
              >
                <SelectTrigger id="supervisor" className="w-48">
                  <SelectValue placeholder="Todos">
                    {supervisorSeleccionado === "all"
                      ? "Todos los supervisores"
                      : supervisoresDisponibles.find((s) => String(s.id) === supervisorSeleccionado)?.nombre}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los supervisores</SelectItem>
                  {supervisoresDisponibles.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="proveedor">Proveedor</Label>
              <Select
                value={proveedorSeleccionado}
                onValueChange={setProveedorSeleccionado}
              >
                <SelectTrigger id="proveedor" className="w-56">
                  <SelectValue placeholder="Todos">
                    {proveedorSeleccionado === "all"
                      ? "Todos los proveedores"
                      : proveedoresDisponibles.find((p) => String(p.id) === proveedorSeleccionado)?.nombre}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los proveedores</SelectItem>
                  {proveedoresDisponibles.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="actividad">Actividad</Label>
              <Select value={actividadSeleccionada} onValueChange={setActividadSeleccionada}>
                <SelectTrigger id="actividad" className="w-56">
                  <SelectValue placeholder="Todas">
                    {actividadSeleccionada === "all"
                      ? "Todas las actividades"
                      : actividadSeleccionada}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las actividades</SelectItem>
                  {actividadesDisponibles.map((act) => (
                    <SelectItem key={act} value={act}>
                      {act.length > 45 ? act.substring(0, 45) + "…" : act}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="predio">Predio</Label>
              <Select value={predioSeleccionado} onValueChange={setPredioSeleccionado}>
                <SelectTrigger id="predio" className="w-56">
                  <SelectValue placeholder="Todos">
                    {predioSeleccionado === "all"
                      ? "Todos los predios"
                      : (predioSeleccionado.length > 40 ? predioSeleccionado.substring(0, 40) + "…" : predioSeleccionado)}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los predios</SelectItem>
                  {prediosDisponibles.map((pred) => (
                    <SelectItem key={pred} value={pred}>
                      {pred.length > 50 ? pred.substring(0, 50) + "…" : pred}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de avances con paginación */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <CardTitle>Detalle de avances</CardTitle>
              <CardDescription className="mt-1">
                {avancesFiltrados.length} registro(s) ·{" "}
                {totalHa.toLocaleString("es-AR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} ha en total
                {avancesFiltrados.length > AVANCES_POR_PAGINA &&
                  ` · Mostrando ${(paginaActual - 1) * AVANCES_POR_PAGINA + 1}–${Math.min(
                    paginaActual * AVANCES_POR_PAGINA,
                    avancesFiltrados.length
                  )} de ${avancesFiltrados.length}`}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportarExcel} disabled={avancesFiltrados.length === 0}>
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Exportar Excel
              </Button>
              <Button variant="outline" size="sm" onClick={exportarPDF} disabled={avancesFiltrados.length === 0}>
                <FileText className="w-4 h-4 mr-2" />
                Exportar PDF
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left p-2 font-medium">Orden</th>
                  <th className="text-left p-2 font-medium">Fecha</th>
                  <th className="text-left p-2 font-medium">Supervisor</th>
                  <th className="text-left p-2 font-medium">Proveedor</th>
                  <th className="text-left p-2 font-medium">Predio / Actividad</th>
                  <th className="text-right p-2 font-medium">Ha</th>
                </tr>
              </thead>
              <tbody>
                {avancesPaginados.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-gray-500">
                      No hay avances que coincidan con los filtros.
                    </td>
                  </tr>
                ) : (
                  avancesPaginados.map((av) => (
                    <tr key={av._id} className="border-b last:border-0 hover:bg-gray-50/50">
                      <td className="p-2">{av.numeroOrden || av.ordenTrabajoId}</td>
                      <td className="p-2">{av.fecha ? new Date(av.fecha).toLocaleDateString("es-AR") : "-"}</td>
                      <td className="p-2">
                        {av.supervisorNombre || mapaSupervisorNombre.get(Number(av.supervisorId)) || "-"}
                      </td>
                      <td className="p-2">{av.proveedorNombre || av.proveedor || "-"}</td>
                      <td className="p-2">
                        {[av.predio, av.actividad].filter(Boolean).join(" — ") || "-"}
                      </td>
                      <td className="p-2 text-right">
                        {av.superficie != null
                          ? Number(av.superficie).toLocaleString("es-AR", {
                              minimumFractionDigits: 1,
                              maximumFractionDigits: 1,
                            })
                          : "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {totalPaginas > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-gray-500">
                Página {paginaActual} de {totalPaginas}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
                  disabled={paginaActual <= 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPaginaActual((p) => Math.min(totalPaginas, p + 1))}
                  disabled={paginaActual >= totalPaginas}
                >
                  Siguiente
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
