"use client"

import type React from "react"

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
}

export function AdminCollectionPage({
  title,
  description,
  collectionName,
  columns,
  formFields,
  isLoading,
  hideHeader = false,
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
        <>
          <h1 className="text-2xl font-bold">{title}</h1>
        </>
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
