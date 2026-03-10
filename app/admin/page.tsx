"use client"

import { useState, useEffect } from "react"
import { useWorkOrders } from "@/hooks/use-work-orders"
import { avancesTrabajoAPI } from "@/lib/api-client"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Clock, CheckCircle2, Calendar, ArrowRight, RefreshCw, FileText, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { BackendStatusAlert } from "@/components/backend-status-alert"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { DashboardCharts } from "@/components/admin/dashboard-charts"
import { Skeleton } from "@/components/ui/skeleton"

export default function AdminDashboard() {
  const { workOrders, loading, error, backendStatus, retryConnection } = useWorkOrders()
  const { toast } = useToast()
  const [syncing, setSyncing] = useState(false)
  const [allAvances, setAllAvances] = useState<any[]>([])
  const [loadingAvances, setLoadingAvances] = useState(false)
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  // Cargar todos los avances
  useEffect(() => {
    const fetchAvances = async () => {
      try {
        setLoadingAvances(true)
        const avances = await avancesTrabajoAPI.getAll()
        const avancesArray = Array.isArray(avances) ? avances : avances?.data || avances?.avances || []
        setAllAvances(avancesArray)
      } catch (err) {
        console.error("Error al cargar avances:", err)
        setAllAvances([])
      } finally {
        setLoadingAvances(false)
      }
    }
    fetchAvances()
  }, [])

  // Función para determinar el estado de una orden basado en sus avances
  const getOrderStatusFromAvances = (orderId: number) => {
    const orderAvances = allAvances.filter((avance) => avance.ordenTrabajoId === orderId)
    
    if (orderAvances.length === 0) {
      return "pendiente" // Sin avances = pendiente
    }

    // Verificar si todos los avances están terminados
    const allTerminated = orderAvances.every((avance) => {
      const estado = String(avance.estado || "").toLowerCase()
      return estado.includes("terminado") || estado.includes("r7") || estado === "finalizado"
    })

    if (allTerminated && orderAvances.length > 0) {
      return "terminado"
    }

    // Verificar si hay al menos un avance terminado
    const hasTerminated = orderAvances.some((avance) => {
      const estado = String(avance.estado || "").toLowerCase()
      return estado.includes("terminado") || estado.includes("r7") || estado === "finalizado"
    })

    if (hasTerminated) {
      return "en_progreso" // Algunos terminados pero no todos
    }

    return "pendiente" // Tiene avances pero ninguno terminado
  }

  // Filtrar órdenes por rango de fechas
  const filteredWorkOrders = workOrders.filter((order) => {
    if (!dateFrom && !dateTo) return true
    const orderDate = new Date(order.fecha)
    if (isNaN(orderDate.getTime())) return true
    if (dateFrom && orderDate < new Date(dateFrom)) return false
    if (dateTo && orderDate > new Date(dateTo + "T23:59:59")) return false
    return true
  })

  // Calcular estadísticas basadas en avances
  const pendingOrders = filteredWorkOrders.filter((order) => {
    const statusFromAvances = getOrderStatusFromAvances(order.id)
    return statusFromAvances === "pendiente"
  })

  const completedOrders = filteredWorkOrders.filter((order) => {
    const statusFromAvances = getOrderStatusFromAvances(order.id)
    return statusFromAvances === "terminado"
  })

  const approvedOrders = filteredWorkOrders.filter((order) => order.estado === "aprobado")

  // Obtener el mes actual
  const currentDate = new Date()
  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()

  // Filtrar órdenes del mes actual
  const currentMonthOrders = filteredWorkOrders.filter((order) => {
    const orderDate = new Date(order.fecha)
    return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear
  })

  // Calcular hectáreas del mes basadas en avances terminados
  const currentMonthHectares = allAvances
    .filter((avance) => {
      // Filtrar avances terminados del mes actual
      const estado = String(avance.estado || "").toLowerCase()
      const isTerminated = estado.includes("terminado") || estado.includes("r7") || estado === "finalizado"
      
      if (!isTerminated) return false
      
      // Verificar que sea del mes actual
      const avanceDate = new Date(avance.fecha || avance.fechaRegistro || avance.createdAt)
      return (
        avanceDate.getMonth() === currentMonth &&
        avanceDate.getFullYear() === currentYear
      )
    })
    .reduce((total, avance) => {
      const superficie = avance.superficie || 0
      return total + (typeof superficie === 'number' ? superficie : Number.parseFloat(String(superficie)) || 0)
    }, 0)

  // Calcular total de órdenes (filtradas)
  const totalOrdenes = filteredWorkOrders.length

  // Calcular hectáreas totales (órdenes filtradas)
  const totalHectareas = filteredWorkOrders.reduce((total, order) => {
    // Intentar obtener hectáreas de diferentes campos
    let hectares = 0
    if (order.totalHectareas) {
      hectares = typeof order.totalHectareas === 'number' ? order.totalHectareas : Number.parseFloat(String(order.totalHectareas)) || 0
    } else if (order.rodales && Array.isArray(order.rodales)) {
      // Calcular desde rodales si no hay totalHectareas
      hectares = order.rodales.reduce((sum: number, rodal: any) => {
        const sup = rodal.superficie || rodal.supha || rodal.sup_ha || 0
        return sum + (typeof sup === 'number' ? sup : Number.parseFloat(String(sup)) || 0)
      }, 0)
    } else if (order.cantidad) {
      // Intentar parsear desde cantidad
      const cantidadStr = String(order.cantidad).replace(/[^\d.,]/g, '')
      hectares = Number.parseFloat(cantidadStr.replace(',', '.')) || 0
    }
    return total + hectares
  }, 0)

  // Función para sincronizar manualmente las órdenes
  const handleSyncOrdenes = async () => {
    setSyncing(true)
    try {
      const response = await fetch("/api/cron/etl", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (response.ok) {
        const resultados = data.resultados || {}
        const ordenesInfo = resultados.ordenesTrabajo || {}
        
        if (data.success && ordenesInfo.exito) {
          toast({
            title: "✅ Sincronización completada",
            description: `Se procesaron ${ordenesInfo.cantidad || 0} órdenes exitosamente.`,
          })

          // Recargar las órdenes después de un breve delay
          setTimeout(() => {
            window.location.reload()
          }, 1500)
        } else if (data.success) {
          // Algunas partes fallaron pero el proceso continuó
          const partesExitosas = [
            resultados.datosAdministrativos?.exito && "datos administrativos",
            resultados.ordenesTrabajo?.exito && "órdenes de trabajo",
            resultados.datosProteccion?.exito && "datos de protección",
          ].filter(Boolean)
          
          toast({
            title: "⚠️ Sincronización parcial",
            description: partesExitosas.length > 0
              ? `Se completaron: ${partesExitosas.join(", ")}. Algunas partes pueden haber fallado.`
              : "La sincronización se completó, pero algunas partes pueden haber fallado.",
          })
          
          // Recargar solo si las órdenes se sincronizaron exitosamente
          if (ordenesInfo.exito) {
            setTimeout(() => {
              window.location.reload()
            }, 1500)
          }
        } else {
          const errorMsg = data.mensaje || data.error || "Error desconocido"
          toast({
            title: "❌ Error en la sincronización",
            description: errorMsg,
            variant: "destructive",
          })
        }
      } else {
        const errorMsg = data.details || data.error || `Error ${response.status}`
        toast({
          title: "❌ Error en la sincronización",
          description: errorMsg,
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "❌ Error en la sincronización",
        description: error.message || "No se pudo conectar con el servidor",
        variant: "destructive",
      })
    } finally {
      setSyncing(false)
    }
  }

  // Calcular órdenes en progreso (tiene avances pero no todas terminadas)
  const inProgressOrders = filteredWorkOrders.filter((order) => {
    const statusFromAvances = getOrderStatusFromAvances(order.id)
    return statusFromAvances === "en_progreso"
  })

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-9 w-40" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-9 w-40" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2"><Skeleton className="h-4 w-24" /></CardHeader>
              <CardContent><Skeleton className="h-8 w-16" /></CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  const hasDateFilter = dateFrom || dateTo

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            {hasDateFilter
              ? `Mostrando ${filteredWorkOrders.length} de ${workOrders.length} órdenes`
              : "Bienvenido al panel de administración"}
          </p>
        </div>
        <div className="flex items-end gap-3 flex-wrap">
          {/* Filtro de fechas */}
          <div className="flex items-end gap-2">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Desde</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-9 text-sm rounded-sm w-36"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Hasta</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-9 text-sm rounded-sm w-36"
              />
            </div>
            {hasDateFilter && (
              <Button
                variant="ghost"
                size="sm"
                className="h-9 px-2 text-muted-foreground hover:text-foreground"
                onClick={() => { setDateFrom(""); setDateTo("") }}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <Button
            onClick={handleSyncOrdenes}
            disabled={syncing}
            variant="outline"
            size="sm"
            className="h-9 flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Sincronizando..." : "Sincronizar Órdenes"}
          </Button>
        </div>
      </div>

      {/* Mostrar alerta de estado del backend si hay problemas de conexión */}
      <BackendStatusAlert
        status={backendStatus === null || backendStatus?.available ? "connected" : "error"}
        loading={loading}
        onRetry={retryConnection}
      />

      {error && (
        <Card className="bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        {[
          { label: "Total Órdenes", value: totalOrdenes, color: "text-foreground", accent: "border-l-2 border-l-blue-400", sub: "Todas las órdenes" },
          { label: "Ha Totales", value: `${totalHectareas.toFixed(1)} ha`, color: "text-emerald-700", accent: "border-l-2 border-l-emerald-400", sub: "Superficie total" },
          { label: "Pendientes", value: pendingOrders.length, color: "text-yellow-700", accent: "border-l-2 border-l-yellow-400", sub: "Sin iniciar" },
          { label: "En progreso", value: inProgressOrders.length, color: "text-blue-700", accent: "border-l-2 border-l-blue-400", sub: "En ejecución" },
          { label: "Terminadas", value: completedOrders.length, color: "text-emerald-700", accent: "border-l-2 border-l-emerald-400", sub: "Completadas" },
          { label: `Ha en ${new Date().toLocaleString("es", { month: "long" })}`, value: `${currentMonthHectares.toFixed(1)} ha`, color: "text-emerald-700", accent: "border-l-2 border-l-emerald-400", sub: "Este mes" },
        ].map((s) => (
          <div key={s.label} className={`border rounded-sm bg-card px-4 py-3 flex flex-col justify-between ${s.accent}`}>
            <div className={`text-2xl font-semibold tabular-nums ${s.color}`}>{s.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Gráficos */}
      <DashboardCharts
        orders={filteredWorkOrders}
        pendientes={pendingOrders.length}
        terminadas={completedOrders.length}
        enProgreso={inProgressOrders.length}
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Órdenes Pendientes</CardTitle>
            <CardDescription>Órdenes que requieren aprobación</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/ordenes" className="flex items-center gap-1">
              Ver todas <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {pendingOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <p className="text-muted-foreground text-center">No hay órdenes pendientes.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Orden #</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Campo</TableHead>
                  <TableHead>Actividad</TableHead>
                  <TableHead>Hectáreas</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWorkOrders.filter(o => getOrderStatusFromAvances(o.id) === "pendiente").slice(0, 5).map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      <Link href={`/admin/ordenes/${order.id}`} className="text-blue-600 hover:underline">
                        #{order.numero}
                      </Link>
                    </TableCell>
                    <TableCell>{order.fecha}</TableCell>
                    <TableCell>{order.campo}</TableCell>
                    <TableCell className="max-w-[200px] truncate" title={order.actividad}>
                      {order.actividad}
                    </TableCell>
                    <TableCell>{order.totalHectareas} ha</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                        Pendiente
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
        {pendingOrders.length > 5 && (
          <CardFooter className="flex justify-center border-t pt-4">
            <Button variant="outline" asChild>
              <Link href="/admin/ordenes?estado=pendiente">Ver {pendingOrders.length - 5} órdenes pendientes más</Link>
            </Button>
          </CardFooter>
        )}
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Órdenes Recientes</CardTitle>
            <CardDescription>Últimas órdenes registradas en el sistema</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/ordenes" className="flex items-center gap-1">
              Ver todas <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {filteredWorkOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <p className="text-muted-foreground text-center">No hay órdenes registradas.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Orden #</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Campo</TableHead>
                  <TableHead>Actividad</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {
                  filteredWorkOrders
                    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
                    .slice(0, 5)
                    .map((order) => {
                      // Fallback when `estado` no está definido
                      const estadoRaw = String(order.estado ?? "desconocido")

                      // Badge color
                      let badgeClass = ""
                      switch (estadoRaw) {
                        case "pendiente":
                          badgeClass = "bg-yellow-100 text-yellow-800"
                          break
                        case "aprobado":
                          badgeClass = "bg-blue-100 text-blue-800"
                          break
                        case "finalizado":
                          badgeClass = "bg-green-100 text-green-800"
                          break
                        default:
                          badgeClass = "bg-muted text-muted-foreground"
                      }

                      const estadoCap = estadoRaw.charAt(0).toUpperCase() + estadoRaw.slice(1)

                      return (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">
                            <Link href={`/admin/ordenes/${order.id}`} className="text-blue-600 hover:underline">
                              #{order.numero}
                            </Link>
                          </TableCell>
                          <TableCell>{order.fecha}</TableCell>
                          <TableCell>{order.campo}</TableCell>
                          <TableCell className="max-w-[200px] truncate" title={order.actividad}>
                            {order.actividad}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={badgeClass}>
                              {estadoCap}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      )
                    }) as any
                }
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
