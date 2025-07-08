import type { AvanceExtendido } from "@/types/AvanceExtendido"

export function getCuadrillaName(avance: AvanceExtendido): string {
  // Si tiene cuadrillaNombre, usarlo
  if (avance.cuadrillaNombre && avance.cuadrillaNombre.trim() !== "") {
    return avance.cuadrillaNombre
  }

  // Si cuadrilla es un string que no parece ser un ID (no tiene caracteres hexadecimales largos)
  if (avance.cuadrilla && typeof avance.cuadrilla === "string") {
    // Si es un ID largo (más de 20 caracteres y contiene solo letras y números), no mostrarlo
    if (avance.cuadrilla.length > 20 && /^[a-f0-9]+$/i.test(avance.cuadrilla)) {
      return "Cuadrilla sin nombre"
    }
    // Si parece ser un nombre normal, mostrarlo
    return avance.cuadrilla
  }

  // Si cuadrilla es un número, convertirlo a string
  if (typeof avance.cuadrilla === "number") {
    return `Cuadrilla ${avance.cuadrilla}`
  }

  // Fallback
  return "Sin cuadrilla"
}
