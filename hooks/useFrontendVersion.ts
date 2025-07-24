"use client";
import { useEffect } from "react";

const FRONTEND_VERSION = "2024-07-11-1"; // Cambia este valor en cada deploy relevante

export function useFrontendVersion() {
  useEffect(() => {
    try {
      const lastVersion = localStorage.getItem("frontend-version");
      if (lastVersion !== FRONTEND_VERSION) {
        localStorage.removeItem("activity-templates");
        localStorage.setItem("frontend-version", FRONTEND_VERSION);
        // No recargar la página automáticamente
      }
    } catch (e) {
      // Puede fallar en SSR o navegadores sin localStorage
    }
  }, []);
} 