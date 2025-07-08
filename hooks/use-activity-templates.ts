"use client"

import { useState, useEffect, useMemo } from "react"

export interface ActivityField {
  id: string
  nombre: string
  tipo: "texto" | "numero" | "fecha" | "seleccion" | "checkbox" | "textarea" | "dinamico"
  requerido: boolean
  orden?: number
  opciones?: string[]
  placeholder?: string
  unidad?: string
  descripcion?: string
  esDelSistema?: boolean
}

export interface ActivityTemplate {
  id: string
  nombre: string
  descripcion: string
  actividadCodigo?: string
  categoria: string
  unidad: string
  patronesCoincidencia: string[]
  campos: ActivityField[]
  activo: boolean
}

// Plantillas predefinidas consolidadas
const DEFAULT_TEMPLATES: ActivityTemplate[] = [
  {
    id: "poda-template",
    nombre: "PODA",
    descripcion: "Plantilla para actividades de poda",
    actividadCodigo: "SAP001",
    categoria: "Silvicultura",
    unidad: "Ha",
    patronesCoincidencia: [
      "poda",
      "primera poda",
      "segunda poda",
      "tercera poda",
      "poda de formación",
      "poda sanitaria",
      "poda de formacion",
      "poda sanitaria",
    ],
    campos: [
      { id: "fecha", nombre: "Fecha", tipo: "fecha", requerido: true, orden: 1, esDelSistema: true },
      { id: "rodal", nombre: "Rodal", tipo: "seleccion", requerido: true, orden: 2, esDelSistema: true },
      { id: "predio", nombre: "Predio/Campo", tipo: "texto", requerido: true, orden: 3, esDelSistema: true },
      { id: "cuadrilla", nombre: "Cuadrilla", tipo: "seleccion", requerido: true, orden: 4, esDelSistema: true },
      {
        id: "cantPersonal",
        nombre: "Cantidad de Personal",
        tipo: "numero",
        requerido: true,
        orden: 5,
        esDelSistema: true,
      },
      { id: "jornada", nombre: "Jornada (hs)", tipo: "numero", requerido: true, orden: 6, esDelSistema: true },
      {
        id: "estado",
        nombre: "Estado",
        tipo: "seleccion",
        requerido: true,
        orden: 7,
        opciones: ["Pendiente", "R7 (terminado)"],
        esDelSistema: true,
      },
      {
        id: "tipoPoda",
        nombre: "Tipo de Poda",
        tipo: "seleccion",
        requerido: true,
        orden: 8,
        opciones: ["Primera poda", "Segunda poda", "Tercera poda"],
        esDelSistema: true,
      },
      {
        id: "densidad",
        nombre: "Densidad",
        tipo: "numero",
        requerido: true,
        orden: 9,
        placeholder: "Plantas por hectárea",
        unidad: "plantas/ha",
        descripcion: "Densidad específica para este período de poda",
        esDelSistema: true,
      },
      {
        id: "cantidadPlantas",
        nombre: "Cantidad de Plantas",
        tipo: "numero",
        requerido: true,
        orden: 10,
        unidad: "plantas",
        descripcion: "Número de plantas podadas",
        esDelSistema: true,
      },
      {
        id: "superficie",
        nombre: "Superficie (Ha)",
        tipo: "numero",
        requerido: true,
        orden: 11,
        unidad: "Ha",
        placeholder: "Se calcula automáticamente basándose en densidad y plantas",
        descripcion: "Superficie calculada automáticamente",
        esDelSistema: true,
      },
      {
        id: "altura_poda",
        nombre: "Altura de Poda (m)",
        tipo: "numero",
        requerido: true,
        orden: 12,
        unidad: "metros",
        descripcion: "Altura de poda realizada",
        esDelSistema: true,
      },
      {
        id: "observaciones",
        nombre: "Observaciones",
        tipo: "textarea",
        requerido: false,
        orden: 13,
        esDelSistema: false,
      },
    ],
    activo: true,
  },
  {
    id: "raleo-template",
    nombre: "RALEO",
    descripcion: "Plantilla para actividades de raleo de plantaciones",
    actividadCodigo: "SAP002",
    categoria: "Silvicultura",
    unidad: "Ha",
    patronesCoincidencia: ["raleo", "raleo a desecho", "primer raleo", "segundo raleo", "raleo comercial"],
    campos: [
      { id: "fecha", nombre: "Fecha", tipo: "fecha", requerido: true, orden: 1, esDelSistema: true },
      { id: "rodal", nombre: "Rodal", tipo: "seleccion", requerido: true, orden: 2, esDelSistema: true },
      { id: "predio", nombre: "Predio/Campo", tipo: "texto", requerido: true, orden: 3, esDelSistema: true },
      { id: "cuadrilla", nombre: "Cuadrilla", tipo: "seleccion", requerido: true, orden: 4, esDelSistema: true },
      {
        id: "cantPersonal",
        nombre: "Cantidad de Personal",
        tipo: "numero",
        requerido: true,
        orden: 5,
        esDelSistema: true,
      },
      { id: "jornada", nombre: "Jornada (hs)", tipo: "numero", requerido: true, orden: 6, esDelSistema: true },
      {
        id: "estado",
        nombre: "Estado",
        tipo: "seleccion",
        requerido: true,
        orden: 7,
        opciones: ["Pendiente", "R7 (terminado)"],
        esDelSistema: true,
      },
      {
        id: "superficie",
        nombre: "Superficie (Ha)",
        tipo: "numero",
        requerido: true,
        orden: 8,
        unidad: "Ha",
        esDelSistema: true,
      },
      {
        id: "especie",
        nombre: "Especie",
        tipo: "seleccion",
        requerido: true,
        orden: 9,
        opciones: ["Pino", "Eucalipto"],
        esDelSistema: true,
      },
      {
        id: "cantidadPlantas",
        nombre: "Cantidad de Plantas",
        tipo: "numero",
        requerido: true,
        orden: 10,
        unidad: "plantas",
        esDelSistema: true,
      },
      {
        id: "densidad",
        nombre: "Densidad (plantas/ha)",
        tipo: "numero",
        requerido: true,
        orden: 11,
        unidad: "plantas/ha",
        esDelSistema: true,
      },
      {
        id: "observaciones",
        nombre: "Observaciones",
        tipo: "textarea",
        requerido: false,
        orden: 12,
        esDelSistema: false,
      },
    ],
    activo: true,
  },
  {
    id: "plantacion-template",
    nombre: "PLANTACION",
    descripcion: "Plantilla para actividades de plantación",
    actividadCodigo: "SAP003",
    categoria: "Silvicultura",
    unidad: "Ha",
    patronesCoincidencia: ["plantacion", "plantación", "plantado", "implantacion", "implantación"],
    campos: [
      { id: "fecha", nombre: "Fecha", tipo: "fecha", requerido: true, orden: 1, esDelSistema: true },
      { id: "rodal", nombre: "Rodal", tipo: "seleccion", requerido: true, orden: 2, esDelSistema: true },
      { id: "predio", nombre: "Predio/Campo", tipo: "texto", requerido: true, orden: 3, esDelSistema: true },
      { id: "cuadrilla", nombre: "Cuadrilla", tipo: "seleccion", requerido: true, orden: 4, esDelSistema: true },
      {
        id: "cantPersonal",
        nombre: "Cantidad de Personal",
        tipo: "numero",
        requerido: true,
        orden: 5,
        esDelSistema: true,
      },
      { id: "jornada", nombre: "Jornada (hs)", tipo: "numero", requerido: true, orden: 6, esDelSistema: true },
      {
        id: "estado",
        nombre: "Estado",
        tipo: "seleccion",
        requerido: true,
        orden: 7,
        opciones: ["Pendiente", "R7 (terminado)"],
        esDelSistema: true,
      },
      {
        id: "vivero",
        nombre: "Vivero",
        tipo: "seleccion",
        requerido: true,
        orden: 8,
        placeholder: "Seleccionar vivero",
        opciones: ["Vivero Central", "Vivero Norte", "Vivero Sur"],
        esDelSistema: true,
      },
      {
        id: "especie",
        nombre: "Especie Forestal",
        tipo: "seleccion",
        requerido: true,
        orden: 9,
        placeholder: "Seleccionar especie",
        opciones: ["Eucalyptus", "Pinus", "Acacia"],
        esDelSistema: true,
      },
      {
        id: "clon",
        nombre: "Clon",
        tipo: "seleccion",
        requerido: true,
        orden: 10,
        placeholder: "Seleccionar clon",
        opciones: ["Clon A", "Clon B", "Clon C"],
        esDelSistema: true,
      },
      {
        id: "tipoCarga",
        nombre: "Tipo de Carga",
        tipo: "seleccion",
        requerido: true,
        orden: 11,
        placeholder: "Seleccionar tipo de carga",
        opciones: ["Bandejas", "Rocambole"],
        esDelSistema: true,
      },
      {
        id: "densidad",
        nombre: "Densidad",
        tipo: "numero",
        requerido: true,
        orden: 12,
        placeholder: "Plantas por hectárea",
        unidad: "plantas/ha",
        esDelSistema: true,
      },
      {
        id: "cantidadBandejas",
        nombre: "Cantidad de Bandejas",
        tipo: "numero",
        requerido: false,
        orden: 13,
        placeholder: "Número de bandejas (40 plantines por bandeja)",
        unidad: "bandejas",
        esDelSistema: true,
      },
      {
        id: "totalPlantas",
        nombre: "Total de Plantas",
        tipo: "numero",
        requerido: false,
        orden: 14,
        placeholder: "Se calcula automáticamente (bandejas × 40)",
        unidad: "plantas",
        esDelSistema: true,
      },
      {
        id: "rocambole",
        nombre: "Rocambole",
        tipo: "seleccion",
        requerido: false,
        orden: 15,
        placeholder: "Seleccionar rocambole",
        opciones: ["Rocambole A", "Rocambole B", "Rocambole C"],
        esDelSistema: true,
      },
      {
        id: "cantidadPlantines",
        nombre: "Cantidad de Plantines",
        tipo: "numero",
        requerido: false,
        orden: 16,
        placeholder: "Número de plantines",
        unidad: "plantines",
        esDelSistema: true,
      },
      {
        id: "superficie",
        nombre: "Superficie (Ha)",
        tipo: "numero",
        requerido: true,
        orden: 17,
        placeholder: "Se calcula automáticamente basándose en densidad y plantas",
        unidad: "Ha",
        esDelSistema: true,
      },
      {
        id: "observaciones",
        nombre: "Observaciones",
        tipo: "textarea",
        requerido: false,
        orden: 18,
        esDelSistema: false,
      },
    ],
    activo: true,
  },
  {
    id: "control-hormigas-template",
    nombre: "CONTROL DE HORMIGAS",
    descripcion: "Plantilla para actividades de control de hormigas en plantaciones forestales",
    actividadCodigo: "SAP007",
    categoria: "Control de Plagas",
    unidad: "Ha",
    patronesCoincidencia: [
      "control de hormigas",
      "control hormigas",
      "hormigas",
      "hormiguicida",
      "tratamiento hormigas",
    ],
    campos: [
      {
        id: "fecha",
        nombre: "Fecha",
        tipo: "fecha",
        requerido: true,
        orden: 1,
        descripcion: "Fecha de realización del control de hormigas",
        esDelSistema: true,
      },
      {
        id: "rodal",
        nombre: "Rodal",
        tipo: "seleccion",
        requerido: true,
        orden: 2,
        descripcion: "Rodal donde se aplica el control",
        esDelSistema: true,
      },
      {
        id: "predio",
        nombre: "Predio/Campo",
        tipo: "texto",
        requerido: true,
        orden: 3,
        descripcion: "Campo donde se realiza el control",
        esDelSistema: true,
      },
      {
        id: "cuadrilla",
        nombre: "Cuadrilla",
        tipo: "seleccion",
        requerido: true,
        orden: 4,
        descripcion: "Cuadrilla asignada al trabajo",
        esDelSistema: true,
      },
      {
        id: "cantPersonal",
        nombre: "Cantidad de Personal",
        tipo: "numero",
        requerido: true,
        orden: 5,
        descripcion: "Número de personas en la cuadrilla",
        esDelSistema: true,
      },
      {
        id: "jornada",
        nombre: "Jornada (hs)",
        tipo: "numero",
        requerido: true,
        orden: 6,
        descripcion: "Horas trabajadas",
        esDelSistema: true,
      },
      {
        id: "estado",
        nombre: "Estado",
        tipo: "seleccion",
        requerido: true,
        orden: 7,
        opciones: ["Pendiente", "R7 (terminado)"],
        descripcion: "Estado del trabajo",
        esDelSistema: true,
      },
      {
        id: "producto",
        nombre: "Producto",
        tipo: "seleccion",
        requerido: true,
        orden: 8,
        opciones: ["Mirex-S", "Attamex", "Blitz", "Hormigon", "Lorsban", "Otro"],
        descripcion: "Producto hormiguicida utilizado",
        esDelSistema: true,
      },
      {
        id: "cantidad",
        nombre: "Cantidad (kg)",
        tipo: "numero",
        requerido: true,
        orden: 9,
        unidad: "kg",
        descripcion: "Cantidad de producto aplicado en kilogramos",
        esDelSistema: true,
      },
      {
        id: "superficie",
        nombre: "Superficie (Ha)",
        tipo: "numero",
        requerido: true,
        orden: 10,
        unidad: "Ha",
        descripcion: "Superficie tratada en hectáreas",
        esDelSistema: true,
      },
      {
        id: "numerosNidos",
        nombre: "Números de Nidos por Rodal",
        tipo: "numero",
        requerido: true,
        orden: 11,
        unidad: "nidos",
        descripcion: "Cantidad de nidos encontrados",
        esDelSistema: true,
      },
      {
        id: "especieHormiga",
        nombre: "Especie de Hormiga",
        tipo: "seleccion",
        requerido: true,
        orden: 12,
        opciones: ["Negra", "Roja"],
        descripcion: "Especie de hormiga encontrada",
        esDelSistema: true,
      },
      {
        id: "observaciones",
        nombre: "Observaciones",
        tipo: "textarea",
        requerido: false,
        orden: 13,
        descripcion: "Observaciones adicionales",
        esDelSistema: false,
      },
    ],
    activo: true,
  },
  {
    id: "control-malezas-template",
    nombre: "CONTROL DE MALEZAS",
    descripcion: "Plantilla para actividades de control de malezas pre y post plantación",
    actividadCodigo: "SAP008",
    categoria: "Control de Malezas",
    unidad: "Ha",
    patronesCoincidencia: [
      "control de malezas",
      "control malezas",
      "malezas",
      "herbicida",
      "desmalezado",
      "control de malezas pre plantacion",
      "control de malezas post plantacion",
      "malezas pre plantacion",
      "malezas post plantacion",
    ],
    campos: [
      { id: "fecha", nombre: "Fecha", tipo: "fecha", requerido: true, orden: 1, esDelSistema: true },
      { id: "rodal", nombre: "Rodal", tipo: "seleccion", requerido: true, orden: 2, esDelSistema: true },
      { id: "predio", nombre: "Predio/Campo", tipo: "texto", requerido: true, orden: 3, esDelSistema: true },
      { id: "cuadrilla", nombre: "Cuadrilla", tipo: "seleccion", requerido: true, orden: 4, esDelSistema: true },
      {
        id: "cantPersonal",
        nombre: "Cantidad de Personal",
        tipo: "numero",
        requerido: true,
        orden: 5,
        esDelSistema: true,
      },
      { id: "jornada", nombre: "Jornada (hs)", tipo: "numero", requerido: true, orden: 6, esDelSistema: true },
      {
        id: "estado",
        nombre: "Estado",
        tipo: "seleccion",
        requerido: true,
        orden: 7,
        opciones: ["Pendiente", "R7 (terminado)"],
        esDelSistema: true,
      },
      {
        id: "subActividad",
        nombre: "Sub Actividad",
        tipo: "seleccion",
        requerido: true,
        orden: 8,
        opciones: [
          "Ctrl QRebrote",
          "HT manual",
          "HT mecanizado",
          "HB mecanizado",
          "HB manual",
          "Pulpo Fordor",
          "Lineo corrido manual",
          "Lineo corrido pulpo",
          "Entrelinea manual",
          "Cajon - entrelinea",
          "Entrelinea Pulpo",
          "Pico Libre",
        ],
        esDelSistema: true,
      },
      {
        id: "superficie",
        nombre: "Superficie (Ha)",
        tipo: "numero",
        requerido: true,
        orden: 9,
        unidad: "Ha",
        esDelSistema: true,
      },
      {
        id: "tipoAplicacion",
        nombre: "Tipo de Aplicación",
        tipo: "seleccion",
        requerido: true,
        orden: 10,
        opciones: ["Mochila", "Mecanizado", "Drone", "Avion", "Tractor c/Pulpo", "Tractor c/Cajon"],
        esDelSistema: true,
      },
      {
        id: "cantidad",
        nombre: "Cantidad",
        tipo: "numero",
        requerido: true,
        orden: 11,
        unidad: "L/Ha",
        esDelSistema: true,
      },
      {
        id: "volumenAplicado",
        nombre: "Volumen Aplicado",
        tipo: "numero",
        requerido: true,
        orden: 12,
        unidad: "L",
        esDelSistema: true,
      },
      {
        id: "cantidadMochilas",
        nombre: "Cantidad de Mochilas",
        tipo: "numero",
        requerido: true,
        orden: 13,
        unidad: "mochilas",
        esDelSistema: true,
      },
      {
        id: "productos",
        nombre: "Productos",
        tipo: "dinamico",
        requerido: true,
        orden: 14,
        placeholder: "Productos herbicidas utilizados (hasta 5 productos)",
        esDelSistema: true,
      },
      {
        id: "observaciones",
        nombre: "Observaciones",
        tipo: "textarea",
        requerido: false,
        orden: 15,
        esDelSistema: false,
      },
    ],
    activo: true,
  },
  {
    id: "quemas-controladas-template",
    nombre: "QUEMAS CONTROLADAS",
    descripcion: "Plantilla para actividades de quemas controladas en plantaciones forestales",
    actividadCodigo: "SAP009",
    categoria: "Manejo Forestal",
    unidad: "Ha",
    patronesCoincidencia: [
      "quemas controladas",
      "quema controlada",
      "quemas",
      "quema prescrita",
      "quema dirigida",
      "control de combustible",
      "reduccion de combustible",
      "manejo de fuego",
      "quema",
    ],
    campos: [
      {
        id: "fecha",
        nombre: "Fecha",
        tipo: "fecha",
        requerido: true,
        orden: 1,
        descripcion: "Fecha de realización de la quema controlada",
        esDelSistema: true,
      },
      {
        id: "rodal",
        nombre: "Rodal",
        tipo: "seleccion",
        requerido: true,
        orden: 2,
        descripcion: "Rodal donde se realiza la quema",
        esDelSistema: true,
      },
      {
        id: "predio",
        nombre: "Predio/Campo",
        tipo: "texto",
        requerido: true,
        orden: 3,
        descripcion: "Campo donde se realiza la quema",
        esDelSistema: true,
      },
      {
        id: "cuadrilla",
        nombre: "Cuadrilla",
        tipo: "seleccion",
        requerido: true,
        orden: 4,
        descripcion: "Cuadrilla asignada al trabajo",
        esDelSistema: true,
      },
      {
        id: "superficie",
        nombre: "Superficie (Ha)",
        tipo: "numero",
        requerido: true,
        orden: 5,
        unidad: "Ha",
        descripcion: "Superficie a quemar en hectáreas",
        esDelSistema: true,
      },
      {
        id: "estado",
        nombre: "Estado",
        tipo: "seleccion",
        requerido: true,
        orden: 6,
        opciones: ["Pendiente", "R7 (terminado)"],
        descripcion: "Estado del trabajo",
        esDelSistema: true,
      },
      {
        id: "areaOperarios",
        nombre: "Área Operarios",
        tipo: "numero",
        requerido: true,
        orden: 7,
        unidad: "operarios",
        descripcion: "Número de operarios asignados a la quema",
        esDelSistema: true,
      },
      {
        id: "horaR29",
        nombre: "R29 - Salida hacia Actividad",
        tipo: "texto",
        requerido: true,
        orden: 8,
        placeholder: "HH:MM",
        descripcion: "Hora de salida hacia la actividad",
        esDelSistema: true,
      },
      {
        id: "horaR8",
        nombre: "R8 - Inicio Actividad",
        tipo: "texto",
        requerido: true,
        orden: 9,
        placeholder: "HH:MM",
        descripcion: "Hora de inicio de la actividad",
        esDelSistema: true,
      },
      {
        id: "horaR7",
        nombre: "R7 - Término Actividad",
        tipo: "texto",
        requerido: true,
        orden: 10,
        placeholder: "HH:MM",
        descripcion: "Hora de término de la actividad",
        esDelSistema: true,
      },
      {
        id: "horaR28",
        nombre: "R28 - Regreso a Base",
        tipo: "texto",
        requerido: true,
        orden: 11,
        placeholder: "HH:MM",
        descripcion: "Hora de regreso a base",
        esDelSistema: true,
      },
      {
        id: "tiempoHs",
        nombre: "Tiempo (hs)",
        tipo: "numero",
        requerido: false,
        orden: 12,
        unidad: "horas",
        placeholder: "Se calcula automáticamente (R8-R7)",
        descripcion: "Tiempo efectivo de trabajo calculado automáticamente",
        esDelSistema: true,
      },
      {
        id: "jornadaHs",
        nombre: "Jornada (hs)",
        tipo: "numero",
        requerido: false,
        orden: 13,
        unidad: "horas",
        placeholder: "Se calcula automáticamente (Tiempo × Operarios)",
        descripcion: "Jornada total calculada automáticamente",
        esDelSistema: true,
      },
      {
        id: "comentarios",
        nombre: "Comentarios",
        tipo: "textarea",
        requerido: false,
        orden: 14,
        descripcion: "Comentarios y observaciones sobre la quema controlada",
        esDelSistema: false,
      },
    ],
    activo: true,
  },
]

