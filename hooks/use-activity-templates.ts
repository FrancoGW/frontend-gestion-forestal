// --- Comentario agregado para forzar redeploy y asegurar que los cambios estén en producción ---
// Si ves este comentario, el commit de fix de plantilla fue correctamente subido y forzó el redeploy.
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
        id: "anioPlantacion",
        nombre: "Año de Plantación",
        tipo: "numero",
        requerido: true,
        orden: 13,
        placeholder: "Ej: 2020, 2021, 2022",
        descripcion: "Año en que se realizó la plantación del rodal",
        esDelSistema: true,
      },
      {
        id: "observaciones",
        nombre: "Observaciones",
        tipo: "textarea",
        requerido: false,
        orden: 14,
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
    patronesCoincidencia: ["raleo", "primer raleo", "segundo raleo", "raleo comercial"],
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
        opciones: ["Ecua", "Pino"],
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
    id: "raleo-desecho-template",
    nombre: "RALEO A DESECHO",
    descripcion: "Plantilla para actividades de raleo a desecho",
    actividadCodigo: "SAP002",
    categoria: "Silvicultura",
    unidad: "Ha",
    patronesCoincidencia: ["raleo a desecho"],
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
        opciones: ["Ecua", "Pino"],
        esDelSistema: true,
      },
      {
        id: "observaciones",
        nombre: "Observaciones",
        tipo: "textarea",
        requerido: false,
        orden: 10,
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
    patronesCoincidencia: [
      "plantacion", 
      "plantación", 
      "plantado", 
      "implantacion", 
      "implantación",
      "replantacion",
      "replantación",
      "reposicion de fallas",
      "reposición de fallas",
      "reposicion fallas",
      "reposición fallas"
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
        id: "especie_forestal",
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
        id: "anioPlantacion",
        nombre: "Año de Plantación",
        tipo: "numero",
        requerido: true,
        orden: 18,
        placeholder: "Ej: 2020, 2021, 2022",
        descripcion: "Año en que se realizó la plantación del rodal",
        esDelSistema: true,
      },
      {
        id: "observaciones",
        nombre: "Observaciones",
        tipo: "textarea",
        requerido: false,
        orden: 19,
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
        requerido: false,
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
        requerido: false,
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
        id: "horaR29",
        nombre: "R29 - Salida hacia Actividad",
        tipo: "texto",
        requerido: true,
        orden: 7,
        placeholder: "HH:MM",
        descripcion: "Hora de salida hacia la actividad",
        esDelSistema: true,
      },
      {
        id: "horaR8",
        nombre: "R8 - Inicio Actividad",
        tipo: "texto",
        requerido: true,
        orden: 8,
        placeholder: "HH:MM",
        descripcion: "Hora de inicio de la actividad",
        esDelSistema: true,
      },
      {
        id: "horaR7",
        nombre: "R7 - Término Actividad",
        tipo: "texto",
        requerido: true,
        orden: 9,
        placeholder: "HH:MM",
        descripcion: "Hora de término de la actividad",
        esDelSistema: true,
      },
      {
        id: "horaR28",
        nombre: "R28 - Regreso a Base",
        tipo: "texto",
        requerido: true,
        orden: 10,
        placeholder: "HH:MM",
        descripcion: "Hora de regreso a base",
        esDelSistema: true,
      },
      {
        id: "tiempoHs",
        nombre: "Tiempo (hs)",
        tipo: "numero",
        requerido: false,
        orden: 11,
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
        orden: 12,
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
        orden: 13,
        descripcion: "Comentarios y observaciones sobre la quema controlada",
        esDelSistema: false,
      },
    ],
    activo: true,
  },
  {
    id: "control-exotica-template",
    nombre: "CONTROL DE EXOTICA",
    descripcion: "Plantilla para actividades de control de exótica.",
    actividadCodigo: "SAP010",
    categoria: "Control de Plagas",
    unidad: "Ha",
    patronesCoincidencia: [
      "control de exotica", "control de exótica", "exotica", "exótica", "control exoticas", "control de exoticas", "control de exóticas", "exoticas", "exóticas"
    ],
    campos: [
      { id: "estado", nombre: "Estado del Trabajo", tipo: "seleccion", requerido: true, orden: 1, opciones: ["Pendiente", "R7 (terminado)"], descripcion: "Estado del trabajo", esDelSistema: true },
      { id: "fecha", nombre: "Fecha", tipo: "fecha", requerido: true, orden: 2, esDelSistema: true },
      { id: "predio", nombre: "Predio", tipo: "texto", requerido: true, orden: 3, esDelSistema: true },
      { id: "rodal", nombre: "Rodal", tipo: "texto", requerido: true, orden: 4, esDelSistema: true },
      { id: "cuadrilla", nombre: "Cuadrilla", tipo: "seleccion", requerido: true, orden: 5, esDelSistema: true },
      { id: "implemento", nombre: "Implemento", tipo: "seleccion", requerido: true, orden: 6, opciones: ["Machete", "Motisierra"], esDelSistema: true },
      { id: "operarios", nombre: "Operarios", tipo: "numero", requerido: true, orden: 7, esDelSistema: true },
      { id: "jornales", nombre: "Jornales", tipo: "numero", requerido: true, orden: 8, esDelSistema: true },
      { id: "superficie", nombre: "Superficie", tipo: "numero", requerido: true, orden: 9, unidad: "Ha", esDelSistema: true },
      { id: "observaciones", nombre: "Observaciones", tipo: "textarea", requerido: false, orden: 10, esDelSistema: false },
    ],
    activo: true,
  },
  {
    id: "control-regeneracion-pinos-template",
    nombre: "CONTROL DE REGENERACION DE PINOS",
    descripcion: "Plantilla para actividades de control de regeneración de pinos.",
    actividadCodigo: "SAP011",
    categoria: "Control de Plagas",
    unidad: "Ha",
    patronesCoincidencia: [
      "control de regeneracion de exoticas", "control de regeneración de exóticas", "regeneracion de exoticas", "regeneración de exóticas", "control regeneracion exoticas", "control regeneración exóticas", "regeneracion exoticas", "regeneración exóticas",
      "control generacion de pino", "control generación de pino",
      "CONTROL DE REGENERACION DE PINOS", "control de regeneración de pinos"
    ],
    campos: [
      { id: "estado", nombre: "Estado del Trabajo", tipo: "seleccion", requerido: true, orden: 1, opciones: ["Pendiente", "R7 (terminado)"], descripcion: "Estado del trabajo", esDelSistema: true },
      { id: "fecha", nombre: "Fecha", tipo: "fecha", requerido: true, orden: 2, esDelSistema: true },
      { id: "predio", nombre: "Predio", tipo: "texto", requerido: true, orden: 3, esDelSistema: true },
      { id: "rodal", nombre: "Rodal", tipo: "texto", requerido: true, orden: 4, esDelSistema: true },
      { id: "cuadrilla", nombre: "Cuadrilla", tipo: "seleccion", requerido: true, orden: 5, esDelSistema: true },
      { id: "implemento", nombre: "Implemento", tipo: "seleccion", requerido: true, orden: 6, opciones: ["Tr c/Rolon", "Topa c/Rolon", "Tr c/Rastra", "Macheteo", "Motosierra"], esDelSistema: true },
      { id: "operarios", nombre: "Operarios", tipo: "numero", requerido: true, orden: 7, esDelSistema: true },
      { id: "ha", nombre: "HA", tipo: "numero", requerido: true, orden: 8, esDelSistema: true },
      { id: "jornales", nombre: "Jornales", tipo: "numero", requerido: true, orden: 9, esDelSistema: true },
      { id: "anioPlantacion", nombre: "Año de Plantación", tipo: "numero", requerido: true, orden: 10, esDelSistema: true },
      { id: "observaciones", nombre: "Observaciones", tipo: "textarea", requerido: false, orden: 11, esDelSistema: false },
    ],
    activo: true,
  },
  {
    id: "manejo-rebrote-template",
    nombre: "MANEJO REBROTE",
    descripcion: "Plantilla para actividades de manejo de rebrote.",
    actividadCodigo: "SAP012",
    categoria: "Silvicultura",
    unidad: "Ha",
    patronesCoincidencia: [
      "manejo rebrote", "manejo de rebrote", "rebrote", "manejo de rebrotes", "manejo rebrote", "rebrote manejo"
    ],
    campos: [
      { id: "estado", nombre: "Estado del Trabajo", tipo: "seleccion", requerido: true, orden: 1, opciones: ["Pendiente", "R7 (terminado)"], descripcion: "Estado del trabajo", esDelSistema: true },
      { id: "fecha", nombre: "Fecha", tipo: "fecha", requerido: true, orden: 2, esDelSistema: true },
      { id: "rodal", nombre: "Rodal", tipo: "texto", requerido: true, orden: 3, esDelSistema: true },
      { id: "predio", nombre: "Predio/Campo", tipo: "texto", requerido: true, orden: 4, esDelSistema: true },
      { id: "cuadrilla", nombre: "Cuadrilla", tipo: "seleccion", requerido: true, orden: 5, esDelSistema: true },
      { id: "implemento", nombre: "Implemento", tipo: "seleccion", requerido: true, orden: 6, opciones: ["Machete", "Motisierra", "Guadaña"], esDelSistema: true },
      { id: "operarios", nombre: "Operarios", tipo: "numero", requerido: true, orden: 7, esDelSistema: true },
      { id: "ha", nombre: "HA", tipo: "numero", requerido: true, orden: 8, esDelSistema: true },
      { id: "anioPlantacion", nombre: "Año de Plantación", tipo: "numero", requerido: true, orden: 9, esDelSistema: true },
      { id: "observaciones", nombre: "Observaciones", tipo: "textarea", requerido: false, orden: 10, esDelSistema: false },
    ],
    activo: true,
  },
  {
    id: "preparacion-terreno-template",
    nombre: "PREPARACION DE TERRENO (TAIPAS - SAVANNAGH ETC.)",
    descripcion: "Plantilla para actividades de preparación de terreno incluyendo taipas, savannagh y otros métodos.",
    actividadCodigo: "SAP013",
    categoria: "Manejo Forestal",
    unidad: "Ha",
    patronesCoincidencia: [
      "preparacion de terreno",
      "preparación de terreno", 
      "taipas",
      "savannagh",
      "preparacion terreno",
      "preparación terreno",
      "terreno preparacion",
      "terreno preparación",
      "preparacion del terreno",
      "preparación del terreno"
    ],
    campos: [
      { id: "fecha", nombre: "Fecha", tipo: "fecha", requerido: true, orden: 1, esDelSistema: true },
      { id: "predio", nombre: "Predio", tipo: "texto", requerido: true, orden: 2, esDelSistema: true },
      { id: "rodal", nombre: "Rodal", tipo: "seleccion", requerido: true, orden: 3, esDelSistema: true },
      { id: "cuadrilla", nombre: "Cuadrilla", tipo: "seleccion", requerido: true, orden: 4, esDelSistema: true },
      { id: "implemento", nombre: "Implemento", tipo: "seleccion", requerido: true, orden: 5, opciones: ["Topadora", "Tractor"], esDelSistema: true },
      { id: "jornal", nombre: "Jornal", tipo: "numero", requerido: true, orden: 6, unidad: "hs", esDelSistema: true },
      { id: "ha", nombre: "Ha", tipo: "numero", requerido: true, orden: 7, unidad: "Ha", esDelSistema: true },
      { id: "estado", nombre: "Estado", tipo: "seleccion", requerido: true, orden: 8, opciones: ["Pendiente", "R7 (terminado)"], esDelSistema: true },
      { id: "observaciones", nombre: "Observaciones", tipo: "textarea", requerido: false, orden: 9, esDelSistema: false },
    ],
    activo: true,
  },
]

