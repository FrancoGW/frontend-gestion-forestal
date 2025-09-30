"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, Plus, Minus } from "lucide-react"
import type { WorkOrder } from "@/types/work-order"
import type { PodaWorkData } from "@/types/provider-work-data"
import { useActivityTemplates, type ActivityField } from "@/hooks/use-activity-templates"
import { useAuth } from "@/hooks/use-auth"
import { format, parseISO } from "date-fns"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cuadrillasAPI, avancesTrabajoAPI } from "@/lib/api-client"
import { viverosAPI, especiesAPI } from "@/lib/api-client"
import { useMalezasProductos } from "@/hooks/use-malezas-productos"
import { supervisorsAPI } from "@/lib/api-client"
import { useProviders } from "@/hooks/use-providers"

interface WorkProgressFormProps {
  workOrder: WorkOrder
  onSubmit: (data: PodaWorkData) => Promise<{ success: boolean; error?: string }>
  totalWorkedArea?: number
  getWorkedAreaForRodal?: (rodalNumero: string) => number
  isSubmitting?: boolean
  initialData?: any
  isEditing?: boolean
}

interface Cuadrilla {
  _id?: string
  id?: string
  idcuadrilla?: string
  nombre?: string
  descripcion?: string
  cod_empres?: string
  proveedorId?: string
}

// Interface para productos dinámicos con unidad de medida
interface ProductoMalezas {
  id: string
  producto: string
  cantidad: string
  unidad: string
}

// Agregar esta función al inicio del componente, después de las interfaces:
const isObjectId = (str: string): boolean => {
  return /^[0-9a-fA-F]{24}$/.test(str)
}

// Función para manejar fechas con zona horaria de Argentina
const formatDateForArgentina = (dateString: string): string => {
  try {
    // Si la fecha ya está en formato YYYY-MM-DD, usarla directamente
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return dateString
    }
    
    // Si es una fecha en otro formato, parsearla y formatearla
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      // Si no se puede parsear, usar la fecha actual
      return getCurrentDateForArgentina()
    }
    
    // Formatear la fecha usando la zona horaria local del navegador
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    
    return `${year}-${month}-${day}`
  } catch (error) {
    console.error("Error al formatear fecha:", error)
    return getCurrentDateForArgentina()
  }
}

// Función para obtener la fecha actual en formato YYYY-MM-DD para Argentina
const getCurrentDateForArgentina = (): string => {
  // Crear una fecha en la zona horaria de Argentina (UTC-3)
  const now = new Date()
  
  // Obtener la fecha actual en la zona horaria local del navegador
  const localDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  
  // Convertir a string en formato YYYY-MM-DD
  const year = localDate.getFullYear()
  const month = String(localDate.getMonth() + 1).padStart(2, '0')
  const day = String(localDate.getDate()).padStart(2, '0')
  
  return `${year}-${month}-${day}`
}

