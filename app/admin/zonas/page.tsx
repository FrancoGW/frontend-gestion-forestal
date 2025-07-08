"use client"

import { AdminCollectionPage } from "@/components/admin-collection-page"

export default function ZonasPage() {
  const columns = [
    {
      header: "ID",
      accessorKey: "_id",
    },
    {
      header: "Nombre",
      accessorKey: "zona",
    },
  ]

  const formFields = [
    {
      name: "zona",
      label: "Nombre de la Zona",
      type: "text",
      required: true,
    },
  ]

  return (
    <AdminCollectionPage
      title="Zonas"
      description="Administración de zonas geográficas"
      collectionName="zonas"
      columns={columns}
      formFields={formFields}
    />
  )
}
