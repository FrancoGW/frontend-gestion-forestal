"use client"

import { AdminCollectionPage } from "@/components/admin-collection-page"

export default function CamposPage() {
  const columns = [
    {
      header: "ID",
      accessorKey: "_id",
    },
    {
      header: "ID Campo",
      accessorKey: "idcampo",
    },
    {
      header: "Nombre",
      accessorKey: "campo",
    },
    {
      header: "Propietario",
      accessorKey: "propietario",
    },
    {
      header: "Superficie Legal",
      accessorKey: "sup_legal",
    },
    {
      header: "Zona",
      accessorKey: "zona",
    },
  ]

  const formFields = [
    {
      name: "campo",
      label: "Nombre del Campo",
      type: "text",
      required: true,
    },
    {
      name: "idcampo",
      label: "ID Campo",
      type: "number",
      required: true,
    },
    {
      name: "propietario_id",
      label: "ID Propietario",
      type: "number",
      required: true,
    },
    {
      name: "sup_legal",
      label: "Superficie Legal",
      type: "text",
    },
    {
      name: "zona_id",
      label: "ID Zona",
      type: "number",
      required: true,
    },
  ]

  return (
    <AdminCollectionPage
      title="Campos"
      description="Administración de campos forestales"
      collectionName="campos"
      columns={columns}
      formFields={formFields}
    />
  )
}
