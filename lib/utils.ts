import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Capitalizes the first letter of a string
 */
export function capitalizeFirstLetter(str: string): string {
  if (!str) return str
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

/**
 * Formats hectares with proper decimal places and units
 */
export function formatHectareas(hectares: number): string {
  if (hectares === 0) return "0 ha"
  if (hectares < 1) {
    return `${(hectares * 10000).toFixed(0)} m²`
  }
  if (hectares < 10) {
    return `${hectares.toFixed(2)} ha`
  }
  if (hectares < 100) {
    return `${hectares.toFixed(1)} ha`
  }
  return `${hectares.toFixed(0)} ha`
}
