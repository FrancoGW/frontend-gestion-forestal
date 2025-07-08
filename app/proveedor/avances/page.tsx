"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { avancesTrabajoAPI, cuadrillasAPI, especiesAPI, viverosAPI, clonesAPI, supervisorsAPI } from "@/lib/api-client"
import { useAuth } from "@/hooks/use-auth"
import { useProviderOrders } from "@/hooks/use-provider-orders"
import * as XLSX from "xlsx"
import { Download, Search, TestTube, Edit, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { WorkProgressForm } from "@/components/provider/work-progress-form"
import { useToast } from "@/hooks/use-toast"
import { useProviderWorkData } from "@/hooks/use-provider-work-data"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"

// Función para capitalizar la primera letra - MEJORADA
const capitalizeFirstLetter = (str: string | number | null | undefined): string => {
  if (str === null || str === undefined) return ""
  const stringValue = String(str)
  if (!stringValue || stringValue.length === 0) return ""
  return stringValue.charAt(0).toUpperCase() + stringValue.slice(1).toLowerCase()
}

// Función para formatear hectáreas
const formatHectareas = (hectareas: number | string | undefined): string => {
  if (hectareas === undefined || hectareas === null) return "0.0"
  const numHectareas = typeof hectareas === "string" ? Number.parseFloat(hectareas) : hectareas
  if (isNaN(numHectareas)) return "0.0"
  return numHectareas.toFixed(1)
}

// Función CORREGIDA para formatear fechas sin conversión de zona horaria
const formatDateArgentina = (dateString: string): string => {
  try {
    // Si la fecha ya está en formato DD/MM/YYYY, devolverla tal como está
    if (dateString.includes("/")) {
      return dateString
    }

    // Si es una fecha en formato YYYY-MM-DD, procesarla directamente sin conversión de zona horaria
    if (dateString.includes("-")) {
      const parts = dateString.split("T")[0].split("-") // Tomar solo la parte de fecha, ignorar hora
      if (parts.length === 3) {
        const year = parts[0]
        const month = parts[1]
        const day = parts[2]
        return `${day}/${month}/${year}`
      }
    }

    // Como último recurso, intentar parsear la fecha pero forzando la zona horaria local
    const date = new Date(dateString + "T00:00:00") // Agregar hora 00:00:00 para evitar problemas de zona horaria
    if (isNaN(date.getTime())) {
      return dateString
    }
    return format(date, "dd/MM/yyyy", { locale: es })
  } catch (error) {
    return dateString
  }
}

// Función para resolver ID de especie a nombre - MEJORADA
const resolveEspecieName = (especieValue: string | number, especies: any[]): string => {
  if (!especieValue) return "Sin especificar"

  // Si ya es un nombre (string que no es un número), devolverlo
  if (typeof especieValue === "string" && isNaN(Number(especieValue))) {
    return capitalizeFirstLetter(especieValue)
  }

  // Si es un ID numérico, buscar en la lista de especies
  const especieId = String(especieValue)
  const especie = especies.find((e) => String(e._id || e.id) === especieId)

  if (especie) {
    return capitalizeFirstLetter(especie.especie || `Especie ${especieId}`)
  }

  // Si no se encuentra y es un número, mostrar que es un ID no resuelto
  if (!isNaN(Number(especieValue))) {
    return `ID: ${especieValue}`
  }

  // Si no se encuentra, devolver el valor original
  return capitalizeFirstLetter(String(especieValue))
}

// Función para resolver ID de vivero a nombre - MEJORADA
const resolveViveroName = (viveroValue: string | number, viveros: any[]): string => {
  if (!viveroValue) return "Sin especificar"

  // Si ya es un nombre (string que no es un ObjectId), devolverlo
  if (typeof viveroValue === "string" && !isObjectId(viveroValue)) {
    return capitalizeFirstLetter(viveroValue)
  }

  // Si es un ID, buscar en la lista de viveros
  const viveroId = String(viveroValue)
  const vivero = viveros.find((v) => String(v._id || v.id) === viveroId)

  if (vivero) {
    return capitalizeFirstLetter(
      vivero.nombre || vivero.descripcion || vivero.vivero || `Vivero ${viveroId.substring(0, 8)}`,
    )
  }

  // Si no se encuentra, mostrar ID truncado
  if (isObjectId(viveroId)) {
    return `ID: ${viveroId.substring(0, 8)}...`
  }

  return capitalizeFirstLetter(String(viveroValue))
}

// Función para resolver ID de clon a código - MEJORADA
const resolveClonCode = (clonValue: string | number, clones: any[]): string => {
  if (!clonValue) return "Sin especificar"

  // Si ya es un código (string que no es un ObjectId), devolverlo
  if (typeof clonValue === "string" && !isObjectId(clonValue)) {
    return capitalizeFirstLetter(clonValue)
  }

  // Si es un ID, buscar en la lista de clones
  const clonId = String(clonValue)
  const clon = clones.find((c) => String(c._id || c.id) === clonId)

  if (clon) {
    return capitalizeFirstLetter(
      clon.codigo || clon.codigoClon || clon.nombre || clon.clon || `Clon ${clonId.substring(0, 8)}`,
    )
  }

  // Si no se encuentra, mostrar ID truncado
  if (isObjectId(clonId)) {
    return `ID: ${clonId.substring(0, 8)}...`
  }

  return capitalizeFirstLetter(String(clonValue))
}

// ✅ NUEVA: Función para extraer cantidad de plantas de campos dinámicos
const extractPlantQuantity = (avance: any): number => {
  // Primero intentar con los campos estándar
  if (avance.cantidadPlantas && avance.cantidadPlantas > 0) {
    return avance.cantidadPlantas
  }

  if (avance.plantas && avance.plantas > 0) {
    return avance.plantas
  }

  // Buscar en campos dinámicos que puedan contener cantidad de plantas
  const dynamicFields = Object.keys(avance).filter(
    (key) => key.startsWith("field-") && typeof avance[key] === "number" && avance[key] > 0,
  )

  // Si hay campos dinámicos, tomar el que tenga el valor más alto (probablemente plantas)
  if (dynamicFields.length > 0) {
    const values = dynamicFields.map((field) => avance[field]).filter((val) => typeof val === "number")
    return Math.max(...values)
  }

  return 0
}

// Función para verificar si un string es un ObjectId de MongoDB
const isObjectId = (str: string): boolean => {
  return /^[0-9a-fA-F]{24}$/.test(str)
}

// Función para generar ID corto desde ObjectID de MongoDB
const generateShortId = (objectId: string): string => {
  if (!objectId || objectId.length < 8) return objectId

  // Tomar los últimos 8 caracteres y convertir a base36 para hacerlo más corto
  const shortHex = objectId.slice(-8)
  const decimal = Number.parseInt(shortHex, 16)
  const base36 = decimal.toString(36).toUpperCase()

  // Agregar prefijo para identificar que es un avance
  return `AV-${base36}`
}

// ✅ NUEVA: Función para formatear productos de malezas
const formatProductosMalezas = (productos: any[]): string => {
  if (!productos || !Array.isArray(productos) || productos.length === 0) {
    return "Sin productos"
  }

  return productos.map((p) => `${p.producto || "N/A"}: ${p.cantidad || 0} ${p.unidad || ""}`).join(" | ")
}

// ✅ NUEVA: Función para obtener el valor de un campo con fallbacks
const getFieldValue = (avance: any, fieldName: string, fallback = ""): string => {
  const value = avance[fieldName]
  if (value === null || value === undefined || value === "") {
    return fallback
  }
  return String(value)
}

interface AvanceExtendido {
  id: string
  ordenId: number
  numeroOrden: string
  fecha: string
  superficie: number
  cantidadPlantas: number
  cantidadBandejas: number
  cuadrilla: string
  cuadrillaNombre?: string
  cuadrillaId?: string
  cantPersonal: number
  jornada: number
  observaciones?: string
  usuario?: string
  predio?: string
  rodal?: string
  actividad?: string
  especie?: string
  rodalEnsayo?: boolean
  estado: string
  _originalData?: any
}

export default function ProviderAvancesPage() {
  const { user } = useAuth()
  const { orders } = useProviderOrders()
  const { toast } = useToast()
  const { addWorkProgress } = useProviderWorkData()

  const [avances, setAvances] = useState<AvanceExtendido[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cuadrillasMap, setCuadrillasMap] = useState<Record<string, string>>({})
  const [isLoadingCuadrillas, setIsLoadingCuadrillas] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  // Estados para filtro de fechas
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined)
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined)

  // Estados para resolver nombres de especies, viveros y clones
  const [especies, setEspecies] = useState<any[]>([])
  const [viveros, setViveros] = useState<any[]>([])
  const [clones, setClones] = useState<any[]>([])
  const [loadingMasterData, setLoadingMasterData] = useState(false)

  // Estados para el diálogo de registro de avance
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // ✅ NUEVOS: Estados para edición de avances
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingAvance, setEditingAvance] = useState<AvanceExtendido | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)

  // ✅ NUEVO: Estado para el avance completo con todos los datos originales
  const [fullEditingAvance, setFullEditingAvance] = useState<any>(null)

  // ✅ NUEVOS: Estados para eliminación de avances
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingAvance, setDeletingAvance] = useState<AvanceExtendido | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  // ✅ NUEVO: Estado para almacenar los datos completos de avances para exportación
  const [fullAvancesData, setFullAvancesData] = useState<any[]>([])

  // Calcular estadísticas
  const totalSuperficie = avances.reduce((sum, avance) => sum + avance.superficie, 0)
  const totalOrdenes = new Set(avances.map((avance) => avance.ordenId)).size

  // Cargar todos los avances del proveedor
  useEffect(() => {
    const loadAvances = async () => {
      if (!user?.providerId || orders.length === 0) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)

        // Obtener todos los avances
        const allAvances = await avancesTrabajoAPI.getAll()

        if (!Array.isArray(allAvances)) {
          setAvances([])
          setFullAvancesData([])
          setLoading(false)
          return
        }

        // Filtrar avances por proveedorId directamente
        const providerAvances = allAvances.filter((avance) => avance.proveedorId === user.providerId)

        setFullAvancesData(providerAvances)

        // Mapear para la vista de tabla
        const mappedAvances = providerAvances.map((avance) => ({
          id: avance._id || avance.id || Math.random().toString(),
          ordenId: avance.ordenTrabajoId,
          numeroOrden: avance.ordenTrabajoId ? `#${avance.ordenTrabajoId}` : "-",
          fecha: avance.fecha || new Date().toISOString().split("T")[0],
          superficie: avance.superficie || 0,
          cantidadPlantas: extractPlantQuantity(avance),
          cantidadBandejas: avance.cantidadBandejas || 0,
          cuadrilla: avance.cuadrilla || "",
          cuadrillaNombre: avance.cuadrillaNombre,
          cuadrillaId: avance.cuadrillaId,
          cantPersonal: avance.cantPersonal || 0,
          jornada: avance.jornada || 0,
          observaciones: avance.observaciones || "",
          usuario: avance.usuario || "",
          predio: avance.predio || "",
          rodal: avance.rodal || "",
          actividad: avance.actividad || "",
          especie: avance.especie || "",
          rodalEnsayo: avance.rodalEnsayo || false,
          estado: avance.estado || "Pendiente",
          _originalData: avance,
        }))

        setAvances(mappedAvances)
        setError(null)
      } catch (err) {
        setError("Error al cargar los avances")
        setAvances([])
        setFullAvancesData([])
      } finally {
        setLoading(false)
      }
    }

    loadAvances()
  }, [user?.providerId, orders])

  // Cargar datos maestros para resolver nombres
  useEffect(() => {
    const loadMasterData = async () => {
      setLoadingMasterData(true)
      try {
        const [especiesData, viverosData, clonesData] = await Promise.all([
          especiesAPI.getAll(),
          viverosAPI.getAll(),
          clonesAPI.getAll(),
        ])

        setEspecies(Array.isArray(especiesData) ? especiesData : [])
        setViveros(Array.isArray(viverosData) ? viverosData : [])
        setClones(Array.isArray(clonesData) ? clonesData : [])
      } catch (error) {
      } finally {
        setLoadingMasterData(false)
      }
    }

    loadMasterData()
  }, [])

  // ✅ CORREGIR: Cargar nombres de cuadrillas usando cuadrillaId
  useEffect(() => {
    const loadCuadrillasNames = async () => {
      // Obtener todos los cuadrillaIds únicos de los avances
      const cuadrillaIds = [
        ...new Set(avances.map((avance) => avance.cuadrillaId).filter((id) => id && isObjectId(id))),
      ]

      if (cuadrillaIds.length === 0) return

      setIsLoadingCuadrillas(true)
      try {
        const tempMap: Record<string, string> = {}
        for (const id of cuadrillaIds) {
          try {
            const cuadrilla = await cuadrillasAPI.getById(id)
            if (cuadrilla) {
              tempMap[id] = cuadrilla.nombre || cuadrilla.descripcion || `Cuadrilla ${id.substring(0, 6)}...`
            }
          } catch (err) {
            tempMap[id] = `Cuadrilla ${id.substring(0, 6)}...`
          }
        }

        setCuadrillasMap(tempMap)
      } catch (error) {
      } finally {
        setIsLoadingCuadrillas(false)
      }
    }

    loadCuadrillasNames()
  }, [avances])

  // ✅ CORREGIR: Función para obtener el nombre de la cuadrilla
  const getCuadrillaName = (avance: AvanceExtendido): string => {
    // Si ya tenemos el nombre de la cuadrilla, usarlo
    if (avance.cuadrillaNombre) {
      return capitalizeFirstLetter(avance.cuadrillaNombre)
    }

    // Si tenemos cuadrilla como nombre directo, usarlo
    if (avance.cuadrilla && !isObjectId(avance.cuadrilla)) {
      return capitalizeFirstLetter(avance.cuadrilla)
    }

    // Si tenemos cuadrillaId, buscar en el mapa
    if (avance.cuadrillaId && cuadrillasMap[avance.cuadrillaId]) {
      return capitalizeFirstLetter(cuadrillasMap[avance.cuadrillaId])
    }

    // Si cuadrilla es un ObjectId, buscar en el mapa
    if (avance.cuadrilla && isObjectId(avance.cuadrilla) && cuadrillasMap[avance.cuadrilla]) {
      return capitalizeFirstLetter(cuadrillasMap[avance.cuadrilla])
    }

    // Si estamos cargando, mostrar mensaje
    if (isLoadingCuadrillas) {
      return "Cargando..."
    }

    // Como último recurso
    return "Sin asignar"
  }

  // ✅ NUEVA: Función para obtener las hectáreas GIS de un rodal desde las órdenes de trabajo
  const getRodalSuperficieGIS = (rodalValue: string | number | null | undefined, ordenId: number): number => {
    if (!rodalValue) return 0

    const rodalStr = String(rodalValue)
    if (rodalStr === "sin-rodales") return 0

    // Buscar la orden correspondiente
    const orden = orders.find((order) => order.id === ordenId)
    if (!orden || !orden.rodales) return 0

    // Buscar el rodal específico en la orden
    const rodal = orden.rodales.find((r) => {
      const rodalNumero = String(r.numero || "").toLowerCase()
      const rodalSearch = rodalStr.toLowerCase()
      return rodalNumero === rodalSearch
    })

    return rodal?.hectareas || 0
  }

  // ✅ MEJORADA: Función para abrir el diálogo de edición con datos completos
  const handleEditAvance = async (avance: AvanceExtendido) => {
    try {

      // Primero intentar obtener el avance completo desde la API
      let fullAvanceData = null

      try {
        // Buscar en los datos completos que ya tenemos cargados
        fullAvanceData = fullAvancesData.find((a) => (a._id || a.id) === avance.id)

        if (!fullAvanceData) {
          // Si no está en los datos locales, intentar obtenerlo de la API
          const allAvances = await avancesTrabajoAPI.getAll()
          fullAvanceData = allAvances.find((a) => (a._id || a.id) === avance.id)
        }

        if (!fullAvanceData) {
          // Como último recurso, usar los datos originales del avance
          fullAvanceData = avance._originalData || avance
        }
      } catch (error) {
        console.error("❌ Error al obtener avance completo:", error)
        // En caso de error, usar los datos que tenemos
        fullAvanceData = avance._originalData || avance
      }


      // Asegurar que tenemos todos los campos necesarios
      const completeAvanceData = {
        // Datos básicos
        _id: fullAvanceData._id || fullAvanceData.id || avance.id,
        id: fullAvanceData._id || fullAvanceData.id || avance.id,
        ordenTrabajoId: fullAvanceData.ordenTrabajoId || avance.ordenId,

        // Fecha - CORREGIR: Asegurar formato correcto
        fecha: fullAvanceData.fecha || avance.fecha || new Date().toISOString().split("T")[0],

        // Ubicación
        predio: fullAvanceData.predio || avance.predio || "",
        rodal: fullAvanceData.rodal || avance.rodal || "",
        seccion: fullAvanceData.seccion || "",
        rodalEnsayo: fullAvanceData.rodalEnsayo || avance.rodalEnsayo || false,

        // Cuadrilla
        cuadrilla: fullAvanceData.cuadrilla || avance.cuadrilla || "",
        cuadrillaId: fullAvanceData.cuadrillaId || avance.cuadrillaId || "",
        cuadrillaNombre: fullAvanceData.cuadrillaNombre || avance.cuadrillaNombre || "",

        // Personal y tiempo
        cantPersonal: fullAvanceData.cantPersonal || avance.cantPersonal || 0,
        jornada: fullAvanceData.jornada || avance.jornada || 8,

        // Superficie
        superficie: fullAvanceData.superficie || avance.superficie || 0,

        // Estado
        estado: fullAvanceData.estado || avance.estado || "Pendiente",

        // Observaciones
        observaciones: fullAvanceData.observaciones || avance.observaciones || "",

        // Actividad
        actividad: fullAvanceData.actividad || avance.actividad || "",

        // PLANTACIÓN - Campos específicos
        tipoCarga: fullAvanceData.tipoCarga || "",
        vivero: fullAvanceData.vivero || fullAvanceData.viveroId || "",
        especie: fullAvanceData.especie || fullAvanceData.especie_forestal || "",
        especie_forestal: fullAvanceData.especie_forestal || fullAvanceData.especie || "",
        clon: fullAvanceData.clon || fullAvanceData.clonId || fullAvanceData.codigo_clon || "",
        densidad: fullAvanceData.densidad || 0,
        cantidadBandejas: fullAvanceData.cantidadBandejas || 0,
        totalPlantas: fullAvanceData.totalPlantas || fullAvanceData.cantidadPlantas || 0,
        rocambole: fullAvanceData.rocambole || "",
        cantidadPlantines: fullAvanceData.cantidadPlantines || 0,
        cantidadPlantas:
          fullAvanceData.cantidadPlantas || fullAvanceData.plantas || extractPlantQuantity(fullAvanceData),

        // PODA - Campos específicos
        tipoPoda: fullAvanceData.tipoPoda || "",
        altura_poda: fullAvanceData.altura_poda || 0,
        plantas: fullAvanceData.plantas || fullAvanceData.cantidadPlantas || 0,

        // CONTROL DE HORMIGAS - Campos específicos
        numerosNidos: fullAvanceData.numerosNidos || "",
        especieHormiga: fullAvanceData.especieHormiga || "",
        producto: fullAvanceData.producto || "",
        cantidad: fullAvanceData.cantidad || 0,

        // CONTROL DE MALEZAS - Campos específicos
        subActividad: fullAvanceData.subActividad || "",
        tipoAplicacion: fullAvanceData.tipoAplicacion || "",
        volumenAplicado: fullAvanceData.volumenAplicado || 0,
        cantidadMochilas: fullAvanceData.cantidadMochilas || 0,
        productos: fullAvanceData.productos || [],

        // QUEMAS CONTROLADAS - Campos específicos
        areaOperarios: fullAvanceData.areaOperarios || 0,
        horaR29: fullAvanceData.horaR29 || "",
        horaR8: fullAvanceData.horaR8 || "",
        horaR7: fullAvanceData.horaR7 || "",
        horaR28: fullAvanceData.horaR28 || "",
        tiempoHs: fullAvanceData.tiempoHs || 0,
        jornadaHs: fullAvanceData.jornadaHs || 0,
        comentarios: fullAvanceData.comentarios || "",

        // Campos dinámicos (field-*)
        ...Object.keys(fullAvanceData)
          .filter((key) => key.startsWith("field-"))
          .reduce((acc, key) => {
            acc[key] = fullAvanceData[key]
            return acc
          }, {}),

        // Metadatos
        usuario: fullAvanceData.usuario || avance.usuario || "",
        createdAt: fullAvanceData.createdAt || "",
        updatedAt: fullAvanceData.updatedAt || "",
      }


      setFullEditingAvance(completeAvanceData)
      setEditingAvance(avance)
      setIsEditDialogOpen(true)
    } catch (error) {
      console.error("❌ Error al preparar datos para edición:", error)
      toast({
        title: "Error al cargar datos",
        description: "No se pudieron cargar todos los datos del avance. Inténtalo de nuevo.",
        variant: "destructive",
      })
    }
  }

  // ✅ NUEVA: Función para actualizar un avance
  const handleUpdateAvance = async (updatedData: any) => {
    if (!editingAvance) return { success: false, error: "No hay avance seleccionado para editar" }

    setIsUpdating(true)
    try {
      // Preparar datos para la actualización
      const updateData = {
        ...updatedData,
        _id: editingAvance.id,
        ordenTrabajoId: editingAvance.ordenId,
      }


      // Llamar a la API para actualizar
      const result = await avancesTrabajoAPI.update(editingAvance.id, updateData)

      if (result) {
        toast({
          title: "Avance actualizado",
          description: "El avance se ha actualizado correctamente",
        })

        // Recargar los avances
        await loadAvances()

        // Cerrar el diálogo
        setIsEditDialogOpen(false)
        setEditingAvance(null)
        setFullEditingAvance(null)

        return { success: true }
      } else {
        throw new Error("Error al actualizar el avance")
      }
    } catch (error) {
      const errorMessage = error.message || "Error al actualizar el avance"
      console.error("❌ Error al actualizar avance:", error)
      toast({
        title: "Error al actualizar",
        description: errorMessage,
        variant: "destructive",
      })
      return { success: false, error: errorMessage }
    } finally {
      setIsUpdating(false)
    }
  }

  // ✅ NUEVA: Función para abrir el diálogo de eliminación
  const handleDeleteAvance = (avance: AvanceExtendido) => {
    setDeletingAvance(avance)
    setIsDeleteDialogOpen(true)
  }

  // ✅ NUEVA: Función para confirmar eliminación
  const handleConfirmDelete = async () => {
    if (!deletingAvance) return

    setIsDeleting(true)
    try {
      // Pasar el proveedorId como segundo parámetro
      await avancesTrabajoAPI.delete(deletingAvance.id, user?.providerId)

      toast({
        title: "Avance eliminado",
        description: "El avance se ha eliminado correctamente",
      })

      // Recargar los avances
      await loadAvances()

      // Cerrar el diálogo
      setIsDeleteDialogOpen(false)
      setDeletingAvance(null)
    } catch (error) {
      toast({
        title: "Error al eliminar",
        description: error.response?.data?.mensaje || "No se pudo eliminar el avance",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  // ✅ MEJORADA: Función para exportar a Excel con TODOS los campos de todas las actividades
  const exportToExcel = () => {
    try {
      // Usar los datos completos filtrados para exportación
      const filteredFullData = fullAvancesData.filter((avance) => {
        // Aplicar los mismos filtros que en la vista
        const avanceExtendido = {
          id: avance._id || avance.id || "",
          ordenId: avance.ordenTrabajoId,
          numeroOrden: orders.find((o) => o.id === avance.ordenTrabajoId)?.numero || `#${avance.ordenTrabajoId}`,
          fecha: avance.fecha || "",
          cuadrilla: avance.cuadrilla || "",
          cuadrillaId: avance.cuadrillaId,
          cuadrillaNombre: avance.cuadrillaNombre,
          predio: avance.predio || "",
          actividad: avance.actividad || "",
          especie: avance.especie || "",
          rodal: avance.rodal || "",
          observaciones: avance.observaciones || "",
        }

        // Filtro por término de búsqueda
        let matchesSearch = true
        if (searchTerm) {
          const searchTermLower = searchTerm.toLowerCase()
          const shortId = generateShortId(avanceExtendido.id)
          const searchableFields = [
            shortId || "",
            shortId.replace("AV-", "") || "",
            avanceExtendido.numeroOrden || "",
            formatDateArgentina(avanceExtendido.fecha) || "",
            getCuadrillaName(avanceExtendido as AvanceExtendido),
            String(avanceExtendido.predio || ""),
            String(avanceExtendido.actividad || ""),
            String(avanceExtendido.especie || ""),
            String(avanceExtendido.rodal || ""),
          ]

          matchesSearch = searchableFields.some((field) => String(field).toLowerCase().includes(searchTermLower))
        }

        // Filtro por fechas
        let matchesDateRange = true
        if (dateFrom || dateTo) {
          const avanceDate = new Date(avanceExtendido.fecha + "T00:00:00")

          if (dateFrom && dateTo) {
            const fromDate = new Date(dateFrom.getFullYear(), dateFrom.getMonth(), dateFrom.getDate())
            const toDate = new Date(dateTo.getFullYear(), dateTo.getMonth(), dateTo.getDate(), 23, 59, 59)
            matchesDateRange = avanceDate >= fromDate && avanceDate <= toDate
          } else if (dateFrom) {
            const fromDate = new Date(dateFrom.getFullYear(), dateFrom.getMonth(), dateFrom.getDate())
            matchesDateRange = avanceDate >= fromDate
          } else if (dateTo) {
            const toDate = new Date(dateTo.getFullYear(), dateTo.getMonth(), dateTo.getDate(), 23, 59, 59)
            matchesDateRange = avanceDate <= toDate
          }
        }

        return matchesSearch && matchesDateRange
      })

      // ✅ NUEVA: Preparar datos completos para exportar con TODOS los campos posibles
      const dataToExport = filteredFullData.map((avance) => {
        const ordenNumero = orders.find((o) => o.id === avance.ordenTrabajoId)?.numero || `#${avance.ordenTrabajoId}`

        return {
          // Campos básicos comunes
          ID: generateShortId(avance._id || avance.id || ""),
          Orden: ordenNumero,
          Fecha: formatDateArgentina(avance.fecha || ""),
          Actividad: capitalizeFirstLetter(avance.actividad) || "Sin especificar",
          Estado: avance.estado === "R7 (terminado)" ? "✅ Terminado" : "⏳ Pendiente",

          // Ubicación
          "Predio/Campo": capitalizeFirstLetter(avance.predio) || "Sin especificar",
          Rodal: capitalizeFirstLetter(avance.rodal) || "Sin especificar",
          Sección: getFieldValue(avance, "seccion", "Sin especificar"),
          Ensayo: avance.rodalEnsayo ? "Sí" : "No",

          // Cuadrilla y personal
          Cuadrilla: getCuadrillaName({
            cuadrilla: avance.cuadrilla,
            cuadrillaId: avance.cuadrillaId,
            cuadrillaNombre: avance.cuadrillaNombre,
          } as AvanceExtendido),
          "Cant. Personal": avance.cantPersonal || 0,
          "Jornadas (hs)": avance.jornada || 0,

          // Superficie
          "Superficie (ha)": formatHectareas(avance.superficie),
          "Sup GIS (ha)": getRodalSuperficieGIS(avance.rodal, avance.ordenTrabajoId) || "N/D",

          // PLANTACIÓN - Campos específicos
          "Tipo de Carga": getFieldValue(avance, "tipoCarga", "-"),
          Vivero: resolveViveroName(avance.vivero || avance.viveroId, viveros),
          "Especie Forestal": resolveEspecieName(avance.especie || avance.especie_forestal, especies),
          Clon: resolveClonCode(avance.clon || avance.clonId || avance.codigo_clon, clones),
          "Densidad (plantas/ha)": getFieldValue(avance, "densidad", "-"),
          "Cant. Bandejas": avance.cantidadBandejas || "-",
          "Total Plantas": avance.totalPlantas || avance.cantidadPlantas || extractPlantQuantity(avance) || "-",
          Rocambole: getFieldValue(avance, "rocambole", "-"),
          "Cant. Plantines": avance.cantidadPlantines || "-",

          // PODA - Campos específicos
          "Tipo de Poda": getFieldValue(avance, "tipoPoda", "-"),
          "Altura Poda (m)": getFieldValue(avance, "altura_poda", "-"),
          "Plantas Podadas": avance.plantas || avance.cantidadPlantas || "-",

          // CONTROL DE HORMIGAS - Campos específicos
          "Números de Nidos": getFieldValue(avance, "numerosNidos", "-"),
          "Especie Hormiga": getFieldValue(avance, "especieHormiga", "-"),
          "Producto Hormiga": getFieldValue(avance, "producto", "-"),
          "Cantidad Producto (kg)": getFieldValue(avance, "cantidad", "-"),

          // CONTROL DE MALEZAS - Campos específicos
          "Tipo Aplicación": getFieldValue(avance, "tipoAplicacion", "-"),
          "Volumen Aplicado (L/ha)": getFieldValue(avance, "volumenAplicado", "-"),
          "Cant. Mochilas": getFieldValue(avance, "cantidadMochilas", "-"),
          "Productos Malezas": formatProductosMalezas(avance.productos),

          // RALEO - Campos específicos
          "Especie Raleo": getFieldValue(avance, "especie", "-"),

          // Campos dinámicos adicionales (field-*)
          ...Object.keys(avance)
            .filter((key) => key.startsWith("field-"))
            .reduce((acc, key) => {
              acc[`Campo ${key.replace("field-", "")}`] = getFieldValue(avance, key, "-")
              return acc
            }, {}),

          // Sub-actividad si existe
          "Sub-Actividad": getFieldValue(avance, "subActividad", "-"),

          // Observaciones al final
          Observaciones: avance.observaciones || "Sin observaciones",

          // Metadatos
          Usuario: getFieldValue(avance, "usuario", "-"),
          "Fecha Creación": avance.createdAt ? formatDateArgentina(avance.createdAt) : "-",
          "Última Modificación": avance.updatedAt ? formatDateArgentina(avance.updatedAt) : "-",
        }
      })

      // Crear el libro de trabajo
      const ws = XLSX.utils.json_to_sheet(dataToExport)
      const wb = XLSX.utils.book_new()

      // Configurar anchos de columna optimizados
      const wscols = [
        { wch: 12 }, // ID
        { wch: 15 }, // Orden
        { wch: 12 }, // Fecha
        { wch: 20 }, // Actividad
        { wch: 12 }, // Estado
        { wch: 15 }, // Predio/Campo
        { wch: 10 }, // Rodal
        { wch: 12 }, // Sección
        { wch: 8 }, // Ensayo
        { wch: 15 }, // Cuadrilla
        { wch: 10 }, // Cant. Personal
        { wch: 12 }, // Jornadas
        { wch: 12 }, // Superficie
        { wch: 12 }, // Sup GIS
        { wch: 15 }, // Tipo de Carga
        { wch: 15 }, // Vivero
        { wch: 20 }, // Especie Forestal
        { wch: 12 }, // Clon
        { wch: 15 }, // Densidad
        { wch: 12 }, // Cant. Bandejas
        { wch: 12 }, // Total Plantas
        { wch: 12 }, // Rocambole
        { wch: 12 }, // Cant. Plantines
        { wch: 15 }, // Tipo de Poda
        { wch: 12 }, // Altura Poda
        { wch: 12 }, // Plantas Podadas
        { wch: 12 }, // Números de Nidos
        { wch: 15 }, // Especie Hormiga
        { wch: 15 }, // Producto Hormiga
        { wch: 15 }, // Cantidad Producto
        { wch: 15 }, // Tipo Aplicación
        { wch: 15 }, // Volumen Aplicado
        { wch: 12 }, // Cant. Mochilas
        { wch: 30 }, // Productos Malezas
        { wch: 15 }, // Especie Raleo
        { wch: 15 }, // Sub-Actividad
        { wch: 40 }, // Observaciones
        { wch: 12 }, // Usuario
        { wch: 15 }, // Fecha Creación
        { wch: 15 }, // Última Modificación
      ]

      ws["!cols"] = wscols

      // Agregar la hoja al libro
      XLSX.utils.book_append_sheet(wb, ws, "Avances Completos")

      // Generar el archivo como array buffer
      const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" })

      // Crear blob y descargar
      const blob = new Blob([wbout], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })

      // Generar el nombre del archivo con fecha actual
      const fechaActual = format(new Date(), "dd-MM-yyyy", { locale: es })
      const nombreArchivo = `Mis_Avances_Completos_${fechaActual}.xlsx`

      // Crear enlace de descarga
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = nombreArchivo
      document.body.appendChild(link)
      link.click()

      // Limpiar
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      // Mostrar mensaje de éxito
      toast({
        title: "Exportación exitosa",
        description: `Se exportaron ${dataToExport.length} registros con todos los campos de todas las actividades`,
      })
    } catch (error) {
      console.error("Error al exportar:", error)
      toast({
        title: "Error al exportar",
        description: "No se pudo exportar los datos. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      })
    }
  }

  // Ordenar avances por fecha (más reciente primero)
  const sortedAvances = [...avances].sort((a, b) => {
    // Comparar fechas como strings en formato YYYY-MM-DD para evitar problemas de zona horaria
    return b.fecha.localeCompare(a.fecha)
  })

  // Filtrar avances según el término de búsqueda y fechas
  const filteredAvances = sortedAvances.filter((avance) => {
    // Filtro por término de búsqueda
    let matchesSearch = true
    if (searchTerm) {
      const searchTermLower = searchTerm.toLowerCase()
      const shortId = generateShortId(avance.id)
      const searchableFields = [
        shortId || "",
        shortId.replace("AV-", "") || "",
        avance.numeroOrden || "",
        formatDateArgentina(avance.fecha) || "",
        getCuadrillaName(avance) || "",
        String(avance.predio || ""),
        String(avance.actividad || ""),
        String(avance.especie || ""),
        String(avance.rodal || ""),
      ]

      matchesSearch = searchableFields.some((field) => String(field).toLowerCase().includes(searchTermLower))
    }

    // Filtro por fechas
    let matchesDateRange = true
    if (dateFrom || dateTo) {
      const avanceDate = new Date(avance.fecha + "T00:00:00")

      if (dateFrom && dateTo) {
        const fromDate = new Date(dateFrom.getFullYear(), dateFrom.getMonth(), dateFrom.getDate())
        const toDate = new Date(dateTo.getFullYear(), dateTo.getMonth(), dateTo.getDate(), 23, 59, 59)
        matchesDateRange = avanceDate >= fromDate && avanceDate <= toDate
      } else if (dateFrom) {
        const fromDate = new Date(dateFrom.getFullYear(), dateFrom.getMonth(), dateFrom.getDate())
        matchesDateRange = avanceDate >= fromDate
      } else if (dateTo) {
        const toDate = new Date(dateTo.getFullYear(), dateTo.getMonth(), dateTo.getDate(), 23, 59, 59)
        matchesDateRange = avanceDate <= toDate
      }
    }

    return matchesSearch && matchesDateRange
  })

  // Calcular paginación
  const totalItems = filteredAvances.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedAvances = filteredAvances.slice(startIndex, endIndex)

  // Resetear página cuando cambia la búsqueda o filtros de fecha
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, dateFrom, dateTo])

  // Función para manejar el envío del formulario de avance
  const handleSubmitProgress = async (progressData) => {
    if (!selectedOrderId) return { success: false, error: "Orden no seleccionada" }

    setIsSubmitting(true)
    try {
      // Buscar el supervisor asignado a este proveedor
      let supervisorId = null;
      try {
        const supervisors = await supervisorsAPI.getAll();
        const myProviderId = user?.providerId;
        for (const supervisor of supervisors) {
          if (Array.isArray(supervisor.proveedoresAsignados)) {
            if (supervisor.proveedoresAsignados.some((p) => p.proveedorId === myProviderId)) {
              supervisorId = supervisor._id;
              break;
            }
          }
        }
      } catch (e) {
        console.error("Error obteniendo supervisores para avance:", e);
      }
      // Agregar el supervisorId al avance
      const avanceConSupervisor = { ...progressData, supervisorId };
      const result = await addWorkProgress(selectedOrderId, avanceConSupervisor)

      if (result.success) {
        toast({
          title: "Avance registrado",
          description: `Avance guardado correctamente para ${progressData.superficie} ha`,
        })

        // Recargar los avances después de un registro exitoso
        setTimeout(() => {
          setIsDialogOpen(false)
          setSelectedOrderId(null)
          // Recargar los avances
          loadAvances()
        }, 1500)

        return { success: true }
      } else {
        throw new Error(result.error || "Error al registrar avance")
      }
    } catch (error) {
      toast({
        title: "Error al registrar avance",
        description: error.message || "No se pudo registrar el avance",
        variant: "destructive",
      })
      return { success: false, error: error.message || "Error al procesar la solicitud" }
    } finally {
      setIsSubmitting(false)
    }
  }

  // Función para cargar los avances
  const loadAvances = async () => {
    if (!user?.providerId || orders.length === 0) return

    try {
      setLoading(true)

      // Obtener todos los avances
      const allAvances = await avancesTrabajoAPI.getAll()

      if (!Array.isArray(allAvances)) {
        setAvances([])
        setFullAvancesData([])
        return
      }

      // Filtrar avances por proveedorId directamente
      const providerAvances = allAvances.filter((avance) => avance.proveedorId === user.providerId)

      setFullAvancesData(providerAvances)

      const mappedAvances = providerAvances.map((avance) => ({
        id: avance._id || avance.id || Math.random().toString(),
        ordenId: avance.ordenTrabajoId,
        numeroOrden: avance.ordenTrabajoId ? `#${avance.ordenTrabajoId}` : "-",
        fecha: avance.fecha || new Date().toISOString().split("T")[0],
        superficie: avance.superficie || 0,
        cantidadPlantas: extractPlantQuantity(avance),
        cantidadBandejas: avance.cantidadBandejas || 0,
        cuadrilla: avance.cuadrilla || "",
        cuadrillaNombre: avance.cuadrillaNombre,
        cuadrillaId: avance.cuadrillaId,
        cantPersonal: avance.cantPersonal || 0,
        jornada: avance.jornada || 0,
        observaciones: avance.observaciones || "",
        usuario: avance.usuario || "",
        predio: avance.predio || "",
        rodal: avance.rodal || "",
        actividad: avance.actividad || "",
        especie: avance.especie || "",
        rodalEnsayo: avance.rodalEnsayo || false,
        // ✅ NUEVO: Guardar el objeto completo para edición
        _originalData: avance,
        estado: avance.estado || "Pendiente",
      }))

      setAvances(mappedAvances)
      setError(null)
    } catch (err) {
      setError("Error al cargar los avances")
      setAvances([])
      setFullAvancesData([])
    } finally {
      setLoading(false)
    }
  }

  // Función para limpiar filtros de fecha
  const clearDateFilters = () => {
    setDateFrom(undefined)
    setDateTo(undefined)
  }

  // Obtener la orden seleccionada
  const selectedOrder = selectedOrderId ? orders.find((order) => order.id === selectedOrderId) : null

  // ✅ NUEVA: Obtener la orden del avance que se está editando
  const editingOrder = editingAvance ? orders.find((order) => order.id === editingAvance.ordenId) : null

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Mis Avances</h1>
          <p className="text-muted-foreground">Todos los avances registrados en tus órdenes de trabajo</p>
        </div>

        {/* Botón temporalmente oculto - descomentar si se necesita después */}
        {/* 
        <Button onClick={() => setIsDialogOpen(true)} className="flex items-center gap-2">
          <PlusCircle className="h-4 w-4" />
          Agregar Registro
        </Button>
        */}
      </div>

      {/* Estadísticas */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Avances</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avances.length}</div>
            <p className="text-xs text-muted-foreground">registros totales</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Superficie Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatHectareas(totalSuperficie)}</div>
            <p className="text-xs text-muted-foreground">hectáreas trabajadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Órdenes Activas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrdenes}</div>
            <p className="text-xs text-muted-foreground">órdenes con avances</p>
          </CardContent>
        </Card>
      </div>
      {/* Tabla de avances */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <CardTitle>Registro de Avances</CardTitle>
                <CardDescription>Historial completo de todos los avances registrados</CardDescription>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Buscar avances..."
                    className="pl-8 w-full"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <Button
                  onClick={exportToExcel}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 whitespace-nowrap bg-transparent"
                  disabled={paginatedAvances.length === 0}
                >
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">Exportar Excel Completo</span>
                  <span className="sm:hidden">Excel</span>
                </Button>
              </div>
            </div>

            {/* Filtros de fecha */}
            <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
              <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Filtrar por fecha:</span>

              <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                <div className="flex items-center gap-2">
                  <Label htmlFor="date-from" className="text-sm">
                    Desde:
                  </Label>
                  <Input
                    id="date-from"
                    type="date"
                    value={dateFrom ? format(dateFrom, "yyyy-MM-dd") : ""}
                    onChange={(e) => {
                      if (e.target.value) {
                        setDateFrom(new Date(e.target.value))
                      } else {
                        setDateFrom(undefined)
                      }
                    }}
                    className="w-full sm:w-[140px]"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Label htmlFor="date-to" className="text-sm">
                    Hasta:
                  </Label>
                  <Input
                    id="date-to"
                    type="date"
                    value={dateTo ? format(dateTo, "yyyy-MM-dd") : ""}
                    onChange={(e) => {
                      if (e.target.value) {
                        setDateTo(new Date(e.target.value))
                      } else {
                        setDateTo(undefined)
                      }
                    }}
                    className="w-full sm:w-[140px]"
                  />
                </div>

                {(dateFrom || dateTo) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearDateFilters}
                    className="h-9 px-2"
                    title="Limpiar filtros de fecha"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {(dateFrom || dateTo) && (
                <div className="text-xs text-muted-foreground">
                  {filteredAvances.length} registro{filteredAvances.length !== 1 ? "s" : ""} encontrado
                  {filteredAvances.length !== 1 ? "s" : ""}
                </div>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="overflow-x-auto">
          {avances.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">No hay avances registrados.</p>
          ) : paginatedAvances.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">
              No se encontraron avances que coincidan con la búsqueda.
            </p>
          ) : (
            <div className="rounded-md border">
              <div className="overflow-x-auto">
                <Table className="min-w-[1200px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="sticky left-0 bg-white z-10 min-w-[80px]">ID</TableHead>
                      <TableHead className="min-w-[100px]">Orden</TableHead>
                      <TableHead className="min-w-[100px]">Fecha</TableHead>
                      <TableHead className="min-w-[120px]">Cuadrilla</TableHead>
                      <TableHead className="hidden md:table-cell min-w-[100px]">Predio</TableHead>
                      <TableHead className="hidden lg:table-cell min-w-[120px]">Actividad</TableHead>
                      <TableHead className="hidden lg:table-cell min-w-[120px]">Especie</TableHead>
                      <TableHead className="min-w-[100px]">Rodal</TableHead>
                      <TableHead className="hidden sm:table-cell min-w-[100px] text-right">Bandejas</TableHead>
                      <TableHead className="hidden sm:table-cell min-w-[100px] text-right">Plantas</TableHead>
                      <TableHead className="hidden md:table-cell min-w-[90px] text-right">GIS (ha)</TableHead>
                      <TableHead className="min-w-[90px] text-right">Sup (ha)</TableHead>
                      <TableHead className="hidden sm:table-cell min-w-[80px] text-right">Personal</TableHead>
                      <TableHead className="hidden sm:table-cell min-w-[80px] text-right">Jornadas</TableHead>
                      <TableHead className="min-w-[100px] text-center">Estado</TableHead>
                      <TableHead className="sticky right-0 bg-white z-10 min-w-[100px] text-center">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedAvances.map((avance) => {
                      const shortId = generateShortId(avance.id)
                      const superficieGIS = getRodalSuperficieGIS(avance.rodal, avance.ordenId)

                      return (
                        <TableRow key={avance.id}>
                          <TableCell className="sticky left-0 bg-white z-10 font-mono text-xs">{shortId}</TableCell>
                          <TableCell className="font-medium">{avance.numeroOrden}</TableCell>
                          <TableCell>{formatDateArgentina(avance.fecha)}</TableCell>
                          <TableCell>{getCuadrillaName(avance)}</TableCell>
                          <TableCell className="hidden md:table-cell">
                            {capitalizeFirstLetter(avance.predio) || "Sin especificar"}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {capitalizeFirstLetter(avance.actividad) || "Sin especificar"}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {resolveEspecieName(avance.especie, especies)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {capitalizeFirstLetter(avance.rodal) || "Sin especificar"}
                              {avance.rodalEnsayo && (
                                <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800">
                                  <TestTube className="h-3 w-3 mr-1" />
                                  Ensayo
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-right">
                            {avance.cantidadBandejas > 0 ? avance.cantidadBandejas : "-"}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-right">
                            {avance.cantidadPlantas > 0 ? avance.cantidadPlantas.toLocaleString() : "-"}
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-right">
                            {superficieGIS > 0 ? (
                              <span className="text-sm">{formatHectareas(superficieGIS)}</span>
                            ) : (
                              <span className="text-muted-foreground text-xs">N/D</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-medium">{formatHectareas(avance.superficie)}</TableCell>
                          <TableCell className="hidden sm:table-cell text-right">
                            {avance.cantPersonal || "-"}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-right">{avance.jornada || "-"}</TableCell>
                          <TableCell className="text-center">
                            {avance.estado === "R7 (terminado)" ? (
                              <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                                ✅ Terminado
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                                ⏳ Pendiente
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="sticky right-0 bg-white z-10">
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditAvance(avance)}
                                className="h-8 w-8 p-0"
                                title="Editar avance"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteAvance(avance)}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                title="Eliminar avance"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t">
              <div className="flex items-center text-sm text-muted-foreground">
                Mostrando {startIndex + 1} a {Math.min(endIndex, totalItems)} de {totalItems} registros
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNumber
                    if (totalPages <= 5) {
                      pageNumber = i + 1
                    } else if (currentPage <= 3) {
                      pageNumber = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNumber = totalPages - 4 + i
                    } else {
                      pageNumber = currentPage - 2 + i
                    }

                    return (
                      <Button
                        key={pageNumber}
                        variant={currentPage === pageNumber ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNumber)}
                        className="h-8 w-8 p-0"
                      >
                        {pageNumber}
                      </Button>
                    )
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 p-0"
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Vista de cards para móviles */}
      <div className="block md:hidden space-y-4 mt-6">
        {paginatedAvances.map((avance) => {
          const shortId = generateShortId(avance.id)
          const superficieGIS = getRodalSuperficieGIS(avance.rodal, avance.ordenId)

          return (
            <Card key={avance.id} className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{shortId}</span>
                    <span className="font-medium">{avance.numeroOrden}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">{formatDateArgentina(avance.fecha)}</div>
                </div>

                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => handleEditAvance(avance)} className="h-8 w-8 p-0">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteAvance(avance)}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cuadrilla:</span>
                  <span>{getCuadrillaName(avance)}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Predio:</span>
                  <span>{capitalizeFirstLetter(avance.predio) || "Sin especificar"}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rodal:</span>
                  <div className="flex items-center gap-2">
                    <span>{capitalizeFirstLetter(avance.rodal) || "Sin especificar"}</span>
                    {avance.rodalEnsayo && (
                      <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800">
                        <TestTube className="h-3 w-3 mr-1" />
                        Ensayo
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Superficie:</span>
                  <span className="font-medium">{formatHectareas(avance.superficie)} ha</span>
                </div>

                {superficieGIS > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">GIS:</span>
                    <span>{formatHectareas(superficieGIS)} ha</span>
                  </div>
                )}

                {avance.cantidadPlantas > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Plantas:</span>
                    <span>{avance.cantidadPlantas.toLocaleString()}</span>
                  </div>
                )}

                <div className="flex justify-between items-center pt-2">
                  <span className="text-muted-foreground">Estado:</span>
                  {avance.estado === "R7 (terminado)" ? (
                    <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                      ✅ Terminado
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                      ⏳ Pendiente
                    </Badge>
                  )}
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Diálogo para registrar nuevo avance */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto z-50">
          <DialogHeader>
            <DialogTitle>Registrar Nuevo Avance</DialogTitle>
            <DialogDescription>Selecciona una orden de trabajo y completa los datos del avance.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Selector de orden */}
            <div className="space-y-2">
              <Label htmlFor="order-select">Orden de Trabajo</Label>
              <Select
                value={selectedOrderId?.toString() || ""}
                onValueChange={(value) => setSelectedOrderId(Number.parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una orden de trabajo" />
                </SelectTrigger>
                <SelectContent className="z-[60]">
                  {orders.map((order) => (
                    <SelectItem key={order.id} value={order.id.toString()}>
                      {order.numero} - {order.actividad} ({order.campo})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Formulario de avance */}
            {selectedOrder && (
              <WorkProgressForm workOrder={selectedOrder} onSubmit={handleSubmitProgress} isSubmitting={isSubmitting} />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ✅ NUEVO: Diálogo para editar avance */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Avance</DialogTitle>
            <DialogDescription>
              Modifica los datos del avance seleccionado.
              {editingAvance && ` (ID: ${generateShortId(editingAvance.id)})`}
            </DialogDescription>
          </DialogHeader>

          {editingOrder && fullEditingAvance && (
            <WorkProgressForm
              workOrder={editingOrder}
              onSubmit={handleUpdateAvance}
              isSubmitting={isUpdating}
              initialData={fullEditingAvance}
              isEditing={true}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* ✅ NUEVO: Diálogo de confirmación para eliminar */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el avance{" "}
              {deletingAvance && <span className="font-mono font-semibold">{generateShortId(deletingAvance.id)}</span>}{" "}
              de la orden {deletingAvance?.numeroOrden}.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
