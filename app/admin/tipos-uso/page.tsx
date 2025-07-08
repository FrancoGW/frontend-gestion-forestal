"use client"

import { AdminCollectionPage } from "@/components/admin-collection-page"

export default function TiposUsoPage() {
  const columns = [
    {
      header: "ID",
      accessorKey: "_id",
    },
    {
      header: "Nombre",
      accessorKey: "tipouso",
    },
    {
      header: "ID Tipo Uso",
      accessorKey: "idtipouso",
    },
  ]

  const formFields = [
    {
      name: "tipouso",
      label: "Nombre",
      type: "text",
      required: true,
    },
    {
      name: "idtipouso",
      label: "ID Tipo Uso",
      type: "number",
    },
  ]

  return (
    <AdminCollectionPage
      title="Tipos de Uso"
      description="Administración de tipos de uso de terrenos"
      collectionName="tiposUso"
      columns={columns}
      formFields={formFields}
    />
  )
}
