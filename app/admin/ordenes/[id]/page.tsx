"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import type { WorkOrder } from "@/types/work-order"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Map,
  FileSpreadsheet,
  Calendar,
  MapPin,
  User,
  Briefcase,
  Building,
  Phone,
  Mail,
  ClipboardList,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from "lucide-react"
import { workOrdersAPI } from "@/lib/api-client"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useProviders } from "@/hooks/use-providers"

export default function WorkOrderDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { providers } = useProviders()

  useEffect(() => {
    const fetchWorkOrderDetail = async () => {
      setLoading(true)
      try {
        // Obtener TODAS las órdenes sin filtrar por estado para poder encontrar la orden específica
        const response = await workOrdersAPI.getAll({
          limite: 1000, // Obtener muchas órdenes para asegurar que encontremos la que buscamos
        })

        // Determinar dónde están los datos de órdenes
        let ordersData = []
        if (response.ordenes && Array.isArray(response.ordenes)) {
          ordersData = response.ordenes
        } else if (Array.isArray(response.data)) {
          ordersData = response.data
        } else if (response.data && Array.isArray(response.data.data)) {
          ordersData = response.data.data
        } else if (response.data) {
          ordersData = [response.data]
        }

        // Buscar la orden específica SIN filtrar por estado
        const searchId = params.id
        const foundOrder = ordersData.find((order) => {
          const orderId = order._id || order.id
          const orderNumero = order.numero_orden || order.numero

          return (
            String(orderId) === searchId ||
            String(orderNumero) === searchId ||
            orderId === Number(searchId) ||
            orderNumero === Number(searchId)
          )
        })

        if (foundOrder) {
          // Transformar la orden encontrada
          const transformedOrder = transformOrderData(foundOrder, providers)
          setWorkOrder(transformedOrder)
        } else {
          setWorkOrder(null)
        }

        setError(null)
      } catch (err) {
        setError("Error al cargar la orden de trabajo. Intente nuevamente más tarde.")
      } finally {
        setLoading(false)
      }
    }

    fetchWorkOrderDetail()
  }, [params.id, providers])

  // Función para transformar los datos de una orden (copiada del hook)
  const transformOrderData = (order: any, providers: any[] = []) => {
    let totalHectareas = 0
    const rodales =
      order.rodales?.map((rodal: any) => {
        const hectareas = Number.parseFloat(rodal.supha) || Number.parseFloat(rodal.superficie) || 0
        totalHectareas += hectareas
        return {
          numero: rodal.cod_rodal?.toString() || rodal.numero?.toString() || "",
          hectareas: hectareas,
          tipoUso: rodal.tipo_uso || "",
          especie: rodal.especie || "",
        }
      }) || []

    if ((!rodales || rodales.length === 0) && order.cantidad) {
      totalHectareas = Number.parseFloat(order.cantidad) || 0
    }

    const transformedOrder = {
      id: order._id || order.id,
      numero: order.numero_orden?.toString() || order._id?.toString() || order.id?.toString(),
      fecha: new Date(order.fecha || Date.now()).toLocaleDateString(),
      emisor: order.emisor || order.supervisor_nombre || order.supervisor || "No asignado",
      propietario: order.propietario || order.propietario_nombre || "No especificado",
      propietarioId: order.cod_propie?.toString() || "",
      campo: order.campo || order.campo_nombre || "No especificado",
      campoId: order.cod_campo?.toString() || "",
      rodales: rodales,
      totalHectareas: totalHectareas,
      empresa: order.empresa || "Sin empresa",
      empresaServicio: order.empresa || order.empresa_nombre || "",
      cuit: order.empresa_cuit || "",
      telefono: order.empresa_telefono || "",
      email: order.empresa_email || "",
      actividad: order.actividad || order.actividad_nombre || "",
      actividadId: order.cod_activi?.toString() || "",
      cantidad: order.cantidad ? `${order.cantidad} ${order.unidad || "HA"}` : `${totalHectareas.toFixed(1)} HA`,
      descripcionActividad: order.descripcion || order.notas || "",
      estado: order.estado_nombre?.toLowerCase() || "emitida",
      mapaUrl: order.mapa_url || undefined,
      ubicacionUrl: order.ubicacion_url || undefined,
      datosActividad: order.datos_actividad || {},
    }

    if (order.proveedorAsignado || order.cod_empres) {
      const matchingProvider = providers?.find(
        (p: any) =>
          p.id === order.cod_empres ||
          p.id === Number.parseInt(order.cod_empres) ||
          String(p.id) === String(order.cod_empres),
      )
      if (matchingProvider) {
        transformedOrder.proveedorAsignado = matchingProvider.nombre
        transformedOrder.proveedorId = matchingProvider.id
        transformedOrder.cuit = matchingProvider.cuit
        transformedOrder.telefono = matchingProvider.telefono
        transformedOrder.email = matchingProvider.email
      }
    }

    return transformedOrder
  }

  // Función para obtener el color del estado
  const getStatusConfig = (status = "emitida") => {
    const statusMap = {
      emitida: {
        color: "bg-blue-100 text-blue-800",
        label: "Emitida",
        icon: Clock,
        description: "Orden emitida, lista para ser trabajada por el proveedor",
      },
      pendiente: {
        color: "bg-yellow-100 text-yellow-800",
        label: "Pendiente",
        icon: HelpCircle,
        description: "Orden pendiente de ejecución",
      },
      "en ejecución": {
        color: "bg-orange-100 text-orange-800",
        label: "En Ejecución",
        icon: Clock,
        description: "Trabajo en curso por el proveedor",
      },
      ejecutada: {
        color: "bg-green-100 text-green-800",
        label: "Ejecutada",
        icon: CheckCircle2,
        description: "Trabajo completado por el proveedor",
      },
      aprobado: {
        color: "bg-green-100 text-green-800",
        label: "Aprobada",
        icon: CheckCircle2,
        description: "Orden aprobada y asignada a proveedor",
      },
      finalizado: {
        color: "bg-gray-100 text-gray-800",
        label: "Finalizada",
        icon: CheckCircle2,
        description: "Trabajo completado por el proveedor",
      },
    }

    return (
      statusMap[status] || {
        color: "bg-gray-100 text-gray-800",
        label: "Desconocido",
        icon: AlertCircle,
        description: "Estado desconocido",
      }
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Button variant="ghost" className="flex gap-1" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
          <Skeleton className="h-8 w-64 mt-4" />
          <Skeleton className="h-4 w-48 mt-2" />
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" className="flex gap-1" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>

        <Card className="bg-red-50">
          <CardContent className="pt-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!workOrder) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" className="flex gap-1" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground text-center">No se encontró la orden de trabajo con ID {params.id}.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const statusConfig = getStatusConfig(workOrder.estado)
  const StatusIcon = statusConfig.icon

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" className="flex gap-1" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>

        <h1 className="text-3xl font-bold tracking-tight mt-4">
          <span className="flex items-center gap-2">
            <FileSpreadsheet className="h-6 w-6" />
            Orden de Trabajo #{workOrder.numero || params.id}
          </span>
        </h1>
        <p className="text-muted-foreground">Detalle completo de la orden</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Columna principal */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información General</CardTitle>
              <CardDescription>Datos básicos de la orden de trabajo</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Fecha de Emisión</h3>
                    <p className="flex items-center gap-1 mt-1">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      {workOrder.fecha || "No especificada"}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Emisor</h3>
                    <p className="flex items-center gap-1 mt-1">
                      <User className="h-4 w-4 text-gray-400" />
                      {workOrder.emisor || "No especificado"}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Empresa Encargada</h3>
                    <p className="flex items-center gap-1 mt-1">
                      <Building className="h-4 w-4 text-gray-400" />
                      {workOrder.proveedorAsignado || workOrder.empresaServicio || "No especificada"}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Campo</h3>
                    <p className="flex items-center gap-1 mt-1">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      {workOrder.campo || "No especificado"}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Actividad</h3>
                    <p className="flex items-center gap-1 mt-1">
                      <Briefcase className="h-4 w-4 text-gray-400" />
                      {workOrder.actividad || "No especificada"}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Cantidad</h3>
                    <p className="mt-1">{workOrder.cantidad || "No especificada"}</p>
                  </div>
                </div>
              </div>

              {workOrder.descripcionActividad && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-gray-500">Descripción de la Actividad</h3>
                  <p className="mt-1 text-gray-700">{workOrder.descripcionActividad}</p>
                </div>
              )}

              {workOrder.rodales && workOrder.rodales.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-gray-500">Rodales</h3>
                  <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                    {workOrder.rodales.map((rodal, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                        <span>Rodal #{rodal.numero || index + 1}</span>
                        <span className="text-gray-600">{rodal.hectareas || 0} HA</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {workOrder.mapaUrl && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Map className="h-5 w-5" />
                  Mapa de Ubicación
                </CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center">
                <div className="border rounded-lg overflow-hidden">
                  <img
                    src={workOrder.mapaUrl || "/placeholder.svg"}
                    alt={`Mapa de ${workOrder.campo || "la ubicación"}`}
                    className="max-w-full h-auto"
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Columna lateral */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Estado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-4">
                <Badge className={statusConfig.color}>
                  <StatusIcon className="h-3.5 w-3.5 mr-1" />
                  {statusConfig.label}
                </Badge>
              </div>
              <p className="text-sm text-gray-600">{statusConfig.description}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Datos de Contacto</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {workOrder.cuit && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">CUIT</h3>
                    <p className="mt-1">{workOrder.cuit}</p>
                  </div>
                )}

                {workOrder.telefono && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Teléfono</h3>
                    <p className="flex items-center gap-1 mt-1">
                      <Phone className="h-4 w-4 text-gray-400" />
                      {workOrder.telefono}
                    </p>
                  </div>
                )}

                {workOrder.email && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Email</h3>
                    <p className="flex items-center gap-1 mt-1">
                      <Mail className="h-4 w-4 text-gray-400" />
                      {workOrder.email}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Acciones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <ClipboardList className="h-4 w-4 mr-2" />
                  Imprimir Orden
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Mail className="h-4 w-4 mr-2" />
                  Enviar por Email
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
