"use client"

import { useState, useEffect } from "react"
import { viverosAPI, especiesAPI } from "@/lib/api-client"
import { toast } from "@/components/ui/use-toast"

export interface Vivero {
  _id: string
  nombre: string
  ubicacion?: string
  contacto?: string
  activo: boolean
  especies: string[]
  clones: Clone[]
}

export interface Clone {
  _id?: string
  codigo: string
  especieAsociada: string
  origen?: string
  descripcion?: string
  caracteristicas?: string
  activo: boolean
}

export interface Especie {
  _id: string
  especie: string
  nombre?: string
  densidad?: number
  category?: string
}

export function useViveros() {
  const [viveros, setViveros] = useState<Vivero[]>([])
  const [especies, setEspecies] = useState<Especie[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filteredViveros, setFilteredViveros] = useState<Vivero[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedVivero, setSelectedVivero] = useState<Vivero | null>(null)

  // Función para cargar datos desde el backend
  const loadData = async () => {
    setIsLoading(true)
    try {
      // Cargar viveros
      const viverosResponse = await viverosAPI.getAll()
      console.log("Respuesta de viveros:", viverosResponse)
      
      if (viverosResponse.success && viverosResponse.data) {
        setViveros(Array.isArray(viverosResponse.data) ? viverosResponse.data : [])
      } else {
        console.log("No hay datos de viveros o respuesta no exitosa")
        setViveros([])
      }

      // Cargar especies
      const especiesResponse = await especiesAPI.getAll()
      console.log("Respuesta de especies:", especiesResponse)
      
      if (especiesResponse.success && especiesResponse.data) {
        setEspecies(Array.isArray(especiesResponse.data) ? especiesResponse.data : [])
      } else {
        console.log("No hay datos de especies o respuesta no exitosa")
        setEspecies([])
      }
    } catch (error) {
      console.error("Error al cargar datos:", error)
      setViveros([])
      setEspecies([])
    } finally {
      setIsLoading(false)
    }
  }

  // Cargar datos al montar el componente
  useEffect(() => {
    loadData()
  }, [])

  // Filtrar viveros por término de búsqueda
  useEffect(() => {
    if (!viveros) return

    const filtered = viveros.filter((vivero: Vivero) =>
      vivero.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vivero.ubicacion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vivero.contacto?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredViveros(filtered)
  }, [viveros, searchTerm])

  // Obtener especies de un vivero específico
  const getEspeciesVivero = (viveroId: string): Especie[] => {
    if (!viveros || !especies) return []
    
    const vivero = viveros.find((v: Vivero) => v._id === viveroId)
    if (!vivero || !vivero.especies) return []

    return especies.filter((especie: Especie) => 
      vivero.especies.includes(especie._id)
    )
  }

  // Obtener todas las especies (existentes + texto) de un vivero
  const getTodasEspeciesVivero = (viveroId: string): string[] => {
    if (!viveros) return []
    
    const vivero = viveros.find((v: Vivero) => v._id === viveroId)
    if (!vivero || !vivero.especies) return []

    return vivero.especies
  }

  // Obtener todas las especies disponibles para seleccionar
  const getEspeciesDisponibles = (): Especie[] => {
    return especies || []
  }

  // Crear un nuevo vivero
  const crearVivero = async (viveroData: Omit<Vivero, '_id'>) => {
    try {
      const dataWithClones = {
        ...viveroData,
        clones: viveroData.clones || []
      }
      
      // Usar directamente viverosAPI para mejor control
      const response = await viverosAPI.create(dataWithClones)
      
             if (response.success) {
         toast({
           title: "Éxito",
           description: "Vivero creado correctamente.",
         })
         loadData()
         return true
       } else {
        throw new Error(response.error || "Error al crear vivero")
      }
    } catch (error) {
      console.error("Error al crear vivero:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo crear el vivero.",
      })
      return false
    }
  }

  // Actualizar un vivero existente
  const actualizarVivero = async (id: string, viveroData: Partial<Vivero>) => {
    try {
      const response = await viverosAPI.update(id, viveroData)
      
             if (response.success) {
         toast({
           title: "Éxito",
           description: "Vivero actualizado correctamente.",
         })
         loadData()
         return true
       } else {
        throw new Error(response.error || "Error al actualizar vivero")
      }
    } catch (error) {
      console.error("Error al actualizar vivero:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo actualizar el vivero.",
      })
      return false
    }
  }

  // Eliminar un vivero
  const eliminarVivero = async (id: string) => {
    try {
      const response = await viverosAPI.delete(id)
      
             if (response.success) {
         toast({
           title: "Éxito",
           description: "Vivero eliminado correctamente.",
         })
         loadData()
         return true
       } else {
        throw new Error(response.error || "Error al eliminar vivero")
      }
    } catch (error) {
      console.error("Error al eliminar vivero:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo eliminar el vivero.",
      })
      return false
    }
  }

  // Agregar un clon a un vivero
  const agregarClon = async (viveroId: string, clonData: Omit<Clone, '_id'>) => {
    try {
      const vivero = viveros?.find((v: Vivero) => v._id === viveroId)
      if (!vivero) throw new Error("Vivero no encontrado")

      const nuevoClon: Clone = {
        _id: Date.now().toString(), // ID temporal
        ...clonData
      }

      const viveroActualizado = {
        ...vivero,
        clones: [...(vivero.clones || []), nuevoClon]
      }

      const response = await viverosAPI.update(viveroId, viveroActualizado)
      
             if (response.success) {
         toast({
           title: "Éxito",
           description: "Clon agregado correctamente.",
         })
         loadData()
         return true
       } else {
        throw new Error(response.error || "Error al agregar clon")
      }
    } catch (error) {
      console.error("Error al agregar clon:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo agregar el clon.",
      })
      return false
    }
  }

  // Actualizar un clon
  const actualizarClon = async (viveroId: string, clonId: string, clonData: Partial<Clone>) => {
    try {
      const vivero = viveros?.find((v: Vivero) => v._id === viveroId)
      if (!vivero) throw new Error("Vivero no encontrado")

      const clonesActualizados = (vivero.clones || []).map(clon => 
        clon._id === clonId ? { ...clon, ...clonData } : clon
      )

      const viveroActualizado = {
        ...vivero,
        clones: clonesActualizados
      }

      const response = await viverosAPI.update(viveroId, viveroActualizado)
      
             if (response.success) {
         toast({
           title: "Éxito",
           description: "Clon actualizado correctamente.",
         })
         loadData()
         return true
       } else {
        throw new Error(response.error || "Error al actualizar clon")
      }
    } catch (error) {
      console.error("Error al actualizar clon:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo actualizar el clon.",
      })
      return false
    }
  }

  // Eliminar un clon
  const eliminarClon = async (viveroId: string, clonId: string) => {
    try {
      const vivero = viveros?.find((v: Vivero) => v._id === viveroId)
      if (!vivero) throw new Error("Vivero no encontrado")

      const clonesActualizados = (vivero.clones || []).filter(clon => clon._id !== clonId)

      const viveroActualizado = {
        ...vivero,
        clones: clonesActualizados
      }

      const response = await viverosAPI.update(viveroId, viveroActualizado)
      
             if (response.success) {
         toast({
           title: "Éxito",
           description: "Clon eliminado correctamente.",
         })
         loadData()
         return true
       } else {
        throw new Error(response.error || "Error al eliminar clon")
      }
    } catch (error) {
      console.error("Error al eliminar clon:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo eliminar el clon.",
      })
      return false
    }
  }

  // Obtener estadísticas de viveros
  const getEstadisticas = () => {
    if (!viveros) return { total: 0, activos: 0, inactivos: 0, totalClones: 0 }

    const total = viveros.length
    const activos = viveros.filter((v: Vivero) => v.activo).length
    const inactivos = total - activos
    const totalClones = viveros.reduce((acc, vivero) => acc + (vivero.clones?.length || 0), 0)

    return { total, activos, inactivos, totalClones }
  }

  return {
    viveros: filteredViveros,
    especies,
    isLoading,
    searchTerm,
    setSearchTerm,
    selectedVivero,
    setSelectedVivero,
    getEspeciesVivero,
    getTodasEspeciesVivero,
    getEspeciesDisponibles,
    crearVivero,
    actualizarVivero,
    eliminarVivero,
    agregarClon,
    actualizarClon,
    eliminarClon,
    getEstadisticas,
    refreshData: loadData,
  }
}