export function WorkProgressForm({
  workOrder,
  onSubmit,
  totalWorkedArea,
  getWorkedAreaForRodal,
  isSubmitting = false,
  initialData,
  isEditing = false,
}: WorkProgressFormProps) {
  const { user } = useAuth()
  const { providers } = useProviders();

  // Hook para productos de malezas - INTEGRACIÓN DINÁMICA
  const {
    productos: malezasProductos,
    loading: loadingMalezasProductos,
    error: errorMalezasProductos,
  } = useMalezasProductos()

  const [formData, setFormData] = useState<Record<string, any>>({
    fecha: getCurrentDateForArgentina(),
    rodal: "",
    superficie: "",
    cuadrilla: "",
    cuadrillaId: "",
    cantPersonal: "",
    jornada: "8",
    vivero: "",
    especie_forestal: "",
    especie: "",
    clon: "",
    observaciones: "",
    predio: workOrder?.campo || "",
    seccion: "",
    altura_poda: "",
    plantas: "",
    cantidadPlantas: "",
    rodalEnsayo: false,
    tipoCarga: "",
    cantidadBandejas: "",
    totalPlantas: "",
    rocambole: "",
    cantidadPlantines: "",
    densidad: "",
    estado: "Pendiente",
    producto: "",
    cantidad: "",
    numerosNidos: "",
    especieHormiga: "",
    subActividad: "",
    tipoAplicacion: "",
    volumenAplicado: "",
    cantidadMochilas: "",
    tipoPoda: "",
    // Campos específicos para QUEMAS CONTROLADAS
    horaR29: "",
    horaR8: "",
    horaR7: "",
    horaR28: "",
    tiempoHs: "",
    jornadaHs: "",
    comentarios: "",
    // Campos específicos para CONTROL DE REGENERACION DE PINOS
    ha: "",
    operarios: "",
    jornales: "",
    // Campos específicos para PREPARACION DE TERRENO
    jornal: "",
    // Campo implemento (compartido entre plantillas)
    implemento: "",
    // Campo Año de Plantación (para plantillas que lo requieren)
    anioPlantacion: "",
  })

  // Estado para productos dinámicos con unidad de medida
  const [productosMalezas, setProductosMalezas] = useState<ProductoMalezas[]>([
    { id: "1", producto: "", cantidad: "", unidad: "cm3" },
  ])

  const [isSubmittingForm, setIsSubmittingForm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<boolean>(false)
  const [activeTemplate, setActiveTemplate] = useState<any>(null)
  const [specificActivityName, setSpecificActivityName] = useState<string>("")

  // Estados existentes...
  const [cuadrillas, setCuadrillas] = useState<Cuadrilla[]>([])
  const [loadingCuadrillas, setLoadingCuadrillas] = useState(false)
  const [rodalProgress, setRodalProgress] = useState<Record<string, number>>({})
  const [loadingRodalProgress, setLoadingRodalProgress] = useState(false)
  const [viveros, setViveros] = useState<any[]>([])
  // especies: opciones visibles (filtradas por vivero)
  const [especies, setEspecies] = useState<any[]>([])
  // allEspecies: catálogo completo desde /api/especies
  const [allEspecies, setAllEspecies] = useState<any[]>([])
  const [clones, setClones] = useState<any[]>([])
  const [loadingPlantationData, setLoadingPlantationData] = useState(false)

  const {
    templates,
    getTemplateForWorkOrder,
    loading: templatesLoading,
    error: templatesError,
  } = useActivityTemplates()

  const hasRodales = workOrder?.rodales && workOrder.rodales.length > 0

  // Funciones para determinar tipo de plantilla - MEJORADAS PARA EVITAR CONFLICTOS
  const isPlantationTemplate = (templateName?: string) => {
    if (!templateName) return false
    const name = templateName.toLowerCase()
    return name === "plantacion"
  }

  const isPodaTemplate = (templateName?: string) => {
    if (!templateName) return false
    const name = templateName.toLowerCase()
    return name === "poda"
  }

  const isRaleoTemplate = (templateName?: string) => {
    if (!templateName) return false
    const name = templateName.toLowerCase()
    return name === "raleo"
  }

  const isControlHormigasTemplate = (templateName?: string) => {
    if (!templateName) return false
    const name = templateName.toLowerCase()
    return name === "control de hormigas"
  }

  const isControlMalezasTemplate = (templateName?: string) => {
    if (!templateName) return false
    const name = templateName.toLowerCase()
    return name === "control de malezas"
  }

  const isQuemasControladasTemplate = (templateName?: string) => {
    if (!templateName) return false
    const name = templateName.toLowerCase()
    return name === "quemas controladas"
  }

  const isControlRegeneracionTemplate = (templateName?: string) => {
    if (!templateName) return false
    const name = templateName.toLowerCase()
    return name.includes("control de regeneracion") || name.includes("regeneracion")
  }

  const isPreparacionTerrenoTemplate = (templateName?: string) => {
    if (!templateName) return false
    const name = templateName.toLowerCase()
    return name.includes("preparacion de terreno") || name.includes("taipas") || name.includes("savannagh")
  }

  // Función para calcular tiempo automáticamente
  const calcularTiempo = (r8: string, r7: string) => {
    if (!r8 || !r7) return ""

    try {
      const [h8, m8] = r8.split(":").map(Number)
      const [h7, m7] = r7.split(":").map(Number)

      const inicio = h8 * 60 + m8
      const fin = h7 * 60 + m7

      let diferencia = fin - inicio
      if (diferencia < 0) diferencia += 24 * 60 // Manejar cambio de día

      const horas = Math.floor(diferencia / 60)
      const minutos = diferencia % 60

      return (horas + minutos / 60).toFixed(2)
    } catch {
      return ""
    }
  }

  // Función para calcular jornada automáticamente
  const calcularJornada = (tiempo: string, operarios: string) => {
    if (!tiempo || !operarios) return ""

    const tiempoNum = Number.parseFloat(tiempo)
    const operariosNum = Number.parseInt(operarios)

    if (isNaN(tiempoNum) || isNaN(operariosNum)) return ""

    return (tiempoNum * operariosNum).toFixed(2)
  }

  // Funciones para manejar productos dinámicos con unidades - FIXED
  const agregarProducto = () => {
    if (productosMalezas.length < 5) {
      const nuevoId = (productosMalezas.length + 1).toString()
      setProductosMalezas([...productosMalezas, { id: nuevoId, producto: "", cantidad: "", unidad: "cm3" }])
    }
  }

  const eliminarProducto = (id: string) => {
    if (productosMalezas.length > 1) {
      setProductosMalezas(productosMalezas.filter((p) => p.id !== id))
    }
  }

  // FIXED: This was the main issue - the function wasn't updating state correctly
  const actualizarProducto = (id: string, campo: "producto" | "cantidad" | "unidad", valor: string) => {
    setProductosMalezas((prevProductos) => {
      return prevProductos.map((producto) => {
        if (producto.id === id) {
          return { ...producto, [campo]: valor }
        }
        return producto
      })
    })

    // Auto-complete unit when product is selected
    if (campo === "producto" && valor) {
      const productoSeleccionado = malezasProductos.find((p) => p.nombre === valor)
      if (productoSeleccionado && productoSeleccionado.unidadMedida) {
        setTimeout(() => {
          setProductosMalezas((prevProductos) => {
            return prevProductos.map((producto) => {
              if (producto.id === id) {
                return { ...producto, unidad: productoSeleccionado.unidadMedida! }
              }
              return producto
            })
          })
        }, 100)
      }
    }
  }

  // Cargar cuadrillas del proveedor
  useEffect(() => {
    const loadCuadrillas = async () => {
      if (!user?.providerId) {
        return
      }

      setLoadingCuadrillas(true)
      try {
        const allCuadrillas = await cuadrillasAPI.getAll()

        if (Array.isArray(allCuadrillas)) {
          const providerCuadrillas = allCuadrillas.filter((cuadrilla: Cuadrilla) => {
            const proveedorId = cuadrilla.proveedorId || cuadrilla.cod_empres
            const cuadrillaProviderId = String(proveedorId)
            const currentProviderId = String(user.providerId)
            return cuadrillaProviderId === currentProviderId
          })

          setCuadrillas(providerCuadrillas)
        } else {
          setCuadrillas([])
        }
      } catch (error) {
        console.error("❌ Error al cargar cuadrillas:", error)
        setCuadrillas([])
      } finally {
        setLoadingCuadrillas(false)
      }
    }

    loadCuadrillas()
  }, [user])

  // Cargar avances por rodal para validar superficie disponible
  useEffect(() => {
    const loadRodalProgress = async () => {
      if (!workOrder || !hasRodales) return

      setLoadingRodalProgress(true)
      try {
        const allProgress = await avancesTrabajoAPI.getByOrderId(workOrder.id)
        const progressByRodal: Record<string, number> = {}

        if (Array.isArray(allProgress)) {
          allProgress.forEach((avance) => {
            if (isEditing && initialData && avance._id === initialData.id) {
              return
            }

            const rodalId = avance.rodal || ""
            const superficie = Number(avance.superficie || 0)

            if (rodalId && superficie > 0) {
              progressByRodal[rodalId] = (progressByRodal[rodalId] || 0) + superficie
            }
          })
        }

        setRodalProgress(progressByRodal)
      } catch (error) {
        setRodalProgress({})
      } finally {
        setLoadingRodalProgress(false)
      }
    }

    loadRodalProgress()
  }, [workOrder, hasRodales, isEditing, initialData])

  // Cargar datos de plantación (viveros, especies, clones)
  useEffect(() => {
    const loadPlantationData = async () => {
      setLoadingPlantationData(true)

      try {
        const especiesResp = await especiesAPI.getAll()
        const viverosResp = await viverosAPI.getAll()

        const viverosData = viverosResp?.data ?? (Array.isArray(viverosResp) ? viverosResp : [])
        const especiesData = especiesResp?.data ?? (Array.isArray(especiesResp) ? especiesResp : [])

        setViveros(Array.isArray(viverosData) ? viverosData : [])
        setAllEspecies(Array.isArray(especiesData) ? especiesData : [])
        setEspecies([])
        setClones([]) // Los clones se cargarán dinámicamente cuando se seleccione un vivero
      } catch (error) {
        setViveros([])
        setEspecies([])
        setClones([])
      } finally {
        setLoadingPlantationData(false)
      }
    }

    loadPlantationData()
  }, [activeTemplate, workOrder?.id, workOrder?.campo])

  // Función para obtener especies de un vivero específico
  const getEspeciesDelVivero = (viveroId: string) => {
    if (!viveroId || !viveros.length) return []
    
    const vivero = viveros.find(v => (v._id || v.id) === viveroId)
    if (!vivero || !vivero.especies) return []
    
    // Filtrar especies que existen en la colección de especies
    const especiesExistentes = (allEspecies || []).filter(especie => 
      vivero.especies.includes(especie._id || especie.id)
    )
    
    // Agregar especies de texto personalizado
    const especiesTexto = vivero.especies.filter(especie => 
      !(allEspecies || []).some(e => (e._id || e.id) === especie)
    )
    
    return [...especiesExistentes, ...especiesTexto.map(texto => ({ 
      _id: texto, 
      especie: texto, 
      nombre: texto 
    }))]
  }

  // Función para obtener clones de un vivero específico
  const getClonesDelVivero = (viveroId: string) => {
    if (!viveroId || !viveros.length) return []
    
    const vivero = viveros.find(v => (v._id || v.id) === viveroId)
    if (!vivero || !vivero.clones) return []
    
    return vivero.clones.filter(clon => clon.activo !== false)
  }

  // Cargar plantilla y inicializar campos dinámicos
  useEffect(() => {
    if (
      workOrder &&
      getTemplateForWorkOrder &&
      !templatesLoading &&
      templates &&
      templates.length > 0 &&
      !activeTemplate
    ) {
      try {
        const result = getTemplateForWorkOrder(workOrder)
        // LOG DETALLADO DE PLANTILLA
        console.log("[PLANTILLA][DEBUG] workOrder:", workOrder)
        console.log("[PLANTILLA][DEBUG] Resultado getTemplateForWorkOrder:", result)
        console.log("[PLANTILLA][DEBUG] Plantillas cargadas:", templates)
        // Buscar si la plantilla viene de DEFAULT_TEMPLATES o de localStorage custom
        const isDefault = Array.isArray(templates) && templates.some(t => t.id === result?.template?.id && t === result.template)
        if (result.template) {
          console.log(`[PLANTILLA][DEBUG] Origen de la plantilla '${result.template?.nombre}':`, isDefault ? 'DEFAULT_TEMPLATES (código)' : 'localStorage/custom')
        } else {
          console.log("[PLANTILLA][DEBUG] No se encontró plantilla para la orden.")
        }

        if (result.template) {
          setActiveTemplate(result.template)
          setSpecificActivityName(result.specificActivityName)

          if (!isEditing) {
            const initialFormData: Record<string, any> = {
              fecha: getCurrentDateForArgentina(),
              rodal: "",
              superficie: "",
              cuadrilla: "",
              cuadrillaId: "",
              cantPersonal: "",
              jornada: "8",
              vivero: "",
              especie_forestal: "",
              especie: "",
              clon: "",
              observaciones: "",
              predio: workOrder.campo || "",
              seccion: "",
              altura_poda: "",
              plantas: "",
              cantidadPlantas: "",
              rodalEnsayo: false,
              tipoCarga: "",
              cantidadBandejas: "",
              totalPlantas: "",
              rocambole: "",
              cantidadPlantines: "",
              densidad: "",
              estado: "Pendiente",
              producto: "",
              cantidad: "",
              numerosNidos: "",
              especieHormiga: "",
              subActividad: "",
              tipoAplicacion: "",
              volumenAplicado: "",
              cantidadMochilas: "",
              tipoPoda: "",
                  // Campos específicos para QUEMAS CONTROLADAS
              horaR29: "",
              horaR8: "",
              horaR7: "",
              horaR28: "",
              tiempoHs: "",
              jornadaHs: "",
              comentarios: "",
              // Campos específicos para CONTROL DE REGENERACION DE PINOS
              ha: "",
              operarios: "",
              jornales: "",
              implemento: "",
            }

            result.template.campos.forEach((campo: ActivityField) => {
              // Solo asignar valor si no existe ya un valor por defecto
              if (initialFormData[campo.id] === undefined || initialFormData[campo.id] === "") {
                switch (campo.tipo) {
                  case "numero":
                    initialFormData[campo.id] = ""
                    break
                  case "fecha":
                    initialFormData[campo.id] = getCurrentDateForArgentina()
                    break
                  case "seleccion":
                    if (campo.id === "rodal" && hasRodales) {
                      initialFormData[campo.id] = String(workOrder.rodales[0]?.numero || "")
                    } else if (campo.id === "estado") {
                      initialFormData[campo.id] = "Pendiente"
                    } else {
                      initialFormData[campo.id] = ""
                    }
                    break
                  case "texto":
                    if (campo.id === "predio") {
                      initialFormData[campo.id] = workOrder.campo || ""
                    } else {
                      initialFormData[campo.id] = ""
                    }
                    break
                  default:
                    initialFormData[campo.id] = ""
                }
              }
            })

            setFormData(initialFormData)
          }
        } else {
          setActiveTemplate(null)
          setSpecificActivityName(workOrder.actividad)
        }
      } catch (error) {
        console.error("❌ Error al cargar plantilla:", error)
        setActiveTemplate(null)
        setSpecificActivityName(workOrder.actividad)
      }
    }
  }, [
    workOrder?.numero,
    workOrder?.actividad,
    templatesLoading,
    templates,
    activeTemplate,
    getTemplateForWorkOrder,
    hasRodales,
    workOrder,
    isEditing,
  ])

  // ✅ CORREGIDO: Inicializar datos para edición - MEJORADO PARA RESOLVER IDs CORRECTAMENTE
  useEffect(() => {
    if (
      isEditing &&
      initialData &&
      activeTemplate &&
      cuadrillas.length > 0 &&
      viveros.length > 0 &&
      especies.length > 0 &&
      clones.length > 0
    ) {

      const editFormData: Record<string, any> = {
        fecha: (() => {
          if (!initialData.fecha) return getCurrentDateForArgentina()

          // Si la fecha ya está en formato YYYY-MM-DD, usarla directamente
          if (typeof initialData.fecha === "string" && initialData.fecha.match(/^\d{4}-\d{2}-\d{2}$/)) {
            return initialData.fecha
          }

          // Si la fecha está en otro formato, intentar convertirla
          try {
            const date = new Date(initialData.fecha)
            if (!isNaN(date.getTime())) {
              return format(date, "yyyy-MM-dd")
            }
          } catch (error) {
            console.error("Error al parsear fecha:", error)
          }

          // Como fallback, usar fecha actual
          return getCurrentDateForArgentina()
        })(),
        rodal: String(initialData.rodal || ""),
        superficie: String(initialData.superficie || ""),
        cuadrilla: initialData.cuadrilla || "",
        cuadrillaId: initialData.cuadrillaId || "",
        cantPersonal: String(initialData.cantPersonal || ""),
        jornada: String(initialData.jornada || "8"),

        // ✅ CORREGIDO: Resolver vivero correctamente
        vivero: (() => {
          const viveroId = initialData.vivero || initialData.viveroId || ""
          if (!viveroId) return ""


          // Buscar el vivero por ID
          const vivero = viveros.find((v) => {
            const id = String(v._id || v.id || "")
            const match = id === String(viveroId)
            return match
          })

          if (vivero) {
            const viveroIdToUse = String(vivero._id || vivero.id)
            return viveroIdToUse
          } else {
            // Si no se encuentra, intentar buscar por nombre
            const viveroByName = viveros.find((v) => {
              const nombre = v.nombre || v.descripcion || v.vivero || ""
              return nombre.toLowerCase() === String(viveroId).toLowerCase()
            })
            if (viveroByName) {
             
              return String(viveroByName._id || viveroByName.id)
            }
            return ""
          }
        })(),

        // ✅ CORREGIDO: Resolver especie forestal correctamente
        especie_forestal: (() => {
          const especieId = initialData.especie_forestal || initialData.especie || ""
          if (!especieId) return ""


          // Buscar la especie por ID
          const especie = especies.find((e) => {
            const id = String(e._id || e.id || "")
            const match = id === String(especieId)
            return match
          })

          if (especie) {
            const especieIdToUse = String(especie._id || especie.id)
            return especieIdToUse
          } else {
            // Si no se encuentra, intentar buscar por nombre
            const especieByName = especies.find((e) => {
              const nombre = e.especie || e.nombre || ""
              return nombre.toLowerCase() === String(especieId).toLowerCase()
            })
            if (especieByName) {
              return String(especieByName._id || especieByName.id)
            }
            return ""
          }
        })(),

        especie: initialData.especie || "",

        // ✅ CORREGIDO: Resolver clon correctamente
        clon: (() => {
          const clonId = initialData.clon || initialData.clonId || initialData.codigo_clon || ""
          if (!clonId) return ""

         

          // Buscar el clon por ID exacto
          const clonPorId = clones.find((c) => {
            const id = String(c._id || c.id || "")
            const match = id === String(clonId)
           
            return match
          })

          if (clonPorId) {
            const clonIdToUse = String(clonPorId._id || clonPorId.id)
           
            return clonIdToUse
          }

          // Si no se encuentra por ID, buscar por código
          const clonPorCodigo = clones.find((c) => {
            const codigo = c.codigo || c.codigoClon || c.nombre || c.clon || ""
            const match = codigo.toLowerCase() === String(clonId).toLowerCase()
           
            return match
          })

          if (clonPorCodigo) {
           
            return String(clonPorCodigo._id || clonPorCodigo.id)
          }

         
          return ""
        })(),

        observaciones: initialData.observaciones || "",
        predio: initialData.predio || workOrder?.campo || "",
        seccion: initialData.seccion || "",
        altura_poda: String(initialData.altura_poda || ""),
        plantas: String(initialData.plantas || initialData.cantidadPlantas || ""),
        cantidadPlantas: String(initialData.cantidadPlantas || ""),
        rodalEnsayo: initialData.rodalEnsayo || false,
        tipoCarga: initialData.tipoCarga || "",
        cantidadBandejas: String(initialData.cantidadBandejas || ""),
        totalPlantas: String(initialData.totalPlantas || ""),
        rocambole: "",
        cantidadPlantines: String(initialData.cantidadPlantines || ""),
        densidad: String(initialData.densidad || ""),
        estado: initialData.estado || "Pendiente",
        producto: initialData.producto || "",
        cantidad: String(initialData.cantidad || ""),
        numerosNidos: String(initialData.numerosNidos || ""),
        especieHormiga: initialData.especieHormiga || "",
        subActividad: initialData.subActividad || "",
        tipoAplicacion: initialData.tipoAplicacion || "",
        volumenAplicado: String(initialData.volumenAplicado || ""),
        cantidadMochilas: String(initialData.cantidadMochilas || ""),
        tipoPoda: initialData.tipoPoda || "",
        // Campos específicos para QUEMAS CONTROLADAS
  
        horaR29: initialData.horaR29 || "",
        horaR8: initialData.horaR8 || "",
        horaR7: initialData.horaR7 || "",
        horaR28: initialData.horaR28 || "",
        tiempoHs: String(initialData.tiempoHs || ""),
        jornadaHs: String(initialData.jornadaHs || ""),
        comentarios: initialData.comentarios || "",
        // Campos específicos para CONTROL DE REGENERACION DE PINOS
        ha: String(initialData.ha || initialData.superficie || ""),
        operarios: String(initialData.operarios || ""),
        jornales: String(initialData.jornales || ""),
        implemento: initialData.implemento || "",
      }

      // ✅ CORREGIR: Resolver el nombre de la cuadrilla correctamente
      const cuadrillaIdFromData = initialData.cuadrillaId || initialData.cuadrilla
      if (cuadrillaIdFromData) {
        // Buscar la cuadrilla en la lista cargada
        const cuadrillaEncontrada = cuadrillas.find((c) => {
          const id = c._id || c.id || c.idcuadrilla || ""
          return String(id) === String(cuadrillaIdFromData)
        })

        if (cuadrillaEncontrada) {
          const nombreCuadrilla =
            cuadrillaEncontrada.nombre || cuadrillaEncontrada.descripcion || `Cuadrilla ${cuadrillaIdFromData}`
          editFormData.cuadrillaId = String(cuadrillaIdFromData)
          editFormData.cuadrilla = nombreCuadrilla
         
        } else {
          // Si no se encuentra la cuadrilla, intentar usar el valor como nombre directamente
          if (typeof cuadrillaIdFromData === "string" && !cuadrillaIdFromData.match(/^[0-9a-fA-F]{24}$/)) {
            // Si no es un ObjectId, probablemente ya es un nombre
            editFormData.cuadrilla = cuadrillaIdFromData
            editFormData.cuadrillaId = ""
          } else {
           
            editFormData.cuadrillaId = String(cuadrillaIdFromData)
            editFormData.cuadrilla = `Cuadrilla ${String(cuadrillaIdFromData).substring(0, 8)}...`
          }
        }
      }

      // Agregar campos dinámicos del initialData
      Object.keys(initialData).forEach((key) => {
        if (key.startsWith("field-") && !editFormData[key]) {
          editFormData[key] = initialData[key]
        }
      })

      
      setFormData(editFormData)

      // Inicializar productos para control de malezas si existen
      if (initialData.productos && Array.isArray(initialData.productos)) {
        const productosFormateados = initialData.productos.map((p, index) => ({
          id: String(index + 1),
          producto: p.producto || "",
          cantidad: String(p.cantidad || ""),
          unidad: p.unidad || "cm3",
        }))
        setProductosMalezas(
          productosFormateados.length > 0
            ? productosFormateados
            : [{ id: "1", producto: "", cantidad: "", unidad: "cm3" }],
        )
      }
    }
  }, [isEditing, initialData, activeTemplate, workOrder?.campo, cuadrillas, viveros, clones, especies])

  // Renderizar formulario específico para QUEMAS CONTROLADAS
  const renderQuemasControladasForm = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Estado del Trabajo */}
        <div className="col-span-2 space-y-2 p-4 bg-orange-50 border border-orange-200 rounded-md">
          <Label htmlFor="estado-trabajo" className="text-lg font-semibold text-orange-800">
            Estado del Trabajo <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.estado || "Pendiente"}
            onValueChange={(newValue) => handleInputChange("estado", newValue)}
          >
            <SelectTrigger id="estado-trabajo" className="h-12 text-base">
              <SelectValue placeholder="Seleccionar estado del trabajo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Pendiente">Pendiente</SelectItem>
              <SelectItem value="R7 (terminado)">R7 (terminado)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Fecha */}
        <div className="space-y-2">
          <Label htmlFor="fecha">
            Fecha <span className="text-red-500">*</span>
          </Label>
          <Input
            id="fecha"
            type="date"
            value={formData.fecha || ""}
            onChange={(e) => handleInputChange("fecha", e.target.value)}
            required={true}
          />
        </div>

        {/* Rodal */}
        <div className="space-y-2">
          <Label htmlFor="rodal">
            Rodal <span className="text-red-500">*</span>
          </Label>
          <Select value={formData.rodal || ""} onValueChange={(newValue) => handleInputChange("rodal", newValue)}>
            <SelectTrigger id="rodal">
              <SelectValue placeholder="Seleccionar rodal" />
            </SelectTrigger>
            <SelectContent>
              {hasRodales ? (
                workOrder.rodales.map((rodal) => (
                  <SelectItem key={rodal.numero} value={String(rodal.numero)}>
                    #{rodal.numero} - Total: {rodal.hectareas} ha
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="sin-rodales">Sin rodales</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Predio/Campo */}
        <div className="space-y-2">
          <Label htmlFor="predio">
            Predio/Campo <span className="text-red-500">*</span>
          </Label>
          <Input
            id="predio"
            type="text"
            value={workOrder?.campo || ""}
            readOnly
            disabled
            className="bg-gray-100 cursor-not-allowed"
          />
        </div>

        {/* Cuadrilla */}
        <div className="space-y-2">
          <Label htmlFor="cuadrilla">
            Cuadrilla <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.cuadrilla || ""}
            onValueChange={(newValue) => {
              // Buscar la cuadrilla por nombre o por ID
              let cuadrillaSeleccionada = cuadrillas.find((c) => {
                const nombre = c.nombre || c.descripcion || ""
                return nombre === newValue
              })
              // Si no se encuentra por nombre, buscar por ID (por si acaso)
              if (!cuadrillaSeleccionada) {
                cuadrillaSeleccionada = cuadrillas.find((c) => {
                  const id = c._id || c.id || c.idcuadrilla || ""
                  return id === newValue
                })
              }
              if (cuadrillaSeleccionada) {
                const id = cuadrillaSeleccionada._id || cuadrillaSeleccionada.id || cuadrillaSeleccionada.idcuadrilla || ""
                const nombre = cuadrillaSeleccionada.nombre || cuadrillaSeleccionada.descripcion || `Cuadrilla ${id}`
                handleInputChange("cuadrillaId", String(id))
                handleInputChange("cuadrilla", nombre)
              } else {
                // Si no se encuentra, limpiar ambos campos
                handleInputChange("cuadrillaId", "")
                handleInputChange("cuadrilla", "")
              }
            }}
          >
            <SelectTrigger id="cuadrilla">
              <SelectValue placeholder="Seleccionar cuadrilla" />
            </SelectTrigger>
            <SelectContent>
              {cuadrillas.map((cuadrilla) => {
                const id = cuadrilla._id || cuadrilla.id || cuadrilla.idcuadrilla || ""
                const nombre = cuadrilla.nombre || cuadrilla.descripcion || `Cuadrilla ${id}`
                if (!id) return null
                return (
                  <SelectItem key={id} value={nombre}>
                    {nombre}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Superficie */}
        <div className="space-y-2">
          <Label htmlFor="superficie">
            Superficie (Ha) <span className="text-red-500">*</span>
          </Label>
          <Input
            id="superficie"
            type="number"
            step="0.0001"
            min="0"
            value={formData.superficie || ""}
            onChange={(e) => handleInputChange("superficie", e.target.value)}
            placeholder="Superficie a quemar"
            required={true}
          />
        </div>



        {/* Cantidad de Personal */}
        <div className="space-y-2">
          <Label htmlFor="cantPersonal">
            Cantidad de Personal <span className="text-red-500">*</span>
          </Label>
          <Input
            id="cantPersonal"
            type="number"
            min="1"
            value={formData.cantPersonal || ""}
            onChange={(e) => handleInputChange("cantPersonal", e.target.value)}
            placeholder="Número de personal"
            required={true}
          />
        </div>

        {/* Jornada */}
        <div className="space-y-2">
          <Label htmlFor="jornada">
            Jornada (hs) <span className="text-red-500">*</span>
          </Label>
          <Input
            id="jornada"
            type="number"
            min="1"
            max="24"
            value={formData.jornada || ""}
            onChange={(e) => handleInputChange("jornada", e.target.value)}
            required={true}
          />
        </div>

        {/* Horarios - Sección especial */}
        <div className="col-span-2 space-y-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <Label className="text-lg font-semibold text-blue-800">
            Horarios de Trabajo <span className="text-red-500">*</span>
          </Label>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* R29 */}
            <div className="space-y-2">
              <Label htmlFor="horaR29">
                R29 - Salida hacia Actividad <span className="text-red-500">*</span>
              </Label>
              <Input
                id="horaR29"
                type="text"
                value={formData.horaR29 || ""}
                onChange={(e) => handleInputChange("horaR29", e.target.value)}
                placeholder="HH:MM"
                pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$"
                required={true}
              />
            </div>

            {/* R8 */}
            <div className="space-y-2">
              <Label htmlFor="horaR8">
                R8 - Inicio Actividad <span className="text-red-500">*</span>
              </Label>
              <Input
                id="horaR8"
                type="text"
                value={formData.horaR8 || ""}
                onChange={(e) => {
                  handleInputChange("horaR8", e.target.value)
                  // Recalcular tiempo automáticamente
                  const tiempo = calcularTiempo(e.target.value, formData.horaR7)
                  if (tiempo) {
                    handleInputChange("tiempoHs", tiempo)
                    // Recalcular jornada si hay personal
                    if (formData.cantPersonal) {
                      const jornada = calcularJornada(tiempo, formData.cantPersonal)
                      handleInputChange("jornadaHs", jornada)
                    }
                  }
                }}
                placeholder="HH:MM"
                pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$"
                required={true}
              />
            </div>

            {/* R7 */}
            <div className="space-y-2">
              <Label htmlFor="horaR7">
                R7 - Término Actividad <span className="text-red-500">*</span>
              </Label>
              <Input
                id="horaR7"
                type="text"
                value={formData.horaR7 || ""}
                onChange={(e) => {
                  handleInputChange("horaR7", e.target.value)
                  // Recalcular tiempo automáticamente
                  const tiempo = calcularTiempo(formData.horaR8, e.target.value)
                  if (tiempo) {
                    handleInputChange("tiempoHs", tiempo)
                    // Recalcular jornada si hay personal
                    if (formData.cantPersonal) {
                      const jornada = calcularJornada(tiempo, formData.cantPersonal)
                      handleInputChange("jornadaHs", jornada)
                    }
                  }
                }}
                placeholder="HH:MM"
                pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$"
                required={true}
              />
            </div>

            {/* R28 */}
            <div className="space-y-2">
              <Label htmlFor="horaR28">
                R28 - Regreso a Base <span className="text-red-500">*</span>
              </Label>
              <Input
                id="horaR28"
                type="text"
                value={formData.horaR28 || ""}
                onChange={(e) => handleInputChange("horaR28", e.target.value)}
                placeholder="HH:MM"
                pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$"
                required={true}
              />
            </div>
          </div>

          <div className="text-sm text-blue-700">
            <p>
              💡 <strong>Referencia de horarios:</strong>
            </p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>
                <strong>R29:</strong> Hora de salida hacia la actividad
              </li>
              <li>
                <strong>R8:</strong> Hora de inicio de la actividad
              </li>
              <li>
                <strong>R7:</strong> Hora de término de la actividad
              </li>
              <li>
                <strong>R28:</strong> Hora de regreso a base
              </li>
            </ul>
          </div>
        </div>

        {/* Campos calculados */}
        <div className="space-y-2">
          <Label htmlFor="tiempoHs">
            Tiempo (hs) <span className="text-sm text-gray-500">(Calculado automáticamente)</span>
          </Label>
          <Input
            id="tiempoHs"
            type="number"
            step="0.01"
            value={formData.tiempoHs || ""}
            readOnly
            disabled
            className="bg-gray-100 cursor-not-allowed"
            placeholder="Se calcula automáticamente (R8-R7)"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="jornadaHs">
            Jornada (hs) <span className="text-sm text-gray-500">(Calculado automáticamente)</span>
          </Label>
          <Input
            id="jornadaHs"
            type="number"
            step="0.01"
            value={formData.jornadaHs || ""}
            readOnly
            disabled
            className="bg-gray-100 cursor-not-allowed"
            placeholder="Se calcula automáticamente (Tiempo × Operarios)"
          />
        </div>

        {/* Comentarios */}
        <div className="col-span-2 space-y-2">
          <Label htmlFor="comentarios">Comentarios</Label>
          <Textarea
            id="comentarios"
            value={formData.comentarios || ""}
            onChange={(e) => handleInputChange("comentarios", e.target.value)}
            placeholder="Comentarios y observaciones sobre la quema controlada"
            className="min-h-[100px]"
          />
        </div>
      </div>
    )
  }

  // Renderizar formulario específico para PODA
  const renderPodaForm = () => {
    // Calcular superficie automáticamente basándose en densidad y plantas para PODA
    const calcularSuperficiePoda = () => {
      const densidadRaw = formData.densidad || 0
      const plantasRaw = formData.cantidadPlantas || 0
      
      const densidad = Number(densidadRaw)
      const plantas = Number(plantasRaw)

      console.log("[CÁLCULO PODA] Valores raw:", { densidadRaw, plantasRaw })
      console.log("[CÁLCULO PODA] Valores convertidos:", { densidad, plantas })
      console.log("[CÁLCULO PODA] Tipos:", { 
        densidadType: typeof densidad, 
        plantasType: typeof plantas,
        densidadIsNaN: isNaN(densidad),
        plantasIsNaN: isNaN(plantas)
      })

      if (densidad > 0 && plantas > 0 && !isNaN(densidad) && !isNaN(plantas)) {
        const superficie = plantas / densidad
        console.log("[CÁLCULO PODA] Cálculo:", `${plantas} ÷ ${densidad} = ${superficie}`)
        console.log("[CÁLCULO PODA] Resultado:", { 
          plantas, 
          densidad, 
          superficie, 
          superficieFormateada: superficie.toFixed(4),
          superficieRedondeada: Math.round(superficie * 10000) / 10000
        })
        
        // Validación adicional para evitar valores incorrectos
        if (superficie > 1000) {
          console.warn("[CÁLCULO PODA] ⚠️ Superficie muy alta detectada:", superficie)
        }
        
        // Verificar si el resultado es razonable (entre 0.1 y 1000 ha)
        if (superficie < 0.1) {
          console.warn("[CÁLCULO PODA] ⚠️ Superficie muy baja detectada:", superficie)
        }
        
        const superficieFinal = superficie.toFixed(4)
        console.log("[CÁLCULO PODA] Valor final a guardar:", superficieFinal)
        handleInputChange("superficie", superficieFinal)
      } else {
        console.log("[CÁLCULO PODA] Valores inválidos para cálculo:", { 
          densidad, 
          plantas, 
          densidadValida: densidad > 0 && !isNaN(densidad),
          plantasValidas: plantas > 0 && !isNaN(plantas)
        })
      }
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Estado del Trabajo */}
        <div className="col-span-2 space-y-2 p-4 bg-green-50 border border-green-200 rounded-md">
          <Label htmlFor="estado-trabajo" className="text-lg font-semibold text-green-800">
            Estado del Trabajo <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.estado || "Pendiente"}
            onValueChange={(newValue) => handleInputChange("estado", newValue)}
          >
            <SelectTrigger id="estado-trabajo" className="h-12 text-base">
              <SelectValue placeholder="Seleccionar estado del trabajo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Pendiente">Pendiente</SelectItem>
              <SelectItem value="R7 (terminado)">R7 (terminado)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Densidad - Campo prominente como en la imagen antigua */}
        <div className="col-span-2 space-y-2 p-4 bg-purple-50 border border-purple-200 rounded-md">
          <Label htmlFor="densidad" className="text-lg font-semibold text-purple-800">
            Densidad <span className="text-red-500">*</span> <span className="text-sm">(plantas por hectárea)</span>
          </Label>
          <Input
            id="densidad"
            type="number"
            min="1"
            value={formData.densidad || ""}
            onChange={(e) => {
              handleInputChange("densidad", e.target.value)
            }}
            onBlur={() => {
              // Calcular superficie automáticamente cuando se completa la entrada
              setTimeout(calcularSuperficiePoda, 100)
            }}
            placeholder="Ej: 1111 plantas/ha"
            required={true}
          />
          <div className="flex items-center gap-2 text-sm text-purple-700">
            <span>💡</span>
            <span>Ingrese la densidad de plantación específica para este período</span>
          </div>
          <p className="text-xs text-purple-600">
            Esta densidad se usará para calcular automáticamente las hectáreas basándose en la cantidad de plantas
          </p>
        </div>

        {/* Fecha */}
        <div className="space-y-2">
          <Label htmlFor="fecha">
            Fecha <span className="text-red-500">*</span>
          </Label>
          <Input
            id="fecha"
            type="date"
            value={formData.fecha || ""}
            onChange={(e) => handleInputChange("fecha", e.target.value)}
            required={true}
          />
        </div>

        {/* Tipo de Poda */}
        <div className="space-y-2">
          <Label htmlFor="tipoPoda">
            Tipo de Poda <span className="text-red-500">*</span>
          </Label>
          <Select value={formData.tipoPoda || ""} onValueChange={(newValue) => handleInputChange("tipoPoda", newValue)}>
            <SelectTrigger id="tipoPoda">
              <SelectValue placeholder="Seleccionar tipo de poda" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Primera poda">Primera poda</SelectItem>
              <SelectItem value="Segunda poda">Segunda poda</SelectItem>
              <SelectItem value="Tercera poda">Tercera poda</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Rodal */}
        <div className="space-y-2">
          <Label htmlFor="rodal">
            Rodal <span className="text-red-500">*</span>
          </Label>
          <Select value={formData.rodal || ""} onValueChange={(newValue) => handleInputChange("rodal", newValue)}>
            <SelectTrigger id="rodal">
              <SelectValue placeholder="Seleccionar rodal" />
            </SelectTrigger>
            <SelectContent>
              {hasRodales ? (
                workOrder.rodales.map((rodal) => (
                  <SelectItem key={rodal.numero} value={String(rodal.numero)}>
                    #{rodal.numero} - Total: {rodal.hectareas} ha
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="sin-rodales">Sin rodales</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Predio/Campo */}
        <div className="space-y-2">
          <Label htmlFor="predio">
            Predio/Campo <span className="text-red-500">*</span>
          </Label>
          <Input
            id="predio"
            type="text"
            value={workOrder?.campo || ""}
            readOnly
            disabled
            className="bg-gray-100 cursor-not-allowed"
          />
        </div>

        {/* Cuadrilla */}
        <div className="space-y-2">
          <Label htmlFor="cuadrilla">
            Cuadrilla <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.cuadrilla || ""}
            onValueChange={(newValue) => {
              // Buscar la cuadrilla por nombre o por ID
              let cuadrillaSeleccionada = cuadrillas.find((c) => {
                const nombre = c.nombre || c.descripcion || ""
                return nombre === newValue
              })
              // Si no se encuentra por nombre, buscar por ID (por si acaso)
              if (!cuadrillaSeleccionada) {
                cuadrillaSeleccionada = cuadrillas.find((c) => {
                  const id = c._id || c.id || c.idcuadrilla || ""
                  return id === newValue
                })
              }
              if (cuadrillaSeleccionada) {
                const id = cuadrillaSeleccionada._id || cuadrillaSeleccionada.id || cuadrillaSeleccionada.idcuadrilla || ""
                const nombre = cuadrillaSeleccionada.nombre || cuadrillaSeleccionada.descripcion || `Cuadrilla ${id}`
                handleInputChange("cuadrillaId", String(id))
                handleInputChange("cuadrilla", nombre)
              } else {
                // Si no se encuentra, limpiar ambos campos
                handleInputChange("cuadrillaId", "")
                handleInputChange("cuadrilla", "")
              }
            }}
          >
            <SelectTrigger id="cuadrilla">
              <SelectValue placeholder="Seleccionar cuadrilla" />
            </SelectTrigger>
            <SelectContent>
              {cuadrillas.map((cuadrilla) => {
                const id = cuadrilla._id || cuadrilla.id || cuadrilla.idcuadrilla || ""
                const nombre = cuadrilla.nombre || cuadrilla.descripcion || `Cuadrilla ${id}`
                if (!id) return null
                return (
                  <SelectItem key={id} value={nombre}>
                    {nombre}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Cantidad de Personal */}
        <div className="space-y-2">
          <Label htmlFor="cantPersonal">
            Cantidad de Personal <span className="text-red-500">*</span>
          </Label>
          <Input
            id="cantPersonal"
            type="number"
            min="1"
            value={formData.cantPersonal || ""}
            onChange={(e) => handleInputChange("cantPersonal", e.target.value)}
            required={true}
          />
        </div>

        {/* Jornada */}
        <div className="space-y-2">
          <Label htmlFor="jornada">
            Jornada (hs) <span className="text-red-500">*</span>
          </Label>
          <Input
            id="jornada"
            type="number"
            min="1"
            max="24"
            value={formData.jornada || ""}
            onChange={(e) => handleInputChange("jornada", e.target.value)}
            required={true}
          />
        </div>

        {/* Cantidad de Plantas */}
        <div className="space-y-2">
          <Label htmlFor="cantidadPlantas">
            Cantidad de Plantas <span className="text-red-500">*</span>
          </Label>
          <Input
            id="cantidadPlantas"
            type="number"
            min="1"
            value={formData.cantidadPlantas || ""}
            onChange={(e) => {
              handleInputChange("cantidadPlantas", e.target.value)
              // Solo calcular cuando el valor esté completo (no en cada dígito)
              const valor = e.target.value
              if (valor && valor.length > 0 && !valor.includes("e")) {
                // Usar onBlur en lugar de setTimeout para evitar cálculos intermedios
              }
            }}
            onBlur={() => {
              // Calcular superficie solo cuando se completa la entrada
              setTimeout(calcularSuperficiePoda, 100)
            }}
            placeholder="Número de plantas podadas"
            required={true}
          />
        </div>

        {/* Superficie (calculada automáticamente) */}
        <div className="space-y-2">
          <Label htmlFor="superficie">
            Superficie (Ha) <span className="text-red-500">*</span>
          </Label>
          <Input
            id="superficie"
            type="number"
            step="0.0001"
            min="0"
            value={formData.superficie || ""}
            onChange={(e) => handleInputChange("superficie", e.target.value)}
            placeholder="Se calcula automáticamente (plantas ÷ densidad)"
            required={true}
          />
          <p className="text-xs text-muted-foreground">
            💡 La superficie se calcula automáticamente: Cantidad de plantas ÷ Densidad
          </p>
        </div>

        {/* Altura de Poda */}
        <div className="space-y-2">
          <Label htmlFor="altura_poda">
            Altura de Poda (m) <span className="text-red-500">*</span>
          </Label>
          <Input
            id="altura_poda"
            type="number"
            step="0.1"
            min="0"
            value={formData.altura_poda || ""}
            onChange={(e) => handleInputChange("altura_poda", e.target.value)}
            placeholder="Altura de poda en metros"
            required={true}
          />
        </div>

        {/* Año de Plantación */}
        <div className="space-y-2">
          <Label htmlFor="anioPlantacion">
            Año de Plantación <span className="text-red-500">*</span>
          </Label>
          <Input
            id="anioPlantacion"
            type="number"
            min="1900"
            max="2030"
            value={formData.anioPlantacion || ""}
            onChange={(e) => handleInputChange("anioPlantacion", e.target.value)}
            placeholder="Ej: 2020, 2021, 2022"
            required={true}
          />
          <p className="text-xs text-muted-foreground">
            💡 Año en que se realizó la plantación del rodal
          </p>
        </div>

        {/* Observaciones */}
        <div className="col-span-2 space-y-2">
          <Label htmlFor="observaciones">Observaciones</Label>
          <Textarea
            id="observaciones"
            value={formData.observaciones || ""}
            onChange={(e) => handleInputChange("observaciones", e.target.value)}
            placeholder="Observaciones sobre la poda realizada"
            className="min-h-[100px]"
          />
        </div>
      </div>
    )

   
  }

  // Renderizar formulario específico para PLANTACIÓN con funcionalidad dinámica mejorada
  const renderPlantacionForm = () => {
    // Calcular superficie automáticamente basándose en densidad y plantas
    const calcularSuperficie = () => {
      const densidad = Number(formData.densidad || 0)
      let totalPlantas = 0

      if (formData.tipoCarga === "Bandejas") {
        totalPlantas = Number(formData.totalPlantas || 0)
      } else if (formData.tipoCarga === "Rocambole") {
        totalPlantas = Number(formData.cantidadPlantines || 0)
      }

      console.log("[CÁLCULO PLANTACIÓN] Valores de entrada:", { 
        densidad, 
        totalPlantas, 
        tipoCarga: formData.tipoCarga,
        bandejas: formData.cantidadBandejas,
        plantines: formData.cantidadPlantines 
      })

      if (densidad > 0 && totalPlantas > 0) {
        const superficie = totalPlantas / densidad
        console.log("[CÁLCULO PLANTACIÓN] Resultado:", { 
          totalPlantas, 
          densidad, 
          superficie, 
          superficieFormateada: superficie.toFixed(4) 
        })
        
        // Validación adicional para evitar valores incorrectos
        if (superficie > 1000) {
          console.warn("[CÁLCULO PLANTACIÓN] ⚠️ Superficie muy alta detectada:", superficie)
        }
        
        handleInputChange("superficie", superficie.toFixed(4))
      } else {
        console.log("[CÁLCULO PLANTACIÓN] Valores inválidos para cálculo:", { densidad, totalPlantas })
      }
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Estado del Trabajo */}
        <div className="col-span-2 space-y-2 p-4 bg-green-50 border border-green-200 rounded-md">
          <Label htmlFor="estado-trabajo" className="text-lg font-semibold text-green-800">
            Estado del Trabajo <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.estado || "Pendiente"}
            onValueChange={(newValue) => handleInputChange("estado", newValue)}
          >
            <SelectTrigger id="estado-trabajo" className="h-12 text-base">
              <SelectValue placeholder="Seleccionar estado del trabajo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Pendiente">Pendiente</SelectItem>
              <SelectItem value="R7 (terminado)">R7 (terminado)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tipo de Carga - MEJORADO CON FUNCIONALIDAD DINÁMICA */}
        <div className="col-span-2 space-y-2 p-4 bg-green-50 border border-green-200 rounded-md">
          <Label htmlFor="tipoCarga" className="text-lg font-semibold text-green-800">
            Tipo de Carga <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.tipoCarga || ""}
            onValueChange={(newValue) => {
              handleInputChange("tipoCarga", newValue)
              // Limpiar campos relacionados cuando cambia el tipo
              if (newValue === "Bandejas") {
                handleInputChange("rocambole", "")
                handleInputChange("cantidadPlantines", "")
              } else if (newValue === "Rocambole") {
                handleInputChange("cantidadBandejas", "")
                handleInputChange("totalPlantas", "")
              }
            }}
          >
            <SelectTrigger id="tipoCarga">
              <SelectValue placeholder="🌱 Seleccionar método de carga de plantas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Bandejas">
                <div className="flex items-center gap-2">
                  <span>📦</span>
                  <div>
                    <div>Bandejas</div>
                    <div className="text-xs text-muted-foreground">40 plantines por bandeja (cálculo automático)</div>
                  </div>
                </div>
              </SelectItem>
              <SelectItem value="Rocambole">
                <div className="flex items-center gap-2">
                  <span>🌿</span>
                  <div>
                    <div>Rocambole</div>
                    <div className="text-xs text-muted-foreground">Cantidad manual de plantines</div>
                  </div>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-green-700">
            Seleccione cómo desea registrar la cantidad de plantas para esta plantación
          </p>

          {/* Mensaje dinámico según selección */}
          {formData.tipoCarga && (
            <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-md">
              <div className="flex items-center gap-2">
                <span>{formData.tipoCarga === "Bandejas" ? "📦" : "🌿"}</span>
                <strong>Método seleccionado: {formData.tipoCarga}</strong>
              </div>
              <p className="text-sm text-orange-700 mt-1">
                {formData.tipoCarga === "Bandejas"
                  ? "Ingrese la cantidad de bandejas. El total de plantas se calculará automáticamente (bandejas × 40)."
                  : "Seleccione el rocambole e ingrese manualmente la cantidad de plantines."}
              </p>
            </div>
          )}
        </div>

        {/* Densidad */}
        <div className="col-span-2 space-y-2 p-4 bg-purple-50 border border-purple-200 rounded-md">
          <Label htmlFor="densidad" className="text-lg font-semibold text-purple-800">
            Densidad <span className="text-red-500">*</span> <span className="text-sm">(plantas por hectárea)</span>
          </Label>
          <Input
            id="densidad"
            type="number"
            min="1"
            value={formData.densidad || ""}
            onChange={(e) => {
              handleInputChange("densidad", e.target.value)
            }}
            onBlur={() => {
              // Calcular superficie automáticamente cuando se completa la entrada
              setTimeout(calcularSuperficie, 100)
            }}
            placeholder="Ej: 1111 plantas/ha"
            required={true}
          />
          <div className="flex items-center gap-2 text-sm text-purple-700">
            <span>💡</span>
            <span>Ingrese la densidad de plantación específica para este período</span>
          </div>
          <p className="text-xs text-purple-600">
            Esta densidad se usará para calcular automáticamente las hectáreas basándose en la cantidad de plantas
          </p>
        </div>

        {/* Fecha */}
        <div className="space-y-2">
          <Label htmlFor="fecha">
            Fecha <span className="text-red-500">*</span>
          </Label>
          <Input
            id="fecha"
            type="date"
            value={formData.fecha || ""}
            onChange={(e) => handleInputChange("fecha", e.target.value)}
            required={true}
          />
        </div>

        {/* Rodal */}
        <div className="space-y-2">
          <Label htmlFor="rodal">
            Rodal <span className="text-red-500">*</span>
          </Label>
          <Select value={formData.rodal || ""} onValueChange={(newValue) => handleInputChange("rodal", newValue)}>
            <SelectTrigger id="rodal">
              <SelectValue placeholder="Seleccionar rodal" />
            </SelectTrigger>
            <SelectContent>
              {hasRodales ? (
                workOrder.rodales.map((rodal) => (
                  <SelectItem key={rodal.numero} value={String(rodal.numero)}>
                    #{rodal.numero} - Total: {rodal.hectareas} ha
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="sin-rodales">Sin rodales</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Predio/Campo */}
        <div className="space-y-2">
          <Label htmlFor="predio">
            Predio/Campo <span className="text-red-500">*</span>
          </Label>
          <Input
            id="predio"
            type="text"
            value={workOrder?.campo || ""}
            readOnly
            disabled
            className="bg-gray-100 cursor-not-allowed"
          />
        </div>

        {/* Cuadrilla */}
        <div className="space-y-2">
          <Label htmlFor="cuadrilla">
            Cuadrilla <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.cuadrilla || ""}
            onValueChange={(newValue) => {
              // Buscar la cuadrilla por nombre o por ID
              let cuadrillaSeleccionada = cuadrillas.find((c) => {
                const nombre = c.nombre || c.descripcion || ""
                return nombre === newValue
              })
              // Si no se encuentra por nombre, buscar por ID (por si acaso)
              if (!cuadrillaSeleccionada) {
                cuadrillaSeleccionada = cuadrillas.find((c) => {
                  const id = c._id || c.id || c.idcuadrilla || ""
                  return id === newValue
                })
              }
              if (cuadrillaSeleccionada) {
                const id = cuadrillaSeleccionada._id || cuadrillaSeleccionada.id || cuadrillaSeleccionada.idcuadrilla || ""
                const nombre = cuadrillaSeleccionada.nombre || cuadrillaSeleccionada.descripcion || `Cuadrilla ${id}`
                handleInputChange("cuadrillaId", String(id))
                handleInputChange("cuadrilla", nombre)
              } else {
                // Si no se encuentra, limpiar ambos campos
                handleInputChange("cuadrillaId", "")
                handleInputChange("cuadrilla", "")
              }
            }}
          >
            <SelectTrigger id="cuadrilla">
              <SelectValue placeholder="Seleccionar cuadrilla" />
            </SelectTrigger>
            <SelectContent>
              {cuadrillas.map((cuadrilla) => {
                const id = cuadrilla._id || cuadrilla.id || cuadrilla.idcuadrilla || ""
                const nombre = cuadrilla.nombre || cuadrilla.descripcion || `Cuadrilla ${id}`
                if (!id) return null
                return (
                  <SelectItem key={id} value={nombre}>
                    {nombre}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Cantidad de Personal */}
        <div className="space-y-2">
          <Label htmlFor="cantPersonal">
            Cantidad de Personal <span className="text-red-500">*</span>
          </Label>
          <Input
            id="cantPersonal"
            type="number"
            min="1"
            value={formData.cantPersonal || ""}
            onChange={(e) => handleInputChange("cantPersonal", e.target.value)}
            required={true}
          />
        </div>

        {/* Jornada */}
        <div className="space-y-2">
          <Label htmlFor="jornada">
            Jornada (hs) <span className="text-red-500">*</span>
          </Label>
          <Input
            id="jornada"
            type="number"
            min="1"
            max="24"
            value={formData.jornada || ""}
            onChange={(e) => handleInputChange("jornada", e.target.value)}
            required={true}
          />
        </div>

        {/* Vivero - CORREGIDO */}
        <div className="space-y-2">
          <Label htmlFor="vivero">
            Vivero <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.vivero || ""}
            onValueChange={(newValue) => {
             
              handleInputChange("vivero", newValue)
            }}
          >
            <SelectTrigger id="vivero">
              <SelectValue placeholder="Seleccionar vivero">
                {formData.vivero
                  ? (() => {
                      const vivero = viveros.find((v) => (v._id || v.id) === formData.vivero)
                      return vivero
                        ? vivero.nombre || vivero.descripcion || vivero.vivero || `Vivero ${formData.vivero}`
                        : formData.vivero
                    })()
                  : "Seleccionar vivero"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {viveros.map((vivero) => {
                const id = vivero._id || vivero.id || ""
                const nombre = vivero.nombre || vivero.descripcion || vivero.vivero || `Vivero ${id}`
                return (
                  <SelectItem key={id} value={id}>
                    {nombre}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Especie Forestal */}
        <div className="space-y-2">
          <Label htmlFor="especie_forestal">
            Especie Forestal <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.especie_forestal || ""}
            onValueChange={(newValue) => handleInputChange("especie_forestal", newValue)}
            disabled={!formData.vivero}
          >
            <SelectTrigger id="especie_forestal">
              <SelectValue placeholder={formData.vivero ? "Seleccionar especie" : "Primero seleccione un vivero"}>
                {formData.especie_forestal
                  ? (() => {
                      const especie = especies.find((e) => (e._id || e.id) === formData.especie_forestal)
                      return especie
                        ? especie.especie || especie.nombre || `Especie ${formData.especie_forestal}`
                        : formData.especie_forestal
                    })()
                  : formData.vivero ? "Seleccionar especie" : "Primero seleccione un vivero"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {especies.length > 0 ? (
                especies.map((especie) => {
                  const id = especie._id || especie.id || ""
                  const nombre = especie.especie || especie.nombre || `Especie ${id}`
                  return (
                    <SelectItem key={id} value={id}>
                      {nombre}
                    </SelectItem>
                  )
                })
              ) : (
                <SelectItem value="" disabled>
                  {formData.vivero ? "No hay especies disponibles" : "Seleccione un vivero primero"}
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Clon - CORREGIDO */}
        <div className="space-y-2">
          <Label htmlFor="clon">
            Clon <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.clon || ""}
            onValueChange={(newValue) => {
              handleInputChange("clon", newValue)
            }}
            disabled={!formData.vivero}
          >
            <SelectTrigger id="clon">
              <SelectValue placeholder={
                !formData.vivero ? "Primero seleccione un vivero" :
                "Seleccionar clon"
              }>
                {formData.clon
                  ? (() => {
                      const clon = clones.find((c) => (c._id || c.id) === formData.clon)
                      return clon
                        ? clon.codigo || clon.codigoClon || clon.nombre || clon.clon || `Clon ${formData.clon}`
                        : formData.clon
                    })()
                  : !formData.vivero ? "Primero seleccione un vivero" :
                    "Seleccionar clon"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {clones.length > 0 ? (
                clones.map((clon) => {
                  const id = clon._id || clon.id || ""
                  const codigo = clon.codigo || clon.codigoClon || clon.nombre || clon.clon || `Clon ${id}`
                  return (
                    <SelectItem key={id} value={id}>
                      {codigo}
                    </SelectItem>
                  )
                })
              ) : (
                <SelectItem value="" disabled>
                  {!formData.vivero ? "Seleccione un vivero primero" :
                   "No hay clones disponibles"}
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Campos específicos según tipo de carga */}
        {formData.tipoCarga === "Bandejas" && (
          <>
            {/* Cantidad de Bandejas */}
            <div className="space-y-2">
              <Label htmlFor="cantidadBandejas">
                Cantidad de Bandejas <span className="text-red-500">*</span>
              </Label>
              <Input
                id="cantidadBandejas"
                type="number"
                min="1"
                value={formData.cantidadBandejas || ""}
                onChange={(e) => {
                  const bandejas = Number(e.target.value)
                  handleInputChange("cantidadBandejas", e.target.value)
                  // Calcular total de plantas automáticamente (40 plantas por bandeja)
                  const totalPlantas = bandejas * 40
                  handleInputChange("totalPlantas", totalPlantas.toString())
                }}
                onBlur={() => {
                  // Recalcular superficie solo cuando se completa la entrada
                  setTimeout(calcularSuperficie, 100)
                }}
                placeholder="Número de bandejas"
                required={formData.tipoCarga === "Bandejas"}
              />
            </div>

            {/* Total de Plantas (calculado automáticamente) */}
            <div className="space-y-2">
              <Label htmlFor="totalPlantas">
                Total de Plantas <span className="text-sm text-gray-500">(40 plantas por bandeja)</span>
              </Label>
              <Input
                id="totalPlantas"
                type="number"
                value={formData.totalPlantas || ""}
                readOnly
                disabled
                className="bg-gray-100 cursor-not-allowed"
                placeholder="Se calcula automáticamente"
              />
            </div>
          </>
        )}

        {formData.tipoCarga === "Rocambole" && (
          <>
            {/* Cantidad de Plantines */}
            <div className="space-y-2">
              <Label htmlFor="cantidadPlantines">
                Cantidad de Plantines <span className="text-red-500">*</span>
              </Label>
              <Input
                id="cantidadPlantines"
                type="number"
                min="1"
                value={formData.cantidadPlantines || ""}
                onChange={(e) => {
                  handleInputChange("cantidadPlantines", e.target.value)
                }}
                onBlur={() => {
                  // Recalcular superficie solo cuando se completa la entrada
                  setTimeout(calcularSuperficie, 100)
                }}
                placeholder="Número de plantines"
                required={formData.tipoCarga === "Rocambole"}
              />
            </div>
          </>
        )}

        {/* Superficie (calculada automáticamente) */}
        <div className="space-y-2">
          <Label htmlFor="superficie">
            Superficie (Ha) <span className="text-red-500">*</span>
          </Label>
          <Input
            id="superficie"
            type="number"
            step="0.0001"
            min="0"
            value={formData.superficie || ""}
            onChange={(e) => handleInputChange("superficie", e.target.value)}
            placeholder="Se calcula automáticamente (plantas ÷ densidad)"
            required={true}
          />
          <p className="text-xs text-muted-foreground">
            💡 La superficie se calcula automáticamente: Total de plantas ÷ Densidad
          </p>
        </div>

        {/* Año de Plantación */}
        <div className="space-y-2">
          <Label htmlFor="anioPlantacion">
            Año de Plantación <span className="text-red-500">*</span>
          </Label>
          <Input
            id="anioPlantacion"
            type="number"
            min="1900"
            max="2030"
            value={formData.anioPlantacion || ""}
            onChange={(e) => handleInputChange("anioPlantacion", e.target.value)}
            placeholder="Ej: 2020, 2021, 2022"
            required={true}
          />
          <p className="text-xs text-muted-foreground">
            💡 Año en que se realizó la plantación del rodal
          </p>
        </div>

        {/* Observaciones */}
        <div className="col-span-2 space-y-2">
          <Label htmlFor="observaciones">Observaciones</Label>
          <Textarea
            id="observaciones"
            value={formData.observaciones || ""}
            onChange={(e) => handleInputChange("observaciones", e.target.value)}
            placeholder="Observaciones sobre la plantación realizada"
            className="min-h-[100px]"
          />
        </div>
      </div>
    )
  }

  // Renderizar formulario específico para CONTROL DE MALEZAS con productos dinámicos
  const renderControlMalezasForm = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Estado del Trabajo */}
        <div className="col-span-2 space-y-2 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <Label htmlFor="estado-trabajo" className="text-lg font-semibold text-yellow-800">
            Estado del Trabajo <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.estado || "Pendiente"}
            onValueChange={(newValue) => handleInputChange("estado", newValue)}
          >
            <SelectTrigger id="estado-trabajo" className="h-12 text-base">
              <SelectValue placeholder="Seleccionar estado del trabajo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Pendiente">Pendiente</SelectItem>
              <SelectItem value="R7 (terminado)">R7 (terminado)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Fecha */}
        <div className="space-y-2">
          <Label htmlFor="fecha">
            Fecha <span className="text-red-500">*</span>
          </Label>
          <Input
            id="fecha"
            type="date"
            value={formData.fecha || ""}
            onChange={(e) => handleInputChange("fecha", e.target.value)}
            required={true}
          />
        </div>

        {/* Rodal */}
        <div className="space-y-2">
          <Label htmlFor="rodal">
            Rodal <span className="text-red-500">*</span>
          </Label>
          <Select value={formData.rodal || ""} onValueChange={(newValue) => handleInputChange("rodal", newValue)}>
            <SelectTrigger id="rodal">
              <SelectValue placeholder="Seleccionar rodal" />
            </SelectTrigger>
            <SelectContent>
              {hasRodales ? (
                workOrder.rodales.map((rodal) => (
                  <SelectItem key={rodal.numero} value={String(rodal.numero)}>
                    #{rodal.numero} - Total: {rodal.hectareas} ha
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="sin-rodales">Sin rodales</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Predio/Campo */}
        <div className="space-y-2">
          <Label htmlFor="predio">
            Predio/Campo <span className="text-red-500">*</span>
          </Label>
          <Input
            id="predio"
            type="text"
            value={workOrder?.campo || ""}
            readOnly
            disabled
            className="bg-gray-100 cursor-not-allowed"
          />
        </div>

        {/* Cuadrilla */}
        <div className="space-y-2">
          <Label htmlFor="cuadrilla">
            Cuadrilla <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.cuadrilla || ""}
            onValueChange={(newValue) => {
              // Buscar la cuadrilla por nombre o por ID
              let cuadrillaSeleccionada = cuadrillas.find((c) => {
                const nombre = c.nombre || c.descripcion || ""
                return nombre === newValue
              })
              // Si no se encuentra por nombre, buscar por ID (por si acaso)
              if (!cuadrillaSeleccionada) {
                cuadrillaSeleccionada = cuadrillas.find((c) => {
                  const id = c._id || c.id || c.idcuadrilla || ""
                  return id === newValue
                })
              }
              if (cuadrillaSeleccionada) {
                const id = cuadrillaSeleccionada._id || cuadrillaSeleccionada.id || cuadrillaSeleccionada.idcuadrilla || ""
                const nombre = cuadrillaSeleccionada.nombre || cuadrillaSeleccionada.descripcion || `Cuadrilla ${id}`
                handleInputChange("cuadrillaId", String(id))
                handleInputChange("cuadrilla", nombre)
              } else {
                // Si no se encuentra, limpiar ambos campos
                handleInputChange("cuadrillaId", "")
                handleInputChange("cuadrilla", "")
              }
            }}
          >
            <SelectTrigger id="cuadrilla">
              <SelectValue placeholder="Seleccionar cuadrilla" />
            </SelectTrigger>
            <SelectContent>
              {cuadrillas.map((cuadrilla) => {
                const id = cuadrilla._id || cuadrilla.id || cuadrilla.idcuadrilla || ""
                const nombre = cuadrilla.nombre || cuadrilla.descripcion || `Cuadrilla ${id}`
                if (!id) return null
                return (
                  <SelectItem key={id} value={nombre}>
                    {nombre}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Superficie */}
        <div className="space-y-2">
          <Label htmlFor="superficie">
            Superficie (Ha) <span className="text-red-500">*</span>
          </Label>
          <Input
            id="superficie"
            type="number"
            step="0.0001"
            min="0"
            value={formData.superficie || ""}
            onChange={(e) => handleInputChange("superficie", e.target.value)}
            placeholder="Superficie tratada"
            required={true}
          />
        </div>

        {/* Cantidad de Personal */}
        <div className="space-y-2">
          <Label htmlFor="cantPersonal">
            Cantidad de Personal <span className="text-red-500">*</span>
          </Label>
          <Input
            id="cantPersonal"
            type="number"
            min="1"
            value={formData.cantPersonal || ""}
            onChange={(e) => handleInputChange("cantPersonal", e.target.value)}
            required={true}
          />
        </div>

        {/* Jornada */}
        <div className="space-y-2">
          <Label htmlFor="jornada">
            Jornada (hs) <span className="text-red-500">*</span>
          </Label>
          <Input
            id="jornada"
            type="number"
            min="1"
            max="24"
            value={formData.jornada || ""}
            onChange={(e) => handleInputChange("jornada", e.target.value)}
            required={true}
          />
        </div>

        {/* Tipo de Aplicación */}
        <div className="space-y-2">
          <Label htmlFor="tipoAplicacion">
            Tipo de Aplicación <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.tipoAplicacion || ""}
            onValueChange={(newValue) => handleInputChange("tipoAplicacion", newValue)}
          >
            <SelectTrigger id="tipoAplicacion">
              <SelectValue placeholder="Seleccionar tipo de aplicación" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Mochila">Mochila</SelectItem>
              <SelectItem value="Tractor">Tractor</SelectItem>
              <SelectItem value="Manual">Manual</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Volumen Aplicado */}
        <div className="space-y-2">
          <Label htmlFor="volumenAplicado">
            Volumen Aplicado (L/ha) <span className="text-red-500">*</span>
          </Label>
          <Input
            id="volumenAplicado"
            type="number"
            step="0.1"
            min="0"
            value={formData.volumenAplicado || ""}
            onChange={(e) => handleInputChange("volumenAplicado", e.target.value)}
            placeholder="Litros por hectárea"
            required={true}
          />
        </div>

        {/* Cantidad de Mochilas */}
        <div className="space-y-2">
          <Label htmlFor="cantidadMochilas">Cantidad de Mochilas</Label>
          <Input
            id="cantidadMochilas"
            type="number"
            min="0"
            value={formData.cantidadMochilas || ""}
            onChange={(e) => handleInputChange("cantidadMochilas", e.target.value)}
            placeholder="Número de mochilas utilizadas"
          />
        </div>

        {/* Productos Utilizados - SECCIÓN DINÁMICA MEJORADA */}
        <div className="col-span-2 space-y-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-center justify-between">
            <Label className="text-lg font-semibold text-blue-800">
              Productos Utilizados <span className="text-red-500">*</span>
            </Label>
            <Button
              type="button"
              onClick={agregarProducto}
              disabled={productosMalezas.length >= 5}
              size="sm"
              variant="outline"
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Agregar Producto
            </Button>
          </div>

          <div className="space-y-3">
            {productosMalezas.map((producto, index) => (
              <div key={producto.id} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 bg-white rounded-md border">
                <div className="space-y-1">
                  <Label htmlFor={`producto-${producto.id}`} className="text-sm">
                    Producto {index + 1} <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={producto.producto}
                    onValueChange={(value) => actualizarProducto(producto.id, "producto", value)}
                  >
                    <SelectTrigger id={`producto-${producto.id}`}>
                      <SelectValue placeholder="Seleccionar producto" />
                    </SelectTrigger>
                    <SelectContent>
                      {malezasProductos.map((prod) => (
                        <SelectItem key={prod._id || prod.id} value={prod.nombre}>
                          {prod.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor={`cantidad-${producto.id}`} className="text-sm">
                    Cantidad <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id={`cantidad-${producto.id}`}
                    type="number"
                    step="0.01"
                    min="0"
                    value={producto.cantidad}
                    onChange={(e) => actualizarProducto(producto.id, "cantidad", e.target.value)}
                    placeholder="0.00"
                    required={true}
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor={`unidad-${producto.id}`} className="text-sm">
                    Unidad <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={producto.unidad}
                    onValueChange={(value) => actualizarProducto(producto.id, "unidad", value)}
                  >
                    <SelectTrigger id={`unidad-${producto.id}`}>
                      <SelectValue placeholder="Unidad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cm3">cm³</SelectItem>
                      <SelectItem value="ml">ml</SelectItem>
                      <SelectItem value="L">L</SelectItem>
                      <SelectItem value="g">g</SelectItem>
                      <SelectItem value="kg">kg</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button
                    type="button"
                    onClick={() => eliminarProducto(producto.id)}
                    disabled={productosMalezas.length <= 1}
                    size="sm"
                    variant="outline"
                    className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <p className="text-sm text-blue-700">
            💡 Puede agregar hasta 5 productos diferentes. Seleccione el producto de la lista y especifique la cantidad
            y unidad de medida.
          </p>
        </div>

        {/* Observaciones */}
        <div className="col-span-2 space-y-2">
          <Label htmlFor="observaciones">Observaciones</Label>
          <Textarea
            id="observaciones"
            value={formData.observaciones || ""}
            onChange={(e) => handleInputChange("observaciones", e.target.value)}
            placeholder="Observaciones sobre el control de malezas realizado"
            className="min-h-[100px]"
          />
        </div>
      </div>
    )
  }

  // Renderizar formulario específico para CONTROL DE HORMIGAS
  const renderControlHormigasForm = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Estado del Trabajo */}
        <div className="col-span-2 space-y-2 p-4 bg-red-50 border border-red-200 rounded-md">
          <Label htmlFor="estado-trabajo" className="text-lg font-semibold text-red-800">
            Estado del Trabajo <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.estado || "Pendiente"}
            onValueChange={(newValue) => handleInputChange("estado", newValue)}
          >
            <SelectTrigger id="estado-trabajo" className="h-12 text-base">
              <SelectValue placeholder="Seleccionar estado del trabajo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Pendiente">Pendiente</SelectItem>
              <SelectItem value="R7 (terminado)">R7 (terminado)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Fecha */}
        <div className="space-y-2">
          <Label htmlFor="fecha">
            Fecha <span className="text-red-500">*</span>
          </Label>
          <Input
            id="fecha"
            type="date"
            value={formData.fecha || ""}
            onChange={(e) => handleInputChange("fecha", e.target.value)}
            required={true}
          />
        </div>

        {/* Rodal */}
        <div className="space-y-2">
          <Label htmlFor="rodal">
            Rodal <span className="text-red-500">*</span>
          </Label>
          <Select value={formData.rodal || ""} onValueChange={(newValue) => handleInputChange("rodal", newValue)}>
            <SelectTrigger id="rodal">
              <SelectValue placeholder="Seleccionar rodal" />
            </SelectTrigger>
            <SelectContent>
              {hasRodales ? (
                workOrder.rodales.map((rodal) => (
                  <SelectItem key={rodal.numero} value={String(rodal.numero)}>
                    #{rodal.numero} - Total: {rodal.hectareas} ha
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="sin-rodales">Sin rodales</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Predio/Campo */}
        <div className="space-y-2">
          <Label htmlFor="predio">
            Predio/Campo <span className="text-red-500">*</span>
          </Label>
          <Input
            id="predio"
            type="text"
            value={workOrder?.campo || ""}
            readOnly
            disabled
            className="bg-gray-100 cursor-not-allowed"
          />
        </div>

        {/* Cuadrilla */}
        <div className="space-y-2">
          <Label htmlFor="cuadrilla">
            Cuadrilla <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.cuadrilla || ""}
            onValueChange={(newValue) => {
              // Buscar la cuadrilla por nombre o por ID
              let cuadrillaSeleccionada = cuadrillas.find((c) => {
                const nombre = c.nombre || c.descripcion || ""
                return nombre === newValue
              })
              // Si no se encuentra por nombre, buscar por ID (por si acaso)
              if (!cuadrillaSeleccionada) {
                cuadrillaSeleccionada = cuadrillas.find((c) => {
                  const id = c._id || c.id || c.idcuadrilla || ""
                  return id === newValue
                })
              }
              if (cuadrillaSeleccionada) {
                const id = cuadrillaSeleccionada._id || cuadrillaSeleccionada.id || cuadrillaSeleccionada.idcuadrilla || ""
                const nombre = cuadrillaSeleccionada.nombre || cuadrillaSeleccionada.descripcion || `Cuadrilla ${id}`
                handleInputChange("cuadrillaId", String(id))
                handleInputChange("cuadrilla", nombre)
              } else {
                // Si no se encuentra, limpiar ambos campos
                handleInputChange("cuadrillaId", "")
                handleInputChange("cuadrilla", "")
              }
            }}
          >
            <SelectTrigger id="cuadrilla">
              <SelectValue placeholder="Seleccionar cuadrilla" />
            </SelectTrigger>
            <SelectContent>
              {cuadrillas.map((cuadrilla) => {
                const id = cuadrilla._id || cuadrilla.id || cuadrilla.idcuadrilla || ""
                const nombre = cuadrilla.nombre || cuadrilla.descripcion || `Cuadrilla ${id}`
                if (!id) return null
                return (
                  <SelectItem key={id} value={nombre}>
                    {nombre}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Superficie */}
        <div className="space-y-2">
          <Label htmlFor="superficie">
            Superficie (Ha) <span className="text-red-500">*</span>
          </Label>
          <Input
            id="superficie"
            type="number"
            step="0.0001"
            min="0"
            value={formData.superficie || ""}
            onChange={(e) => handleInputChange("superficie", e.target.value)}
            placeholder="Superficie tratada"
            required={true}
          />
        </div>

        {/* Cantidad de Personal */}
        <div className="space-y-2">
          <Label htmlFor="cantPersonal">
            Cantidad de Personal <span className="text-red-500">*</span>
          </Label>
          <Input
            id="cantPersonal"
            type="number"
            min="1"
            value={formData.cantPersonal || ""}
            onChange={(e) => handleInputChange("cantPersonal", e.target.value)}
            required={true}
          />
        </div>

        {/* Jornada */}
        <div className="space-y-2">
          <Label htmlFor="jornada">
            Jornada (hs) <span className="text-red-500">*</span>
          </Label>
          <Input
            id="jornada"
            type="number"
            min="1"
            max="24"
            value={formData.jornada || ""}
            onChange={(e) => handleInputChange("jornada", e.target.value)}
            required={true}
          />
        </div>

        {/* Números de Nidos */}
        <div className="space-y-2">
          <Label htmlFor="numerosNidos">
            Números de Nidos <span className="text-red-500">*</span>
          </Label>
          <Input
            id="numerosNidos"
            type="text"
            value={formData.numerosNidos || ""}
            onChange={(e) => handleInputChange("numerosNidos", e.target.value)}
            placeholder="Ej: 1, 2, 3, 4"
            required={true}
          />
          <p className="text-xs text-muted-foreground">Ingrese los números de nidos separados por comas</p>
        </div>

        {/* Especie de Hormiga */}
        <div className="space-y-2">
          <Label htmlFor="especieHormiga">
            Especie de Hormiga <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.especieHormiga || ""}
            onValueChange={(newValue) => handleInputChange("especieHormiga", newValue)}
          >
            <SelectTrigger id="especieHormiga">
              <SelectValue placeholder="Seleccionar especie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Atta vollenweideri">Atta vollenweideri</SelectItem>
              <SelectItem value="Acromyrmex lundi">Acromyrmex lundi</SelectItem>
              <SelectItem value="Acromyrmex striatus">Acromyrmex striatus</SelectItem>
              <SelectItem value="Otra especie">Otra especie</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Producto */}
        <div className="space-y-2">
          <Label htmlFor="producto">
            Producto <span className="text-red-500">*</span>
          </Label>
          <Input
            id="producto"
            type="text"
            value={formData.producto || ""}
            onChange={(e) => handleInputChange("producto", e.target.value)}
            placeholder="Nombre del producto utilizado"
            required={true}
          />
        </div>

        {/* Cantidad */}
        <div className="space-y-2">
          <Label htmlFor="cantidad">
            Cantidad (kg) <span className="text-red-500">*</span>
          </Label>
          <Input
            id="cantidad"
            type="number"
            step="0.01"
            min="0"
            value={formData.cantidad || ""}
            onChange={(e) => handleInputChange("cantidad", e.target.value)}
            placeholder="Cantidad en kilogramos"
            required={true}
          />
        </div>

        {/* Observaciones */}
        <div className="col-span-2 space-y-2">
          <Label htmlFor="observaciones">Observaciones</Label>
          <Textarea
            id="observaciones"
            value={formData.observaciones || ""}
            onChange={(e) => handleInputChange("observaciones", e.target.value)}
            placeholder="Observaciones sobre el control de hormigas realizado"
            className="min-h-[100px]"
          />
        </div>
      </div>
    )
  }

  // Renderizar formulario específico para RALEO
  const renderRaleoForm = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Estado del Trabajo */}
        <div className="col-span-2 space-y-2 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <Label htmlFor="estado-trabajo" className="text-lg font-semibold text-blue-800">
            Estado del Trabajo <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.estado || "Pendiente"}
            onValueChange={(newValue) => handleInputChange("estado", newValue)}
          >
            <SelectTrigger id="estado-trabajo" className="h-12 text-base">
              <SelectValue placeholder="Seleccionar estado del trabajo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Pendiente">Pendiente</SelectItem>
              <SelectItem value="R7 (terminado)">R7 (terminado)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Fecha */}
        <div className="space-y-2">
          <Label htmlFor="fecha">
            Fecha <span className="text-red-500">*</span>
          </Label>
          <Input
            id="fecha"
            type="date"
            value={formData.fecha || ""}
            onChange={(e) => handleInputChange("fecha", e.target.value)}
            required={true}
          />
        </div>

        {/* Rodal */}
        <div className="space-y-2">
          <Label htmlFor="rodal">
            Rodal <span className="text-red-500">*</span>
          </Label>
          <Select value={formData.rodal || ""} onValueChange={(newValue) => handleInputChange("rodal", newValue)}>
            <SelectTrigger id="rodal">
              <SelectValue placeholder="Seleccionar rodal" />
            </SelectTrigger>
            <SelectContent>
              {hasRodales ? (
                workOrder.rodales.map((rodal) => (
                  <SelectItem key={rodal.numero} value={String(rodal.numero)}>
                    #{rodal.numero} - Total: {rodal.hectareas} ha
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="sin-rodales">Sin rodales</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Predio/Campo */}
        <div className="space-y-2">
          <Label htmlFor="predio">
            Predio/Campo <span className="text-red-500">*</span>
          </Label>
          <Input
            id="predio"
            type="text"
            value={workOrder?.campo || ""}
            readOnly
            disabled
            className="bg-gray-100 cursor-not-allowed"
          />
        </div>

        {/* Cuadrilla */}
        <div className="space-y-2">
          <Label htmlFor="cuadrilla">
            Cuadrilla <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.cuadrilla || ""}
            onValueChange={(newValue) => {
              // Buscar la cuadrilla por nombre o por ID
              let cuadrillaSeleccionada = cuadrillas.find((c) => {
                const nombre = c.nombre || c.descripcion || ""
                return nombre === newValue
              })
              // Si no se encuentra por nombre, buscar por ID (por si acaso)
              if (!cuadrillaSeleccionada) {
                cuadrillaSeleccionada = cuadrillas.find((c) => {
                  const id = c._id || c.id || c.idcuadrilla || ""
                  return id === newValue
                })
              }
              if (cuadrillaSeleccionada) {
                const id = cuadrillaSeleccionada._id || cuadrillaSeleccionada.id || cuadrillaSeleccionada.idcuadrilla || ""
                const nombre = cuadrillaSeleccionada.nombre || cuadrillaSeleccionada.descripcion || `Cuadrilla ${id}`
                handleInputChange("cuadrillaId", String(id))
                handleInputChange("cuadrilla", nombre)
              } else {
                // Si no se encuentra, limpiar ambos campos
                handleInputChange("cuadrillaId", "")
                handleInputChange("cuadrilla", "")
              }
            }}
          >
            <SelectTrigger id="cuadrilla">
              <SelectValue placeholder="Seleccionar cuadrilla" />
            </SelectTrigger>
            <SelectContent>
              {cuadrillas.map((cuadrilla) => {
                const id = cuadrilla._id || cuadrilla.id || cuadrilla.idcuadrilla || ""
                const nombre = cuadrilla.nombre || cuadrilla.descripcion || `Cuadrilla ${id}`
                if (!id) return null
                return (
                  <SelectItem key={id} value={nombre}>
                    {nombre}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Superficie */}
        <div className="space-y-2">
          <Label htmlFor="superficie">
            Superficie (Ha) <span className="text-red-500">*</span>
          </Label>
          <Input
            id="superficie"
            type="number"
            step="0.0001"
            min="0"
            value={formData.superficie || ""}
            onChange={(e) => handleInputChange("superficie", e.target.value)}
            placeholder="Superficie raleada"
            required={true}
          />
        </div>

        {/* Cantidad de Personal */}
        <div className="space-y-2">
          <Label htmlFor="cantPersonal">
            Cantidad de Personal <span className="text-red-500">*</span>
          </Label>
          <Input
            id="cantPersonal"
            type="number"
            min="1"
            value={formData.cantPersonal || ""}
            onChange={(e) => handleInputChange("cantPersonal", e.target.value)}
            required={true}
          />
        </div>

        {/* Jornada */}
        <div className="space-y-2">
          <Label htmlFor="jornada">
            Jornada (hs) <span className="text-red-500">*</span>
          </Label>
          <Input
            id="jornada"
            type="number"
            min="1"
            max="24"
            value={formData.jornada || ""}
            onChange={(e) => handleInputChange("jornada", e.target.value)}
            required={true}
          />
        </div>

        {/* Especie */}
        <div className="space-y-2">
          <Label htmlFor="especie">
            Especie <span className="text-red-500">*</span>
          </Label>
          <Select value={formData.especie || ""} onValueChange={(newValue) => handleInputChange("especie", newValue)}>
            <SelectTrigger id="especie">
              <SelectValue placeholder="Seleccionar especie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Ecua">Ecua</SelectItem>
              <SelectItem value="Pino">Pino</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Observaciones */}
        <div className="col-span-2 space-y-2">
          <Label htmlFor="observaciones">Observaciones</Label>
          <Textarea
            id="observaciones"
            value={formData.observaciones || ""}
            onChange={(e) => handleInputChange("observaciones", e.target.value)}
            placeholder="Observaciones sobre el raleo realizado"
            className="min-h-[100px]"
          />
        </div>
      </div>
    )
  }

  // Función para manejar cambios en los inputs
  const handleInputChange = (field: string, value: string | boolean) => {
    // Log específico para campos críticos del cálculo
    if (field === "densidad" || field === "cantidadPlantas" || field === "superficie") {
      console.log(`[INPUT][${field}] Valor anterior:`, formData[field])
      console.log(`[INPUT][${field}] Nuevo valor:`, value)
      console.log(`[INPUT][${field}] Tipo:`, typeof value)
    }
    
    setFormData((prev) => {
      const newFormData = {
        ...prev,
        [field]: value,
      }

      // Si se selecciona un vivero, actualizar especies y clones disponibles
      if (field === "vivero" && value) {
        const especiesDelVivero = getEspeciesDelVivero(value as string)
        const clonesDelVivero = getClonesDelVivero(value as string)

        setEspecies(especiesDelVivero)
        setClones(clonesDelVivero)

        // Limpiar especie y clon seleccionados si ya no están disponibles
        if (!especiesDelVivero.some(e => (e._id || e.id) === prev.especie_forestal)) {
          newFormData.especie_forestal = ""
        }
        if (!clonesDelVivero.some(c => (c._id || c.id) === prev.clon)) {
          newFormData.clon = ""
        }
      }

      // Si se selecciona una especie ya no filtramos clones; mostramos todos los del vivero.
      if (field === "especie_forestal" && formData.vivero) {
        const clonesDelVivero = getClonesDelVivero(formData.vivero)
        setClones(clonesDelVivero)
        if (!clonesDelVivero.some(c => (c._id || c.id) === prev.clon)) {
          newFormData.clon = ""
        }
      }

      return newFormData
    })
  }

  // Función para validar el formulario
  const validateForm = (): boolean => {
    let requiredFields: string[] = []

    // Para Control de regeneración de pinos, usar exactamente los campos definidos en la plantilla
    if (isControlRegeneracionTemplate(activeTemplate?.nombre)) {
      // Campos específicos para Control de regeneración de pinos
      requiredFields = ["estado", "fecha", "predio", "rodal", "cuadrilla", "implemento", "operarios", "ha", "jornales", "anioPlantacion"]
    } else if (isPreparacionTerrenoTemplate(activeTemplate?.nombre)) {
      // Campos específicos para Preparación de terreno
      requiredFields = ["fecha", "predio", "rodal", "cuadrilla", "implemento", "jornal", "ha"]
    } else if (activeTemplate?.nombre === "MANEJO REBROTE") {
      // Campos específicos para Manejo de rebrote
      requiredFields = ["estado", "fecha", "rodal", "predio", "cuadrilla", "implemento", "operarios", "ha", "anioPlantacion"]
    } else {
      // Para otras plantillas, usar la lógica existente
      requiredFields = ["fecha", "cuadrilla"]

      // Agregar cantPersonal solo si está definido en la plantilla
      if (activeTemplate?.campos?.some(c => c.id === "cantPersonal")) {
        requiredFields.push("cantPersonal")
      }

      // Agregar jornada solo si está definido en la plantilla
      if (activeTemplate?.campos?.some(c => c.id === "jornada")) {
        requiredFields.push("jornada")
      }

      // Agregar superficie solo si NO es control de regeneración, NO es preparación de terreno y NO es manejo de rebrote
      if (!isControlRegeneracionTemplate(activeTemplate?.nombre) && 
          !isPreparacionTerrenoTemplate(activeTemplate?.nombre) && 
          activeTemplate?.nombre !== "MANEJO REBROTE") {
        requiredFields.push("superficie")
      }
    }

    // Validaciones específicas por tipo de plantilla
    if (isPlantationTemplate(activeTemplate?.nombre)) {
      requiredFields.push("tipoCarga", "densidad", "vivero", "especie_forestal", "clon", "anioPlantacion")
      if (formData.tipoCarga === "Bandejas") {
        requiredFields.push("cantidadBandejas")
      } else if (formData.tipoCarga === "Rocambole") {
        requiredFields.push("cantidadPlantines")
      }
    } else if (isPodaTemplate(activeTemplate?.nombre)) {
      requiredFields.push("tipoPoda", "altura_poda", "cantidadPlantas", "densidad", "anioPlantacion")

      // Validaciones específicas para PODA
      if (!formData.tipoPoda || formData.tipoPoda.trim() === "") {
        setError("Debe seleccionar el tipo de poda")
        return false
      }

      const alturaPoda = Number(formData.altura_poda)
      if (alturaPoda <= 0) {
        setError("La altura de poda debe ser mayor a 0")
        return false
      }

      const cantidadPlantas = Number(formData.cantidadPlantas)
      if (cantidadPlantas <= 0) {
        setError("La cantidad de plantas debe ser mayor a 0")
        return false
      }

      const densidad = Number(formData.densidad)
      if (densidad <= 0) {
        setError("La densidad debe ser mayor a 0")
        return false
      }

      // Validar año de plantación para PODA
      const anioPlantacion = Number(formData.anioPlantacion)
      if (anioPlantacion < 1900 || anioPlantacion > 2030) {
        setError("El año de plantación debe estar entre 1900 y 2030")
        return false
      }
    } else if (isPlantationTemplate(activeTemplate?.nombre)) {
      // Validar año de plantación para PLANTACION
      const anioPlantacion = Number(formData.anioPlantacion)
      if (anioPlantacion < 1900 || anioPlantacion > 2030) {
        setError("El año de plantación debe estar entre 1900 y 2030")
        return false
      }
    } else if (isControlHormigasTemplate(activeTemplate?.nombre)) {
      requiredFields.push("numerosNidos", "especieHormiga", "producto", "cantidad")
    } else if (isControlMalezasTemplate(activeTemplate?.nombre)) {
      requiredFields.push("tipoAplicacion", "volumenAplicado")
      // Validar que al menos un producto esté completo
      const productosCompletos = productosMalezas.filter(
        (p) => p.producto && p.cantidad && p.unidad && Number(p.cantidad) > 0,
      )
      if (productosCompletos.length === 0) {
        setError("Debe agregar al menos un producto con cantidad válida")
        return false
      }
    } else if (isRaleoTemplate(activeTemplate?.nombre)) {
      requiredFields.push("especie")
    } else if (isQuemasControladasTemplate(activeTemplate?.nombre)) {
              requiredFields.push("horaR29", "horaR8", "horaR7", "horaR28", "cantPersonal", "jornada")
    } else if (activeTemplate?.nombre === "MANEJO REBROTE") {
      // Validaciones específicas para Manejo de rebrote
      const operarios = Number(formData.operarios)
      if (operarios <= 0) {
        setError("Los operarios deben ser mayor a 0")
        return false
      }

      const ha = Number(formData.ha)
      if (ha <= 0) {
        setError("Las hectáreas deben ser mayor a 0")
        return false
      }

      // Validar año de plantación para Manejo de rebrote
      const anioPlantacion = Number(formData.anioPlantacion)
      if (anioPlantacion < 1900 || anioPlantacion > 2030) {
        setError("El año de plantación debe estar entre 1900 y 2030")
        return false
      }
    } else if (isControlRegeneracionTemplate(activeTemplate?.nombre)) {
      // Validar año de plantación para Control de regeneración de pinos
      const anioPlantacion = Number(formData.anioPlantacion)
      if (anioPlantacion < 1900 || anioPlantacion > 2030) {
        setError("El año de plantación debe estar entre 1900 y 2030")
        return false
      }
    }

    // Debug: Log de campos requeridos y valores
    console.log("[VALIDACIÓN][DEBUG] Campos requeridos:", requiredFields)
    console.log("[VALIDACIÓN][DEBUG] FormData actual:", formData)
    console.log("[VALIDACIÓN][DEBUG] Plantilla activa:", activeTemplate?.nombre)
    
    // Validar campos requeridos
    for (const field of requiredFields) {
      const value = formData[field]
      console.log(`[VALIDACIÓN][DEBUG] Validando campo '${field}':`, value)
      if (!value || (typeof value === "string" && value.trim() === "")) {
        console.log(`[VALIDACIÓN][ERROR] Campo '${field}' está vacío o es inválido`)
        console.log(`[VALIDACIÓN][ERROR] Valor del campo '${field}':`, value)
        setError(`El campo ${field} es requerido`)
        return false
      }
    }

    // Validar superficie solo si NO es control de regeneración, NO es preparación de terreno y NO es manejo de rebrote
    if (!isControlRegeneracionTemplate(activeTemplate?.nombre) && 
        !isPreparacionTerrenoTemplate(activeTemplate?.nombre) && 
        activeTemplate?.nombre !== "MANEJO REBROTE") {
      const superficie = Number(formData.superficie)
      if (superficie <= 0) {
        setError("La superficie debe ser mayor a 0")
        return false
      }
    }
    
    // Validar Ha para preparación de terreno
    if (isPreparacionTerrenoTemplate(activeTemplate?.nombre)) {
      const ha = Number(formData.ha)
      if (ha <= 0) {
        setError("Las hectáreas deben ser mayor a 0")
        return false
      }
      
      const jornal = Number(formData.jornal)
      if (jornal <= 0) {
        setError("El jornal debe ser mayor a 0")
        return false
      }
    }

    // Validar personal solo si está definido en la plantilla y NO es control de regeneración
    if (!isControlRegeneracionTemplate(activeTemplate?.nombre) && activeTemplate?.campos?.some(c => c.id === "cantPersonal")) {
      const personal = Number(formData.cantPersonal)
      if (personal <= 0) {
        setError("La cantidad de personal debe ser mayor a 0")
        return false
      }
    }

    // Validar jornada solo si está definido en la plantilla y NO es control de regeneración
    if (!isControlRegeneracionTemplate(activeTemplate?.nombre) && activeTemplate?.campos?.some(c => c.id === "jornada")) {
      const jornada = Number(formData.jornada)
      if (jornada <= 0 || jornada > 24) {
        setError("La jornada debe estar entre 1 y 24 horas")
        return false
      }
    }

    return true
  }

  // Función para enviar el formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmittingForm(true)
    setError(null)
    setSuccess(false)

    try {
      // Preparar datos base
      let submitData: any = {
        ordenTrabajoId: workOrder.id,
        actividad: specificActivityName || workOrder.actividad,
        usuario: user?.name || user?.email || "Usuario",
      }

      // Para Control de regeneración de pinos, construir el objeto desde cero
      if (isControlRegeneracionTemplate(activeTemplate?.nombre)) {
        submitData = {
          ...submitData,
          estado: formData.estado || "Pendiente",
          fecha: formatDateForArgentina(formData.fecha || getCurrentDateForArgentina()),
          predio: formData.predio || workOrder?.campo || "",
          rodal: formData.rodal || "",
          cuadrilla: formData.cuadrilla || "",
          cuadrillaId: formData.cuadrillaId || "",
          implemento: formData.implemento || "",
          operarios: Number(formData.operarios || 0),
          ha: Number(formData.ha || 0),
          superficie: Number(formData.ha || 0), // Mapear ha a superficie para el backend
          jornales: Number(formData.jornales || 0),
          anioPlantacion: Number(formData.anioPlantacion || 0),
          observaciones: formData.observaciones || "",
        }
      } else if (isPreparacionTerrenoTemplate(activeTemplate?.nombre)) {
        // Para Preparación de terreno, construir el objeto específico
        submitData = {
          ...submitData,
          estado: formData.estado || "Pendiente",
          fecha: formatDateForArgentina(formData.fecha || getCurrentDateForArgentina()),
          predio: formData.predio || workOrder?.campo || "",
          rodal: formData.rodal || "",
          cuadrilla: formData.cuadrilla || "",
          cuadrillaId: formData.cuadrillaId || "",
          implemento: formData.implemento || "",
          jornal: Number(formData.jornal || 0),
          ha: Number(formData.ha || 0),
          superficie: Number(formData.ha || 0), // Mapear ha a superficie para el backend
          observaciones: formData.observaciones || "",
        }
      } else if (activeTemplate?.nombre === "MANEJO REBROTE") {
        // Para Manejo de rebrote, construir el objeto específico
        submitData = {
          ...submitData,
          estado: formData.estado || "Pendiente",
          fecha: formatDateForArgentina(formData.fecha || getCurrentDateForArgentina()),
          predio: formData.predio || workOrder?.campo || "",
          rodal: formData.rodal || "",
          cuadrilla: formData.cuadrilla || "",
          cuadrillaId: formData.cuadrillaId || "",
          implemento: formData.implemento || "",
          operarios: Number(formData.operarios || 0),
          ha: Number(formData.ha || 0),
          superficie: Number(formData.ha || 0), // Mapear ha a superficie para el backend
          anioPlantacion: Number(formData.anioPlantacion || 0),
          observaciones: formData.observaciones || "",
        }
      } else {
        // Para otras plantillas, usar la lógica existente
        submitData = {
          ...submitData,
          ...formData,
          superficie: Number(formData.superficie)
        }
      }

      // Agregar cantPersonal solo si está definido en la plantilla
      if (activeTemplate?.campos?.some(c => c.id === "cantPersonal")) {
        submitData.cantPersonal = Number(formData.cantPersonal)
      }

      // Agregar jornada solo si está definido en la plantilla
      if (activeTemplate?.campos?.some(c => c.id === "jornada")) {
        submitData.jornada = Number(formData.jornada)
      }

      // Agregar campos específicos según el tipo de plantilla
      if (isPlantationTemplate(activeTemplate?.nombre)) {
        if (formData.tipoCarga === "Bandejas") {
          submitData.cantidadBandejas = Number(formData.cantidadBandejas)
          submitData.totalPlantas = Number(formData.totalPlantas)
          submitData.cantidadPlantas = Number(formData.totalPlantas)
        } else if (formData.tipoCarga === "Rocambole") {
          submitData.cantidadPlantines = Number(formData.cantidadPlantines)
          submitData.cantidadPlantas = Number(formData.cantidadPlantines)
        }
        submitData.densidad = Number(formData.densidad)
        submitData.anioPlantacion = Number(formData.anioPlantacion || 0)
      } else if (isPodaTemplate(activeTemplate?.nombre)) {
        // Campos específicos de PODA
        submitData.tipoPoda = formData.tipoPoda || ""
        submitData.altura_poda = Number(formData.altura_poda || 0)
        submitData.plantas = Number(formData.cantidadPlantas || 0)
        submitData.cantidadPlantas = Number(formData.cantidadPlantas || 0)
        submitData.densidad = Number(formData.densidad || 0)
        submitData.anioPlantacion = Number(formData.anioPlantacion || 0)

        // Campos del sistema que deben incluirse
        submitData.predio = formData.predio || workOrder?.campo || ""
        submitData.estado = formData.estado || "Pendiente"
        submitData.rodal = formData.rodal || ""
        submitData.cuadrilla = formData.cuadrilla || ""
        submitData.cuadrillaId = formData.cuadrillaId || ""

        // Asegurar que los campos base también se incluyan
        submitData.fecha = formData.fecha || getCurrentDateForArgentina()
        submitData.superficie = Number(formData.superficie || 0)
        submitData.cantPersonal = Number(formData.cantPersonal || 0)
        submitData.jornada = Number(formData.jornada || 8)
        submitData.observaciones = formData.observaciones || ""
      } else if (isControlHormigasTemplate(activeTemplate?.nombre)) {
        submitData.cantidad = Number(formData.cantidad)
      } else if (isControlMalezasTemplate(activeTemplate?.nombre)) {
        submitData.volumenAplicado = Number(formData.volumenAplicado)
        submitData.cantidadMochilas = Number(formData.cantidadMochilas || 0)
        // Agregar productos válidos
        const productosValidos = productosMalezas.filter(
          (p) => p.producto && p.cantidad && p.unidad && Number(p.cantidad) > 0,
        )
        submitData.productos = productosValidos.map((p) => ({
          producto: p.producto,
          cantidad: Number(p.cantidad),
          unidad: p.unidad,
        }))
      } else if (isQuemasControladasTemplate(activeTemplate?.nombre)) {

        submitData.tiempoHs = Number(formData.tiempoHs)
        submitData.jornadaHs = Number(formData.jornadaHs)
        submitData.cantPersonal = Number(formData.cantPersonal)
        submitData.jornada = Number(formData.jornada)
      }

      // Agregar campos dinámicos de la plantilla
      if (activeTemplate?.campos) {
        activeTemplate.campos.forEach((campo: ActivityField) => {
          if (formData[campo.id] !== undefined && formData[campo.id] !== "") {
            if (campo.tipo === "numero") {
              submitData[campo.id] = Number(formData[campo.id])
            } else {
              submitData[campo.id] = formData[campo.id]
            }
          }
        })
      }

      // Agregar el supervisorId desde la orden de trabajo
      submitData.supervisorId = workOrder.supervisor_id || null;

      // Siempre guardar el nombre y el ID de la cuadrilla, para todas las plantillas
      submitData.cuadrilla = formData.cuadrilla || ""
      submitData.cuadrillaId = formData.cuadrillaId || ""
      submitData.cuadrillaNombre = formData.cuadrilla || ""

      // Siempre incluir campos de sistema en el avance
      submitData.predio = formData.predio || workOrder?.campo || ""
      submitData.numeroOrden = workOrder?.numero || workOrder?.id || ""
      submitData.ordenTrabajoId = workOrder?.id || ""
      submitData.proveedorId = workOrder?.proveedorId || workOrder?.proveedor_id || ""
      // Buscar el nombre del proveedor en el array de providers
      const proveedorId = workOrder?.proveedorId || workOrder?.proveedor_id || ""
      let proveedorNombre = ""
      if (proveedorId && providers && providers.length > 0) {
        const found = providers.find(p => String(p.id) === String(proveedorId))
        if (found) {
          proveedorNombre = found.nombre
        }
      }
      // Fallbacks si no se encuentra
      if (!proveedorNombre) {
        proveedorNombre = workOrder?.proveedor || workOrder?.proveedorNombre || workOrder?.proveedor_id || (proveedorId ? String(proveedorId) : "Sin asignar")
      }
      submitData.proveedorNombre = proveedorNombre
      submitData.campo = workOrder?.campo || ""
      // ... puedes agregar aquí otros campos de sistema relevantes ...

      // Log para debug
      console.log("[ENVÍO][DEBUG] Datos del formulario:", formData)
      console.log("[ENVÍO][DEBUG] Plantilla activa:", activeTemplate?.nombre)
      console.log("[ENVÍO][DEBUG] Datos a enviar:", submitData)
      console.log("[ENVÍO][DEBUG] Validación pasó:", true)

      // ✅ NUEVA VALIDACIÓN: Verificar que la superficie sea correcta
      if (submitData.superficie && submitData.superficie > 0) {
        const superficieCalculada = submitData.cantidadPlantas && submitData.densidad 
          ? submitData.cantidadPlantas / submitData.densidad 
          : null
        
        console.log("[ENVÍO][VALIDACIÓN] Superficie a enviar:", submitData.superficie)
        console.log("[ENVÍO][VALIDACIÓN] Superficie recalculada:", superficieCalculada)
        
        if (superficieCalculada && Math.abs(submitData.superficie - superficieCalculada) > 0.1) {
          console.warn("[ENVÍO][VALIDACIÓN] ⚠️ Diferencia detectada en superficie:", {
            enviada: submitData.superficie,
            calculada: superficieCalculada,
            diferencia: Math.abs(submitData.superficie - superficieCalculada)
          })
        }
      }

      console.log("[ENVÍO][DEBUG] Llamando a onSubmit con:", submitData)
      const result = await onSubmit(submitData)
      console.log("[ENVÍO][DEBUG] Resultado de onSubmit:", result)

      if (result.success) {
        setSuccess(true)
        setError(null)
      } else {
        throw new Error(result.error || "Error al procesar la solicitud")
      }
    } catch (error) {
      console.error("❌ Error al enviar formulario:", error)
      setError(error.message || "Error al procesar la solicitud")
      setSuccess(false)
    } finally {
      setIsSubmittingForm(false)
    }
  }

  // Renderizar formulario genérico basado en plantilla
  const renderGenericForm = () => {
    if (!activeTemplate?.campos) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No se encontró plantilla para esta actividad</p>
        </div>
      )
    }

    // Filtrar campos de sistema
    const camposSistema = [
      "estado", "fecha", "predio", "rodal", "cuadrilla"
    ];

    return (
      <>
        {/* Estado del Trabajo - ESTILO DESTACADO */}
        {activeTemplate.campos.some(c => c.id === "estado") && (
          <div className="col-span-2 space-y-2 p-4 bg-orange-50 border border-orange-200 rounded-md mb-4">
            <Label htmlFor="estado-trabajo" className="text-lg font-semibold text-orange-800">
              Estado del Trabajo <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.estado || "Pendiente"}
              onValueChange={(newValue) => handleInputChange("estado", newValue)}
            >
              <SelectTrigger id="estado-trabajo" className="h-12 text-base">
                <SelectValue placeholder="Seleccionar estado del trabajo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Pendiente">Pendiente</SelectItem>
                <SelectItem value="R7 (terminado)">R7 (terminado)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Fecha */}
          {activeTemplate.campos.some(c => c.id === "fecha") && (
            <div className="space-y-2">
              <Label htmlFor="fecha">
                Fecha <span className="text-red-500">*</span>
              </Label>
              <Input
                id="fecha"
                type="date"
                value={formData.fecha || ""}
                onChange={(e) => handleInputChange("fecha", e.target.value)}
                required={true}
              />
            </div>
          )}
          {/* Rodal */}
          {activeTemplate.campos.some(c => c.id === "rodal") && (
            <div className="space-y-2">
              <Label htmlFor="rodal">
                Rodal <span className="text-red-500">*</span>
              </Label>
              <Select value={formData.rodal || ""} onValueChange={(newValue) => handleInputChange("rodal", newValue)}>
                <SelectTrigger id="rodal">
                  <SelectValue placeholder="Seleccionar rodal" />
                </SelectTrigger>
                <SelectContent>
                  {workOrder.rodales && workOrder.rodales.length > 0 ? (
                    workOrder.rodales.map((rodal) => (
                      <SelectItem key={rodal.numero} value={String(rodal.numero)}>
                        #{rodal.numero} - Total: {rodal.hectareas} ha
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="sin-rodales">Sin rodales</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}
          {/* Predio/Campo */}
          {activeTemplate.campos.some(c => c.id === "predio") && (
            <div className="space-y-2">
              <Label htmlFor="predio">
                Predio/Campo <span className="text-red-500">*</span>
              </Label>
              <Input
                id="predio"
                type="text"
                value={formData.predio || workOrder?.campo || ""}
                readOnly
                disabled
                className="bg-gray-100 cursor-not-allowed"
              />
            </div>
          )}
          {/* Cuadrilla */}
          {activeTemplate.campos.some(c => c.id === "cuadrilla") && (
            <div className="space-y-2">
              <Label htmlFor="cuadrilla">
                Cuadrilla <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.cuadrilla || ""}
                onValueChange={(newValue) => {
                  let cuadrillaSeleccionada = cuadrillas.find((c) => {
                    const nombre = c.nombre || c.descripcion || ""
                    return nombre === newValue
                  })
                  if (!cuadrillaSeleccionada) {
                    cuadrillaSeleccionada = cuadrillas.find((c) => {
                      const id = c._id || c.id || c.idcuadrilla || ""
                      return id === newValue
                    })
                  }
                  if (cuadrillaSeleccionada) {
                    const id = cuadrillaSeleccionada._id || cuadrillaSeleccionada.id || cuadrillaSeleccionada.idcuadrilla || ""
                    const nombre = cuadrillaSeleccionada.nombre || cuadrillaSeleccionada.descripcion || `Cuadrilla ${id}`
                    handleInputChange("cuadrillaId", String(id))
                    handleInputChange("cuadrilla", nombre)
                  } else {
                    handleInputChange("cuadrillaId", "")
                    handleInputChange("cuadrilla", "")
                  }
                }}
              >
                <SelectTrigger id="cuadrilla">
                  <SelectValue placeholder="Seleccionar cuadrilla" />
                </SelectTrigger>
                <SelectContent>
                  {cuadrillas && cuadrillas.length > 0 ? (
                    cuadrillas.map((c) => {
                      const id = c._id || c.id || c.idcuadrilla || ""
                      const nombre = c.nombre || c.descripcion || `Cuadrilla ${id}`
                      return (
                        <SelectItem key={id} value={nombre}>
                          {nombre}
                        </SelectItem>
                      )
                    })
                  ) : (
                    <SelectItem value="sin-cuadrillas">Sin cuadrillas</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}
          {/* Renderizar el resto de los campos que no son de sistema */}
          {activeTemplate.campos.filter(campo => !camposSistema.includes(campo.id)).map((campo: ActivityField) => (
            <div key={campo.id} className="space-y-2">
              <Label htmlFor={campo.id}>
                {campo.nombre} {campo.requerido && <span className="text-red-500">*</span>}
              </Label>
              {campo.tipo === "texto" && (
                <Input
                  id={campo.id}
                  type="text"
                  value={formData[campo.id] || ""}
                  onChange={(e) => handleInputChange(campo.id, e.target.value)}
                  placeholder={campo.placeholder}
                  required={campo.requerido}
                />
              )}
              {campo.tipo === "numero" && (
                <Input
                  id={campo.id}
                  type="number"
                  step={campo.id.includes("superficie") ? "0.0001" : "1"}
                  min="0"
                  value={formData[campo.id] || ""}
                  onChange={(e) => handleInputChange(campo.id, e.target.value)}
                  placeholder={campo.placeholder}
                  required={campo.requerido}
                />
              )}
              {campo.tipo === "fecha" && (
                <Input
                  id={campo.id}
                  type="date"
                  value={formData[campo.id] || ""}
                  onChange={(e) => handleInputChange(campo.id, e.target.value)}
                  required={campo.requerido}
                />
              )}
              {campo.tipo === "seleccion" && (
                <Select
                  value={formData[campo.id] || ""}
                  onValueChange={(newValue) => handleInputChange(campo.id, newValue)}
                >
                  <SelectTrigger id={campo.id}>
                    <SelectValue placeholder={campo.placeholder || `Seleccionar ${campo.nombre.toLowerCase()}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {campo.opciones?.map((opcion) => (
                      <SelectItem key={opcion} value={opcion}>
                        {opcion}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {(campo.tipo === "area" || campo.tipo === "textarea") && (
                <Textarea
                  id={campo.id}
                  value={formData[campo.id] || ""}
                  onChange={(e) => handleInputChange(campo.id, e.target.value)}
                  placeholder={campo.placeholder}
                  className="min-h-[100px]"
                  required={campo.requerido}
                />
              )}
            </div>
          ))}
        </div>
      </>
    )
  }

  if (templatesLoading || loadingCuadrillas || loadingRodalProgress || loadingPlantationData) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <p>Cargando formulario...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (templatesError) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Error al cargar las plantillas: {templatesError}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isEditing ? "✏️ Editar Avance" : "📝 Registrar Avance"}
          <span className="text-sm font-normal text-muted-foreground">
            - {specificActivityName || workOrder.actividad}
          </span>
        </CardTitle>
        <CardDescription>
          {isEditing ? "Modifica los datos del avance seleccionado" : `Orden #${workOrder.numero} - ${workOrder.campo}`}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Renderizar formulario específico según el tipo de actividad */}
          {isPlantationTemplate(activeTemplate?.nombre)
            ? renderPlantacionForm()
            : isPodaTemplate(activeTemplate?.nombre)
              ? renderPodaForm()
              : isControlHormigasTemplate(activeTemplate?.nombre)
                ? renderControlHormigasForm()
                : isControlMalezasTemplate(activeTemplate?.nombre)
                  ? renderControlMalezasForm()
                  : isRaleoTemplate(activeTemplate?.nombre)
                    ? renderRaleoForm()
                    : isQuemasControladasTemplate(activeTemplate?.nombre)
                      ? renderQuemasControladasForm()
                      : isPreparacionTerrenoTemplate(activeTemplate?.nombre)
                        ? renderGenericForm()
                        : renderGenericForm()}

          {/* Mensajes de estado */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                {isEditing ? "Avance actualizado correctamente" : "Avance registrado correctamente"}
              </AlertDescription>
            </Alert>
          )}
        </form>
      </CardContent>

      <CardFooter className="flex justify-end gap-2">
        <Button
          type="submit"
          onClick={handleSubmit}
          disabled={isSubmittingForm || isSubmitting}
          className="min-w-[120px]"
        >
          {isSubmittingForm || isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              {isEditing ? "Actualizando..." : "Guardando..."}
            </>
          ) : (
            <>{isEditing ? "💾 Actualizar Avance" : "💾 Guardar Avance"}</>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