const FRONTEND_VERSION = "2025-01-15-1"; // Cambia este valor en cada deploy relevante

try {
  const lastVersion = localStorage.getItem("frontend-version");
  if (lastVersion !== FRONTEND_VERSION) {
    localStorage.removeItem("activity-templates");
    localStorage.setItem("frontend-version", FRONTEND_VERSION);
  }
} catch (e) {
  // Puede fallar en SSR o navegadores sin localStorage
}

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

        // Sincronizar campos de plantillas existentes por id
        const mergedTemplates = DEFAULT_TEMPLATES.map((defaultTpl) => {
          const localTpl = parsed.find((t: ActivityTemplate) => t.id === defaultTpl.id)
          if (!localTpl) return defaultTpl
          // Si los campos difieren en cantidad o nombres, usar la versión del código
          const camposIguales =
            Array.isArray(localTpl.campos) &&
            localTpl.campos.length === defaultTpl.campos.length &&
            localTpl.campos.every((c: any, idx: number) => c.id === defaultTpl.campos[idx].id)
          if (!camposIguales) return defaultTpl
          // Si los campos son iguales, usar la versión local (puede tener datos custom)
          return localTpl
        })
        // Agregar plantillas custom que no estén en el código
        const customTemplates = parsed.filter((t: ActivityTemplate) => !DEFAULT_TEMPLATES.find((dt) => dt.id === t.id))
        finalTemplates = [...mergedTemplates, ...customTemplates]
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

      // LOG de depuración
      console.log("[PLANTILLA] Buscando plantilla para actividad:", workOrder.actividad)
      console.log("[PLANTILLA] activityName:", activityName)
      templates.forEach((tpl) => {
        console.log("[PLANTILLA] Plantilla:", tpl.nombre, "- Patrones:", tpl.patronesCoincidencia)
      })

      // Buscar plantilla que coincida con los patrones - ORDEN ESPECÍFICO MEJORADO
      let matchedTemplate = null

      // 1. PRIMERO: Buscar coincidencias exactas por nombre de plantilla
      matchedTemplate = templates.find((template) => {
        if (!template.activo) return false
        const templateNameLower = template.nombre.toLowerCase()
        const isMatch = activityName === templateNameLower
        if (isMatch) {
          console.log('[MATCH] Coincidencia exacta por nombre:', template.nombre)
        }
        return isMatch
      })

      if (matchedTemplate) {
       
        return {
          template: matchedTemplate,
          specificActivityName: workOrder.actividad,
        }
      }

      // 2. SEGUNDO: Buscar por patrones específicos en orden de prioridad MEJORADO
      const templatePriority = [
        "PREPARACION DE TERRENO (TAIPAS - SAVANNAGH ETC.)", // Nueva plantilla de preparación de terreno
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
          const patronLower = patron.toLowerCase().trim();
          if (activityName === patronLower) return true;
          if (activityName.includes(patronLower)) return true;
          if (patronLower.includes(activityName)) return true;
          return false;
        });

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

      // 3. TERCERO: Buscar patronesCoincidencia en todas las plantillas activas (para nuevas plantillas)
      for (const template of templates) {
        if (!template.activo) continue;
        const matches = template.patronesCoincidencia.some((patron) => {
          const patronLower = patron.toLowerCase().trim();
          const isMatch = activityName === patronLower || activityName.includes(patronLower) || patronLower.includes(activityName);
          if (isMatch) {
            console.log('[MATCH] Coincidencia por patrón:', patron, 'en plantilla', template.nombre)
          }
          return isMatch;
        });
        if (matches) {
          return {
            template: template,
            specificActivityName: workOrder.actividad,
          };
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
