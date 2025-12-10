"use client"

import { useState } from "react"
import { useWorkOrders } from "@/hooks/use-work-orders"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Clock, CheckCircle2, Calendar, ArrowRight, RefreshCw } from "lucide-react"
import { BackendStatusAlert } from "@/components/backend-status-alert"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

export default function AdminDashboard() {
  const { workOrders, loading, error, backendStatus, retryConnection } = useWorkOrders()
  const { toast } = useToast()
  const [syncing, setSyncing] = useState(false)

  // Calcular estadísticas
  const pendingOrders = workOrders.filter((order) => order.estado === "pendiente")
  const approvedOrders = workOrders.filter((order) => order.estado === "aprobado")
  const completedOrders = workOrders.filter((order) => order.estado === "finalizado")

  // Obtener el mes actual
  const currentDate = new Date()
  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()

  // Filtrar órdenes del mes actual
  const currentMonthOrders = workOrders.filter((order) => {
    const orderDate = new Date(order.fecha)
    return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear
  })

  // Calcular hectáreas totales del mes
  const currentMonthHectares = currentMonthOrders.reduce((total, order) => total + order.totalHectareas, 0)

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
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Bienvenido al panel de administración</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-40" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-4 w-32 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Órdenes Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingOrders.length}</div>
            <p className="text-xs text-muted-foreground">Órdenes que requieren aprobación</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Órdenes del Mes</CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
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
            <CardTitle className="text-sm font-medium">Hectáreas del Mes</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentMonthHectares.toFixed(1)} ha</div>
            <p className="text-xs text-muted-foreground">
              Superficie total en órdenes de {new Date().toLocaleString("es", { month: "long" })}
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
