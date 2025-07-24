"use client";
import { useEffect } from "react"

const FRONTEND_VERSION = "2024-07-09-1" // Cambia este valor en cada deploy relevante

export function useFrontendVersion() {
  useEffect(() => {
    try {
      const lastVersion = localStorage.getItem("frontend-version")
      if (lastVersion && lastVersion !== FRONTEND_VERSION) {
        localStorage.clear() // Borra todo el localStorage para evitar inconsistencias
        localStorage.setItem("frontend-version", FRONTEND_VERSION)
        window.location.reload() // No hace falta el true
      } else {
        localStorage.setItem("frontend-version", FRONTEND_VERSION)
      }
    } catch (e) {
      // Puede fallar en SSR o navegadores sin localStorage
    }
  }, [])
} 