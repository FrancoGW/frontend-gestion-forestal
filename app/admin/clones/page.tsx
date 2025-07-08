"use client"

import { AdminCollectionPage } from "@/components/admin-collection-page"

export default function ClonesPage() {
  const columns = [
    {
      header: "ID",
      accessorKey: "_id",
    },
    {
      header: "Código del Clon",
      accessorKey: "codigo",
    },
    {
      header: "Especie Asociada",
      accessorKey: "especieAsociada",
    },
    {
      header: "Origen",
      accessorKey: "origen",
    },
    {
      header: "Estado",
      accessorKey: "activo",
      cell: (item: any) => (
        <span
          className={`px-2 py-1 rounded-full text-xs ${
            item.activo ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}
        >
          {item.activo ? "Activo" : "Inactivo"}
        </span>
      ),
    },
  ]

  const formFields = [
    {
      name: "codigo",
      label: "Código del Clon",
      type: "text",
      required: true,
      placeholder: "Ej: FA 13, INTA 36, DDX 26",
    },
    {
      name: "especieAsociada",
      label: "Especie Asociada",
      type: "text",
      required: true,
      placeholder: "Ej: Eucalipto, Pino",
    },
    {
      name: "origen",
      label: "Origen",
      type: "text",
      required: false,
      placeholder: "Ej: Forestal Argentina, INTA, DDX",
    },
    {
      name: "activo",
      label: "Estado Activo",
      type: "checkbox",
      required: false,
    },
  ]

  return (
    <AdminCollectionPage
      title="Clones"
      description="Administración de clones forestales"
      collectionName="clones"
      columns={columns}
      formFields={formFields}
    />
  )
}
