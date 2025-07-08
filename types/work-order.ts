export type WorkOrderStatus = "emitida" | "progreso" | "revision" | "finalizado"

export interface WorkOrder {
  id: number
  numero?: string
  fecha?: string
  campo?: string
  actividad?: string
  totalHectareas?: number
  estado?: WorkOrderStatus | number
  rodales?: Array<{
    id: string | number
    nombre: string
    superficie: number
  }>
  // Nuevos campos para unidades de medida
  unidadMedida?: string
  cantidadNumerica?: number
}

// Función para determinar la unidad y cantidad correcta según la actividad
export function getOrderQuantityAndUnit(order: WorkOrder) {
  // Si ya tiene unidad definida, usarla
  if (order.unidadMedida && order.cantidadNumerica !== undefined) {
    return {
      quantity: order.cantidadNumerica,
      unit: order.unidadMedida,
      displayText: `${order.cantidadNumerica.toFixed(1)} ${order.unidadMedida}`,
    }
  }

  // Determinar por el nombre de la actividad
  const activityName = order.actividad?.toUpperCase() || ""

  // Actividades específicas que usan Hora
  if (activityName.includes("CONTROL DE REGENERACION") || activityName.includes("MANTENIMIENTO DE ALAMBRADOS")) {
    // Para actividades por hora
    return {
      quantity: order.totalHectareas || 0,
      unit: "Hora",
      displayText: `${(order.totalHectareas || 0).toFixed(1)} Hora`,
    }
  }

  // Actividades que usan Km
  else if (
    activityName.includes("CAMINO") ||
    activityName.includes("CORTAFUEGO") ||
    activityName.includes("CORTAFUEGOS")
  ) {
    return {
      quantity: order.totalHectareas || 0,
      unit: "Km",
      displayText: `${(order.totalHectareas || 0).toFixed(1)} Km`,
    }
  }

  // Actividades que usan Jornal
  else if (
    activityName.includes("JORNAL") ||
    activityName.includes("JORNADA") ||
    (activityName.includes("MANTENIMIENTO") && !activityName.includes("ALAMBRADOS"))
  ) {
    return {
      quantity: order.totalHectareas || 0,
      unit: "Jornal",
      displayText: `${(order.totalHectareas || 0).toFixed(1)} Jornal`,
    }
  }

  // Actividades que usan Parcela
  else if (activityName.includes("PARCELA") || activityName.includes("INVENTARIO")) {
    return {
      quantity: order.totalHectareas || 0,
      unit: "Parcela",
      displayText: `${Math.round(order.totalHectareas || 0)} Parcela`,
    }
  }

  // Por defecto, usar hectáreas
  return {
    quantity: order.totalHectareas || 0,
    unit: "Ha",
    displayText: `${(order.totalHectareas || 0).toFixed(1)} Ha`,
  }
}
