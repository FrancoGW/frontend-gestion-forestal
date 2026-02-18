"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { usuariosAdminAPI, empresasAPI } from "@/lib/api-client"

interface User {
  id: string
  nombre: string
  apellido?: string
  email: string
  rol: "admin" | "supervisor" | "provider" | "jda"
  activo: boolean
  providerId?: number
  supervisorId?: number
  cuit?: string
  telefono?: string
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null
}

// Usuarios de emergencia SOLO para cuando el backend no esté disponible
const EMERGENCY_USERS = [
  {
    id: "999",
    email: "admin@sistema.com",
    password: "admin",
    nombre: "Administrador",
    apellido: "Sistema",
    rol: "admin" as const,
    activo: true,
  },
  {
    id: "1234",
    email: "alejandro@sistema.com",
    password: "123",
    nombre: "Alejandro",
    apellido: "Wayer",
    rol: "jda" as const,
    activo: true,
  },
  {
    id: "34",
    email: "stefan@sistema.com",
    password: "999",
    nombre: "Carlos",
    apellido: "Stefan",
    rol: "jda" as const,
    activo: true,
  },
  {
    id: "44",
    email: "cecilia.pizzini@supervisor.com",
    password: "123",
    nombre: "Cecilia",
    apellido: "Pizzini",
    rol: "supervisor" as const,
    activo: true,
  },
  {
    id: "4",
    email: "contacto@kauffmann.com",
    password: "123",
    nombre: "RAMON OMAR KAUFFMANN",
    apellido: "",
    rol: "provider" as const,
    activo: true,
    cuit: "30-34567890-1",
    telefono: "11-3456-7890",
  },
  {
    id: "7",
    email: "contacto@logistica.com",
    password: "123",
    nombre: "LOGISTICA",
    apellido: "",
    rol: "provider" as const,
    activo: true,
    cuit: "30-78901234-5",
    telefono: "11-7890-1234",
  },
]

