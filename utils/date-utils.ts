/**
 * Utilidades para formatear y parsear fechas correctamente en zona horaria de Argentina
 */

/**
 * Parsea una fecha string en formato YYYY-MM-DD como fecha local (no UTC)
 * Esto evita el problema de que JavaScript interprete "2025-08-19" como UTC medianoche
 * y luego al convertir a zona horaria local muestre un día anterior
 */
export function parseLocalDate(dateString: string | null | undefined): Date | null {
  if (!dateString) return null

  try {
    // Si es formato YYYY-MM-DD (sin hora), parsearlo como fecha local
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const [year, month, day] = dateString.split("-").map(Number)
      // Crear fecha en zona horaria local (no UTC)
      return new Date(year, month - 1, day)
    }

    // Si tiene hora (formato ISO con T), usar el constructor normal
    if (dateString.includes("T")) {
      return new Date(dateString)
    }

    // Si es formato DD/MM/YYYY, parsearlo como fecha local
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
      const [day, month, year] = dateString.split("/").map(Number)
      return new Date(year, month - 1, day)
    }

    // Intentar parsear como fecha estándar
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      return null
    }
    return date
  } catch (error) {
    console.warn("Error parsing date:", dateString, error)
    return null
  }
}

/**
 * Formatea una fecha a formato DD/MM/YYYY en zona horaria de Argentina
 */
export function formatDateArgentina(dateString: string | Date | null | undefined): string {
  if (!dateString) return "No especificada"

  try {
    let date: Date

    if (dateString instanceof Date) {
      date = dateString
    } else if (typeof dateString === "string") {
      // Si ya está formateado como DD/MM/YYYY, devolverlo tal como está
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
        return dateString
      }

      // Parsear como fecha local
      const parsedDate = parseLocalDate(dateString)
      if (!parsedDate) {
        return "Fecha no válida"
      }
      date = parsedDate
    } else {
      return "Formato de fecha no válido"
    }

    // Verificar si la fecha es válida
    if (isNaN(date.getTime())) {
      return "Fecha no válida"
    }

    // Formatear en zona horaria de Argentina
    return date.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "America/Argentina/Buenos_Aires",
    })
  } catch (error) {
    console.warn("Error formatting date:", dateString, error)
    return "Error en fecha"
  }
}

/**
 * Formatea una fecha a formato YYYY-MM-DD (para inputs de tipo date)
 */
export function formatDateForInput(dateString: string | Date | null | undefined): string {
  if (!dateString) return ""

  try {
    let date: Date

    if (dateString instanceof Date) {
      date = dateString
    } else if (typeof dateString === "string") {
      const parsedDate = parseLocalDate(dateString)
      if (!parsedDate) {
        return ""
      }
      date = parsedDate
    } else {
      return ""
    }

    if (isNaN(date.getTime())) {
      return ""
    }

    // Obtener año, mes y día en zona horaria local
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")

    return `${year}-${month}-${day}`
  } catch (error) {
    console.warn("Error formatting date for input:", dateString, error)
    return ""
  }
}






