"use client"

import { useEffect, useRef, useMemo } from "react"
import {
  Chart,
  ArcElement,
  BarElement,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  DoughnutController,
  BarController,
  LineController,
  Filler,
} from "chart.js"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

Chart.register(
  ArcElement,
  BarElement,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  DoughnutController,
  BarController,
  LineController,
  Filler
)

const COLORS = [
  "#16a34a", "#2563eb", "#d97706", "#dc2626",
  "#7c3aed", "#0891b2", "#db2777", "#65a30d",
  "#ea580c", "#0d9488", "#6366f1", "#b45309",
  "#be123c", "#1d4ed8", "#15803d", "#7e22ce",
]

// ── Doughnut: Estado de órdenes ──────────────────────────────────────────────
function EstadosChart({ pendientes, terminadas, enProgreso }: { pendientes: number; terminadas: number; enProgreso: number }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<Chart | null>(null)

  useEffect(() => {
    if (!ref.current) return
    chartRef.current?.destroy()
    chartRef.current = new Chart(ref.current, {
      type: "doughnut",
      data: {
        labels: ["Pendientes", "En Progreso", "Terminadas"],
        datasets: [{
          data: [pendientes, enProgreso, terminadas],
          backgroundColor: ["#d97706", "#2563eb", "#16a34a"],
          borderWidth: 2,
          borderColor: "#fff",
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "bottom", labels: { padding: 16, font: { size: 12 } } },
          tooltip: { callbacks: { label: (ctx) => ` ${ctx.label}: ${ctx.parsed}` } },
        },
        cutout: "60%",
      },
    })
    return () => chartRef.current?.destroy()
  }, [pendientes, terminadas, enProgreso])

  return <canvas ref={ref} />
}

// ── Bar: Top actividades ─────────────────────────────────────────────────────
function ActividadesChart({ orders }: { orders: any[] }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<Chart | null>(null)

  useEffect(() => {
    if (!ref.current) return
    const counts: Record<string, number> = {}
    orders.forEach((o) => {
      const act = o.actividad || "Sin actividad"
      counts[act] = (counts[act] || 0) + 1
    })
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8)

    chartRef.current?.destroy()
    chartRef.current = new Chart(ref.current, {
      type: "bar",
      data: {
        labels: sorted.map(([k]) => k.length > 28 ? k.slice(0, 28) + "…" : k),
        datasets: [{
          label: "Órdenes",
          data: sorted.map(([, v]) => v),
          backgroundColor: COLORS,
          borderRadius: 6,
          borderSkipped: false,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: "y",
        plugins: { legend: { display: false } },
        scales: {
          x: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: "#f1f5f9" } },
          y: { grid: { display: false }, ticks: { font: { size: 11 } } },
        },
      },
    })
    return () => chartRef.current?.destroy()
  }, [orders])

  return <canvas ref={ref} />
}

// ── Line: Órdenes por mes ────────────────────────────────────────────────────
function OrdenesLineChart({ orders }: { orders: any[] }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<Chart | null>(null)

  useEffect(() => {
    if (!ref.current) return

    const now = new Date()
    const labels: string[] = []
    const counts: number[] = []

    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const label = d.toLocaleString("es", { month: "short", year: "2-digit" })
      labels.push(label)
      const count = orders.filter((o) => {
        const od = new Date(o.fecha)
        return od.getMonth() === d.getMonth() && od.getFullYear() === d.getFullYear()
      }).length
      counts.push(count)
    }

    chartRef.current?.destroy()
    chartRef.current = new Chart(ref.current, {
      type: "line",
      data: {
        labels,
        datasets: [{
          label: "Órdenes emitidas",
          data: counts,
          borderColor: "#16a34a",
          backgroundColor: "rgba(22,163,74,0.08)",
          borderWidth: 2.5,
          pointBackgroundColor: "#16a34a",
          pointRadius: 4,
          fill: true,
          tension: 0.4,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: "#f1f5f9" } },
          x: { grid: { display: false } },
        },
      },
    })
    return () => chartRef.current?.destroy()
  }, [orders])

  return <canvas ref={ref} />
}

