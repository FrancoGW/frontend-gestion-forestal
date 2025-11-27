"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, Download, FileText, Filter, Printer } from "lucide-react"
import { useProviderOrders } from "@/hooks/use-provider-orders"
import { formatDateArgentina } from "@/utils/date-utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"

export default function ProviderReportsPage() {
  const { orders } = useProviderOrders()
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  })
  const [reportType, setReportType] = useState("actividad")

  // Calcular estadísticas
  const totalOrders = orders.length
  const completedOrders = orders.filter((order) => order.estado === "finalizado").length
  const pendingOrders = orders.filter((order) => order.estado === "pendiente").length
  const approvedOrders = orders.filter((order) => order.estado === "aprobado").length

  // Calcular porcentaje de completitud
  const completionRate = totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0

  // Agrupar órdenes por actividad
  const ordersByActivity = orders.reduce(
    (acc, order) => {
      const activity = order.actividad || "Sin actividad"
      if (!acc[activity]) {
        acc[activity] = []
      }
      acc[activity].push(order)
      return acc
    },
    {} as Record<string, typeof orders>,
  )

  // Obtener actividades únicas
  const activities = Object.keys(ordersByActivity)

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Reportes</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Órdenes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <p className="text-xs text-muted-foreground">Órdenes asignadas a tu empresa</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Órdenes Completadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedOrders}</div>
            <p className="text-xs text-muted-foreground">{completionRate}% del total de órdenes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Órdenes Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingOrders + approvedOrders}</div>
            <p className="text-xs text-muted-foreground">
              {pendingOrders} pendientes, {approvedOrders} aprobadas
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros de Reporte</CardTitle>
          <CardDescription>Personaliza tu reporte seleccionando los filtros deseados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Reporte</label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="actividad">Por Actividad</SelectItem>
                  <SelectItem value="estado">Por Estado</SelectItem>
                  <SelectItem value="fecha">Por Fecha</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Fecha Desde</label>
              <DatePicker
                selected={dateRange.from}
                onSelect={(date) => setDateRange((prev) => ({ ...prev, from: date }))}
                disabled={(date) => date > new Date()}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Fecha Hasta</label>
              <DatePicker
                selected={dateRange.to}
                onSelect={(date) => setDateRange((prev) => ({ ...prev, to: date }))}
                disabled={(date) => date > new Date() || (dateRange.from ? date < dateRange.from : false)}
              />
            </div>
          </div>
          <Button className="mt-4">
            <Filter className="h-4 w-4 mr-2" />
            Aplicar Filtros
          </Button>
        </CardContent>
      </Card>

      <Tabs defaultValue="summary">
        <TabsList>
          <TabsTrigger value="summary">Resumen</TabsTrigger>
          <TabsTrigger value="activity">Por Actividad</TabsTrigger>
          <TabsTrigger value="timeline">Línea de Tiempo</TabsTrigger>
        </TabsList>
        <TabsContent value="summary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Resumen de Órdenes por Estado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                    <span>Finalizadas</span>
                  </div>
                  <span className="font-medium">{completedOrders}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                    <span>Aprobadas</span>
                  </div>
                  <span className="font-medium">{approvedOrders}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                    <span>Pendientes</span>
                  </div>
                  <span className="font-medium">{pendingOrders}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-gray-300 mr-2"></div>
                    <span>Emitidas</span>
                  </div>
                  <span className="font-medium">{orders.filter((o) => o.estado === "emitida").length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="activity" className="space-y-4">
          {activities.map((activity) => (
            <Card key={activity}>
              <CardHeader>
                <CardTitle>{activity}</CardTitle>
                <CardDescription>{ordersByActivity[activity].length} órdenes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {ordersByActivity[activity].map((order) => (
                    <div key={order.id} className="flex items-center justify-between border-b pb-2">
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>{order.titulo || `Orden #${order.id}`}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {formatDateArgentina(order.fecha)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Línea de Tiempo</CardTitle>
              <CardDescription>Historial de órdenes por fecha</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {[...orders]
                  .sort((a, b) => new Date(b.fecha || 0).getTime() - new Date(a.fecha || 0).getTime())
                  .map((order) => (
                    <div key={order.id} className="flex">
                      <div className="mr-4 flex flex-col items-center">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                          <Calendar className="h-5 w-5 text-primary" />
                        </div>
                        <div className="h-full w-px bg-border" />
                      </div>
                      <div className="space-y-1 pt-1">
                        <p className="text-sm font-medium leading-none">{order.titulo || `Orden #${order.id}`}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDateArgentina(order.fecha)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Estado: {order.estado?.charAt(0).toUpperCase() + order.estado?.slice(1) || "Desconocido"}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
