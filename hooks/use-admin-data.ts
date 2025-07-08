"use client"

import { useState, useEffect } from "react"
import { zonasAPI, propietariosAPI, camposAPI, tiposUsoAPI, especiesAPI, ambientalesAPI } from "@/lib/api-client"

// Generic hook for administrative data
export function useAdminData<T>(apiFunction: () => Promise<any[]>, transformer: (item: any) => T) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const response = await apiFunction()
        const transformedData = response.map(transformer)
        setData(transformedData)
        setError(null)
      } catch (err) {
        console.error("Error fetching data:", err)
        setError("Error al cargar los datos")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Function to add a new item
  const addItem = async (item: Omit<T, "id">) => {
    try {
      const response = await apiFunction.create(item)
      const transformedItem = transformer(response)
      setData((prev) => [...prev, transformedItem])
      return { success: true, item: transformedItem }
    } catch (err) {
      console.error("Error adding item:", err)
      return { success: false, error: "Error al agregar el elemento" }
    }
  }

  // Function to update an item
  const updateItem = async (id: number | string, updates: Partial<T>) => {
    try {
      const response = await apiFunction.update(id, updates)
      const transformedItem = transformer(response)
      setData((prev) => prev.map((item) => (item.id === id ? { ...item, ...transformedItem } : item)))
      return { success: true }
    } catch (err) {
      console.error("Error updating item:", err)
      return { success: false, error: "Error al actualizar el elemento" }
    }
  }

  // Function to delete an item
  const deleteItem = async (id: number | string) => {
    try {
      await apiFunction.delete(id)
      setData((prev) => prev.filter((item) => item.id !== id))
      return { success: true }
    } catch (err) {
      console.error("Error deleting item:", err)
      return { success: false, error: "Error al eliminar el elemento" }
    }
  }

  return {
    data,
    loading,
    error,
    addItem,
    updateItem,
    deleteItem,
  }
}

// Specific hooks for each administrative entity
export function useZonas() {
  return useAdminData(zonasAPI.getAll, (zona) => ({
    id: zona.id,
    codigo: zona.codigo || "",
    nombre: zona.nombre || "",
    descripcion: zona.descripcion || "",
    activo: zona.activo !== false,
  }))
}

export function usePropietarios() {
  return useAdminData(propietariosAPI.getAll, (propietario) => ({
    id: propietario.id,
    codigo: propietario.codigo || "",
    nombre: propietario.nombre || "",
    cuit: propietario.cuit || "",
    telefono: propietario.telefono || "",
    email: propietario.email || "",
    activo: propietario.activo !== false,
  }))
}

export function useCampos() {
  return useAdminData(camposAPI.getAll, (campo) => ({
    id: campo.id,
    codigo: campo.codigo || "",
    nombre: campo.nombre || "",
    propietarioId: campo.cod_propietario || "",
    propietarioNombre: campo.propietario_nombre || "",
    zonaId: campo.cod_zona || "",
    zonaNombre: campo.zona_nombre || "",
    superficie: campo.superficie || 0,
    activo: campo.activo !== false,
  }))
}

export function useTiposUso() {
  return useAdminData(tiposUsoAPI.getAll, (tipoUso) => ({
    id: tipoUso.id,
    codigo: tipoUso.codigo || "",
    nombre: tipoUso.nombre || "",
    descripcion: tipoUso.descripcion || "",
    activo: tipoUso.activo !== false,
  }))
}

export function useEspecies() {
  return useAdminData(especiesAPI.getAll, (especie) => ({
    id: especie.id,
    codigo: especie.codigo || "",
    nombre: especie.nombre || "",
    nombreCientifico: especie.nombre_cientifico || "",
    descripcion: especie.descripcion || "",
    activo: especie.activo !== false,
  }))
}

export function useAmbientales() {
  return useAdminData(ambientalesAPI.getAll, (ambiental) => ({
    id: ambiental.id,
    codigo: ambiental.codigo || "",
    descripcion: ambiental.descripcion || "",
    activo: ambiental.activo !== false,
  }))
}
