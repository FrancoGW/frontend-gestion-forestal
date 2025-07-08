"use client"

import { AdminCollectionPage } from "@/components/admin-collection-page"

export default function ViverosPage() {
  const columns = [
    {
      header: "ID",
      accessorKey: "_id",
    },
    {
      header: "Nombre",
      accessorKey: "nombre",
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
      name: "nombre",
      label: "Nombre del Vivero",
      type: "text",
      required: true,
      placeholder: "Ej: Paul, Loreto, Von Wernich",
    },
    {
      name: "ubicacion",
      label: "Ubicación",
      type: "text",
      required: false,
      placeholder: "Ej: Misiones, Corrientes",
    },
    {
      name: "contacto",
      label: "Contacto",
      type: "text",
      required: false,
      placeholder: "Ej: Juan Pérez",
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
      title="Viveros"
      description="Administración de viveros forestales"
      collectionName="viveros"
      columns={columns}
      formFields={formFields}
    />
  )
}
