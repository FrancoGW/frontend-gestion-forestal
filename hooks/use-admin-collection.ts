"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "@/components/ui/use-toast"

// Importamos las APIs administrativas
import {
  zonasAPI,
  propietariosAPI,
  camposAPI,
  empresasAPI,
  actividadesAPI,
  usuariosAPI,
  tiposUsoAPI,
  especiesAPI,
  ambientalesAPI,
  insumosAPI,
  viverosAPI,
  vecinosAPI,

} from "@/lib/api-client"

// Mapa de APIs
const apiMap: Record<string, any> = {
  zonas: zonasAPI,
  propietarios: propietariosAPI,
  campos: camposAPI,
  empresas: empresasAPI,
  actividades: actividadesAPI,
  usuarios: usuariosAPI,
  tiposUso: tiposUsoAPI,
  especies: especiesAPI,
  ambientales: ambientalesAPI,
  insumos: insumosAPI,
  viveros: viverosAPI,
  vecinos: vecinosAPI,
}

// Actualizar el mapeo de campos para incluir empresas y tipos de uso
const fieldMappings: Record<string, Record<string, string>> = {
  zonas: {
    id: "_id",
    nombre: "zona",
  },
  propietarios: {
    id: "_id",
    nombre: "propietario",
  },
  campos: {
    id: "_id",
    nombre: "campo",
    idcampo: "idcampo",
    propietario: "propietario",
    propietario_id: "propietario_id",
    superficie: "sup_legal",
    zona: "zona",
    zona_id: "zona_id",
  },
  usuarios: {
    id: "_id",
    nombre: "name",
  },
  especies: {
    id: "_id",
    nombre: "especie",
  },
  ambientales: {
    id: "_id",
    aspecto: "aspecto",
  },
  empresas: {
    id: "_id",
    nombre: "empresa",
    idempresa: "idempresa",
  },
  tiposUso: {
    id: "_id",
    nombre: "tipouso",
    idtipouso: "idtipouso",
  },
  insumos: {
    id: "_id",
    nombre: "insumo",
  },
  viveros: {
    id: "_id",
    nombre: "nombre",
  },
  vecinos: {
    id: "_id",
    nombre: "nombre",
  },
}

