"use client"

import { useState, useEffect, useCallback } from "react"
import { actividadesAPI } from "@/lib/api-client"
import type { Activity } from "@/types/activity"
import { determineActivityUnit } from "@/types/activity"

export function useActivities() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true)
      const data = await actividadesAPI.getAll()

      // Mapear los datos al formato esperado
      // El formato de la API es: { _id: number, actividad: string, sap_id: string }
      const activitiesData = Array.isArray(data)
        ? data.map((item) => {
            // Determinar la unidad correcta basada en el nombre de la actividad
            const activityName = item.actividad || item.nombre || ""
            const correctUnit = item.unidad || determineActivityUnit(activityName)

            return {
              id: item._id?.toString() || item.id?.toString() || "",
              codigo: item.sap_id || "",
              nombre: activityName,
              descripcion: item.descripcion || activityName,
              unidad: correctUnit,
              categoria: item.categoria || "",
              activo: item.activo !== false,
            }
          })
        : []


      // Para categorías, usamos un array vacío por ahora
      const categoriesData = []

      setActivities(activitiesData)
      setCategories(categoriesData)
      setLoading(false)
    } catch (err: any) {
      console.error("Error fetching activities:", err)
      setError(err.message || "Error al cargar las actividades")
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchActivities()
  }, [fetchActivities])

  const addActivity = async (activityData: Omit<Activity, "id">) => {
    try {
      // Determinar la unidad correcta si no se especificó
      const unidad = activityData.unidad || determineActivityUnit(activityData.nombre)

      // Convertir al formato que espera la API
      const apiData = {
        actividad: activityData.nombre,
        sap_id: activityData.codigo,
        unidad: unidad,
        descripcion: activityData.descripcion,
        activo: activityData.activo,
      }

      await actividadesAPI.create(apiData)
      await fetchActivities() // Recargar actividades
      return { success: true }
    } catch (err: any) {
      console.error("Error adding activity:", err)
      return { success: false, error: err.message }
    }
  }

  const updateActivity = async (id: string, activityData: Partial<Activity>) => {
    try {
      // Determinar la unidad correcta si se está actualizando el nombre pero no la unidad
      let unidad = activityData.unidad
      if (activityData.nombre && !activityData.unidad) {
        unidad = determineActivityUnit(activityData.nombre)
      }

      // Convertir al formato que espera la API
      const apiData: any = {}
      if (activityData.nombre) apiData.actividad = activityData.nombre
      if (activityData.codigo) apiData.sap_id = activityData.codigo
      if (unidad) apiData.unidad = unidad
      if (activityData.descripcion) apiData.descripcion = activityData.descripcion
      if (activityData.activo !== undefined) apiData.activo = activityData.activo

      await actividadesAPI.update(id, apiData)
      await fetchActivities() // Recargar actividades
      return { success: true }
    } catch (err: any) {
      console.error(`Error updating activity ${id}:`, err)
      return { success: false, error: err.message }
    }
  }

  const addCategory = async (categoryData: { nombre: string; descripcion: string }) => {
    try {
      await actividadesAPI.create({
        actividad: categoryData.nombre,
        descripcion: categoryData.descripcion,
        esCategoria: true,
        activo: true,
      })
      await fetchActivities() // Recargar actividades y categorías
      return { success: true }
    } catch (err: any) {
      console.error("Error adding category:", err)
      return { success: false, error: err.message }
    }
  }

  // Función para actualizar masivamente las unidades de todas las actividades
  const updateAllActivityUnits = async () => {
    try {

      // Para cada actividad, determinar la unidad correcta y actualizarla si es necesario
      for (const activity of activities) {
        const correctUnit = determineActivityUnit(activity.nombre)

        // Si la unidad actual no es la correcta, actualizar
        if (activity.unidad !== correctUnit) {

          await actividadesAPI.update(activity.id, {
            unidad: correctUnit,
          })
        }
      }

      await fetchActivities() // Recargar actividades con las nuevas unidades
      return { success: true, message: "Unidades actualizadas correctamente" }
    } catch (err: any) {
      console.error("Error updating activity units:", err)
      return { success: false, error: err.message }
    }
  }

  return {
    activities,
    categories,
    loading,
    error,
    addActivity,
    updateActivity,
    addCategory,
    updateAllActivityUnits,
    refresh: fetchActivities,
  }
}
