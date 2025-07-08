"use client"

import { AdminCollectionPage } from "@/components/admin-collection-page"

export default function InsumosPage() {
  const columns = [
    {
      header: "ID",
      accessorKey: "id",
    },
    {
      header: "Nombre",
      accessorKey: "nombre",
    },
  ]

  const formFields = [
    {
      name: "nombre",
      label: "Nombre",
      type: "text",
      required: true,
      placeholder: "Ej: GLIFOSATO / POWER MAXX 79.2% (KG/HA)",
    },
  ]

  return (
    <AdminCollectionPage
      title="Insumos"
      description="Administración de insumos forestales"
      collectionName="insumos"
      columns={columns}
      formFields={formFields}
    />
  )
}
