"use client"

import { useState, useEffect } from "react"

// Datos de ejemplo para los proveedores
const mockProviders = [
  {
    id: 1,
    nombre: "Forestal del Norte S.A.",
    cuit: "30-12345678-9",
    email: "contacto@forestaldelnorte.com",
    telefono: "011-4567-8901",
    rubros: ["Plantación", "Cosecha"],
  },
  {
    id: 2,
    nombre: "El Ombu S.R.L.",
    cuit: "30-98765432-1",
    email: "info@elombu.com",
    telefono: "0341-456-7890",
    rubros: ["Transporte", "Logística"],
  },
  {
    id: 3,
    nombre: "Maderas del Sur",
    cuit: "30-56789012-3",
    email: "ventas@maderasdelsur.com",
    telefono: "0351-789-0123",
    rubros: ["Aserradero", "Tratamiento"],
  },
]

export function useProviderProfile() {
  const [provider, setProvider] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProviderData = async () => {
      try {
        setLoading(true)

        // Obtener el ID del proveedor del sessionStorage
        let providerId = 0
        try {
          const userStr = sessionStorage.getItem("user")
          if (userStr) {
            const user = JSON.parse(userStr)
            providerId = user.providerId || 0
          }
        } catch (e) {
          console.error("Error parsing user data:", e)
        }

        // Simular una llamada a la API
        await new Promise((resolve) => setTimeout(resolve, 800))

        // Buscar el proveedor por ID
        const foundProvider = mockProviders.find((p) => p.id === providerId)

        if (foundProvider) {
          setProvider(foundProvider)

          // Actualizar el sessionStorage con el nombre del proveedor
          try {
            const userStr = sessionStorage.getItem("user")
            if (userStr) {
              const user = JSON.parse(userStr)
              if (!user.nombre || user.nombre === "Proveedor") {
                user.nombre = foundProvider.nombre
                sessionStorage.setItem("user", JSON.stringify(user))
              }
            }
          } catch (e) {
            console.error("Error updating user data:", e)
          }
        } else {
          setError("No se encontró información del proveedor")
        }
      } catch (err) {
        setError("Error al cargar los datos del proveedor")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchProviderData()
  }, [])

  return { provider, loading, error }
}
