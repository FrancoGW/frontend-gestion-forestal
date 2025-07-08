"use client"

import { useState, useEffect } from "react"
import { malezasProductosAPI } from "@/lib/api-client"

export interface MalezasProducto {
  _id?: string
  id?: string
  nombre: string
  descripcion?: string
  tipo?: string
  unidadMedida?: string
  categoria?: string
  concentracion?: string // Para compatibilidad con la UI existente
  activo: boolean
  fechaCreacion?: string
  fechaActualizacion?: string
}

export function useMalezasProductos() {
  const [productos, setProductos] = useState<MalezasProducto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProductos = async () => {
    setLoading(true)
    try {
      const data = await malezasProductosAPI.getAll()


      // Asegurar que tenemos un array
      const productosArray = Array.isArray(data) ? data : []

      // Transformar los datos de MongoDB para que sean compatibles con la UI
      const transformedData = productosArray.map((producto) => {
        return {
          ...producto,
          // Mapear descripcion a concentracion para compatibilidad con la UI existente
          concentracion: producto.descripcion || producto.concentracion || "",
        }
      })


      setProductos(transformedData)
      setError(null)
    } catch (err: any) {
      console.error("❌ Error fetching malezas productos desde API:", err)
      setError(`Error al cargar productos: ${err.message}`)
      setProductos([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProductos()
  }, [])

  const addProducto = async (producto: Omit<MalezasProducto, "_id" | "id">) => {
    try {

      // Validar datos antes de crear
      if (!producto.nombre?.trim()) {
        throw new Error("El nombre del producto es obligatorio")
      }

      // Preparar datos para enviar al backend - usar exactamente la estructura que espera la API
      const dataToSend = {
        nombre: producto.nombre.trim(),
        descripcion: producto.descripcion?.trim() || producto.concentracion?.trim() || "",
        tipo: producto.tipo || "Sistémico",
        unidadMedida: producto.unidadMedida || "cm3",
        categoria: producto.categoria || "Herbicida total",
        activo: producto.activo ?? true,
      }

      const result = await malezasProductosAPI.create(dataToSend)

      return { success: true, data: result }
    } catch (err: any) {
      console.error("❌ Error adding producto:", err)

      // Extraer mensaje de error más específico
      let errorMessage = "Error al agregar el producto"

      if (err.response?.data?.message) {
        errorMessage = err.response.data.message
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error
      } else if (err.message) {
        errorMessage = err.message
      }

      console.error("💥 Mensaje de error específico:", errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  const updateProducto = async (id: string, updates: Partial<MalezasProducto>) => {
    try {

      // Validar datos antes de actualizar
      if (updates.nombre !== undefined && !updates.nombre?.trim()) {
        throw new Error("El nombre del producto es obligatorio")
      }

      // Preparar datos limpios para el backend
      const cleanUpdates: any = {}

      if (updates.nombre !== undefined) {
        cleanUpdates.nombre = updates.nombre.trim()
      }

      if (updates.concentracion !== undefined || updates.descripcion !== undefined) {
        cleanUpdates.descripcion = updates.descripcion?.trim() || updates.concentracion?.trim() || ""
      }

      if (updates.tipo !== undefined) {
        cleanUpdates.tipo = updates.tipo
      }

      if (updates.unidadMedida !== undefined) {
        cleanUpdates.unidadMedida = updates.unidadMedida || "cm3"
      }

      if (updates.categoria !== undefined) {
        cleanUpdates.categoria = updates.categoria
      }

      if (updates.activo !== undefined) {
        cleanUpdates.activo = updates.activo
      }

      const result = await malezasProductosAPI.update(id, cleanUpdates)

      return { success: true, data: result }
    } catch (err: any) {
      console.error("❌ Error updating producto:", err)

      let errorMessage = "Error al actualizar el producto"

      if (err.response?.data?.message) {
        errorMessage = err.response.data.message
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error
      } else if (err.message) {
        errorMessage = err.message
      }

      return { success: false, error: errorMessage }
    }
  }

  const deleteProducto = async (id: string) => {
    try {
      const result = await malezasProductosAPI.delete(id)

      return { success: true }
    } catch (err: any) {
      console.error("❌ Error deleting producto:", err)

      let errorMessage = "Error al eliminar el producto"

      if (err.response?.data?.message) {
        errorMessage = err.response.data.message
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error
      } else if (err.message) {
        errorMessage = err.message
      }

      return { success: false, error: errorMessage }
    }
  }

  return {
    productos,
    loading,
    error,
    addProducto,
    updateProducto,
    deleteProducto,
    refetch: fetchProductos,
  }
}
