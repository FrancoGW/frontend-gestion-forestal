import apiClient from "./api-client"

// Definición de la interfaz para las cuadrillas
export interface CuadrillaData {
  id?: string
  _id?: string
  nombre: string
  proveedorId: string
  proveedorNombre: string
  activa: boolean
  fechaCreacion?: string
  ultimaActualizacion?: string
}

// API para gestionar las cuadrillas
export const cuadrillasAPI = {
  // Obtener todas las cuadrillas
  getAll: async () => {
    console.log("[CUADRILLAS] Obteniendo todas las cuadrillas...")
    try {
      const response = await apiClient.get("/api/cuadrillas")
      console.log("[CUADRILLAS] Cuadrillas obtenidas:", response.data)

      // Normalizar los datos (asegurar que id esté presente)
      const cuadrillas = response.data.map((c) => ({
        ...c,
        id: c.id || c._id, // Usar id si existe, sino usar _id
      }))

      return cuadrillas
    } catch (error) {
      console.error("[CUADRILLAS] Error al obtener cuadrillas:", error.message)
      throw error
    }
  },

  // Obtener cuadrillas activas
  getActivas: async () => {
    console.log("[CUADRILLAS] Obteniendo cuadrillas activas...")
    try {
      const response = await apiClient.get("/api/cuadrillas/activas")
      console.log("[CUADRILLAS] Cuadrillas activas obtenidas:", response.data)

      // Normalizar los datos
      const cuadrillas = response.data.map((c) => ({
        ...c,
        id: c.id || c._id,
      }))

      return cuadrillas
    } catch (error) {
      console.error("[CUADRILLAS] Error al obtener cuadrillas activas:", error.message)
      throw error
    }
  },

  // Obtener cuadrillas por proveedor
  getByProveedor: async (proveedorId) => {
    console.log(`[CUADRILLAS] Obteniendo cuadrillas del proveedor ${proveedorId}...`)
    try {
      // Usar el endpoint específico para obtener cuadrillas por proveedor
      const response = await apiClient.get(`/api/cuadrillas/por-proveedor/${proveedorId}`)
      console.log("[CUADRILLAS] Cuadrillas del proveedor obtenidas:", response.data)

      // Normalizar los datos
      const cuadrillas = response.data.map((c) => ({
        ...c,
        id: c.id || c._id,
      }))

      return cuadrillas
    } catch (error) {
      console.error(`[CUADRILLAS] Error al obtener cuadrillas del proveedor ${proveedorId}:`, error.message)
      throw error
    }
  },

  // Obtener una cuadrilla por ID
  getById: async (id) => {
    console.log(`[CUADRILLAS] Obteniendo cuadrilla con ID ${id}...`)
    try {
      const response = await apiClient.get(`/api/cuadrillas/${id}`)
      console.log("[CUADRILLAS] Cuadrilla obtenida:", response.data)

      // Normalizar los datos
      const cuadrilla = {
        ...response.data,
        id: response.data.id || response.data._id,
      }

      return cuadrilla
    } catch (error) {
      console.error(`[CUADRILLAS] Error al obtener cuadrilla ${id}:`, error.message)
      throw error
    }
  },

  // Crear una nueva cuadrilla
  create: async (cuadrilla) => {
    console.log("[CUADRILLAS] Creando nueva cuadrilla:", cuadrilla)
    try {
      const response = await apiClient.post("/api/cuadrillas", cuadrilla)
      console.log("[CUADRILLAS] Cuadrilla creada:", response.data)

      // Normalizar los datos
      const cuadrillaCreada = {
        ...response.data,
        id: response.data.id || response.data._id,
      }

      return cuadrillaCreada
    } catch (error) {
      console.error("[CUADRILLAS] Error al crear cuadrilla:", error.message)
      throw error
    }
  },

  // Actualizar una cuadrilla existente
  update: async (id, cuadrilla) => {
    console.log(`[CUADRILLAS] Actualizando cuadrilla ${id}:`, cuadrilla)
    try {
      const response = await apiClient.put(`/api/cuadrillas/${id}`, cuadrilla)
      console.log("[CUADRILLAS] Cuadrilla actualizada:", response.data)

      // Normalizar los datos
      const cuadrillaActualizada = {
        ...response.data,
        id: response.data.id || response.data._id,
      }

      return cuadrillaActualizada
    } catch (error) {
      console.error(`[CUADRILLAS] Error al actualizar cuadrilla ${id}:`, error.message)
      throw error
    }
  },

  // Eliminar una cuadrilla
  delete: async (id) => {
    console.log(`[CUADRILLAS] Eliminando cuadrilla ${id}...`)
    try {
      const response = await apiClient.delete(`/api/cuadrillas/${id}`)
      console.log("[CUADRILLAS] Cuadrilla eliminada:", response.data)
      return response.data
    } catch (error) {
      console.error(`[CUADRILLAS] Error al eliminar cuadrilla ${id}:`, error.message)
      throw error
    }
  },
}
