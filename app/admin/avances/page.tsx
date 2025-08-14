"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Search, Building2, ArrowRight, AlertCircle, Download, FileSpreadsheet, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { workOrdersAPI, avancesTrabajoAPI, empresasAPI } from "@/lib/api-client"
import * as XLSX from "xlsx"

interface ProveedorVirtual {
  id: string | number
  _id: string | number
  nombre: string
  ordenes: any[]
  ordenesTotal: number
  ordenesCompletadas: number
  ordenesEnProgreso: number
  progresoTotal: number
  avances: any[]
}

// Cache global para evitar recargar datos
let globalCache = {
  ordenes: null as any[] | null,
  avances: null as any[] | null,
  empresas: null as any[] | null,
  lastFetch: 0,
  isLoading: false,
}

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

export default function AvancesPage() {
  const [proveedores, setProveedores] = useState<ProveedorVirtual[]>([])
  const [filteredProveedores, setFilteredProveedores] = useState<ProveedorVirtual[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [rawData, setRawData] = useState<{
    ordenes: any[]
    avances: any[]
    empresas: any[]
  }>({ ordenes: [], avances: [], empresas: [] })
  const [isExporting, setIsExporting] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState({ current: 0, total: 0, phase: "" })
  const [exportFilters, setExportFilters] = useState({
    proveedores: [] as string[],
    fechaDesde: "",
    fechaHasta: "",
    actividades: [] as string[],
    estados: [] as string[],
    incluirSinAvances: true,
  })
  const [showExportDialog, setShowExportDialog] = useState(false)

  // Función optimizada para obtener datos con cache
  const fetchDataWithCache = async () => {
    const now = Date.now()

    // Si tenemos datos en cache y no han expirado, usarlos
    if (
      globalCache.ordenes &&
      globalCache.avances &&
      globalCache.empresas &&
      now - globalCache.lastFetch < CACHE_DURATION
    ) {
      return {
        ordenes: globalCache.ordenes,
        avances: globalCache.avances,
        empresas: globalCache.empresas,
      }
    }

    // Si ya se está cargando, esperar
    if (globalCache.isLoading) {
      return new Promise((resolve) => {
        const checkCache = () => {
          if (!globalCache.isLoading && globalCache.ordenes) {
            resolve({
              ordenes: globalCache.ordenes,
              avances: globalCache.avances,
              empresas: globalCache.empresas,
            })
          } else {
            setTimeout(checkCache, 100)
          }
        }
        checkCache()
      })
    }

    globalCache.isLoading = true

    try {
      setLoadingProgress({ current: 0, total: 3, phase: "Iniciando carga..." })

      // 1. Cargar empresas primero (es rápido)
      setLoadingProgress({ current: 1, total: 3, phase: "Cargando empresas..." })
      let empresasData = await empresasAPI.getAll()

      if (!Array.isArray(empresasData)) {
        if (empresasData && typeof empresasData === "object") {
          const arrayProps = Object.keys(empresasData).filter((key) => Array.isArray(empresasData[key]))
          if (arrayProps.length > 0) {
            empresasData = empresasData[arrayProps[0]]
          } else {
            empresasData = Object.values(empresasData)
          }
        } else {
          empresasData = []
        }
      }

      // 2. Cargar avances (también relativamente rápido)
      setLoadingProgress({ current: 2, total: 3, phase: "Cargando avances..." })
      const avancesData = await fetchAllAvances()

      // 3. Cargar órdenes con estrategia optimizada
      setLoadingProgress({ current: 3, total: 3, phase: "Cargando órdenes..." })
      const ordenesData = await fetchAllWorkOrdersOptimized()

      // Guardar en cache
      globalCache.ordenes = ordenesData
      globalCache.avances = avancesData
      globalCache.empresas = empresasData
      globalCache.lastFetch = now
      globalCache.isLoading = false

      return {
        ordenes: ordenesData,
        avances: avancesData,
        empresas: empresasData,
      }
    } catch (error) {
      globalCache.isLoading = false
      throw error
    }
  }

  // Función optimizada para cargar órdenes con requests paralelos
  const fetchAllWorkOrdersOptimized = async () => {
    try {
      // Primero obtenemos la primera página para conocer la paginación
      const firstPageResponse = await workOrdersAPI.getAll({ pagina: 1, limite: 50 }) // Aumentamos el límite

      let allOrders = []
      let totalPages = 1

      // Extraer datos de la primera página
      if (firstPageResponse.ordenes && Array.isArray(firstPageResponse.ordenes)) {
        allOrders = [...firstPageResponse.ordenes]
      }

      // Obtener información de paginación
      if (firstPageResponse.paginacion) {
        totalPages = firstPageResponse.paginacion.paginas || 1
      }

      setLoadingProgress({ current: 1, total: totalPages, phase: `Cargando órdenes (1/${totalPages})...` })

      // Si hay más páginas, cargarlas en paralelo (en lotes)
      if (totalPages > 1) {
        const BATCH_SIZE = 5 // Cargar 5 páginas en paralelo

        for (let startPage = 2; startPage <= totalPages; startPage += BATCH_SIZE) {
          const endPage = Math.min(startPage + BATCH_SIZE - 1, totalPages)
          const pagePromises = []

          // Crear promesas para el lote actual
          for (let page = startPage; page <= endPage; page++) {
            pagePromises.push(
              workOrdersAPI
                .getAll({ pagina: page, limite: 50 })
                .then((response) => ({ page, data: response.ordenes || [] }))
                .catch((error) => ({ page, data: [], error })),
            )
          }

          // Esperar a que se complete el lote
          const batchResults = await Promise.all(pagePromises)

          // Procesar resultados del lote
          batchResults.forEach((result) => {
            if (result.data && Array.isArray(result.data)) {
              allOrders = [...allOrders, ...result.data]
            }
          })

          setLoadingProgress({
            current: endPage,
            total: totalPages,
            phase: `Cargando órdenes (${endPage}/${totalPages})...`,
          })

          // Pequeña pausa entre lotes para no sobrecargar el servidor
          if (endPage < totalPages) {
            await new Promise((resolve) => setTimeout(resolve, 200))
          }
        }
      }

      // Filtrar órdenes por estado
      const filteredOrders = allOrders.filter((orden: any) => {
        const estado = orden.estado_nombre || orden.estado || ""
        const estadoUpper = estado.toUpperCase()
        return estadoUpper !== "EJECUTADA" && estadoUpper !== "ANULADA"
      })

      return filteredOrders
    } catch (error) {
      throw error
    }
  }

  // Función para obtener avances (optimizada)
  const fetchAllAvances = async () => {
    try {
      const firstPageResponse = await avancesTrabajoAPI.getAll({ pagina: 1, limite: 100 })

      let allAvances = []
      let totalPages = 1

      // Extraer datos de la primera página
      if (Array.isArray(firstPageResponse)) {
        allAvances = [...firstPageResponse]
      } else if (firstPageResponse.avances && Array.isArray(firstPageResponse.avances)) {
        allAvances = [...firstPageResponse.avances]
      } else if (firstPageResponse.data && Array.isArray(firstPageResponse.data)) {
        allAvances = [...firstPageResponse.data]
      }

      // Obtener información de paginación si existe
      if (firstPageResponse.paginacion) {
        totalPages = firstPageResponse.paginacion.paginas || 1
      }

      // Si hay más páginas, cargarlas en paralelo
      if (totalPages > 1) {
        const pagePromises = []
        for (let page = 2; page <= totalPages; page++) {
          pagePromises.push(
            avancesTrabajoAPI
              .getAll({ pagina: page, limite: 100 })
              .then((response) => {
                if (Array.isArray(response)) return response
                if (response.avances && Array.isArray(response.avances)) return response.avances
                if (response.data && Array.isArray(response.data)) return response.data
                return []
              })
              .catch(() => []),
          )
        }

        const results = await Promise.all(pagePromises)
        results.forEach((pageAvances) => {
          allAvances = [...allAvances, ...pageAvances]
        })
      }

      return allAvances
    } catch (error) {
      return []
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const { ordenes, avances, empresas } = await fetchDataWithCache()

        // Guardar datos crudos para posible exportación
        setRawData({
          ordenes,
          avances,
          empresas,
        })

        // Crear un mapa de proveedores virtuales basados en las órdenes
        const proveedoresVirtuales = new Map()

        // Agrupar órdenes por proveedor (cod_empres)
        ordenes.forEach((orden: any) => {
          if (orden.cod_empres) {
            const proveedorId = String(orden.cod_empres)
            if (!proveedoresVirtuales.has(proveedorId)) {
              proveedoresVirtuales.set(proveedorId, {
                _id: proveedorId,
                id: proveedorId,
                idempresa: proveedorId,
                cod_empres: proveedorId,
                nombre: orden.empresa || `Empresa ${proveedorId}`,
                ordenes: [],
                avances: [],
              })
            }

            // Añadir orden al proveedor
            const proveedor = proveedoresVirtuales.get(proveedorId)
            proveedor.ordenes.push(orden)

            // Buscar avances para esta orden
            const avancesOrden = avances.filter(
              (avance: any) => avance.ordenTrabajoId === orden._id || avance.ordenTrabajoId === orden.id,
            )
            proveedor.avances = [...proveedor.avances, ...avancesOrden]
          }
        })

        // Combinar proveedores reales con virtuales
        const proveedoresCombinados = [...proveedoresVirtuales.values()]

        // Calcular estadísticas para cada proveedor
        const proveedoresConEstadisticas = proveedoresCombinados.map((proveedor) => {
          const ordenesTotal = proveedor.ordenes.length
          const ordenesCompletadas = proveedor.ordenes.filter((orden: any) => {
            // Calcular si la orden está completada basado en avances
            const avancesOrden = proveedor.avances.filter(
              (avance: any) => avance.ordenTrabajoId === orden._id || avance.ordenTrabajoId === orden.id,
            )

            if (avancesOrden.length === 0) return false

            const superficieTotal = Number.parseFloat(orden.cantidad) || 0
            const superficieCompletada = avancesOrden.reduce(
              (total: number, avance: any) => total + (avance.superficie || 0),
              0,
            )

            return superficieTotal > 0 && superficieCompletada >= superficieTotal
          }).length

          const ordenesEnProgreso =
            proveedor.ordenes.filter((orden: any) => {
              const avancesOrden = proveedor.avances.filter(
                (avance: any) => avance.ordenTrabajoId === orden._id || avance.ordenTrabajoId === orden.id,
              )
              return avancesOrden.length > 0
            }).length - ordenesCompletadas

          // Calcular porcentaje de progreso
          let progresoTotal = 0
          if (ordenesTotal > 0) {
            const pesoCompletadas = ordenesCompletadas * 100
            const pesoEnProgreso = ordenesEnProgreso * 50 // Asumimos 50% de progreso para órdenes en progreso
            progresoTotal = Math.round((pesoCompletadas + pesoEnProgreso) / ordenesTotal)
          }

          return {
            ...proveedor,
            ordenesTotal,
            ordenesCompletadas,
            ordenesEnProgreso,
            progresoTotal,
          }
        })

        // Filtrar proveedores sin órdenes
        const proveedoresConOrdenes = proveedoresConEstadisticas.filter((p) => p.ordenesTotal > 0)

        // Ordenar por nombre
        proveedoresConOrdenes.sort((a, b) => a.nombre.localeCompare(b.nombre))

        setProveedores(proveedoresConOrdenes)
        setFilteredProveedores(proveedoresConOrdenes)
        setIsLoading(false)
        setLoadingProgress({ current: 0, total: 0, phase: "" })
      } catch (error: any) {
        setError(error.message || "Error al cargar los datos")
        setIsLoading(false)
        setLoadingProgress({ current: 0, total: 0, phase: "" })
      }
    }

    fetchData()
  }, [])

  // Filtrar proveedores por búsqueda
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredProveedores(proveedores)
    } else {
      const searchTermLower = searchTerm.toLowerCase()
      const filtered = proveedores.filter((proveedor) => proveedor.nombre.toLowerCase().includes(searchTermLower))
      setFilteredProveedores(filtered)
    }
  }, [searchTerm, proveedores])

  // Función para limpiar cache manualmente
  const clearCache = () => {
    globalCache = {
      ordenes: null,
      avances: null,
      empresas: null,
      lastFetch: 0,
      isLoading: false,
    }
    window.location.reload()
  }

  // Función para exportar datos crudos en JSON
  const exportRawData = () => {
    const dataStr = JSON.stringify(rawData, null, 2)
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`

    const exportFileDefaultName = `datos-avances-${new Date().toISOString().slice(0, 10)}.json`

    const linkElement = document.createElement("a")
    linkElement.setAttribute("href", dataUri)
    linkElement.setAttribute("download", exportFileDefaultName)
    linkElement.click()
  }

  // Función para formatear fecha
  const formatDate = (dateString: string) => {
    if (!dateString) return "No especificada"
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    } catch (e) {
      return dateString
    }
  }

  // Función para crear nombres de hojas válidos para Excel (máximo 31 caracteres)
  const createValidSheetName = (baseName: string, suffix = "", index = 0) => {
    // Eliminar caracteres no válidos para nombres de hojas
    let cleanName = baseName
      .replace(/[\\/*[\]?:]/g, "") // Eliminar caracteres no permitidos en nombres de hojas
      .trim()

    // Calcular longitud máxima para el nombre base
    const maxBaseLength = 24 - suffix.length - (index > 0 ? String(index).length + 1 : 0)

    // Truncar el nombre si es necesario
    if (cleanName.length > maxBaseLength) {
      cleanName = cleanName.substring(0, maxBaseLength)
    }

    // Añadir sufijo e índice si es necesario
    let sheetName = cleanName + suffix
    if (index > 0) {
      sheetName += ` ${index}`
    }

    return sheetName
  }

  // Función para obtener listas únicas para filtros
  const getUniqueValues = () => {
    const actividades = [...new Set(rawData.ordenes.map((orden) => orden.actividad).filter(Boolean))]
    const estados = [...new Set(rawData.ordenes.map((orden) => orden.estado).filter(Boolean))]

    return { actividades, estados }
  }

  // Función para aplicar filtros a los datos
  const applyExportFilters = (proveedores: ProveedorVirtual[]) => {
    return proveedores.filter((proveedor) => {
      // Filtro por proveedor
      if (exportFilters.proveedores.length > 0 && !exportFilters.proveedores.includes(proveedor.id.toString())) {
        return false
      }

      // Filtro por actividades
      if (exportFilters.actividades.length > 0) {
        const tieneActividad = proveedor.ordenes.some((orden) => exportFilters.actividades.includes(orden.actividad))
        if (!tieneActividad) return false
      }

      // Filtro por estados
      if (exportFilters.estados.length > 0) {
        const tieneEstado = proveedor.ordenes.some((orden) => exportFilters.estados.includes(orden.estado || "emitida"))
        if (!tieneEstado) return false
      }

      // Filtro por fechas
      if (exportFilters.fechaDesde || exportFilters.fechaHasta) {
        const tieneAvanceEnRango = proveedor.avances.some((avance) => {
          if (!avance.fecha) return false
          const fechaAvance = new Date(avance.fecha)

          if (exportFilters.fechaDesde) {
            const desde = new Date(exportFilters.fechaDesde)
            if (fechaAvance < desde) return false
          }

          if (exportFilters.fechaHasta) {
            const hasta = new Date(exportFilters.fechaHasta)
            if (fechaAvance > hasta) return false
          }

          return true
        })

        if (!tieneAvanceEnRango && !exportFilters.incluirSinAvances) return false
      }

      // Filtro por proveedores sin avances
      if (!exportFilters.incluirSinAvances && proveedor.avances.length === 0) {
        return false
      }

      return true
    })
  }

  // Función helper para formatear números con coma decimal
  const formatNumberWithComma = (value: number | string): string => {
    if (value === null || value === undefined || value === "") return "0,00"
    const num = typeof value === "string" ? Number.parseFloat(value) : value
    if (isNaN(num)) return "0,00"
    return num.toFixed(2).replace(".", ",")
  }

  // Configurar Excel para usar formato español (coma decimal)
  const configureExcelForSpanishFormat = () => {
    // Establecer la configuración regional para Excel
    XLSX.SSF.load({
      "0.00": "#,##0.00", // Formato con coma decimal
      "0": "#,##0", // Formato entero
    })
  }

  // Función para exportar a Excel con filtros aplicados
  const exportToExcelHierarchicalFiltered = async () => {
    try {
      setIsExporting(true)

      // Configurar Excel para formato español
      configureExcelForSpanishFormat()

      // Aplicar filtros
      const proveedoresFiltrados = applyExportFilters(filteredProveedores)

      if (proveedoresFiltrados.length === 0) {
        alert("No hay datos que coincidan con los filtros seleccionados.")
        setIsExporting(false)
        return
      }

      // Crear un array para los datos jerárquicos
      const hierarchicalData: any[] = []

      // Agregar información de filtros aplicados
      hierarchicalData.push({
        Tipo: "FILTROS_APLICADOS",
        Información: `Exportación filtrada - ${proveedoresFiltrados.length} proveedores`,
      })

      if (exportFilters.proveedores.length > 0) {
        hierarchicalData.push({
          Tipo: "FILTRO",
          Información: `Proveedores: ${exportFilters.proveedores.join(", ")}`,
        })
      }

      if (exportFilters.actividades.length > 0) {
        hierarchicalData.push({
          Tipo: "FILTRO",
          Información: `Actividades: ${exportFilters.actividades.join(", ")}`,
        })
      }

      if (exportFilters.fechaDesde || exportFilters.fechaHasta) {
        const rangoFecha = `${exportFilters.fechaDesde || "Sin límite"} - ${exportFilters.fechaHasta || "Sin límite"}`
        hierarchicalData.push({
          Tipo: "FILTRO",
          Información: `Rango de fechas: ${rangoFecha}`,
        })
      }

      hierarchicalData.push({}) // Línea en blanco

      // Procesar cada proveedor
      for (const proveedor of proveedoresFiltrados) {
        // Añadir fila de encabezado del proveedor
        hierarchicalData.push({
          Tipo: "PROVEEDOR",
          ID: proveedor.id,
          Nombre: proveedor.nombre,
          "Órdenes Totales": proveedor.ordenesTotal,
          "Órdenes Completadas": proveedor.ordenesCompletadas,
          "Órdenes En Progreso": proveedor.ordenesEnProgreso,
          "Progreso Total (%)": proveedor.progresoTotal,
        })

        // Añadir fila en blanco para separar
        hierarchicalData.push({})

        // Añadir encabezado de órdenes
        hierarchicalData.push({
          Tipo: "ENCABEZADO_ORDENES",
          ID: "ID Orden",
          Nombre: "Descripción",
          Número: "Número",
          "Superficie Total (ha)": "Superficie Total (ha)",
          "Superficie Completada (ha)": "Superficie Completada (ha)",
          "Progreso (%)": "Progreso (%)",
          Estado: "Estado",
          "Fecha Creación": "Fecha Creación",
        })

        // Procesar cada orden del proveedor
        for (const orden of proveedor.ordenes) {
          // Calcular avance para esta orden
          const avancesOrden = proveedor.avances.filter(
            (avance: any) => avance.ordenTrabajoId === orden._id || avance.ordenTrabajoId === orden.id,
          )

          const superficieTotal = Number.parseFloat(orden.cantidad) || 0
          const superficieCompletada = avancesOrden.reduce(
            (total: number, avance: any) => total + (Number.parseFloat(avance.superficie) || 0),
            0,
          )

          const porcentajeAvance =
            superficieTotal > 0 ? Math.min(100, Math.round((superficieCompletada / superficieTotal) * 100)) : 0

          // Añadir fila de orden
          hierarchicalData.push({
            Tipo: "ORDEN",
            ID: orden._id || orden.id,
            Nombre: orden.descripcion || "Sin descripción",
            Número: orden.numero || "N/A",
            "Superficie Total (ha)": superficieTotal.toString().replace(".", ","),
            "Superficie Completada (ha)": superficieCompletada.toString().replace(".", ","),
            "Progreso (%)": porcentajeAvance,
            Estado: orden.estado || "No especificado",
            "Fecha Creación": formatDate(orden.fechaCreacion),
          })

          // Si la orden tiene avances, añadir encabezado de avances
          if (avancesOrden.length > 0) {
            hierarchicalData.push({
              Tipo: "ENCABEZADO_AVANCES",
              Fecha: "Fecha",
              "Superficie (ha)": "Superficie (ha)",
              Plantas: "Plantas",
              Personal: "Personal",
              Observaciones: "Observaciones",
            })

            // Ordenar avances por fecha (más reciente primero)
            const avancesOrdenados = [...avancesOrden].sort((a, b) => {
              const fechaA = a.fecha ? new Date(a.fecha).getTime() : 0
              const fechaB = b.fecha ? new Date(b.fecha).getTime() : 0
              return fechaB - fechaA
            })

            // Añadir cada avance
            for (const avance of avancesOrdenados) {
              const superficie = Number.parseFloat(avance.superficie) || 0
              hierarchicalData.push({
                Tipo: "AVANCE",
                Fecha: formatDate(avance.fecha),
                "Superficie (ha)": superficie.toString().replace(".", ","),
                Plantas: avance.plantas || 0,
                Personal: avance.personal || 0,
                Observaciones: avance.observaciones || "",
              })
            }

            // Añadir fila en blanco después de los avances
            hierarchicalData.push({})
          }

          // Añadir fila en blanco después de cada orden
          hierarchicalData.push({})
        }

        // Añadir filas en blanco para separar proveedores
        hierarchicalData.push({})
        hierarchicalData.push({})
      }

      // Crear libro de Excel
      const wb = XLSX.utils.book_new()

      // Configurar opciones para formato español
      wb.Workbook = {
        Views: [{ RTL: false }],
      }

      // Añadir hoja con datos jerárquicos
      const wsHierarchical = XLSX.utils.json_to_sheet(hierarchicalData)

      // Aplicar estilos (ancho de columnas)
      const wscols = [
        { wch: 15 }, // Tipo
        { wch: 15 }, // ID
        { wch: 40 }, // Nombre
        { wch: 15 }, // Número/Órdenes Totales
        { wch: 20 }, // Superficie Total/Órdenes Completadas
        { wch: 20 }, // Superficie Completada/Órdenes En Progreso
        { wch: 15 }, // Progreso
        { wch: 15 }, // Estado
        { wch: 15 }, // Fecha Creación
      ]
      wsHierarchical["!cols"] = wscols

      // Forzar formato de texto para columnas con números decimales
      const range = XLSX.utils.decode_range(wsHierarchical["!ref"] || "A1:Z1000")
      for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cell_address = { c: C, r: R }
          const cell_ref = XLSX.utils.encode_cell(cell_address)
          const cell = wsHierarchical[cell_ref]

          if (cell && typeof cell.v === "string" && cell.v.includes(",")) {
            cell.t = "s" // Forzar tipo string
          }
        }
      }

      XLSX.utils.book_append_sheet(wb, wsHierarchical, "Avances por Proveedor")

      // Mantener un registro de los nombres de hojas usados para evitar duplicados
      const usedSheetNames = new Set(["Avances por Proveedor"])

      // También crear hojas individuales para cada proveedor
      for (const proveedor of proveedoresFiltrados) {
        // Datos de órdenes para este proveedor
        const ordenesData = proveedor.ordenes.map((orden) => {
          // Calcular avance para esta orden
          const avancesOrden = proveedor.avances.filter(
            (avance: any) => avance.ordenTrabajoId === orden._id || avance.ordenTrabajoId === orden.id,
          )

          const superficieTotal = Number.parseFloat(orden.cantidad) || 0
          const superficieCompletada = avancesOrden.reduce(
            (total: number, avance: any) => total + (Number.parseFloat(avance.superficie) || 0),
            0,
          )

          const porcentajeAvance =
            superficieTotal > 0 ? Math.min(100, Math.round((superficieCompletada / superficieTotal) * 100)) : 0

          return {
            "ID Orden": orden._id || orden.id,
            Número: orden.numero || "N/A",
            Descripción: orden.descripcion || "Sin descripción",
            "Superficie Total (ha)": superficieTotal.toString().replace(".", ","),
            "Superficie Completada (ha)": superficieCompletada.toString().replace(".", ","),
            "Progreso (%)": porcentajeAvance,
            Estado: orden.estado || "No especificado",
            "Fecha Creación": formatDate(orden.fechaCreacion),
            "Avances Registrados": avancesOrden.length,
          }
        })

        // Datos de avances para este proveedor
        const avancesData = proveedor.avances.map((avance) => {
          // Encontrar la orden correspondiente
          const orden =
            proveedor.ordenes.find((o: any) => o._id === avance.ordenTrabajoId || o.id === avance.ordenTrabajoId) || {}

          const superficie = Number.parseFloat(avance.superficie) || 0

          return {
            "ID Orden": avance.ordenTrabajoId,
            "Número Orden": orden.numero || "N/A",
            "Descripción Orden": orden.descripcion || "Sin descripción",
            "Fecha Avance": formatDate(avance.fecha),
            "Superficie (ha)": superficie.toString().replace(".", ","),
            Plantas: avance.plantas || 0,
            Personal: avance.personal || 0,
            Observaciones: avance.observaciones || "",
          }
        })

        // Crear hojas para este proveedor con nombres válidos
        if (ordenesData.length > 0) {
          // Crear un nombre de hoja válido para las órdenes
          let ordenesSheetName = ""
          let ordenesIndex = 0

          do {
            ordenesSheetName = createValidSheetName(proveedor.nombre, " - Ord", ordenesIndex)
            ordenesIndex++
          } while (usedSheetNames.has(ordenesSheetName))

          usedSheetNames.add(ordenesSheetName)

          const wsOrdenes = XLSX.utils.json_to_sheet(ordenesData)

          // Forzar formato de texto para columnas con números decimales
          const ordenesRange = XLSX.utils.decode_range(wsOrdenes["!ref"] || "A1:Z1000")
          for (let R = ordenesRange.s.r; R <= ordenesRange.e.r; ++R) {
            for (let C = ordenesRange.s.c; C <= ordenesRange.e.c; ++C) {
              const cell_address = { c: C, r: R }
              const cell_ref = XLSX.utils.encode_cell(cell_address)
              const cell = wsOrdenes[cell_ref]

              if (cell && typeof cell.v === "string" && cell.v.includes(",")) {
                cell.t = "s" // Forzar tipo string
              }
            }
          }

          XLSX.utils.book_append_sheet(wb, wsOrdenes, ordenesSheetName)
        }

        if (avancesData.length > 0) {
          // Crear un nombre de hoja válido para los avances
          let avancesSheetName = ""
          let avancesIndex = 0

          do {
            avancesSheetName = createValidSheetName(proveedor.nombre, " - Ava", avancesIndex)
            avancesIndex++
          } while (usedSheetNames.has(avancesSheetName))

          usedSheetNames.add(avancesSheetName)

          const wsAvances = XLSX.utils.json_to_sheet(avancesData)

          // Forzar formato de texto para columnas con números decimales
          const avancesRange = XLSX.utils.decode_range(wsAvances["!ref"] || "A1:Z1000")
          for (let R = avancesRange.s.r; R <= avancesRange.e.r; ++R) {
            for (let C = avancesRange.s.c; C <= avancesRange.e.c; ++C) {
              const cell_address = { c: C, r: R }
              const cell_ref = XLSX.utils.encode_cell(cell_address)
              const cell = wsAvances[cell_ref]

              if (cell && typeof cell.v === "string" && cell.v.includes(",")) {
                cell.t = "s" // Forzar tipo string
              }
            }
          }

          XLSX.utils.book_append_sheet(wb, wsAvances, avancesSheetName)
        }
      }

      // Guardar archivo con configuración para formato español
      const fileName = `avances-proveedores-filtrado-${new Date().toISOString().slice(0, 10)}.xlsx`

      // Usar la opción bookSST para mantener las cadenas como cadenas
      const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array", bookSST: true })
      const blob = new Blob([wbout], { type: "application/octet-stream" })

      // Crear enlace de descarga
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      setIsExporting(false)
    } catch (error) {
      console.error("Error al exportar:", error)
      alert("Error al exportar a Excel. Consulte la consola para más detalles.")
      setIsExporting(false)
    }
  }

  const exportToExcelHierarchical = async () => {
    try {
      setIsExporting(true)

      // Configurar Excel para formato español
      configureExcelForSpanishFormat()

      // Crear un array para los datos jerárquicos
      const hierarchicalData: any[] = []

      // Procesar cada proveedor
      for (const proveedor of filteredProveedores) {
        // Añadir fila de encabezado del proveedor
        hierarchicalData.push({
          Tipo: "PROVEEDOR",
          ID: proveedor.id,
          Nombre: proveedor.nombre,
          "Órdenes Totales": proveedor.ordenesTotal,
          "Órdenes Completadas": proveedor.ordenesCompletadas,
          "Órdenes En Progreso": proveedor.ordenesEnProgreso,
          "Progreso Total (%)": proveedor.progresoTotal,
        })

        // Añadir fila en blanco para separar
        hierarchicalData.push({})

        // Añadir encabezado de órdenes
        hierarchicalData.push({
          Tipo: "ENCABEZADO_ORDENES",
          ID: "ID Orden",
          Nombre: "Descripción",
          Número: "Número",
          "Superficie Total (ha)": "Superficie Total (ha)",
          "Superficie Completada (ha)": "Superficie Completada (ha)",
          "Progreso (%)": "Progreso (%)",
          Estado: "Estado",
          "Fecha Creación": "Fecha Creación",
        })

        // Procesar cada orden del proveedor
        for (const orden of proveedor.ordenes) {
          // Calcular avance para esta orden
          const avancesOrden = proveedor.avances.filter(
            (avance: any) => avance.ordenTrabajoId === orden._id || avance.ordenTrabajoId === orden.id,
          )

          const superficieTotal = Number.parseFloat(orden.cantidad) || 0
          const superficieCompletada = avancesOrden.reduce(
            (total: number, avance: any) => total + (Number.parseFloat(avance.superficie) || 0),
            0,
          )

          const porcentajeAvance =
            superficieTotal > 0 ? Math.min(100, Math.round((superficieCompletada / superficieTotal) * 100)) : 0

          // Añadir fila de orden
          hierarchicalData.push({
            Tipo: "ORDEN",
            ID: orden._id || orden.id,
            Nombre: orden.descripcion || "Sin descripción",
            Número: orden.numero || "N/A",
            "Superficie Total (ha)": Number(superficieTotal),
            "Superficie Completada (ha)": Number(superficieCompletada),
            "Progreso (%)": Number(porcentajeAvance),
            Estado: orden.estado || "No especificado",
            "Fecha Creación": formatDate(orden.fechaCreacion),
          })

          // Si la orden tiene avances, añadir encabezado
          if (avancesOrden.length > 0) {
            hierarchicalData.push({
              Tipo: "ENCABEZADO_AVANCES",
              Fecha: "Fecha",
              "Superficie (ha)": "Superficie (ha)",
              Plantas: "Plantas",
              Personal: "Personal",
              Observaciones: "Observaciones",
            })

            // Ordenar avances por fecha (más reciente primero)
            const avancesOrdenados = [...avancesOrden].sort((a, b) => {
              const fechaA = a.fecha ? new Date(a.fecha).getTime() : 0
              const fechaB = b.fecha ? new Date(b.fecha).getTime() : 0
              return fechaB - fechaA
            })

            // Añadir cada avance
            for (const avance of avancesOrdenados) {
              const superficie = Number.parseFloat(avance.superficie) || 0
              hierarchicalData.push({
                Tipo: "AVANCE",
                Fecha: formatDate(avance.fecha),
                "Superficie (ha)": Number(superficie),
                Plantas: Number(avance.plantas || 0),
                Personal: Number(avance.personal || 0),
                Observaciones: avance.observaciones || "",
              })
            }

            // Añadir fila en blanco después de los avances
            hierarchicalData.push({})
          }

          // Añadir fila en blanco después de cada orden
          hierarchicalData.push({})
        }

        // Añadir filas en blanco para separar proveedores
        hierarchicalData.push({})
        hierarchicalData.push({})
      }

      // Crear libro de Excel
      const wb = XLSX.utils.book_new()

      // Configurar opciones para formato español
      wb.Workbook = {
        Views: [{ RTL: false }],
      }

      // Añadir hoja con datos jerárquicos
      const wsHierarchical = XLSX.utils.json_to_sheet(hierarchicalData)

      // Aplicar estilos (ancho de columnas)
      const wscols = [
        { wch: 15 }, // Tipo
        { wch: 15 }, // ID
        { wch: 40 }, // Nombre
        { wch: 15 }, // Número/Órdenes Totales
        { wch: 20 }, // Superficie Total/Órdenes Completadas
        { wch: 20 }, // Superficie Completada/Órdenes En Progreso
        { wch: 15 }, // Progreso
        { wch: 15 }, // Estado
        { wch: 15 }, // Fecha Creación
      ]
      wsHierarchical["!cols"] = wscols

      // Forzar formato de texto para columnas con números decimales
      const range = XLSX.utils.decode_range(wsHierarchical["!ref"] || "A1:Z1000")
      for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cell_address = { c: C, r: R }
          const cell_ref = XLSX.utils.encode_cell(cell_address)
          const cell = wsHierarchical[cell_ref]

          if (cell && typeof cell.v === "string" && cell.v.includes(",")) {
            cell.t = "s" // Forzar tipo string
          }
        }
      }

      XLSX.utils.book_append_sheet(wb, wsHierarchical, "Avances por Proveedor")

      // Guardar archivo con configuración para formato español
      const fileName = `avances-proveedores-${new Date().toISOString().slice(0, 10)}.xlsx`

      // Usar la opción bookSST para mantener las cadenas como cadenas
      const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array", bookSST: true })
      const blob = new Blob([wbout], { type: "application/octet-stream" })

      // Crear enlace de descarga
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      setIsExporting(false)
    } catch (error) {
      console.error("Error al exportar:", error)
      alert("Error al exportar a Excel. Consulte la consola para más detalles.")
      setIsExporting(false)
    }
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <h2 className="text-lg font-semibold text-red-700 mb-2">Error al cargar los datos</h2>
        <p className="text-red-600">{error}</p>
        <p className="mt-4 text-sm text-gray-600">
          Intente recargar la página. Si el problema persiste, contacte al administrador del sistema.
        </p>
        <div className="flex gap-2 mt-4">
          <Button variant="outline" onClick={() => window.location.reload()}>
            Recargar página
          </Button>
          <Button variant="outline" onClick={clearCache}>
            Limpiar cache y recargar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Avances por Proveedor</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowExportDialog(true)} className="h-9">
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Exportar Filtrado
          </Button>
          <Button variant="outline" onClick={exportToExcelHierarchical} disabled={isExporting} className="h-9">
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            {isExporting ? "Exportando..." : "Exportar Todo"}
          </Button>
          <Button variant="outline" onClick={exportRawData} className="h-9">
            <Download className="mr-2 h-4 w-4" />
            Exportar JSON
          </Button>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar proveedor..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {loadingProgress.total > 0 && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{loadingProgress.phase}</p>
                    <p className="text-sm text-muted-foreground">
                      {loadingProgress.current} de {loadingProgress.total}
                    </p>
                    <Progress value={(loadingProgress.current / loadingProgress.total) * 100} className="mt-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Proveedor</TableHead>
                    <TableHead className="w-[100px] text-center">Órdenes</TableHead>
                    <TableHead className="w-[100px] text-center">Completadas</TableHead>
                    <TableHead className="w-[100px] text-center">En progreso</TableHead>
                    <TableHead className="w-[150px]">Progreso</TableHead>
                    <TableHead className="w-[100px] text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-5 w-[200px]" />
                      </TableCell>
                      <TableCell className="text-center">
                        <Skeleton className="h-5 w-[30px] mx-auto" />
                      </TableCell>
                      <TableCell className="text-center">
                        <Skeleton className="h-5 w-[30px] mx-auto" />
                      </TableCell>
                      <TableCell className="text-center">
                        <Skeleton className="h-5 w-[30px] mx-auto" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="h-9 w-[100px] ml-auto" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      ) : filteredProveedores.length === 0 ? (
        <div className="text-center py-10">
          <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No se encontraron proveedores</h3>
          <p className="text-muted-foreground">No hay proveedores con órdenes de trabajo asignadas.</p>
          <div className="mt-6 p-4 bg-gray-50 rounded-lg text-left max-w-2xl mx-auto">
            <h4 className="font-medium mb-2">Información de depuración:</h4>
            <p className="text-sm text-gray-600 mb-2">
              Se encontraron {proveedores.length} proveedores en total, pero ninguno tiene órdenes asignadas.
            </p>
            <p className="text-sm text-gray-600">
              Revise la consola del navegador para ver los logs detallados de proveedores y órdenes.
            </p>
            <Button variant="outline" className="mt-4" onClick={exportRawData}>
              <Download className="mr-2 h-4 w-4" />
              Exportar datos para análisis
            </Button>
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Proveedor</TableHead>
                  <TableHead className="w-[100px] text-center">Órdenes</TableHead>
                  <TableHead className="w-[100px] text-center">Completadas</TableHead>
                  <TableHead className="w-[100px] text-center">En progreso</TableHead>
                  <TableHead className="w-[150px]">Progreso</TableHead>
                  <TableHead className="w-[100px] text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProveedores.map((proveedor) => (
                  <TableRow key={proveedor.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        {proveedor.nombre}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">{proveedor.ordenesTotal}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="bg-green-50">
                        {proveedor.ordenesCompletadas}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="bg-amber-50">
                        {proveedor.ordenesEnProgreso}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={proveedor.progresoTotal} className="h-2 flex-1" />
                        <span className="text-sm font-medium w-9 text-right">{proveedor.progresoTotal}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/admin/avances/proveedor/${proveedor.id}`} passHref>
                        <Button size="sm" className="h-9">
                          Ver Órdenes
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
      {/* Diálogo de filtros de exportación */}
      {showExportDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Filtros de Exportación</h2>

            {/* Filtro por proveedores */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Proveedores</label>
              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border rounded p-2">
                {proveedores.map((proveedor) => (
                  <label key={proveedor.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={exportFilters.proveedores.includes(proveedor.id.toString())}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setExportFilters((prev) => ({
                            ...prev,
                            proveedores: [...prev.proveedores, proveedor.id.toString()],
                          }))
                        } else {
                          setExportFilters((prev) => ({
                            ...prev,
                            proveedores: prev.proveedores.filter((id) => id !== proveedor.id.toString()),
                          }))
                        }
                      }}
                    />
                    <span className="text-sm">{proveedor.nombre}</span>
                  </label>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => setExportFilters((prev) => ({ ...prev, proveedores: [] }))}
              >
                Limpiar selección
              </Button>
            </div>

            {/* Filtro por actividades */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Actividades</label>
              <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto border rounded p-2">
                {getUniqueValues().actividades.map((actividad) => (
                  <label key={actividad} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={exportFilters.actividades.includes(actividad)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setExportFilters((prev) => ({
                            ...prev,
                            actividades: [...prev.actividades, actividad],
                          }))
                        } else {
                          setExportFilters((prev) => ({
                            ...prev,
                            actividades: prev.actividades.filter((act) => act !== actividad),
                          }))
                        }
                      }}
                    />
                    <span className="text-sm">{actividad}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Filtro por rango de fechas */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Rango de Fechas de Avances</label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Desde</label>
                  <input
                    type="date"
                    value={exportFilters.fechaDesde}
                    onChange={(e) => setExportFilters((prev) => ({ ...prev, fechaDesde: e.target.value }))}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Hasta</label>
                  <input
                    type="date"
                    value={exportFilters.fechaHasta}
                    onChange={(e) => setExportFilters((prev) => ({ ...prev, fechaHasta: e.target.value }))}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
              </div>
            </div>

            {/* Opciones adicionales */}
            <div className="mb-6">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={exportFilters.incluirSinAvances}
                  onChange={(e) => setExportFilters((prev) => ({ ...prev, incluirSinAvances: e.target.checked }))}
                />
                <span className="text-sm">Incluir proveedores sin avances</span>
              </label>
            </div>

            {/* Botones */}
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowExportDialog(false)}>
                Cancelar
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setExportFilters({
                    proveedores: [],
                    fechaDesde: "",
                    fechaHasta: "",
                    actividades: [],
                    estados: [],
                    incluirSinAvances: true,
                  })
                }}
              >
                Limpiar Filtros
              </Button>
              <Button
                onClick={() => {
                  setShowExportDialog(false)
                  exportToExcelHierarchicalFiltered()
                }}
                disabled={isExporting}
              >
                {isExporting ? "Exportando..." : "Exportar"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
