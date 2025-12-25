"use client"

import { useState, useEffect } from "react"
import { useWorkOrders } from "@/hooks/use-work-orders"
import { avancesTrabajoAPI } from "@/lib/api-client"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PageLoader } from "@/components/ui/page-loader"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Clock, CheckCircle2, Calendar, ArrowRight, RefreshCw, FileText } from "lucide-react"
import { BackendStatusAlert } from "@/components/backend-status-alert"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

export default function AdminDashboard() {
  const { workOrders, loading, error, backendStatus, retryConnection } = useWorkOrders()
  const { toast } = useToast()
  const [syncing, setSyncing] = useState(false)
  const [allAvances, setAllAvances] = useState<any[]>([])
  const [loadingAvances, setLoadingAvances] = useState(false)

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

  // Calcular estadísticas basadas en avances
  const pendingOrders = workOrders.filter((order) => {
    const statusFromAvances = getOrderStatusFromAvances(order.id)
    return statusFromAvances === "pendiente"
  })

  const completedOrders = workOrders.filter((order) => {
    const statusFromAvances = getOrderStatusFromAvances(order.id)
    return statusFromAvances === "terminado"
  })

  const approvedOrders = workOrders.filter((order) => order.estado === "aprobado")

  // Obtener el mes actual
  const currentDate = new Date()
  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()

  // Filtrar órdenes del mes actual
  const currentMonthOrders = workOrders.filter((order) => {
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

  // Calcular total de órdenes (todas)
  const totalOrdenes = workOrders.length

  // Calcular hectáreas totales (todas las órdenes)
  const totalHectareas = workOrders.reduce((total, order) => {
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

  if (loading) {
    return (
      <div className="space-y-6">
        <PageLoader message="Cargando dashboard..." submessage="Obteniendo estadísticas y órdenes" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Bienvenido al panel de administración</p>
        </div>
        <Button
          onClick={handleSyncOrdenes}
          disabled={syncing}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "Sincronizando..." : "Sincronizar Órdenes"}
        </Button>
      </div>

      {/* Mostrar alerta de estado del backend si hay problemas de conexión */}
      <BackendStatusAlert status={backendStatus} loading={loading} onRetry={retryConnection} />

      {error && (
        <Card className="bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Órdenes</CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrdenes}</div>
            <p className="text-xs text-muted-foreground">Todas las órdenes del sistema</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hectáreas Totales</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHectareas.toFixed(1)} ha</div>
            <p className="text-xs text-muted-foreground">Superficie total de todas las órdenes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Órdenes Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingOrders.length}</div>
            <p className="text-xs text-muted-foreground">Sin avances o avances pendientes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Órdenes del Mes</CardTitle>
            <Calendar className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentMonthOrders.length}</div>
            <p className="text-xs text-muted-foreground">
              Total de órdenes en {new Date().toLocaleString("es", { month: "long" })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Órdenes Terminadas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedOrders.length}</div>
            <p className="text-xs text-muted-foreground">Órdenes completadas según avances</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hectáreas del Mes</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentMonthHectares.toFixed(1)} ha</div>
            <p className="text-xs text-muted-foreground">
              Superficie de avances terminados en {new Date().toLocaleString("es", { month: "long" })}
            </p>
          </CardContent>
        </Card>
      </div>

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
                {pendingOrders.slice(0, 5).map((order) => (
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
          {workOrders.length === 0 ? (
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
                  workOrders
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
