// Mapeo de IDs de especies a nombres
// Basado en los datos encontrados en use-admin-collection.ts
export const ESPECIES_MAP: { [key: string]: string } = {
  "301": "Eucalyptus clon",
  "302": "Eucalyptus clon reposición", 
  "306": "Eucalyptus saligna",
  "1001": "Euca",
  "6842": "Pino"
}

/**
 * Obtiene el nombre de la especie basado en el ID
 * @param especieId - ID de la especie (puede ser string o number)
 * @returns Nombre de la especie o el ID original si no se encuentra
 */
export function getNombreEspecie(especieId: string | number | undefined): string {
  if (!especieId) return ""
  
  const idString = String(especieId)
  return ESPECIES_MAP[idString] || idString
}

/**
 * Obtiene el nombre de la especie para actividades de plantación
 * @param actividad - Nombre de la actividad
 * @param especieId - ID de la especie
 * @returns Actividad con nombre de especie concatenado si es plantación
 */
export function getActividadConEspecie(actividad: string, especieId: string | number | undefined): string {
  if (!actividad || !especieId) return actividad || ""
  
  if (actividad.toLowerCase().includes('plantacion')) {
    const nombreEspecie = getNombreEspecie(especieId)
    return `${actividad} ${nombreEspecie}`
  }
  
  return actividad
}
