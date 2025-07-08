"use client"

import { useState, useEffect, useCallback } from "react"
import { empresasAPI } from "@/lib/api-client"
import type { Provider } from "@/types/work-order"

export function useProviders() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dataFetched, setDataFetched] = useState(false)

  // Fetch providers from API
  useEffect(() => {
    // Si ya hemos obtenido datos, no hacemos más peticiones
    if (dataFetched) return

    const fetchProviders = async () => {
      setLoading(true)
      try {
        const response = await empresasAPI.getAll()

        // Determinar dónde están los datos de proveedores
        let providersData = []
        if (response.empresas && Array.isArray(response.empresas)) {
          providersData = response.empresas
        } else if (Array.isArray(response)) {
          providersData = response
        } else if (Array.isArray(response.data)) {
          providersData = response.data
        } else {
          console.warn("Estructura de respuesta no reconocida:", response)
          providersData = []
        }


        // Transform API data to match our Provider type
        const transformedProviders = providersData.map((empresa: any) => ({
          id: empresa._id || empresa.idempresa || empresa.id || empresa.cod_empres,
          nombre: empresa.empresa || empresa.nombre || "",
          cuit: empresa.cuit || "",
          telefono: empresa.telefono || "",
          email:
            empresa.email ||
            `contacto@${(empresa.empresa || empresa.nombre || "").toLowerCase().replace(/\s+/g, "")}.com` ||
            "",
          rubros: empresa.rubros?.split?.(",").map((r: string) => r.trim()) || [],
          activo: empresa.activo !== false, // Por defecto es activo si no se especifica
          role: "provider", // Aseguramos que todos tengan el rol "provider"
          // Guardar los IDs originales para facilitar la búsqueda
          originalIds: {
            _id: empresa._id,
            id: empresa.id,
            idempresa: empresa.idempresa,
            cod_empres: empresa.cod_empres,
          },
        }))

        setProviders(transformedProviders)
        setError(null)
        setDataFetched(true)
      } catch (err) {
        console.error("Error fetching providers:", err)
        setError("Error al cargar los proveedores")
        setProviders([])
        setDataFetched(true)
      } finally {
        setLoading(false)
      }
    }

    fetchProviders()
  }, [dataFetched])

  // Function to add a new provider
  const addProvider = async (provider: Omit<Provider, "id">) => {
    try {
      // Transform to API format
      const providerData = {
        empresa: provider.nombre, // Usar 'empresa' como campo principal
        nombre: provider.nombre,
        cuit: provider.cuit,
        telefono: provider.telefono || "",
        email: provider.email || `contacto@${provider.nombre.toLowerCase().replace(/\s+/g, "")}.com`,
        rubros: Array.isArray(provider.rubros) ? provider.rubros.join(", ") : provider.rubros,
        activo: provider.activo !== false,
        role: "provider",
      }

      const newProvider = await empresasAPI.create(providerData)

      // Transform response to Provider type
      const transformedProvider: Provider = {
        id: newProvider._id || newProvider.idempresa || newProvider.id,
        nombre: newProvider.empresa || newProvider.nombre || "",
        cuit: newProvider.cuit || "",
        telefono: newProvider.telefono || "",
        email: newProvider.email || providerData.email,
        rubros: newProvider.rubros?.split?.(",").map((r: string) => r.trim()) || [],
        activo: newProvider.activo !== false,
        role: "provider",
      }

      setProviders((prev) => [...prev, transformedProvider])
      return { success: true, provider: transformedProvider }
    } catch (err) {
      console.error("Error adding provider:", err)
      return { success: false, error: "Error al agregar el proveedor" }
    }
  }

  // Function to update a provider
  const updateProvider = async (id: number | string, updates: Partial<Provider>) => {
    try {
      // Get current provider
      const currentProvider = providers.find((p) => p.id === id)
      if (!currentProvider) {
        return { success: false, error: "Proveedor no encontrado" }
      }


      // Transform to API format
      const providerData = {
        empresa: updates.nombre || currentProvider.nombre,
        nombre: updates.nombre || currentProvider.nombre,
        cuit: updates.cuit || currentProvider.cuit,
        telefono: updates.telefono || currentProvider.telefono || "",
        email: updates.email || currentProvider.email,
        rubros: updates.rubros
          ? Array.isArray(updates.rubros)
            ? updates.rubros.join(", ")
            : updates.rubros
          : currentProvider.rubros.join(", "),
        activo: updates.activo !== undefined ? updates.activo : currentProvider.activo,
        role: "provider",
      }

      await empresasAPI.update(id, providerData)

      // Update local state
      setProviders((prev) =>
        prev.map((provider) => (provider.id === id ? { ...provider, ...updates, role: "provider" } : provider)),
      )

      return { success: true }
    } catch (err) {
      console.error("Error updating provider:", err)
      return { success: false, error: "Error al actualizar el proveedor" }
    }
  }

  // Function to delete a provider
  const deleteProvider = async (id: number | string) => {
    try {
      await empresasAPI.delete(id)

      // Update local state
      setProviders((prev) => prev.filter((provider) => provider.id !== id))

      return { success: true }
    } catch (err) {
      console.error("Error deleting provider:", err)
      return { success: false, error: "Error al eliminar el proveedor" }
    }
  }

  // Function to retry fetching providers
  const retryFetchProviders = () => {
    setDataFetched(false)
  }

  // Function to get active providers only
  const getActiveProviders = useCallback(() => {
    return providers.filter((provider) => provider.activo !== false)
  }, [providers])

  return {
    providers,
    activeProviders: getActiveProviders(),
    loading,
    error,
    addProvider,
    updateProvider,
    deleteProvider,
    retryFetchProviders,
  }
}
