import axios from "axios"
import axiosRetry from "axios-retry"

// Corregir la URL base - eliminar el "/api" adicional
const BASE_URL = "https://backend-gestion-forestal.vercel.app"

// Control de logging
const ENABLE_DETAILED_LOGGING = true // Activamos logging detallado para depurar
let requestCount = 0 // Contador de solicitudes para logging

// CORREGIDO: Aumentar timeouts y reducir reintentos para evitar bucles
const TIMEOUT_MS = 30000 // Aumentamos el timeout a 30 segundos
const MAX_RETRIES = 0 // Sin reintentos automáticos para evitar bucles

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: TIMEOUT_MS,
})

// CORREGIDO: Desactivar reintentos automáticos para evitar bucles
axiosRetry(apiClient, {
  retries: MAX_RETRIES,
  retryDelay: (retryCount) => {
    if (ENABLE_DETAILED_LOGGING) {
    }
    return retryCount * 2000 // Tiempo entre reintentos: 2s, 4s, 6s...
  },
  retryCondition: (error) => {
    // Solo reintentar en errores de red muy específicos
    return false // Desactivamos todos los reintentos automáticos
  },
})

// Interceptor para logging detallado de errores
apiClient.interceptors.request.use(
  (config) => {
    requestCount++
    // Solo logear cada 10 solicitudes para no sobrecargar la consola
    if (ENABLE_DETAILED_LOGGING || requestCount % 10 === 1) {
    }
    return config
  },
  (error) => {
    console.error("[API] Error en solicitud:", error.message)
    return Promise.reject(error)
  },
)

apiClient.interceptors.response.use(
  (response) => {
    // Reducir el logging de respuestas exitosas
    if (ENABLE_DETAILED_LOGGING) {
    }
    return response
  },
  (error) => {
    // Crear un objeto con información del error pero sin logging excesivo
    const errorInfo = {
      message: error.message,
      code: error.code,
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
      requestData: error.config?.data,
    }

    // Solo logear errores importantes
    console.error("[API] Error detallado:", errorInfo)

    // Mensaje específico para timeouts (solo una vez)
    if (error.code === "ECONNABORTED" && !window.timeoutMessageShown) {
      console.error(`[API] Timeout excedido para ${error.config?.url}. Trabajando en modo offline.`)
      window.timeoutMessageShown = true
    }

    return Promise.reject(error)
  },
)

// Work Orders API
export const workOrdersAPI = {
  // Get all work orders with pagination and filtering
  getAll: async (params = {}) => {
    try {
      const response = await apiClient.get("/api/ordenesTrabajoAPI", { params })
     
      // Devuelve SIEMPRE el objeto completo (con ordenes y paginacion)
      return response.data
    } catch (error) {
      console.error("Error en workOrdersAPI.getAll:", error.message)
      throw error
    }
  },

  // Get a single work order by ID
  getById: async (id) => {
    try {
      const response = await apiClient.get(`/api/ordenesTrabajoAPI/${id}`)
      return response.data
    } catch (error) {
      console.error(`Error en workOrdersAPI.getById(${id}):`, error.message)
      throw error
    }
  },

  // Create a new work order
  create: async (data) => {
    try {
      const response = await apiClient.post("/api/ordenesTrabajoAPI", data)
      return response.data
    } catch (error) {
      console.error("Error en workOrdersAPI.create:", error.message)
      throw error
    }
  },

  // Update a work order
  update: async (id, data) => {
    try {
      const response = await apiClient.put(`/api/ordenesTrabajoAPI/${id}`, data)
      return response.data
    } catch (error) {
      console.error(`Error en workOrdersAPI.update(${id}):`, error.message)
      throw error
    }
  },

  // Update work order status
  updateStatus: async (id, estado) => {
    try {
      const response = await apiClient.patch(`/api/ordenesTrabajoAPI/${id}/estado`, { estado })
      return response.data
    } catch (error) {
      console.error(`Error en workOrdersAPI.updateStatus(${id}, ${estado}):`, error.message)
      throw error
    }
  },

  // Delete a work order
  delete: async (id) => {
    try {
      const response = await apiClient.delete(`/api/ordenesTrabajoAPI/${id}`)
      return response.data
    } catch (error) {
      console.error(`Error en workOrdersAPI.delete(${id}):`, error.message)
      throw error
    }
  },
}