// ── Bar apilado: Hectáreas por campo con actividades ─────────────────────────
function HectareasCampoChart({ orders }: { orders: any[] }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<Chart | null>(null)

  // Pre-calcular datos fuera del useEffect
  const { topCampos, datasets } = useMemo(() => {
    // Calcular ha por campo
    const haTotal: Record<string, number> = {}
    orders.forEach((o) => {
      const campo = o.campo || "Sin campo"
      let ha = 0
      if (o.totalHectareas && Number(o.totalHectareas) > 0) {
        ha = parseFloat(String(o.totalHectareas)) || 0
      } else if (Array.isArray(o.rodales) && o.rodales.length > 0) {
        ha = o.rodales.reduce((sum: number, r: any) => {
          const sup = r.sup_ha ?? r.supha ?? r.hectareas ?? r.superficie ?? 0
          return sum + (parseFloat(String(sup)) || 0)
        }, 0)
      } else if (o.cantidad) {
        const cantStr = String(o.cantidad).replace(/[^\d.,]/g, "").replace(",", ".")
        ha = parseFloat(cantStr) || 0
      }
      haTotal[campo] = (haTotal[campo] || 0) + ha
    })

    // Top 8 campos por ha total
    const topCampos = Object.entries(haTotal)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([campo]) => campo)

    // Calcular ha por campo+actividad (solo para top 8 campos)
    const haPorCampoActividad: Record<string, Record<string, number>> = {}
    orders.forEach((o) => {
      const campo = o.campo || "Sin campo"
      if (!topCampos.includes(campo)) return
      const actividad = o.actividad || "Sin actividad"
      let ha = 0
      if (o.totalHectareas && Number(o.totalHectareas) > 0) {
        ha = parseFloat(String(o.totalHectareas)) || 0
      } else if (Array.isArray(o.rodales) && o.rodales.length > 0) {
        ha = o.rodales.reduce((sum: number, r: any) => {
          const sup = r.sup_ha ?? r.supha ?? r.hectareas ?? r.superficie ?? 0
          return sum + (parseFloat(String(sup)) || 0)
        }, 0)
      } else if (o.cantidad) {
        const cantStr = String(o.cantidad).replace(/[^\d.,]/g, "").replace(",", ".")
        ha = parseFloat(cantStr) || 0
      }
      if (!haPorCampoActividad[campo]) haPorCampoActividad[campo] = {}
      haPorCampoActividad[campo][actividad] = (haPorCampoActividad[campo][actividad] || 0) + ha
    })

    // Recolectar todas las actividades únicas y calcular su ha total entre todos los campos top 8
    const actividadHaTotal: Record<string, number> = {}
    topCampos.forEach((campo) => {
      Object.entries(haPorCampoActividad[campo] || {}).forEach(([act, ha]) => {
        actividadHaTotal[act] = (actividadHaTotal[act] || 0) + ha
      })
    })

    // Top actividades (hasta 10), el resto va a "Otras"
    const MAX_ACTIVIDADES = 10
    const actividadesOrdenadas = Object.entries(actividadHaTotal)
      .sort((a, b) => b[1] - a[1])
    const topActividades = actividadesOrdenadas.slice(0, MAX_ACTIVIDADES).map(([act]) => act)
    const hayOtras = actividadesOrdenadas.length > MAX_ACTIVIDADES

    // Construir datasets (uno por actividad + uno para "Otras")
    const datasets = topActividades.map((actividad, idx) => ({
      label: actividad.length > 30 ? actividad.slice(0, 30) + "…" : actividad,
      data: topCampos.map((campo) =>
        parseFloat(((haPorCampoActividad[campo]?.[actividad]) || 0).toFixed(1))
      ),
      backgroundColor: COLORS[idx % COLORS.length] + "cc",
      borderColor: COLORS[idx % COLORS.length],
      borderWidth: 1,
      borderRadius: 2,
    }))

    if (hayOtras) {
      const otrasActs = actividadesOrdenadas.slice(MAX_ACTIVIDADES).map(([act]) => act)
      datasets.push({
        label: "Otras",
        data: topCampos.map((campo) => {
          const sum = otrasActs.reduce(
            (acc, act) => acc + ((haPorCampoActividad[campo]?.[act]) || 0), 0
          )
          return parseFloat(sum.toFixed(1))
        }),
        backgroundColor: "#94a3b8cc",
        borderColor: "#94a3b8",
        borderWidth: 1,
        borderRadius: 2,
      })
    }

    return { topCampos, datasets }
  }, [orders])

  useEffect(() => {
    if (!ref.current) return
    chartRef.current?.destroy()
    chartRef.current = new Chart(ref.current, {
      type: "bar",
      data: {
        labels: topCampos,
        datasets,
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: { padding: 10, font: { size: 10 }, boxWidth: 12, boxHeight: 10 },
          },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.dataset.label}: ${Number(ctx.parsed.y).toFixed(1)} ha`,
            },
          },
        },
        scales: {
          x: { stacked: true, grid: { display: false }, ticks: { font: { size: 11 } } },
          y: {
            stacked: true,
            beginAtZero: true,
            grid: { color: "#f1f5f9" },
            ticks: { callback: (v) => `${v} ha` },
          },
        },
      },
    })
    return () => chartRef.current?.destroy()
  }, [topCampos, datasets])

  return <canvas ref={ref} />
}

// ── Export principal ─────────────────────────────────────────────────────────
interface DashboardChartsProps {
  orders: any[]
  pendientes: number
  terminadas: number
  enProgreso: number
}

export function DashboardCharts({ orders, pendientes, terminadas, enProgreso }: DashboardChartsProps) {
  if (!orders.length) return null

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Estado de Órdenes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <EstadosChart pendientes={pendientes} terminadas={terminadas} enProgreso={enProgreso} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top Actividades</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ActividadesChart orders={orders} />
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Órdenes por Mes (últimos 12 meses)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-56">
            <OrdenesLineChart orders={orders} />
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Hectáreas por Campo (Top 8) — por actividad</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <HectareasCampoChart orders={orders} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