export function useAuth() {
  const router = useRouter()
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    loading: true,
    error: null,
  })

  // Función para obtener el usuario desde sessionStorage
  const getUserFromStorage = (): User | null => {
    if (typeof window === "undefined") return null

    try {
      const userData = sessionStorage.getItem("user")
      if (userData) {
        const user = JSON.parse(userData)
        return user
      }
    } catch (error) {
      console.error("❌ Error al parsear usuario desde sessionStorage:", error)
      sessionStorage.removeItem("user")
    }
    return null
  }

  // Función para guardar usuario en sessionStorage
  const saveUserToStorage = (user: User) => {
    try {
      sessionStorage.setItem("user", JSON.stringify(user))
    } catch (error) {
      console.error("❌ Error al guardar usuario en sessionStorage:", error)
    }
  }

  // Función para limpiar sessionStorage
  const clearUserFromStorage = () => {
    try {
      sessionStorage.removeItem("user")
    } catch (error) {
      console.error("❌ Error al limpiar sessionStorage:", error)
    }
  }

  // Función de login
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setAuthState((prev) => ({ ...prev, loading: true, error: null }))

      console.log("🔐 Intentando autenticación con backend...")
      
      // PRIMERO: Intentar autenticación con la base de datos
      try {
        const dbResponse = await usuariosAdminAPI.login(email, password)
        
        console.log("📡 Respuesta del backend:", dbResponse)
        
        if (dbResponse && dbResponse.success && dbResponse.data) {
          console.log("✅ Autenticación exitosa con base de datos")
          
          const dbUser = dbResponse.data
          const rawId = dbUser._id ?? dbUser.id
          const user: User = {
            id: String(rawId),
            nombre: dbUser.nombre,
            apellido: dbUser.apellido || "",
            email: dbUser.email,
            rol: dbUser.rol,
            activo: dbUser.activo,
            cuit: dbUser.cuit,
            telefono: dbUser.telefono,
          }

          // IDs numéricos GIS: supervisores usan gisSupervisorId, proveedores idempresa
          if (user.rol === "provider") {
            const idempresa = dbUser.idempresa
            if (idempresa != null && !isNaN(Number(idempresa))) {
              user.providerId = Number(idempresa)
            } else {
              try {
                const empresasResponse = await empresasAPI.getAll()
                const empresas = Array.isArray(empresasResponse)
                  ? empresasResponse
                  : (empresasResponse?.data || empresasResponse?.empresas || [])
                const empresa = empresas.find(
                  (e: any) =>
                    e.email === user.email ||
                    e.empresa?.toLowerCase().includes(user.nombre.toLowerCase()) ||
                    e.nombre?.toLowerCase().includes(user.nombre.toLowerCase())
                )
                if (empresa) {
                  const n = empresa.idempresa ?? empresa.cod_empres ?? empresa._id ?? empresa.id
                  user.providerId = typeof n === "number" ? n : /^\d+$/.test(String(n)) ? Number(n) : NaN
                }
                if (Number.isNaN(user.providerId)) {
                  const m = String(rawId).match(/^provider_(\d+)$/)
                  user.providerId = m ? Number(m[1]) : Number(rawId)
                }
              } catch {
                const m = String(rawId).match(/^provider_(\d+)$/)
                user.providerId = m ? Number(m[1]) : Number(rawId)
              }
            }
          } else if (user.rol === "supervisor") {
            const gisId = dbUser.gisSupervisorId
            if (gisId != null && !isNaN(Number(gisId))) {
              user.supervisorId = Number(gisId)
            } else {
              const m = String(rawId).match(/^supervisor_(\d+)$/)
              user.supervisorId = m ? Number(m[1]) : Number(rawId)
            }
          }

          // Guardar en sessionStorage y estado
          saveUserToStorage(user)
          setAuthState({
            user,
            isAuthenticated: true,
            loading: false,
            error: null,
          })

          return true
        } else {
          console.log("❌ Respuesta del backend sin éxito:", dbResponse)
          setAuthState((prev) => ({
            ...prev,
            loading: false,
            error: dbResponse?.message || "Credenciales incorrectas",
          }))
          return false
        }
      } catch (dbError: any) {
        console.log("⚠️ Error en autenticación con base de datos:", dbError.message)
        console.log("🔄 Intentando con usuarios de emergencia...")
        
        // SEGUNDO: Si falla la base de datos, usar usuarios de emergencia
      const emergencyUser = EMERGENCY_USERS.find((u) => u.email === email && u.password === password)

      if (emergencyUser) {
          console.log("✅ Autenticación exitosa con usuario de emergencia")
          
        const user: User = {
          id: emergencyUser.id,
          nombre: emergencyUser.nombre,
          apellido: emergencyUser.apellido,
          email: emergencyUser.email,
          rol: emergencyUser.rol,
          activo: emergencyUser.activo,
          cuit: emergencyUser.cuit,
          telefono: emergencyUser.telefono,
        }

        // Agregar IDs específicos según el rol como NÚMEROS
        if (user.rol === "provider") {
          user.providerId = Number.parseInt(user.id, 10)
        } else if (user.rol === "supervisor") {
          user.supervisorId = Number.parseInt(user.id, 10)
        }

        // Guardar en sessionStorage y estado
        saveUserToStorage(user)
        setAuthState({
          user,
          isAuthenticated: true,
          loading: false,
          error: null,
        })

          return true
      }

      setAuthState((prev) => ({
        ...prev,
        loading: false,
        error: "Credenciales incorrectas",
      }))

        return false
      }
    } catch (error: any) {
      console.error("❌ Error en autenticación:", error.message)

      setAuthState((prev) => ({
        ...prev,
        loading: false,
        error: "Error del servidor",
      }))

      return false
    }
  }

  // Función de logout
  const logout = () => {
    clearUserFromStorage()
    setAuthState({
      user: null,
      isAuthenticated: false,
      loading: false,
      error: null,
    })
    router.push("/login")
  }

  // Verificar autenticación al cargar
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedUser = getUserFromStorage()

        if (storedUser) {
          // Asegurar que providerId esté definido como número para usuarios con rol "provider"
          if (storedUser.rol === "provider" && !storedUser.providerId) {
            // Intentar buscar la empresa asociada
            try {
              const empresasResponse = await empresasAPI.getAll()
              const empresas = Array.isArray(empresasResponse) 
                ? empresasResponse 
                : (empresasResponse?.data || empresasResponse?.empresas || [])
              
              const empresa = empresas.find((e: any) => 
                e.email === storedUser.email || 
                e.empresa?.toLowerCase().includes(storedUser.nombre.toLowerCase()) ||
                e.nombre?.toLowerCase().includes(storedUser.nombre.toLowerCase())
              )
              
              if (empresa) {
                const providerIdNum = empresa.idempresa || empresa.cod_empres || 
                  (typeof empresa._id === 'number' ? empresa._id : 
                   typeof empresa.id === 'number' ? empresa.id : null)
                
                if (providerIdNum !== null && providerIdNum !== undefined) {
                  storedUser.providerId = Number(providerIdNum)
                } else {
                  storedUser.providerId = Number.parseInt(storedUser.id, 10)
                }
              } else {
                storedUser.providerId = Number.parseInt(storedUser.id, 10)
              }
            } catch (error) {
              storedUser.providerId = Number.parseInt(storedUser.id, 10)
            }
          }

          // Asegurar que supervisorId esté definido como número para usuarios con rol "supervisor"
          if (storedUser.rol === "supervisor" && !storedUser.supervisorId && storedUser.id) {
            storedUser.supervisorId = Number.parseInt(storedUser.id, 10)
          }

          setAuthState({
            user: storedUser,
            isAuthenticated: true,
            loading: false,
            error: null,
          })
        } else {
            setAuthState({
            user: null,
            isAuthenticated: false,
            loading: false,
            error: null,
          })
        }
      } catch (err) {
        console.error("Error parsing stored user:", err)
        sessionStorage.removeItem("user")
        setAuthState({
          user: null,
          isAuthenticated: false,
          loading: false,
          error: null,
        })
      }
    }

    checkAuth()
  }, [])

  return {
    user: authState.user,
    loading: authState.loading,
    error: authState.error,
    login,
    logout,
    isAuthenticated: authState.isAuthenticated,
  }
}
