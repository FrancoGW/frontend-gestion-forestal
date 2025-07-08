export interface Activity {
  id: string
  codigo: string
  nombre: string
  descripcion: string
  unidad: string
  categoria: string
  activo: boolean
}

export interface ActivityTemplate {
  id: string
  nombre: string
  actividad: string
  actividadId: string
  campos: {
    [key: string]: any
  }
  activo: boolean
}

// Función de utilidad para determinar la unidad correcta según el nombre de la actividad
export function determineActivityUnit(activityName: string): string {
  const name = activityName.toLowerCase()

  // ACTIVIDADES ESPECÍFICAS EN HORAS
  if (name.includes("control de regeneracion de pinos") || name.includes("mantenimiento de alambrados")) {
    return "Hora"
  }

  // JORNAL
  if (
    name.includes("jornal") ||
    name.includes("pension") ||
    name.includes("movilidad") ||
    name.includes("motosierrista") ||
    name.includes("motoguadaña") ||
    name.includes("hoteleria") ||
    name.includes("brigada") ||
    name.includes("móvil de brigada")
  ) {
    return "Jornal"
  }

  // MES
  if (name.includes("torrero") || name.includes("operador central")) {
    return "Mes"
  }

  // KM (excluyendo las actividades específicas)
  if (
    name.includes("cortafuego") ||
    name.includes("desmalezadora") ||
    name.includes("desmontadora") ||
    name.includes("camino") ||
    name.includes("rastra")
  ) {
    return "Km"
  }

  // HORA (otras actividades que contengan "hora")
  if (name.includes("champion") && name.includes("hora")) {
    return "Hora"
  }

  // PARCELA
  if (name.includes("parcela") || name.includes("medición") || name.includes("epe")) {
    return "Parcela"
  }

  // Por defecto HA para todas las demás actividades
  return "Ha"
}