export function useAdminCollection(collectionName: string) {
  const [data, setData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const [dataFetched, setDataFetched] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const api = apiMap[collectionName]
  const fieldMapping = fieldMappings[collectionName] || {}

  // Función para transformar los datos según el mapeo de campos
  const transformData = (item: any) => {
    const result: Record<string, any> = {}

    // Primero copiamos todos los campos originales
    Object.keys(item).forEach((key) => {
      result[key] = item[key]
    })

    // Luego aplicamos el mapeo para tener campos estandarizados
    Object.entries(fieldMapping).forEach(([standardKey, originalKey]) => {
      if (item[originalKey] !== undefined) {
        result[standardKey] = item[originalKey]
      }
    })

    // Asegurarse de que los campos numéricos sean números
    if (result.densidad && typeof result.densidad === "string") {
      result.densidad = Number.parseFloat(result.densidad)
    }

    return result
  }

  const fetchData = useCallback(async () => {
    if (!api) {
      console.error(`API para ${collectionName} no encontrada`)
      setIsError(true)
      setErrorMessage(`API para ${collectionName} no encontrada`)
      setIsLoading(false)
      return
    }

    if (dataFetched) return

    setIsLoading(true)
    setIsError(false)
    setErrorMessage(null)

    try {
      const response = await api.getAll()

      // Determinar la estructura de la respuesta
      let items = []
      if (Array.isArray(response)) {
        items = response
      } else if (response.data && Array.isArray(response.data)) {
        items = response.data
      } else if (response[collectionName] && Array.isArray(response[collectionName])) {
        items = response[collectionName]
      } else if (response.viveros && Array.isArray(response.viveros) && collectionName === "viveros") {
        // Manejar estructura específica de viveros
        items = response.viveros
      } else {
        console.warn(`Estructura de respuesta desconocida para ${collectionName}:`, response)
        items = []
      }

      // Transformar los datos según el mapeo de campos y convertir campos numéricos
      const transformedItems = items.map((item) => {
        const transformed = transformData(item)

        // Convertir campos numéricos de string a number
        if (transformed.densidad && typeof transformed.densidad === "string") {
          transformed.densidad = Number.parseFloat(transformed.densidad)
        }

        return transformed
      })

      setData(transformedItems)
      setDataFetched(true)
    } catch (error) {
      console.error(`Error al obtener ${collectionName}:`, error)
      setIsError(true)
      setErrorMessage(error.message || `Error al obtener ${collectionName}`)
      // No usar datos mock, dejar el array vacío
      setData([])
    } finally {
      setIsLoading(false)
    }
  }, [api, collectionName, dataFetched, fieldMapping])

  const addItem = async (itemData: any) => {
    if (!api) return

    try {
      setIsLoading(true)

      // Transformar los datos para enviar al backend según el mapeo inverso
      const backendData: Record<string, any> = {}

      // Aplicar el mapeo específico primero
      Object.entries(fieldMapping).forEach(([standardKey, originalKey]) => {
        if (itemData[standardKey] !== undefined && itemData[standardKey] !== null && itemData[standardKey] !== "") {
          backendData[originalKey] = itemData[standardKey]
        }
      })

      // Luego copiamos los campos que no están en el mapeo
      Object.keys(itemData).forEach((key) => {
        if (itemData[key] !== undefined && itemData[key] !== null && itemData[key] !== "" && !fieldMapping[key]) {
          backendData[key] = itemData[key]
        }
      })


      const response = await api.create(backendData)

      // Transformar la respuesta según el mapeo de campos
      const transformedItem = transformData(response)

      setData((prev) => [...prev, transformedItem])
      toast({
        title: "Éxito",
        description: `${getSingularName(collectionName)} agregado correctamente.`,
      })
    } catch (error) {
      console.error(`Error al agregar ${collectionName}:`, error)
      toast({
        variant: "destructive",
        title: "Error",
        description: `No se pudo agregar el ${getSingularName(collectionName)}.`,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const updateItem = async (id: string | number, itemData: any) => {
    if (!api) return

    try {
      setIsLoading(true)

      // Transformar los datos para enviar al backend según el mapeo inverso
      const backendData: Record<string, any> = {}


      // Aplicar el mapeo específico primero
      Object.entries(fieldMapping).forEach(([standardKey, originalKey]) => {
        if (itemData[standardKey] !== undefined && itemData[standardKey] !== null && itemData[standardKey] !== "") {
          // Asegurarse de que la densidad sea un número para el backend
          if (originalKey === "densidad" && typeof itemData[standardKey] === "string") {
            backendData[originalKey] = Number.parseFloat(itemData[standardKey])
          } else {
            backendData[originalKey] = itemData[standardKey]
          }
        }
      })

      // Luego copiamos los campos que no están en el mapeo
      Object.keys(itemData).forEach((key) => {
        if (itemData[key] !== undefined && itemData[key] !== null && itemData[key] !== "" && !fieldMapping[key]) {
          // Asegurarse de que la densidad sea un número para el backend
          if (key === "densidad" && typeof itemData[key] === "string") {
            backendData[key] = Number.parseFloat(itemData[key])
          } else {
            backendData[key] = itemData[key]
          }
        }
      })

      // Eliminar campos que puedan causar problemas
      delete backendData._id // Evitar enviar el ID en el cuerpo
      delete backendData.id // Evitar enviar el ID en el cuerpo


      try {
        // Intentar primero con el ID tal como está
        const response = await api.update(id, backendData)

        // Si la respuesta no contiene los datos actualizados, hacer un refresh
        if (!response || !response.especie) {

          // Actualizar el item localmente con los datos que enviamos
          const updatedItem = {
            _id: id,
            id: id,
            ...backendData,
            // Asegurar que los campos estén en el formato correcto para mostrar
            nombre: backendData.especie || backendData.nombre,
            especie: backendData.especie,
            densidad: backendData.densidad,
          }

          setData((prev) => prev.map((item) => (item.id === id || item._id === id ? updatedItem : item)))

          // Programar un refresh después de un breve delay para sincronizar con el servidor
          setTimeout(() => {
            refreshData()
          }, 1000)
        } else {
          // Transformar la respuesta según el mapeo de campos
          const transformedItem = transformData(response)
          setData((prev) => prev.map((item) => (item.id === id || item._id === id ? transformedItem : item)))
        }

        toast({
          title: "Éxito",
          description: `${getSingularName(collectionName)} actualizado correctamente.`,
        })
      } catch (firstError) {
        console.error(`Error al actualizar con ID directo:`, firstError)

        // Si falla, intentar con el ID sin el prefijo "ObjectId"
        if (typeof id === "string" && id.includes("ObjectId")) {
          const cleanId = id.replace(/ObjectId$$['"](.+)['"]$$/, "$1")

          const response = await api.update(cleanId, backendData)

          // Si la respuesta no contiene los datos actualizados, hacer un refresh
          if (!response || !response.especie) {

            // Actualizar el item localmente con los datos que enviamos
            const updatedItem = {
              _id: id,
              id: id,
              ...backendData,
              // Asegurar que los campos estén en el formato correcto para mostrar
              nombre: backendData.especie || backendData.nombre,
              especie: backendData.especie,
              densidad: backendData.densidad,
            }

            setData((prev) => prev.map((item) => (item.id === id || item._id === id ? updatedItem : item)))

            // Programar un refresh después de un breve delay para sincronizar con el servidor
            setTimeout(() => {
              refreshData()
            }, 1000)
          } else {
            // Transformar la respuesta según el mapeo de campos
            const transformedItem = transformData(response)
            setData((prev) => prev.map((item) => (item.id === id || item._id === id ? transformedItem : item)))
          }

          toast({
            title: "Éxito",
            description: `${getSingularName(collectionName)} actualizado correctamente.`,
          })
        } else {
          // Si no es un ObjectId, reenviar el error
          throw firstError
        }
      }
    } catch (error) {
      console.error(`Error al actualizar ${collectionName}:`, error)

      // Mostrar detalles adicionales del error si están disponibles
      if (error.response) {
        console.error("Detalles del error:", {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
        })
      }

      toast({
        variant: "destructive",
        title: "Error",
        description: `No se pudo actualizar el ${getSingularName(collectionName)}. ${error.message}`,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const deleteItem = async (id: string | number) => {
    if (!api) return

    try {
      setIsLoading(true)

      try {
        // Intentar primero con el ID tal como está
        await api.delete(id)
      } catch (firstError) {
        console.error(`Error al eliminar con ID directo:`, firstError)

        // Si falla, intentar con el ID sin el prefijo "ObjectId"
        if (typeof id === "string" && id.includes("ObjectId")) {
          const cleanId = id.replace(/ObjectId$$['"](.+)['"]$$/, "$1")
          await api.delete(cleanId)
        } else {
          // Si no es un ObjectId, reenviar el error
          throw firstError
        }
      }

      setData((prev) => prev.filter((item) => item.id !== id && item._id !== id))
      toast({
        title: "Éxito",
        description: `${getSingularName(collectionName)} eliminado correctamente.`,
      })
    } catch (error) {
      console.error(`Error al eliminar ${collectionName}:`, error)
      toast({
        variant: "destructive",
        title: "Error",
        description: `No se pudo eliminar el ${getSingularName(collectionName)}.`,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const refreshData = () => {
    setDataFetched(false)
    fetchData()
  }

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    data,
    isLoading,
    isError,
    errorMessage,
    refreshData,
    addItem,
    updateItem,
    deleteItem,
  }
}

// Hook específico para obtener especies de poda
export function useEspeciesPoda() {
  const { data: allEspecies, isLoading, isError } = useAdminCollection("especies")

  const especiesPoda = allEspecies.filter((especie) => especie.category === "poda")

  return {
    data: especiesPoda,
    isLoading,
    isError,
    // Formatear para usar en selects
    options: especiesPoda.map((especie) => ({
      value: especie._id || especie.id,
      label: especie.especie || especie.nombre,
    })),
  }
}

// Función auxiliar para obtener el nombre singular de una colección
function getSingularName(collectionName: string): string {
  const singularMap: Record<string, string> = {
    zonas: "zona",
    propietarios: "propietario",
    campos: "campo",
    empresas: "empresa/proveedor",
    actividades: "actividad",
    usuarios: "usuario",
    tiposUso: "tipo de uso",
    especies: "especie",
    ambientales: "aspecto ambiental",
    insumos: "insumo",
    viveros: "vivero",
    vecinos: "vecino",
  }

  return singularMap[collectionName] || collectionName.slice(0, -1)
}

// Función para generar datos de ejemplo
function getExampleData(collectionName: string): any[] {
  switch (collectionName) {
    case "zonas":
      return [
        { _id: 1, zona: "VIRASORO" },
        { _id: 2, zona: "LA CRUZ" },
        { _id: 3, zona: "PASO DE LOS LIBRES" },
      ]
    case "propietarios":
      return [
        { _id: 1, propietario: "EMPRESAS VERDES ARGENTINA S.A." },
        { _id: 2, propietario: "LAS MISIONES S.A." },
      ]
    case "campos":
      return [
        {
          _id: 1,
          campo: "LA SELVA",
          idcampo: 1023,
          propietario: "FORESTAL ARGENTINA S.A.",
          propietario_id: 4,
          sup_legal: "898",
          zona: "VIRASORO",
          zona_id: 1,
        },
      ]
    case "usuarios":
      return [
        { _id: 21, name: "Alejandro Wayer" },
        { _id: 49, name: "Armando Gamboa" },
      ]
    case "especies":
      return [
        { _id: 301, especie: "Eucalyptus clon", densidad: 1111, category: "plantacion" },
        { _id: 302, especie: "Eucalyptus clon reposición", densidad: 1600, category: "plantacion" },
        { _id: 306, especie: "Eucalyptus saligna", densidad: 2500, category: "plantacion" },
        { _id: 1001, especie: "Euca", category: "poda", tipoPoda: "General", cantidadPlantas: 500 },
        { _id: 6842, especie: "Pino", category: "poda", tipoPoda: "General", cantidadPlantas: 300 },
      ]
    case "ambientales":
      return [
        { _id: 12, aspecto: "APLICACIONES AÉREAS PRÓXIMAS A VIVIENDAS O POBLADOS VECINOS." },
        { _id: 9, aspecto: "CERCANÍA A AREAS NATURALES, RESERVAS, AAVC O CURSOS DE AGUA." },
      ]
    case "empresas":
      return [
        { _id: 6, empresa: "WISEFOR S.R.L.", idempresa: 6 },
        { _id: 10, empresa: "ADRIANA MARLENE MATZKE", idempresa: 10 },
      ]
    case "tiposUso":
      return [
        { _id: 1030, tipouso: "Venta a terceros", idtipouso: 1030 },
        { _id: 6030, tipouso: "Bosque Nativo", idtipouso: 6030 },
      ]
    case "insumos":
      return [
        { _id: 9, insumo: "2,4-DB / SIGMA 93.1% (LTS/HA)" },
        { _id: 10, insumo: "2,4-D / KRYNN DUO 80.4% (LTS/HA)" },
        { _id: 11, insumo: "BACILUS / BAC-THUR 4% (LTS/HA)" },
      ]
    case "viveros":
      return [
        { _id: 1, nombre: "Paul", activo: true },
        { _id: 2, nombre: "Loreto", activo: true },
        { _id: 3, nombre: "Von Wernich", activo: true },
      ]
    default:
      return []
  }
}
