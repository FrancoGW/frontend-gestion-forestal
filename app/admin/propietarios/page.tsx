"use client"

import { AdminCollectionPage } from "@/components/admin-collection-page"

export default function PropietariosPage() {
  const columns = [
    {
      header: "ID",
      accessorKey: "_id",
    },
    {
      header: "Nombre",
      accessorKey: "propietario",
    },
  ]

  const formFields = [
    {
      name: "propietario",
      label: "Nombre del Propietario",
      type: "text",
      required: true,
    },
  ]

  return (
    <AdminCollectionPage
      title="Propietarios"
      description="Administración de propietarios de campos"
      collectionName="propietarios"
      columns={columns}
      formFields={formFields}
    />
  )
}
