"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RefreshCw, Database } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

import { useAdminCollection } from "@/hooks/use-admin-collection"
import { AdminDataTable } from "@/components/admin-data-table"

interface AdminCollectionPageProps {
  title: string
  description: string
  collectionName: string
  columns: {
    header: string
    accessorKey: string
    cell?: (item: any) => React.ReactNode
  }[]
  formFields?: {
    name: string
    label: string
    type: string
    required?: boolean
    options?: { value: string; label: string }[]
    placeholder?: string
    description?: string
  }[]
  isLoading?: boolean
  hideHeader?: boolean
  syncEndpoint?: string
}

export function AdminCollectionPage({
  title,
  description,
  collectionName,
  columns,
  formFields,
  isLoading,
  hideHeader = false,
  syncEndpoint,
}: AdminCollectionPageProps) {
  const {
    data,
    isLoading: dataLoading,
    isError,
    refreshData,
    addItem,
    updateItem,
    deleteItem,
  } = useAdminCollection(collectionName)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<any>(null)
  const { toast } = useToast()

  const handleSync = async () => {
    if (!syncEndpoint) return

    setSyncing(true)
    setSyncResult(null)
    try {
      const response = await fetch(syncEndpoint, {
        method: "POST",
      })
      const result = await response.json()

      if (result.success) {
        setSyncResult(result.resumen)
        toast({
          title: "Sincronización exitosa",
          description: `Procesados: ${result.resumen.procesados}, Nuevos: ${result.resumen.nuevos}, Actualizados: ${result.resumen.actualizados}`,
        })
        // Recargar datos
        await refreshData()
      } else {
        throw new Error(result.message || "Error en la sincronización")
      }
    } catch (err: any) {
      toast({
        title: "Error en sincronización",
        description: err.message || "No se pudo sincronizar con Usuarios GIS",
        variant: "destructive",
      })
    } finally {
      setSyncing(false)
    }
  }

  // Procesamiento especial para campos específicos
  const processFormData = (formData: any) => {
    const processedData = { ...formData }

    // Si hay un campo "rubros" y es un string, conviértelo a array
    if (processedData.rubros && typeof processedData.rubros === "string") {
      processedData.rubros = processedData.rubros
        .split(",")
        .map((item: string) => item.trim())
        .filter((item: string) => item.length > 0)
    }

    // Asegurar que el campo activo sea booleano
    if (processedData.activo !== undefined) {
      processedData.activo = processedData.activo === true || processedData.activo === "true"
    }

    // Para empresas, usar el campo correcto para el nombre
    if (processedData.empresa && !processedData.nombre) {
      processedData.nombre = processedData.empresa
    }

    return processedData
  }

  // Funciones modificadas para procesar los datos
  const handleAddItem = async (formData: any) => {
    const processedData = processFormData(formData)
    return await addItem(processedData)
  }

  const handleUpdateItem = async (id: string, formData: any) => {
    const processedData = processFormData(formData)
    return await updateItem(id, processedData)
  }

  return (
    <div className="space-y-4">
      {!hideHeader && (
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{title}</h1>
          {syncEndpoint && (
            <Button onClick={handleSync} disabled={syncing} variant="outline">
              <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Sincronizando..." : "Sincronizar con GIS"}
            </Button>
          )}
        </div>
      )}
      {syncResult && (
        <Alert>
          <Database className="w-4 h-4 text-green-600" />
          <AlertDescription>
            ✅ Sincronización completada: {syncResult.procesados} procesados, {syncResult.nuevos} nuevos,{" "}
            {syncResult.actualizados} actualizados
            {syncResult.errores > 0 && `, ${syncResult.errores} errores`}
          </AlertDescription>
        </Alert>
      )}
      <AdminDataTable
        title={title}
        description={description}
        data={data}
        isLoading={isLoading || dataLoading}
        isError={isError}
        columns={columns}
        onRefresh={refreshData}
        onAdd={handleAddItem}
        onEdit={handleUpdateItem}
        onDelete={deleteItem}
        formFields={formFields}
      />
    </div>
  )
}
