"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft, RefreshCw, ArrowRight } from "lucide-react"
import { useProviderOrders } from "@/hooks/use-provider-orders"
import { WorkOrderDetails } from "@/components/provider/work-order-details"
import { WorkProgressForm } from "@/components/provider/work-progress-form"
import type { WorkOrder } from "@/types/work-order"
import type { PodaWorkData } from "@/types/provider-work-data"
import { useToast } from "@/components/ui/use-toast"
import { avancesTrabajoAPI, cuadrillasAPI, supervisorsAPI } from "@/lib/api-client"
import { useAuth } from "@/hooks/use-auth"
import Link from "next/link"

// Definir la estructura de un avance
interface WorkProgressEntry {
  id: string
  orderId: number
  fecha: string
  superficie: number
  cantidadPlantas: number
  cuadrilla: string
  cantPersonal: number
  jornada: number
  observaciones?: string
  usuario: string
  createdAt: string
  predio?: string
  rodal?: string
}

export default function ProviderOrderDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()
  const { orders, loading: ordersLoading, error: ordersError, getOrderById, updateOrderStatus } = useProviderOrders()

  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null)
  const [orderProgress, setOrderProgress] = useState<WorkProgressEntry[]>([])
  const [isLoadingProgress, setIsLoadingProgress] = useState(false)

  // Convertir el ID de la orden a número
  const orderId = Number.parseInt(params.id, 10)

  // Cargar la orden (simplificado)
  useEffect(() => {
    if (!ordersLoading && orders.length > 0) {
      const order = getOrderById(orderId)
      if (order) {
        setWorkOrder(order)
        // Cargar avances solo una vez cuando se encuentra la orden
        loadOrderProgress(order)
      }
    }
  }, [ordersLoading, orderId, orders, getOrderById])

  // Función simplificada para cargar los avances de la orden
  const loadOrderProgress = async (order?: WorkOrder) => {
    const targetOrder = order || workOrder
    if (!targetOrder || isLoadingProgress) return

    setIsLoadingProgress(true)
    try {

      // Obtener todos los avances
      const allProgress = await avancesTrabajoAPI.getAll()

      // Filtrar los avances por ordenTrabajoId
      const filteredProgress = Array.isArray(allProgress)
        ? allProgress.filter((item) => item.ordenTrabajoId === targetOrder.id)
        : []

      if (filteredProgress.length > 0) {
        // Mapear los datos del servidor al formato local
        const mappedProgress = filteredProgress.map((item) => ({
          id: item._id || "",
          orderId: item.ordenTrabajoId,
          fecha: item.fecha,
          superficie: item.superficie,
          cantidadPlantas: item.cantidadPlantas || 0,
          cuadrilla: item.cuadrilla || "",
          cantPersonal: item.cantPersonal || 0,
          jornada: item.jornada || 0,
          observaciones: item.observaciones || "",
          usuario: item.usuario || "Sistema",
          createdAt: item.fechaRegistro || new Date().toISOString(),
          predio: item.predio || "",
          rodal: item.rodal || "",
        }))

        setOrderProgress(mappedProgress)
      } else {
        setOrderProgress([])
      }
    } catch (error) {
      console.error(`Error al cargar avances para orden ${targetOrder.id}:`, error)
      toast({
        title: "Error al cargar avances",
        description: "No se pudieron cargar los avances de esta orden",
        variant: "destructive",
      })
      setOrderProgress([])
    } finally {
      setIsLoadingProgress(false)
    }
  }

  // Función para forzar una recarga de los avances
  const handleRefreshProgress = async () => {
    await loadOrderProgress()
    toast({
      title: "Avances actualizados",
      description: `Se han cargado ${orderProgress.length} avances para esta orden`,
    })
  }

  // Función simplificada para agregar un nuevo avance
  const handleSubmitProgress = async (progressData: PodaWorkData) => {
    if (!workOrder) return { success: false, error: "Orden no encontrada" }
    if (!user) return { success: false, error: "Usuario no autenticado" }

    try {
      // Usar el supervisor_id de la orden de trabajo
      let supervisorId = workOrder.supervisor_id || null;
      
      // Si no hay supervisor_id en la orden, buscar el supervisor asignado a este proveedor como fallback
      if (!supervisorId) {
        try {
          const supervisors = await supervisorsAPI.getAll();
          const myProviderId = user.providerId;
          for (const supervisor of supervisors) {
            if (Array.isArray(supervisor.proveedoresAsignados)) {
              if (supervisor.proveedoresAsignados.some((p) => p.proveedorId === myProviderId)) {
                supervisorId = supervisor._id;
                break;
              }
            }
          }
        } catch (e) {
          console.error("Error obteniendo supervisores para avance:", e);
        }
      }

      // Asegurarnos de que la actividad no esté vacía
      const actividadToSave = progressData.actividad || workOrder.actividad || "CONTROL DE MALEZAS POST PLANTACION"

      // Obtener información de la cuadrilla para guardar tanto el ID como el nombre
      const cuadrillaInfo = {
        id: progressData.cuadrilla,
        nombre: "Cuadrilla sin nombre",
      }

      try {
        // Intentar obtener el nombre de la cuadrilla
        const cuadrillasResponse = await cuadrillasAPI.getById(progressData.cuadrilla)
        if (cuadrillasResponse && (cuadrillasResponse.nombre || cuadrillasResponse.descripcion)) {
          cuadrillaInfo.nombre = cuadrillasResponse.nombre || cuadrillasResponse.descripcion
        }
      } catch (cuadrillaError) {
        console.warn("No se pudo obtener el nombre de la cuadrilla:", cuadrillaError)
      }

      // Preparar datos completos para enviar al servidor
      const serverData: any = {
        ordenTrabajoId: workOrder.id,
        proveedorId: user.providerId || 13,
        fecha: progressData.fecha,
        actividad: actividadToSave, // Usar la actividad con fallback
        predio: progressData.predio,
        seccion: progressData.seccion || "", // Incluir sección si existe
        rodal: progressData.rodal,
        cantidadPlantas: Number(progressData.cantidadPlantas || 0),
        cuadrilla: progressData.cuadrilla, // ID de la cuadrilla
        cuadrillaNombre: cuadrillaInfo.nombre, // Nombre de la cuadrilla
        cantPersonal: Number(progressData.cantPersonal || 0),
        jornada: Number(progressData.jornada || 8),
        observaciones: progressData.observaciones || "",
        especie: progressData.especie || "", // Incluir especie
        especie_nombre: progressData.especie_nombre || "", // Incluir nombre de especie
        usuario: user.nombre || user.email || "Usuario",
        fechaRegistro: new Date().toISOString(),
        // Incluir campos específicos de plantación
        vivero: progressData.vivero || "",
        clon: progressData.clon || "",
        // Agregar el supervisorId
        supervisorId,
      }

      // Agregar superficie solo si está definida y no es NaN
      if (progressData.superficie !== undefined && progressData.superficie !== "" && !isNaN(Number(progressData.superficie))) {
        serverData.superficie = Number(progressData.superficie)
      }

      // Enviar al servidor
      const response = await avancesTrabajoAPI.create(serverData)

      if (response) {
        // Recargar los avances
        await loadOrderProgress()

        toast({
          title: "Avance registrado",
          description: `Avance guardado correctamente para ${progressData.superficie} ha`,
        })

        return { success: true }
      } else {
        throw new Error("Respuesta inválida del servidor")
      }
    } catch (error) {
      console.error("=== ERROR AL PROCESAR AVANCE ===")
      console.error("Error:", error)
      toast({
        title: "Error al registrar avance",
        description: error.message || "No se pudo registrar el avance",
        variant: "destructive",
      })
      return { success: false, error: error.message || "Error al procesar la solicitud" }
    }
  }

  if (ordersLoading && !workOrder) {
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
          <CardContent className="p-6">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (ordersError) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" className="flex gap-1" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>
        <Card className="bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">{ordersError}</p>
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
            <div className="mt-4">
              <Button onClick={() => router.push("/proveedor/ordenes")}>Ver todas las órdenes</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="w-full px-4 md:px-8 lg:px-16 max-w-4xl mx-auto py-8">
      <div className="space-y-6">
        <div>
          <Button variant="ghost" className="flex gap-1" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>

          <h1 className="text-3xl font-bold tracking-tight mt-4">Orden de Trabajo #{workOrder.numero}</h1>
          <p className="text-muted-foreground">
            {workOrder.actividad} - {workOrder.campo}
          </p>
        </div>

        <div className="mb-8 mt-4"><WorkOrderDetails workOrder={workOrder} /></div>

        <div className="flex justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshProgress}
            disabled={isLoadingProgress}
            className="mb-2"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingProgress ? "animate-spin" : ""}`} />
            {isLoadingProgress ? "Cargando..." : "Actualizar avances"}
          </Button>
          <Button asChild>
            <Link href="/proveedor/avances">
              Ver Avances
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
