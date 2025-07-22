"use client"

import { useState, useCallback, useEffect } from "react"
import { useProviderOrders } from "@/hooks/use-provider-orders"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Calendar,
  ArrowRight,
  PlusCircle,
  Send,
  Clock,
  CheckCircle2,
  MapPin,
  Search,
  FileText,
  RefreshCw,
  WifiOff,
} from "lucide-react"
import Link from "next/link"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { WorkProgressForm } from "@/components/provider/work-progress-form"
import type { WorkOrderStatus } from "@/types/work-order"
import { getOrderQuantityAndUnit } from "@/types/work-order"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { useProviderWorkData } from "@/hooks/use-provider-work-data"

// Función para formatear cantidades según la unidad
const formatQuantity = (quantity: number | string | undefined | null, unit: string): string => {
  if (quantity === undefined || quantity === null || quantity === "") return "0"

  // Convertir a número si es string
  let numQuantity: number
  if (typeof quantity === "string") {
    const cleanString = quantity.replace(/[^\d.,]/g, "").replace(",", ".")
    numQuantity = Number.parseFloat(cleanString)
  } else if (typeof quantity === "number") {
    numQuantity = quantity
  } else {
    return "0"
  }

  // Verificar si es un número válido
  if (isNaN(numQuantity) || !isFinite(numQuantity)) return "0"

  // Formatear según la unidad
  if (unit === "Parcela") {
    return numQuantity.toFixed(0) // Sin decimales para parcelas
  } else {
    return numQuantity.toFixed(1) // 1 decimal para el resto
  }
}

// Actualizar la configuración de estilos para cada estado
const statusConfig = {
  emitida: {
    label: "Emitida",
    color: "bg-purple-100 text-purple-800",
    icon: Send,
    description: "Orden recibida, pendiente de iniciar",
  },
  progreso: {
    label: "En Progreso",
    color: "bg-yellow-100 text-yellow-800",
    icon: Clock,
    description: "Trabajo en curso",
  },
  revision: {
    label: "En Revisión",
    color: "bg-blue-100 text-blue-800",
    icon: CheckCircle2,
    description: "Trabajo en revisión",
  },
  finalizado: {
    label: "Finalizada",
    color: "bg-green-100 text-green-800",
    icon: CheckCircle2,
    description: "Trabajo completado",
  },
  desconocido: {
    label: "Desconocido",
    color: "bg-gray-100 text-gray-800",
    icon: Clock,
    description: "Estado desconocido",
  },
}

// Función auxiliar para obtener la configuración de estado
function getStatusConfig(estado: WorkOrderStatus | number | undefined) {
  if (estado === undefined) return statusConfig.desconocido

  // Si es un número, convertirlo a texto
  if (typeof estado === "number") {
    switch (estado) {
      case 0:
        return statusConfig.emitida
      case 1:
        return statusConfig.progreso
      case 2:
        return statusConfig.revision
      case 3:
        return statusConfig.finalizado
      default:
        return statusConfig.desconocido
    }
  }

  // Si es texto, usar directamente
  return statusConfig[estado] || statusConfig.desconocido
}