export function useActivityTemplates() {
  const [templates, setTemplates] = useState<ActivityTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Cargar plantillas desde localStorage o usar las predefinidas
    try {
      const storedTemplates = localStorage.getItem("activity-templates")
      let finalTemplates = DEFAULT_TEMPLATES

      if (storedTemplates) {
        const parsed = JSON.parse(storedTemplates)

        // Verificar si hay nuevas plantillas predefinidas que no están en localStorage
        const storedIds = new Set(parsed.map((t: ActivityTemplate) => t.id))
        const newTemplates = DEFAULT_TEMPLATES.filter((t) => !storedIds.has(t.id))

        if (newTemplates.length > 0) {
          // Hay nuevas plantillas, combinar con las existentes
          finalTemplates = [...parsed, ...newTemplates]
         
        } else {
          // No hay nuevas plantillas, usar las almacenadas
          finalTemplates = parsed
        }
      }

      // Guardar las plantillas actualizadas
      setTemplates(finalTemplates)
      localStorage.setItem("activity-templates", JSON.stringify(finalTemplates))
    } catch (err) {
      console.error("Error loading templates:", err)
      setTemplates(DEFAULT_TEMPLATES)
      localStorage.setItem("activity-templates", JSON.stringify(DEFAULT_TEMPLATES))
      setError("Error al cargar plantillas, usando plantillas predefinidas")
    } finally {
      setLoading(false)
    }
  }, [])

  const getTemplateForWorkOrder = useMemo(() => {
    return (workOrder: { actividad: string; actividadCodigo?: string }) => {
      if (!workOrder || !workOrder.actividad) {
       
        return { template: null, specificActivityName: "" }
      }

      const activityName = workOrder.actividad.toLowerCase().trim()
      const activityCode = workOrder.actividadCodigo?.toLowerCase() || ""

     

      // Buscar plantilla que coincida con los patrones - ORDEN ESPECÍFICO MEJORADO
      let matchedTemplate = null

      // 1. PRIMERO: Buscar coincidencias exactas por nombre de plantilla
      matchedTemplate = templates.find((template) => {
        if (!template.activo) return false
        const templateNameLower = template.nombre.toLowerCase()
       
        return activityName === templateNameLower
      })

      if (matchedTemplate) {
       
        return {
          template: matchedTemplate,
          specificActivityName: workOrder.actividad,
        }
      }

      // 2. SEGUNDO: Buscar por patrones específicos en orden de prioridad MEJORADO
      const templatePriority = [
        "QUEMAS CONTROLADAS", // Nueva plantilla agregada con alta prioridad
        "CONTROL DE MALEZAS", // Más específico primero para evitar conflictos
        "CONTROL DE HORMIGAS",
        "PLANTACION", // Plantación después de controles
        "PODA",
        "RALEO", // Menos específico al final
      ]

      for (const templateName of templatePriority) {
        const template = templates.find((t) => t.nombre === templateName && t.activo)
        if (!template) continue

       

        const matches = template.patronesCoincidencia.some((patron) => {
          const patronLower = patron.toLowerCase().trim()
         

          // Coincidencia exacta
          if (activityName === patronLower) {
           
            return true
          }

          // Coincidencia por inclusión (la actividad contiene el patrón completo)
          if (activityName.includes(patronLower)) {
           
            return true
          }

          // Para quemas controladas, verificar variaciones específicas
          if (template.nombre === "QUEMAS CONTROLADAS") {
            const quemasVariations = [
              "quemas controladas",
              "quema controlada",
              "quemas",
              "quema",
              "quema prescrita",
              "quema dirigida",
              "manejo de fuego",
              "control de combustible",
            ]
            const isQuemasMatch = quemasVariations.some((variation) => activityName.includes(variation.toLowerCase()))
            if (isQuemasMatch) {
             
              return true
            }
          }

          // Para control de malezas, verificar variaciones específicas
          if (template.nombre === "CONTROL DE MALEZAS") {
            const malezasVariations = [
              "control de malezas",
              "control malezas",
              "malezas",
              "herbicida",
              "desmalezado",
              "control de malezas pre plantacion",
              "control de malezas post plantacion",
              "malezas pre plantacion",
              "malezas post plantacion",
            ]
            const isMalezasMatch = malezasVariations.some((variation) => activityName.includes(variation.toLowerCase()))
            if (isMalezasMatch) {

              return true
            }
          }

          // Para plantación, verificar variaciones específicas
          if (template.nombre === "PLANTACION") {
            const plantacionVariations = ["plantacion", "plantación", "plantado", "implantacion", "implantación"]
            const isPlantacionMatch = plantacionVariations.some((variation) =>
              activityName.includes(variation.toLowerCase()),
            )
            if (isPlantacionMatch) {
              
              return true
            }
          }

          return false
        })

        // Verificar código de actividad si existe
        const codeMatches =
          template.actividadCodigo && activityCode && activityCode.includes(template.actividadCodigo.toLowerCase())

        if (codeMatches) {
         
        }

        if (matches || codeMatches) {
         
          return {
            template: template,
            specificActivityName: workOrder.actividad,
          }
        }
      }

     
      return {
        template: null,
        specificActivityName: workOrder.actividad,
      }
    }
  }, [templates])

  return {
    templates,
    loading,
    error,
    getTemplateForWorkOrder,
  }
}
