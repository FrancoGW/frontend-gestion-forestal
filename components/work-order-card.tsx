"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CheckCircle2, Clock, FileSpreadsheet, MapPin, User, Calendar, Building2, Send, Briefcase } from "lucide-react"
import { ActivityDataForm } from "./activity-data-form"
import { Progress } from "@/components/ui/progress"

import type { WorkOrder, WorkOrderStatus } from "@/types/work-order"

// Función para formatear hectáreas
const formatHectareas = (hectareas: number | string | undefined): string => {
  if (hectareas === undefined || hectareas === null) return "0.0"

  // Convertir a número si es string
  const numHectareas = typeof hectareas === "string" ? Number.parseFloat(hectareas) : hectareas

  // Verificar si es un número válido
  if (isNaN(numHectareas)) return "0.0"

  // Redondear a 1 decimal
  return numHectareas.toFixed(1)
}

// Definir un ancho fijo para el contenedor de pestañas
const CARD_WIDTH = "100%"
const CARD_MAX_WIDTH = "800px"

// Estilos CSS para el contenedor principal
const cardContainerStyles = {
  width: CARD_WIDTH,
  maxWidth: CARD_MAX_WIDTH,
  margin: "0 auto",
}

// Estilos CSS para el contenedor de pestañas
const tabsContainerStyles = {
  width: "100%",
  minWidth: "100%",
  boxSizing: "border-box" as const,
}

// Estilos CSS para el contenido de las pestañas
const tabContentStyles = {
  width: "100%",
  minWidth: "100%",
  boxSizing: "border-box" as const,
}

// Actualizar la configuración de estados para el proveedor
const statusConfig = {
  emitida: {
    label: "Emitida",
    color: "bg-purple-100 text-purple-800 hover:bg-purple-200",
    icon: Send,
  },
  progreso: {
    label: "En Progreso",
    color: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
    icon: Clock,
  },
  revision: {
    label: "En Revisión",
    color: "bg-blue-100 text-blue-800 hover:bg-blue-200",
    icon: CheckCircle2,
  },
  finalizado: {
    label: "Finalizada",
    color: "bg-green-100 text-green-800 hover:bg-green-200",
    icon: CheckCircle2,
  },
}

// Función para obtener la configuración de estado con valores por defecto seguros
const getStatusConfig = (estado?: WorkOrderStatus | number) => {
  // Mapear estados numéricos a estados de texto
  let estadoTexto = estado
  if (typeof estado === "number") {
    switch (estado) {
      case 0:
        estadoTexto = "emitida"
        break
      case 1:
        estadoTexto = "progreso"
        break
      case 2:
        estadoTexto = "revision"
        break
      case 3:
        estadoTexto = "finalizado"
        break
      default:
        estadoTexto = "emitida"
    }
  }

  // Asegurarse de que el estado es una clave válida del objeto statusConfig
  if (estadoTexto && statusConfig[estadoTexto as WorkOrderStatus]) {
    return statusConfig[estadoTexto as WorkOrderStatus]
  }

  // Valor por defecto si el estado no es válido
  return {
    label: "Desconocido",
    color: "bg-gray-100 text-gray-800 hover:bg-gray-200",
    icon: Clock,
  }
}

interface WorkOrderCardProps {
  workOrder?: WorkOrder
  order?: WorkOrder // Añadimos este prop para compatibilidad
  progress?: number
  onStatusChange?: (id: number, status: WorkOrderStatus) => Promise<{ success: boolean }>
  onUpdateActivityData?: (orderId: number, data: Record<string, any>) => Promise<{ success: boolean }>
  href?: string
  showStatusActions?: boolean
}