export default function ProviderOrdersPage() {
  const {
    orders,
    loading: ordersLoading,
    error: ordersError,
    updateOrderStatus,
    orderProgress,
    forceRefresh,
  } = useProviderOrders()
  const {
    loading: progressLoading,
    error: progressError,
    isOfflineMode,
    isSyncing,
    syncWithServer,
    addWorkProgress,
  } = useProviderWorkData()

  const [orderIdSearch, setOrderIdSearch] = useState("")
  const [rodalSearch, setRodalSearch] = useState("")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [updatedOrders, setUpdatedOrders] = useState<Record<number, WorkOrderStatus>>({})
  const { toast } = useToast()
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  // Estado para el diálogo de agregar avance
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Cargar datos automáticamente al entrar a la página
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        await forceRefresh()
        setLastRefresh(new Date())
      } catch (error) {}
    }

    loadInitialData()
  }, [forceRefresh])

  // Limitar la frecuencia de sincronización
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await syncWithServer()
      await forceRefresh() // Forzar recarga de órdenes
      setLastRefresh(new Date())

      toast({
        title: "Datos actualizados",
        description: "Se han actualizado los datos correctamente",
      })
    } catch (error) {
      toast({
        title: "Error al actualizar",
        description: "No se pudieron actualizar los datos. Intenta más tarde.",
        variant: "destructive",
      })
    } finally {
      setIsRefreshing(false)
    }
  }, [syncWithServer, toast, forceRefresh])

  // Manejar el envío del formulario de avance
  const handleSubmitProgress = useCallback(
    async (progressData: any) => {
      if (!selectedOrderId) return { success: false, error: "Orden no seleccionada" }

      const result = await addWorkProgress(selectedOrderId, progressData)

      if (result.success) {
        // Actualizar el estado de la orden a "progreso"
        await updateOrderStatus(selectedOrderId, "progreso")

        // Actualizar el estado local
        setUpdatedOrders((prev) => ({
          ...prev,
          [selectedOrderId]: "progreso",
        }))

        // Cerrar el diálogo después de un registro exitoso
        setTimeout(() => {
          setIsDialogOpen(false)
          setSelectedOrderId(null)

          // Forzar recarga de datos
          forceRefresh()
        }, 2000)
      }

      return result
    },
    [selectedOrderId, addWorkProgress, updateOrderStatus, forceRefresh],
  )

  // Filtrar órdenes por ID de orden y por rodal
  const filteredOrders = orders.filter((order: any) => {
    const matchesOrderId =
      !orderIdSearch || (order.numero && String(order.numero).toLowerCase() === orderIdSearch.toLowerCase())
    const matchesRodal =
      !rodalSearch ||
      (order.rodales && Array.isArray(order.rodales) && order.rodales.some((r: any) => {
        const rodalNum = r.numero ?? r.nombre ?? ''
        return rodalNum && String(rodalNum).toLowerCase().includes(rodalSearch.toLowerCase())
      }))
    return matchesOrderId && matchesRodal
  })

  // Obtener la orden seleccionada
  const selectedOrder = selectedOrderId ? orders.find((order) => order.id === selectedOrderId) : null

  if (ordersLoading || progressLoading) {
    return (
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mis Órdenes</h1>
          <p className="text-muted-foreground">Gestiona tus órdenes de trabajo</p>
        </div>

        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    )
  }

  if (ordersError || progressError) {
    return (
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mis Órdenes</h1>
          <p className="text-muted-foreground">Gestiona tus órdenes de trabajo</p>
        </div>

        <Card className="bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">{ordersError || progressError}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mis Órdenes</h1>
          <p className="text-muted-foreground">Gestiona tus órdenes de trabajo</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground hidden md:inline">
            Última actualización: {lastRefresh.toLocaleTimeString()}
          </span>
          <Button
            onClick={handleRefresh}
            variant="outline"
            disabled={isRefreshing || isSyncing}
            className="flex items-center gap-2 bg-transparent"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing || isSyncing ? "animate-spin" : ""}`} />
            {isRefreshing || isSyncing ? "Sincronizando..." : "Sincronizar"}
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar por ID de orden..."
              className="pl-8 w-full sm:w-[200px]"
              value={orderIdSearch}
              onChange={(e) => setOrderIdSearch(e.target.value)}
            />
          </div>
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar por Rodal..."
              className="pl-8 w-full sm:w-[200px]"
              value={rodalSearch}
              onChange={(e) => setRodalSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {isOfflineMode && (
        <Alert className="bg-yellow-50 border-yellow-200">
          <WifiOff className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="text-yellow-800">Modo sin conexión</AlertTitle>
          <AlertDescription className="text-yellow-700">
            Estás trabajando en modo sin conexión. Los cambios se guardarán localmente y se sincronizarán cuando haya
            conexión.
          </AlertDescription>
        </Alert>
      )}

      {filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground text-center">
              No hay órdenes de trabajo que coincidan con los filtros.
            </p>
            {(orderIdSearch || rodalSearch) && (
              <Button
                variant="outline"
                className="mt-4 bg-transparent"
                onClick={() => {
                  setOrderIdSearch("")
                  setRodalSearch("")
                }}
              >
                Limpiar filtros
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Vista de tabla para desktop */}
          <div className="hidden lg:block rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[140px] px-6 py-4">Número</TableHead>
                  <TableHead className="w-[120px] px-4 py-4">Fecha</TableHead>
                  <TableHead className="w-[180px] px-4 py-4">Campo</TableHead>
                  <TableHead className="px-4 py-4">Actividad</TableHead>
                  <TableHead className="px-4 py-4">Rodales</TableHead>
                  <TableHead className="w-[140px] px-4 py-4">Cantidad</TableHead>
                  <TableHead className="w-[140px] px-4 py-4">Estado</TableHead>
                  <TableHead className="w-[200px] px-4 py-4">Progreso</TableHead>
                  <TableHead className="w-[200px] text-right px-6 py-4">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => {
                  const { quantity, unit, displayText } = getOrderQuantityAndUnit(order)
                  const totalWorkedArea = orderProgress[order.id] || 0
                  const progressPercentage =
                    quantity > 0 ? Math.min(Math.round((totalWorkedArea / quantity) * 100), 100) : 0
                  const currentStatus = updatedOrders[order.id] || order.estado
                  const canAddProgress =
                    currentStatus === "emitida" ||
                    currentStatus === "progreso"
                  const statusConf = getStatusConfig(currentStatus)
                  const StatusIcon = statusConf.icon

                  return (
                    <TableRow key={order.id} className="h-16">
                      <TableCell className="font-medium px-6 py-4">
                        <Link
                          href={`/proveedor/ordenes/${order.id}`}
                          className="hover:underline flex items-center gap-2"
                        >
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          {order.numero || "Sin número"}
                        </Link>
                      </TableCell>
                      <TableCell className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {order.fecha || "Sin fecha"}
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          {order.campo || "Sin campo"}
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-4">{order.actividad || "Sin actividad"}</TableCell>
                      <TableCell className="px-4 py-4">
                        {Array.isArray(order.rodales) && order.rodales?.length > 0
                          ? order.rodales.map((r: any, idx: number) => {
                              const rodalNum = r.numero ?? r.nombre ?? ''
                              const hect = r.hectareas ?? r.superficie ?? ''
                              const isMatch = rodalSearch && rodalNum && String(rodalNum).toLowerCase() === rodalSearch.toLowerCase();
                              return (
                                <span key={idx} style={isMatch ? { background: '#bbf7d0', color: '#166534', borderRadius: '4px', padding: '0 4px' } : {}}>
                                  {rodalNum}{hect ? ` (${hect} ha)` : ''}
                                  {idx < order.rodales.length - 1 ? ', ' : ''}
                                </span>
                              );
                            })
                          : "Sin rodales"}
                      </TableCell>
                      <TableCell className="px-4 py-4">{displayText}</TableCell>
                      <TableCell className="px-4 py-4">
                        <Badge className={`flex items-center gap-1 px-3 py-1 ${statusConf.color}`}>
                          <StatusIcon className="h-3.5 w-3.5" />
                          <span>{statusConf.label}</span>
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span>
                              {formatQuantity(totalWorkedArea, unit)} / {formatQuantity(quantity, unit)} {unit}
                            </span>
                            <span>{progressPercentage}%</span>
                          </div>
                          <Progress value={progressPercentage} className="h-2" />
                        </div>
                      </TableCell>
                      <TableCell className="text-right px-6 py-4">
                        <div className="flex justify-end gap-2">
                          {canAddProgress && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-1 bg-transparent"
                              onClick={() => {
                                setSelectedOrderId(order.id)
                                setIsDialogOpen(true)
                              }}
                            >
                              <PlusCircle className="h-3.5 w-3.5" />
                              <span className="hidden xl:inline">Registrar</span>
                            </Button>
                          )}
                          <Button asChild size="sm">
                            <Link href={`/proveedor/ordenes/${order.id}`} className="flex items-center gap-1">
                              <span className="hidden xl:inline">Detalles</span>
                              <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {/* Vista de cards para móvil */}
          <div className="lg:hidden space-y-4">
            {filteredOrders.map((order) => {
              const { quantity, unit, displayText } = getOrderQuantityAndUnit(order)
              const totalWorkedArea = orderProgress[order.id] || 0
              const progressPercentage =
                quantity > 0 ? Math.min(Math.round((totalWorkedArea / quantity) * 100), 100) : 0
              const currentStatus = updatedOrders[order.id] || order.estado
              const canAddProgress =
                currentStatus === "emitida" ||
                currentStatus === "progreso"
              const statusConf = getStatusConfig(currentStatus)
              const StatusIcon = statusConf.icon

              return (
                <Card key={order.id} className="p-6">
                  <div className="space-y-4">
                    {/* Header con número y estado */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{order.numero || "Sin número"}</span>
                      </div>
                      <Badge className={`flex items-center gap-1 px-2 py-1 ${statusConf.color}`}>
                        <StatusIcon className="h-3 w-3" />
                        <span className="text-xs">{statusConf.label}</span>
                      </Badge>
                    </div>

                    {/* Información básica */}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">{order.fecha || "Sin fecha"}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">{order.campo || "Sin campo"}</span>
                      </div>
                    </div>

                    {/* Actividad */}
                    <div className="text-sm">
                      <span className="font-medium">Actividad:</span> {order.actividad || "Sin actividad"}
                    </div>
                    {/* Rodales */}
                    <div className="text-sm">
                      <span className="font-medium">Rodales:</span> {Array.isArray(order.rodales) && order.rodales?.length > 0
                        ? order.rodales.map((r: any, idx: number) => {
                            const rodalNum = r.numero ?? r.nombre ?? ''
                            const hect = r.hectareas ?? r.superficie ?? ''
                            const isMatch = rodalSearch && rodalNum && String(rodalNum).toLowerCase() === rodalSearch.toLowerCase();
                            return (
                              <span key={idx} style={isMatch ? { background: '#bbf7d0', color: '#166534', borderRadius: '4px', padding: '0 4px' } : {}}>
                                {rodalNum}{hect ? ` (${hect} ha)` : ''}
                                {idx < order.rodales.length - 1 ? ', ' : ''}
                              </span>
                            );
                          })
                        : "Sin rodales"}
                    </div>

                    {/* Cantidad */}
                    <div className="text-sm">
                      <span className="font-medium">Cantidad:</span> {displayText}
                    </div>

                    {/* Progreso */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">Progreso:</span>
                        <span>
                          {formatQuantity(totalWorkedArea, unit)} / {formatQuantity(quantity, unit)} {unit} (
                          {progressPercentage}%)
                        </span>
                      </div>
                      <Progress value={progressPercentage} className="h-2" />
                    </div>

                    {/* Acciones */}
                    <div className="flex gap-2 pt-2">
                      {canAddProgress && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 flex items-center gap-1 bg-transparent"
                          onClick={() => {
                            setSelectedOrderId(order.id)
                            setIsDialogOpen(true)
                          }}
                        >
                          <PlusCircle className="h-3.5 w-3.5" />
                          Registrar
                        </Button>
                      )}
                      <Button asChild size="sm" className="flex-1">
                        <Link href={`/proveedor/ordenes/${order.id}`} className="flex items-center gap-1">
                          Detalles
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </>
      )}

      {/* Diálogo para agregar avance */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader className="sticky top-0 z-10 bg-white border-b pb-4">
            <DialogTitle>Registrar Avance - Orden #{selectedOrder?.numero || "Sin número"}</DialogTitle>
            <DialogDescription>Complete los campos para registrar un avance en esta orden de trabajo</DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <WorkProgressForm
              workOrder={selectedOrder}
              onSubmit={handleSubmitProgress}
              totalWorkedArea={orderProgress[selectedOrder.id] || 0}
              getWorkedAreaForRodal={(rodalNumero) => {
                // Esta función debería calcular el área trabajada para un rodal específico
                // Por ahora retornamos 0, pero se puede mejorar si es necesario
                return 0
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
