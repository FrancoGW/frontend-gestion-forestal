"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, TestTube } from "lucide-react"
import { useProviderOrders } from "@/hooks/use-provider-orders"
import { WorkProgressTable } from "@/components/provider/work-progress-table"
import type { WorkOrder } from "@/types/work-order"
import { useToast } from "@/components/ui/use-toast"
import { avancesTrabajoAPI } from "@/lib/api-client"

// Agregar la función de capitalización al inicio del archivo, después de los imports
const capitalizeFirstLetter = (str: string): string => {
  if (!str) return ""
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

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
  actividad?: string
  especie?: string
  rodalEnsayo?: boolean // Add this field
}

export default function ProviderOrderAvancesPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const { orders, loading: ordersLoading, error: ordersError, getOrderById } = useProviderOrders()

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
      console.log(`Cargando avances para la orden ${targetOrder.id}...`)

      // Obtener todos los avances
      const allProgress = await avancesTrabajoAPI.getAll()

      // Filtrar los avances por ordenTrabajoId
      const filteredProgress = Array.isArray(allProgress)
        ? allProgress.filter((item) => item.ordenTrabajoId === targetOrder.id)
        : []

      if (filteredProgress.length > 0) {
        // Mapear los datos del servidor al formato local
        const mappedProgress = await Promise.all(
          filteredProgress.map(async (item) => {
            // Obtener nombre de cuadrilla si es un ID
            let cuadrillaName = item.cuadrilla || ""
            if (cuadrillaName && cuadrillaName.length === 24) {
              // Es un ObjectId
              try {
                const cuadrillasResponse = await fetch("/api/cuadrillas")
                if (cuadrillasResponse.ok) {
                  const cuadrillas = await cuadrillasResponse.json()
                  const cuadrilla = cuadrillas.find((c: any) => c._id === cuadrillaName)
                  cuadrillaName = cuadrilla ? capitalizeFirstLetter(cuadrilla.nombre) : cuadrillaName
                }
              } catch (error) {
                console.error("Error al obtener cuadrilla:", error)
              }
            }

            // Obtener nombre de actividad si es un ID
            let actividadName = item.actividad || ""
            if (actividadName && actividadName.length === 24) {
              // Es un ObjectId
              try {
                const actividadesResponse = await fetch("/api/actividades")
                if (actividadesResponse.ok) {
                  const actividades = await actividadesResponse.json()
                  const actividad = actividades.find((a: any) => a._id === actividadName)
                  actividadName = actividad ? capitalizeFirstLetter(actividad.nombre) : actividadName
                }
              } catch (error) {
                console.error("Error al obtener actividad:", error)
              }
            }

            return {
              id: item._id || "",
              orderId: item.ordenTrabajoId,
              fecha: item.fecha || new Date().toISOString().split("T")[0],
              superficie: item.superficie,
              cantidadPlantas: item.cantidadPlantas || 0,
              cuadrilla: capitalizeFirstLetter(cuadrillaName),
              cantPersonal: item.cantPersonal || 0,
              jornada: item.jornada || 0,
              observaciones: item.observaciones || "",
              usuario: item.usuario || "Sistema",
              createdAt: item.fechaRegistro || new Date().toISOString(),
              predio: capitalizeFirstLetter(item.predio || ""),
              rodal: capitalizeFirstLetter(item.rodal || ""),
              actividad: capitalizeFirstLetter(actividadName),
              especie: capitalizeFirstLetter(item.especie || ""),
              rodalEnsayo: item.rodalEnsayo || false, // Add this line
            }
          }),
        )

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
    <div className="space-y-6">
      <div>
        <Button variant="ghost" className="flex gap-1" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>

        <h1 className="text-3xl font-bold tracking-tight mt-4">Avances de la Orden #{workOrder.numero}</h1>
        <p className="text-muted-foreground">
          {capitalizeFirstLetter(workOrder.actividad)} - {capitalizeFirstLetter(workOrder.campo)}
          {workOrder.ensayo && (
            <Badge variant="secondary" className="ml-2">
              <TestTube className="h-3 w-3 mr-1" />
              Ensayo
            </Badge>
          )}
        </p>
      </div>

      {isLoadingProgress ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : orderProgress.length > 0 ? (
        <WorkProgressTable avances={orderProgress} totalHectareas={workOrder.totalHectareas} />
      ) : (
        <div className="mt-4 p-8 bg-yellow-50 rounded-md text-center">
          <p className="text-yellow-800 mb-4">No se encontraron avances para esta orden.</p>
        </div>
      )}
    </div>
  )
}
