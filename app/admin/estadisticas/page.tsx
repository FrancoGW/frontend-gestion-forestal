"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  Pie,
  PieChart,
} from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function EstadisticasPage() {
  // Datos de ejemplo para los gráficos
  const monthlyData = [
    { month: "Ene", ordenes: 65, hectareas: 850 },
    { month: "Feb", ordenes: 59, hectareas: 720 },
    { month: "Mar", ordenes: 80, hectareas: 1100 },
    { month: "Abr", ordenes: 81, hectareas: 1020 },
    { month: "May", ordenes: 56, hectareas: 680 },
    { month: "Jun", ordenes: 55, hectareas: 650 },
    { month: "Jul", ordenes: 40, hectareas: 450 },
  ]

  const activityData = [
    { actividad: "Control de Malezas", ordenes: 45 },
    { actividad: "Plantación", ordenes: 28 },
    { actividad: "Poda", ordenes: 18 },
    { actividad: "Raleo", ordenes: 12 },
    { actividad: "Cosecha", ordenes: 9 },
  ]

  const statusData = [
    { estado: "Pendiente", value: 25 },
    { estado: "Aprobado", value: 45 },
    { estado: "Finalizado", value: 30 },
  ]

  const colors = ["#ff9800", "#2196f3", "#4caf50"]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Estadísticas</h1>
        <p className="text-muted-foreground">Visualiza las métricas y estadísticas del sistema</p>
      </div>

      <Tabs defaultValue="ordenes">
        <TabsList className="w-full">
          <TabsTrigger value="ordenes" className="flex-1">
            Órdenes
          </TabsTrigger>
          <TabsTrigger value="actividades" className="flex-1">
            Actividades
          </TabsTrigger>
          <TabsTrigger value="estados" className="flex-1">
            Estados
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ordenes" className="mt-4">
          <div className="space-y-6">
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>Órdenes y Hectáreas por Mes</CardTitle>
                <CardDescription>Evolución de órdenes de trabajo y hectáreas</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ChartContainer
                  config={{
                    ordenes: {
                      label: "Órdenes",
                      color: "hsl(var(--chart-1))",
                    },
                    hectareas: {
                      label: "Hectáreas",
                      color: "hsl(var(--chart-2))",
                    },
                  }}
                  className="h-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="ordenes"
                        stroke="var(--color-ordenes)"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="hectareas"
                        stroke="var(--color-hectareas)"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="actividades" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Órdenes por Actividad</CardTitle>
              <CardDescription>Distribución de órdenes según tipo de actividad</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={activityData}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="actividad" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="ordenes" name="Órdenes" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="estados" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Órdenes por Estado</CardTitle>
              <CardDescription>Distribución de órdenes según su estado actual</CardDescription>
            </CardHeader>
            <CardContent className="h-80 flex justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="estado"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
