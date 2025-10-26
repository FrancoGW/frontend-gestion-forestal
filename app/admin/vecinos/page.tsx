"use client"

import { AdminCollectionPage } from "@/components/admin-collection-page"

export default function VecinosPage() {
  const columns = [
    {
      header: "Nombre del Vecino",
      accessorKey: "nombre",
    },
  ]

  const formFields = [
    {
      name: "nombre",
      label: "Nombre del Vecino",
      type: "text",
      required: true,
    },
  ]

  return (
    <AdminCollectionPage
      title="Vecinos"
      description="Administración de vecinos para avances sin orden"
      collectionName="vecinos"
      columns={columns}
      formFields={formFields}
    />
  )
}