// Modificar la función createAdminAPI para incluir el prefijo /api/ en las rutas
const createAdminAPI = (collection) => ({
  getAll: async () => {
    try {
      // Añadir el prefijo /api/ a la ruta
      const response = await apiClient.get(`/api/${collection}`)
      return response.data
    } catch (error) {
      console.error(`Error en ${collection}.getAll:`, error.message)
      throw error
    }
  },

  getById: async (id) => {
    try {
      // Añadir el prefijo /api/ a la ruta
      const response = await apiClient.get(`/api/${collection}/${id}`)
      return response.data
    } catch (error) {
      console.error(`Error en ${collection}.getById(${id}):`, error.message)
      throw error
    }
  },

  create: async (data) => {
    try {
      // Añadir el prefijo /api/ a la ruta
      const response = await apiClient.post(`/api/${collection}`, data)
      return response.data
    } catch (error) {
      console.error(`Error en ${collection}.create:`, error.message)
      if (error.response) {
        console.error(`[${collection}] Detalles del error 400:`, {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          requestData: error.config?.data,
        })
      }
      throw error
    }
  },

  update: async (id, data) => {
    try {
      // Añadir el prefijo /api/ a la ruta

      // Asegurarse de que el ID sea una cadena simple
      const cleanId =
        typeof id === "string" && id.includes("ObjectId") ? id.replace(/ObjectId$$['"](.+)['"]$$/, "$1") : id


      const response = await apiClient.put(`/api/${collection}/${cleanId}`, data)
      return response.data
    } catch (error) {
      console.error(`Error en ${collection}.update(${id}):`, error.message)
      throw error
    }
  },

  delete: async (id) => {
    try {
      // Añadir el prefijo /api/ a la ruta

      // Asegurarse de que el ID sea una cadena simple
      const cleanId =
        typeof id === "string" && id.includes("ObjectId") ? id.replace(/ObjectId$$['"](.+)['"]$$/, "$1") : id


      const response = await apiClient.delete(`/api/${collection}/${cleanId}`)
      return response.data
    } catch (error) {
      console.error(`Error en ${collection}.delete:`, error.message)
      throw error
    }
  },
})

// ⬇️  NEW – make createAdminAPI available to other files
export { createAdminAPI }

// Administrative APIs
export const zonasAPI = createAdminAPI("zonas")
export const propietariosAPI = createAdminAPI("propietarios")
export const camposAPI = createAdminAPI("campos")
export const empresasAPI = createAdminAPI("empresas")
export const actividadesAPI = createAdminAPI("actividades")
export const tiposUsoAPI = createAdminAPI("tiposUso")
export const especiesAPI = createAdminAPI("especies")
export const ambientalesAPI = createAdminAPI("ambientales")
export const insumosAPI = createAdminAPI("insumos")
export const cuadrillasAPI = createAdminAPI("cuadrillas")
export const viverosAPI = createAdminAPI("viveros")
export const vecinosAPI = createAdminAPI("vecinos")

// --- CRUD para la colección de usuarios (general) -------------------------
export const usuariosAPI = createAdminAPI("usuarios")

// API para productos de malezas - AHORA HABILITADO
export const malezasProductosAPI = createAdminAPI("malezasProductos")

// API especializada para usuarios del sistema (admin, supervisors, providers)
export const usuariosAdminAPI = {
  getAll: async () => {
    try {
      const response = await apiClient.get("/api/usuarios_admin")
      return response.data
    } catch (error) {
      console.error("Error en usuariosAdminAPI.getAll:", error.message)
      throw error
    }
  },

  getById: async (id: string) => {
    try {
      const response = await apiClient.get(`/api/usuarios_admin/${id}`)
      return response.data
    } catch (error) {
      console.error(`Error en usuariosAdminAPI.getById(${id}):`, error.message)
      throw error
    }
  },

  create: async (user: any) => {
    try {
      const response = await apiClient.post("/api/usuarios_admin", user)
      return response.data
    } catch (error) {
      console.error("Error en usuariosAdminAPI.create:", error.message)
      throw error
    }
  },

  update: async (id: string, user: any) => {
    try {
      const response = await apiClient.put(`/api/usuarios_admin/${id}`, user)
      return response.data
    } catch (error) {
      console.error(`Error en usuariosAdminAPI.update(${id}):`, error.message)
      throw error
    }
  },

  delete: async (id: string) => {
    try {
      const response = await apiClient.delete(`/api/usuarios_admin/${id}`)
      return response.data
    } catch (error) {
      console.error(`Error en usuariosAdminAPI.delete(${id}):`, error.message)
      throw error
    }
  },

  getByRole: async (role: string) => {
    try {
      const response = await apiClient.get(`/api/usuarios_admin/rol/${role}`)
      return response.data
    } catch (error) {
      console.error(`Error en usuariosAdminAPI.getByRole(${role}):`, error.message)
      throw error
    }
  },

  login: async (email: string, password: string) => {
    try {
    

      const response = await apiClient.post("/api/usuarios_admin/login", {
        email,
        password,
      })

      return response.data
    } catch (error: any) {
      console.error("❌ Error en usuariosAdminAPI.login:", error.message)

      if (error.response) {
        console.error("📊 Detalles del error HTTP:", {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          headers: error.response.headers,
        })

        // Si es 401, las credenciales son incorrectas
        if (error.response.status === 401) {
          console.error("🔐 Error 401: Credenciales incorrectas")
        }
      } else if (error.request) {
        console.error("🌐 Error de red - no se recibió respuesta:", error.request)
      } else {
        console.error("⚙️ Error de configuración:", error.message)
      }

      throw error
    }
  },
}

// Nuevo: API para avances de trabajo
export const avancesTrabajoAPI = {
  // Obtener todos los avances de trabajo
  getAll: async (params = {}) => {
    try {
      const response = await apiClient.get("/api/avancesTrabajos", { params })
      return response.data
    } catch (error) {
      console.error("Error en avancesTrabajoAPI.getAll:", error.message)
      throw error
    }
  },

  // Obtener avances por orden de trabajo
  getByOrderId: async (orderId) => {
    try {

      // Obtener todos los avances
      const response = await apiClient.get("/api/avancesTrabajos")

      // Filtrar por ordenTrabajoId
      const filteredData = Array.isArray(response.data)
        ? response.data.filter((item) => item.ordenTrabajoId === orderId)
        : []

      return filteredData
    } catch (error) {
      console.error(`Error en avancesTrabajoAPI.getByOrderId(${orderId}):`, error.message)
      throw error
    }
  },

  // Obtener avances por proveedor
  getByProviderId: async (providerId) => {
    try {

      // Obtener todos los avances
      const response = await apiClient.get("/api/avancesTrabajos")

      // Filtrar por proveedorId
      const filteredData = Array.isArray(response.data)
        ? response.data.filter((item) => item.proveedorId === providerId)
        : []

      return filteredData
    } catch (error) {
      console.error(`Error en avancesTrabajoAPI.getByProviderId(${providerId}):`, error.message)
      return []
    }
  },

  // Crear un nuevo avance
  create: async (data) => {
    try {

      // Crear una versión simplificada con solo los campos esenciales
      const simplifiedData = {
        ordenTrabajoId: data.ordenTrabajoId,
        proveedorId: data.proveedorId,
        fecha: data.fecha,
        cuadrillaId: data.cuadrillaId, // Ensure we're sending cuadrillaId
        rodal: data.rodal,
        actividad: data.actividad,
        cantPersonal: data.cantPersonal || 0,
        jornada: data.jornada || 8,
        observaciones: data.observaciones || "",
        // AGREGAR TODOS LOS CAMPOS ADICIONALES
        vivero: data.vivero || "",
        especie: data.especie || "",
        clon: data.clon || "",
        cantidadPlantas: data.cantidadPlantas || 0,
        altura_poda: data.altura_poda || 0,
        predio: data.predio || "",
        seccion: data.seccion || "",
        rodalEnsayo: data.rodalEnsayo || false,
        // ✅ NUEVO: Asegurar que el estado se envíe correctamente
        estado: data.estado || "Pendiente",
      }

      // Agregar superficie solo si está definida y es válida
      if (data.superficie !== undefined && data.superficie !== null && data.superficie !== "" && !isNaN(Number(data.superficie))) {
        simplifiedData.superficie = Number(data.superficie)
      }

      // Incluir campos dinámicos de la plantilla
      const dynamicFields = Object.keys(data).reduce((acc, key) => {
        const mappedFields = [
          "ordenTrabajoId",
          "proveedorId",
          "fecha",
          "superficie",
          "cuadrillaId",
          "cuadrilla", // Include cuadrilla name too
          "rodal",
          "actividad",
          "cantPersonal",
          "jornada",
          "observaciones",
          "vivero",
          "especie",
          "clon",
          "cantidadPlantas",
          "altura_poda",
          "predio",
          "seccion",
          "rodalEnsayo",
          "estado", // ✅ NUEVO: Incluir estado en la lista de campos mapeados
        ]

        if (!mappedFields.includes(key) && data[key] !== undefined && data[key] !== null && data[key] !== "") {
          acc[key] = data[key]
        }
        return acc
      }, {})

      // Combinar los datos base con los campos dinámicos
      const finalData = {
        ...simplifiedData,
        ...dynamicFields
      }

      const response = await apiClient.post("/api/avancesTrabajos", finalData)
      return response.data
    } catch (error) {
      console.error("Error en avancesTrabajoAPI.create:", error.message)
      if (error.response) {
        console.error("Detalles del error:", {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          headers: error.response.headers,
        })
      }
      throw error
    }
  },

  // Actualizar un avance
  update: async (id, data) => {
    try {
      const response = await apiClient.put(`/api/avancesTrabajos/${id}`, data)
      return response.data
    } catch (error) {
      console.error(`Error en avancesTrabajoAPI.update(${id}):`, error.message)
      throw error
    }
  },

  // Eliminar un avance
  delete: async (id, proveedorId) => {
    try {

      const response = await apiClient.delete(`/api/avancesTrabajos/${id}`, {
        data: {
          proveedorId: proveedorId,
        },
      })

      return response.data
    } catch (error) {
      console.error(`Error en avancesTrabajoAPI.delete(${id}):`, error.message)
      throw error
    }
  },
}

// Reports API
export const reportesAPI = {
  getOrdenesPorZona: async () => {
    try {
      const response = await apiClient.get("/reportes/ordenesPorZona")
      return response.data
    } catch (error) {
      console.error("Error en reportesAPI.getOrdenesPorZona:", error.message)
      throw error
    }
  },

  getOrdenesPorEstado: async () => {
    try {
      const response = await apiClient.get("/reportes/ordenesPorEstado")
      return response.data
    } catch (error) {
      console.error("Error en reportesAPI.getOrdenesPorEstado:", error.message)
      throw error
    }
  },
}

// CORREGIDO: Función de utilidad para verificar si el backend está disponible con timeout más largo
export const checkBackendStatus = async () => {
  try {
    // Verificamos la ruta de la API que vimos en el código del backend
    const response = await apiClient.get("/api/ordenesTrabajoAPI", {
      timeout: 15000, // Timeout más corto para esta verificación
      params: { limite: 1 }, // Solicitamos solo un elemento para reducir la carga
    })
    return { available: true, status: response.status, data: response.data }
  } catch (error) {

    // Intentar con la ruta raíz como fallback
    try {
      const rootResponse = await apiClient.get("/", {
        timeout: 10000,
      })
        return {
        available: true,
        status: rootResponse.status,
        data: rootResponse.data,
        message: "La API principal no está disponible, pero el servidor responde",
      }
    } catch (rootError) {
      return {
        available: false,
        error: error.message,
        isNetworkError:
          !error.response && (error.message.includes("Network Error") || error.message.includes("timeout")),
      }
    }
  }
}

// Añadimos el control de timeout para window
declare global {
  interface Window {
    timeoutMessageShown?: boolean
  }
}

// IMPORTANTE: Restaurar la exportación por defecto
export default apiClient

// ➕ NEW: also export it as a named export
export { apiClient }

// API especializada para usuarios del sistema (admin, supervisors, providers)
export const supervisorsAPI = {
  getAll: async () => {
    try {
      const response = await apiClient.get("/api/supervisores");
      return response.data.data || [];
    } catch (error) {
      console.error("Error en supervisorsAPI.getAll:", error.message);
      return [];
    }
  },
};
