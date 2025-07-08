"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "./use-auth"
import { cuadrillasAPI } from "@/lib/api-client"
import { useToast } from "@/components/ui/use-toast"

export interface Cuadrilla {
  id: string
  nombre: string
  proveedorId: string
  proveedorNombre: string
  activa: boolean
  fechaCreacion?: string
  ultimaActualizacion?: string
}

export function useCuadrillas() {
  const { user } = useAuth()
  const { toast } = useToast()
  const providerId = user?.providerId

  const [cuadrillas, setCuadrillas] = useState<Cuadrilla[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cargar cuadrillas
  const fetchCuadrillas = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // Obtener todas las cuadrillas
      const response = await cuadrillasAPI.getAll()

      if (response && Array.isArray(response)) {
        // Mapear los datos al formato esperado
        const mappedCuadrillas = response.map((item) => {
          // Extraer el ID correctamente
          const id = item._id?.$oid || item._id || item.id || ""

          return {
            id: id.toString(),
            nombre: item.nombre || "",
            proveedorId: item.proveedorId?.toString() || "",
            proveedorNombre: item.proveedorNombre || "",
            activa: item.activa !== false,
            fechaCreacion: item.fechaCreacion || undefined,
            ultimaActualizacion: item.ultimaActualizacion || undefined,
          }
        })


        // Si hay un providerId, filtrar las cuadrillas
        if (providerId) {
          const providerCuadrillas = mappedCuadrillas.filter((c) => c.proveedorId === providerId.toString())
          setCuadrillas(providerCuadrillas)
        } else {
          // Si no hay providerId, mostrar todas las cuadrillas
          setCuadrillas(mappedCuadrillas)
        }
      } else {
        console.error("Formato de respuesta inesperado:", response)
        setError("Formato de respuesta inesperado")
        setCuadrillas([])
      }
    } catch (err) {
      console.error("Error fetching cuadrillas:", err)
      setError("No se pudieron cargar las cuadrillas")
      setCuadrillas([])
    } finally {
      setLoading(false)
    }
  }, [providerId])

  // Añadir la función getCuadrillasByProveedor
  const getCuadrillasByProveedor = useCallback(async (proveedorId: string | number) => {
    setLoading(true)
    setError(null)

    try {
      // Intentar obtener cuadrillas
      const response = await cuadrillasAPI.getAll()

      if (response && Array.isArray(response)) {
        // Convertir proveedorId a string para comparación consistente
        const provIdStr = proveedorId.toString()

        // Mapear y filtrar cuadrillas por proveedorId
        const providerCuadrillas = response
          .map((item) => {
            const id = item._id?.$oid || item._id || item.id || ""

            return {
              id: id.toString(),
              nombre: item.nombre || "",
              proveedorId: item.proveedorId?.toString() || "",
              proveedorNombre: item.proveedorNombre || "",
              activa: item.activa !== false,
              fechaCreacion: item.fechaCreacion || undefined,
              ultimaActualizacion: item.ultimaActualizacion || undefined,
            }
          })
          .filter((item) => item.proveedorId === provIdStr)

        return providerCuadrillas
      } else {
        console.error("Formato de respuesta inesperado:", response)
        return []
      }
    } catch (err) {
      console.error("Error fetching cuadrillas by provider:", err)
      setError("No se pudieron cargar las cuadrillas")
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  // Cargar cuadrillas al iniciar
  useEffect(() => {
    fetchCuadrillas()
  }, [fetchCuadrillas])

  // Crear una nueva cuadrilla
  const createCuadrilla = useCallback(
    async (data: { nombre: string; proveedorId: string; proveedorNombre: string }) => {
      setLoading(true)

      try {
        const newCuadrilla = {
          nombre: data.nombre,
          proveedorId: data.proveedorId,
          proveedorNombre: data.proveedorNombre,
          activa: true,
        }

        // Enviar al servidor
        const response = await cuadrillasAPI.create(newCuadrilla)

        // Extraer el ID correctamente
        const id = response._id?.$oid || response._id || response.id || `temp-${Date.now()}`

        // Actualizar estado local
        const createdCuadrilla = {
          id: id.toString(),
          ...newCuadrilla,
        }

        setCuadrillas((prev) => [...prev, createdCuadrilla])

        toast({
          title: "Cuadrilla creada",
          description: `La cuadrilla "${data.nombre}" ha sido creada correctamente`,
        })

        return { success: true, data: createdCuadrilla }
      } catch (err) {
        console.error("Error creating cuadrilla:", err)

        toast({
          title: "Error al crear cuadrilla",
          description: "No se pudo crear la cuadrilla",
          variant: "destructive",
        })

        return { success: false, error: "Error al crear la cuadrilla" }
      } finally {
        setLoading(false)
      }
    },
    [toast],
  )

  // Función simplificada para añadir cuadrilla
  const addCuadrilla = useCallback(
    async (data: { nombre: string; proveedorId: string; proveedorNombre: string; activa: boolean }) => {
      return createCuadrilla(data)
    },
    [createCuadrilla],
  )

  // Actualizar una cuadrilla
  const updateCuadrilla = useCallback(
    async (id: string, data: Partial<Cuadrilla>) => {
      setLoading(true)

      try {
        // Enviar al servidor
        await cuadrillasAPI.update(id, data)

        // Actualizar estado local
        setCuadrillas((prev) => prev.map((item) => (item.id === id ? { ...item, ...data } : item)))

        toast({
          title: "Cuadrilla actualizada",
          description: `La cuadrilla ha sido actualizada correctamente`,
        })

        return { success: true }
      } catch (err) {
        console.error("Error updating cuadrilla:", err)

        toast({
          title: "Error al actualizar cuadrilla",
          description: "No se pudo actualizar la cuadrilla",
          variant: "destructive",
        })

        return { success: false, error: "Error al actualizar la cuadrilla" }
      } finally {
        setLoading(false)
      }
    },
    [toast],
  )

  // Eliminar una cuadrilla
  const deleteCuadrilla = useCallback(
    async (id: string) => {
      setLoading(true)

      try {
        // Enviar al servidor
        await cuadrillasAPI.delete(id)

        // Actualizar estado local
        setCuadrillas((prev) => prev.filter((item) => item.id !== id))

        toast({
          title: "Cuadrilla eliminada",
          description: `La cuadrilla ha sido eliminada correctamente`,
        })

        return { success: true }
      } catch (err) {
        console.error("Error deleting cuadrilla:", err)

        toast({
          title: "Error al eliminar cuadrilla",
          description: "No se pudo eliminar la cuadrilla",
          variant: "destructive",
        })

        return { success: false, error: "Error al eliminar la cuadrilla" }
      } finally {
        setLoading(false)
      }
    },
    [toast],
  )

  // Función para recargar las cuadrillas
  const reloadCuadrillas = useCallback(async () => {
    await fetchCuadrillas()
    return { success: true }
  }, [fetchCuadrillas])

  return {
    cuadrillas,
    isLoading: loading,
    isError: !!error,
    error,
    fetchCuadrillas,
    getCuadrillasByProveedor,
    createCuadrilla,
    addCuadrilla,
    updateCuadrilla,
    deleteCuadrilla,
    reloadCuadrillas,
  }
}
