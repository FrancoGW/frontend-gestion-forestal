"use client"

import { useState, useEffect } from "react"
import { vecinosAPI } from "@/lib/api-client"

export interface Vecino {
  _id: string
  id?: string
  nombre: string
}

export function useVecinos() {
  const [vecinos, setVecinos] = useState<Vecino[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)

  useEffect(() => {
    const loadVecinos = async () => {
      setIsLoading(true)
      setIsError(false)
      try {
        const response = await vecinosAPI.getAll()
        
        // Determinar la estructura de la respuesta
        let items = []
        if (Array.isArray(response)) {
          items = response
        } else if (response.data && Array.isArray(response.data)) {
          items = response.data
        } else if (response.vecinos && Array.isArray(response.vecinos)) {
          items = response.vecinos
        } else {
          console.warn("Estructura de respuesta desconocida para vecinos:", response)
          items = []
        }

        // Asegurar que cada vecino tenga un ID consistente
        const vecinosData = items.map((item: any) => ({
          ...item,
          id: item._id || item.id,
          _id: item._id || item.id,
        }))

        setVecinos(vecinosData)
      } catch (error) {
        console.error("Error al cargar vecinos:", error)
        setIsError(true)
        setVecinos([])
      } finally {
        setIsLoading(false)
      }
    }

    loadVecinos()
  }, [])

  return {
    vecinos,
    isLoading,
    isError,
  }
}