export function WorkOrderCard({
  workOrder,
  order, // Añadimos este prop para compatibilidad
  progress = 0,
  onStatusChange,
  onUpdateActivityData,
  href,
  showStatusActions = false,
}: WorkOrderCardProps) {
  // Usar order si workOrder no está definido
  const orderData = workOrder || order

  const [isUpdating, setIsUpdating] = useState(false)

  // Usar getStatusConfig para obtener la configuración de estado de forma segura
  const statusCfg = getStatusConfig(orderData?.estado)
  const StatusIcon = statusCfg.icon

  // Referencia para el contenedor de pestañas
  const tabsContainerRef = useRef<HTMLDivElement>(null)

  // Estado para almacenar el ancho máximo calculado
  const [maxTabWidth, setMaxTabWidth] = useState<number | null>(null)

  // Efecto para calcular el ancho máximo de todas las pestañas
  useEffect(() => {
    if (tabsContainerRef.current) {
      // Establecer un ancho mínimo para el contenedor
      setMaxTabWidth(tabsContainerRef.current.offsetWidth)
    }
  }, [])

  const handleStatusChange = async (newStatus: WorkOrderStatus) => {
    if (!onStatusChange || newStatus === orderData.estado) return

    setIsUpdating(true)
    const result = await onStatusChange(orderData.id, newStatus)
    setIsUpdating(false)
  }

  const handleUpdateActivityData = async (data: Record<string, any>) => {
    if (onUpdateActivityData) {
      return await onUpdateActivityData(orderData.id, data)
    }
    return { success: false }
  }

  // Calcular el porcentaje de progreso
  const progressPercentage = orderData.totalHectareas
    ? Math.min(Math.round((progress / orderData.totalHectareas) * 100), 100)
    : 0

  // Si se proporciona un href, renderizar una versión simplificada de la tarjeta como enlace
  if (href) {
    return (
      <Card className="w-full h-full flex flex-col">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                Orden #{orderData.numero || "Sin número"}
              </CardTitle>
              <CardDescription>
                <div className="flex items-center gap-1 mt-1">
                  <Calendar className="h-4 w-4" />
                  <span>Fecha: {orderData.fecha || "No especificada"}</span>
                </div>
              </CardDescription>
            </div>

            <Badge className={`flex items-center gap-1 px-2 py-1 ${statusCfg.color}`}>
              <StatusIcon className="h-4 w-4" />
              <span>{statusCfg.label}</span>
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="flex-grow">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>Campo: {orderData.campo || "No especificado"}</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>Actividad: {orderData.actividad || "No especificada"}</span>
            </div>
            <div>
              <span className="font-medium">Superficie: </span>
              {formatHectareas(orderData.totalHectareas)} ha
            </div>

            {/* Barra de progreso */}
            {orderData.totalHectareas > 0 && (
              <div className="space-y-1 mt-2">
                <div className="flex items-center justify-between text-xs">
                  <span>
                    {formatHectareas(progress)} / {formatHectareas(orderData.totalHectareas)} ha
                  </span>
                  <span>{progressPercentage}%</span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="pt-2 border-t">
          <Button className="w-full">Ver detalles</Button>
        </CardFooter>
      </Card>
    )
  }

  // Si no hay datos de orden, mostrar un mensaje de error
  if (!orderData) {
    return (
      <Card className="w-full h-full flex flex-col">
        <CardHeader>
          <CardTitle className="text-lg font-bold">Error: Datos no disponibles</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">No se pudieron cargar los datos de la orden de trabajo.</p>
        </CardContent>
      </Card>
    )
  }

  // Versión completa de la tarjeta
  return (
    <Card className="w-full" style={cardContainerStyles}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Orden de Trabajo #{orderData.numero || "Sin número"}
            </CardTitle>
            <CardDescription>
              <div className="flex items-center gap-1 mt-1">
                <Calendar className="h-4 w-4" />
                <span>Fecha: {orderData.fecha || "No especificada"}</span>
              </div>
            </CardDescription>
          </div>

          <Badge className={`flex items-center gap-1 px-2 py-1 ${statusCfg.color}`}>
            <StatusIcon className="h-4 w-4" />
            <span>{statusCfg.label}</span>
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <div ref={tabsContainerRef} style={tabsContainerStyles}>
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="details" className="flex-1">
                Detalles
              </TabsTrigger>
              <TabsTrigger value="activity" className="flex-1">
                Actividad
              </TabsTrigger>
              <TabsTrigger value="activity-data" className="flex-1">
                Datos Específicos
              </TabsTrigger>
            </TabsList>

            <div
              className="mt-4"
              style={{
                minHeight: "250px",
                width: "100%",
                minWidth: maxTabWidth ? `${maxTabWidth}px` : "100%",
              }}
            >
              <TabsContent value="details" style={tabContentStyles}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Emisor:</span> {orderData.emisor || "No especificado"}
                    </div>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Propietario:</span> {orderData.propietario || "No especificado"}
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Campo:</span> {orderData.campo || "No especificado"}
                    </div>
                    {orderData.proveedorAsignado && (
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Proveedor:</span> {orderData.proveedorAsignado}
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Rodales ({orderData.rodales?.length || 0}):</h4>
                    {orderData.rodales && orderData.rodales.length > 0 ? (
                      <ul className="list-disc pl-5">
                        {orderData.rodales.map((rodal, index) => {
                          if (typeof rodal === "string") {
                            return <li key={`rodal-${index}`}>{rodal}</li>
                          } else if (rodal && typeof rodal === "object") {
                            const numero = rodal.numero || `#${index + 1}`
                            const hectareas = rodal.hectareas ? formatHectareas(rodal.hectareas) : ""
                            return (
                              <li key={`rodal-${index}`}>
                                #{numero} ({hectareas} ha)
                              </li>
                            )
                          } else {
                            return <li key={`rodal-${index}`}>Rodal #{index + 1}</li>
                          }
                        })}
                      </ul>
                    ) : (
                      <p>No hay rodales especificados</p>
                    )}
                    <p className="mt-2 font-medium">Total: {formatHectareas(orderData.totalHectareas)} ha</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="activity" style={tabContentStyles}>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium">Actividad:</h4>
                    <p>{orderData.actividad || "No especificada"}</p>
                  </div>
                  <div>
                    <h4 className="font-medium">Cantidad:</h4>
                    <p>
                      {orderData.cantidad || formatHectareas(orderData.totalHectareas) + " ha" || "No especificada"}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium">Descripción:</h4>
                    <p>{orderData.descripcionActividad || "Sin descripción"}</p>
                  </div>

                  {orderData.empresaServicio && (
                    <div>
                      <h4 className="font-medium">Empresa de Servicios:</h4>
                      <p>{orderData.empresaServicio}</p>
                    </div>
                  )}

                  {orderData.email && (
                    <div>
                      <h4 className="font-medium">Contacto:</h4>
                      <p>{orderData.email}</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="activity-data" style={tabContentStyles}>
                <ActivityDataForm
                  workOrder={orderData}
                  onSave={handleUpdateActivityData}
                  readOnly={orderData.estado === "finalizado"}
                />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </CardContent>

      <Separator />

      <CardFooter className="flex justify-between pt-4">
        <div className="flex gap-2">
          {orderData.proveedorAsignado ? (
            <Button variant="outline" onClick={() => window.open(`/proveedor/ordenes/${orderData.id}`, "_blank")}>
              Ver Vista de Proveedor
            </Button>
          ) : (
            <p className="text-muted-foreground">No hay proveedor asignado</p>
          )}
        </div>

        {showStatusActions && onStatusChange && (
          <div className="flex gap-2">
            <Select
              disabled={isUpdating}
              value={orderData.estado}
              onValueChange={(value) => handleStatusChange(value as WorkOrderStatus)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Cambiar estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="emitida">Emitida</SelectItem>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="aprobado">Aprobado</SelectItem>
                <SelectItem value="finalizado">Finalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </CardFooter>
    </Card>
  )
}
