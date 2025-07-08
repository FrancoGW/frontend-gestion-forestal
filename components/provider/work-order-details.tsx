import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { WorkOrder } from "@/types/work-order"

// Función para formatear fechas de manera más robusta
const formatDate = (dateString: string | Date) => {
  if (!dateString) return "No especificada"

  try {
    let date: Date

    // Si ya es un objeto Date
    if (dateString instanceof Date) {
      date = dateString
    }
    // Si es un string
    else if (typeof dateString === "string") {
      // Verificar si contiene "Invalid Date"
      if (dateString.includes("Invalid")) {
        return "Fecha no válida"
      }

      // Si ya está formateado como DD/MM/YYYY, devolverlo tal como está
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
        return dateString
      }

      // Intentar parsear como fecha ISO o estándar
      date = new Date(dateString)
    }
    // Si es un número (timestamp)
    else if (typeof dateString === "number") {
      date = new Date(dateString)
    } else {
      return "Formato de fecha no válido"
    }

    // Verificar si la fecha es válida
    if (isNaN(date.getTime())) {
      return "Fecha no válida"
    }

    return date.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  } catch (error) {
    console.warn("Error formatting date:", dateString, error)
    return "Error en fecha"
  }
}

// Función para obtener el color del estado
const getStatusColor = (status: string | number) => {
  const statusMap: Record<string, string> = {
    emitida: "bg-blue-100 text-blue-800",
    progreso: "bg-yellow-100 text-yellow-800",
    revision: "bg-purple-100 text-purple-800",
    finalizado: "bg-green-100 text-green-800",
    cancelado: "bg-red-100 text-red-800",
    // Mapeo para valores numéricos
    "0": "bg-blue-100 text-blue-800",
    "1": "bg-yellow-100 text-yellow-800",
    "2": "bg-purple-100 text-purple-800",
    "3": "bg-green-100 text-green-800",
    "4": "bg-red-100 text-red-800",
  }

  const statusKey = typeof status === "number" ? status.toString() : status
  return statusMap[statusKey] || "bg-gray-100 text-gray-800"
}

// Función para obtener el texto del estado
const getStatusText = (status: string | number) => {
  const statusMap: Record<string, string> = {
    emitida: "Emitida",
    progreso: "En Progreso",
    revision: "En Revisión",
    finalizado: "Finalizada",
    cancelado: "Cancelada",
    // Mapeo para valores numéricos
    "0": "Emitida",
    "1": "En Progreso",
    "2": "En Revisión",
    "3": "Finalizada",
    "4": "Cancelada",
  }

  const statusKey = typeof status === "number" ? status.toString() : status
  return statusMap[statusKey] || "Desconocido"
}

// Función para formatear hectáreas
const formatHectareas = (hectareas: number | string | undefined): string => {
  if (hectareas === undefined || hectareas === null) return "0 ha"

  // Convertir a número si es string
  const numHectareas = typeof hectareas === "string" ? Number.parseFloat(hectareas) : hectareas

  // Verificar si es un número válido
  if (isNaN(numHectareas)) return "0 ha"

  // Redondear a 1 decimal
  return `${numHectareas.toFixed(1)} ha`
}

// Tipo para los rodales
interface Rodal {
  numero?: string | number
  hectareas?: number
  [key: string]: any // Para otras propiedades que pueda tener
}

interface WorkOrderDetailsProps {
  workOrder: WorkOrder
}

export function WorkOrderDetails({ workOrder }: WorkOrderDetailsProps) {
  // Función para renderizar un rodal de forma segura
  const renderRodal = (rodal: any, index: number) => {
    // Si el rodal es un string, mostrarlo directamente
    if (typeof rodal === "string") {
      return <li key={`rodal-${index}`}>{rodal}</li>
    }

    // Si el rodal es un objeto, extraer y mostrar sus propiedades
    if (rodal && typeof rodal === "object") {
      const numero = rodal.numero || `#${index + 1}`
      const hectareas = rodal.hectareas ? formatHectareas(rodal.hectareas) : ""

      return (
        <li key={`rodal-${index}`}>
          Rodal {numero} {hectareas && `- ${hectareas}`}
        </li>
      )
    }

    // Fallback para cualquier otro caso
    return <li key={`rodal-${index}`}>Rodal #{index + 1}</li>
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-semibold">Detalles de la Orden</h2>
          <Badge className={getStatusColor(workOrder.estado)}>{getStatusText(workOrder.estado)}</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Columna izquierda */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Fecha de Emisión</h3>
              <p>{formatDate(workOrder.fechaEmision || workOrder.fecha)}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Emisor</h3>
              <p>{workOrder.emisor || "No especificado"}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Propietario</h3>
              <p>{workOrder.propietario || "No especificado"}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Empresa Encargada</h3>
              <p>{workOrder.empresaServicio || workOrder.proveedorAsignado || "No especificada"}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Campo</h3>
              <p>{workOrder.campo || "No especificado"}</p>
            </div>
          </div>

          {/* Columna derecha */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Actividad</h3>
              <p>{workOrder.actividad || "No especificada"}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Cantidad</h3>
              <p>{workOrder.cantidad || formatHectareas(workOrder.totalHectareas) || "No especificada"}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Descripción</h3>
              <p>{workOrder.descripcion || workOrder.descripcionActividad || "Sin descripción"}</p>
            </div>
          </div>
        </div>

        {/* Rodales */}
        <div className="mt-6">
          <h3 className="font-semibold text-lg mb-2">Rodales ({workOrder.rodales?.length || 0}):</h3>
          {workOrder.rodales && workOrder.rodales.length > 0 ? (
            <ul className="list-disc pl-5 space-y-1">
              {workOrder.rodales.map((rodal, index) => renderRodal(rodal, index))}
            </ul>
          ) : (
            <p className="text-muted-foreground">No hay rodales especificados</p>
          )}
        </div>

        {/* Total */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex justify-between">
            <span className="font-semibold">Total:</span>
            <span className="font-semibold">{formatHectareas(workOrder.totalHectareas)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
