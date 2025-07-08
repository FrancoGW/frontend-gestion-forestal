"use client"

import { AdminCollectionPage } from "@/components/admin-collection-page"

export default function AmbientalesPage() {
  const columns = [
    {
      header: "ID",
      accessorKey: "_id",
    },
    {
      header: "Aspecto",
      accessorKey: "aspecto",
    },
  ]

  const formFields = [
    {
      name: "aspecto",
      label: "Aspecto Ambiental",
      type: "text",
      required: true,
    },
  ]

  return (
    <AdminCollectionPage
      title="Aspectos Ambientales"
      description="Administración de aspectos ambientales"
      collectionName="ambientales"
      columns={columns}
      formFields={formFields}
    />
  )
}
