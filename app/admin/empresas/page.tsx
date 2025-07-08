"use client"

import { AdminCollectionPage } from "@/components/admin-collection-page"

const columns = [
  {
    header: "Nombre",
    accessorKey: "empresa",
    cell: (item: any) => item.empresa || item.nombre || "-",
  },
  {
    header: "CUIT",
    accessorKey: "cuit",
  },
  {
    header: "Teléfono",
    accessorKey: "telefono",
  },
  {
    header: "Email",
    accessorKey: "email",
  },
  {
    header: "Rubros",
    accessorKey: "rubros",
    cell: (item: any) => {
      if (Array.isArray(item.rubros)) {
        return item.rubros.join(", ")
      }
      if (typeof item.rubros === "string") {
        return item.rubros
      }
      return "-"
    },
  },
  {
    header: "Estado",
    accessorKey: "activo",
    cell: (item: any) => (
      <span
        className={`px-2 py-1 rounded-full text-xs ${
          item.activo !== false ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
        }`}
      >
        {item.activo !== false ? "Activo" : "Inactivo"}
      </span>
    ),
  },
]

const formFields = [
  {
    name: "empresa",
    label: "Nombre de la Empresa",
    type: "text",
    required: true,
    placeholder: "Ingrese el nombre de la empresa",
  },
  {
    name: "cuit",
    label: "CUIT",
    type: "text",
    required: true,
    placeholder: "XX-XXXXXXXX-X",
  },
  {
    name: "telefono",
    label: "Teléfono",
    type: "tel",
    required: false,
    placeholder: "+54 11 XXXX-XXXX",
  },
  {
    name: "email",
    label: "Email",
    type: "email",
    required: false,
    placeholder: "contacto@empresa.com",
  },
  {
    name: "rubros",
    label: "Rubros",
    type: "text",
    required: false,
    placeholder: "Separar con comas: Forestal, Agrícola, etc.",
    description: "Ingrese los rubros separados por comas",
  },
  {
    name: "activo",
    label: "Estado",
    type: "select",
    required: true,
    options: [
      { value: "true", label: "Activo" },
      { value: "false", label: "Inactivo" },
    ],
  },
]

export default function EmpresasPage() {
  return (
    <AdminCollectionPage
      title="Empresas/Proveedores"
      description="Gestión de empresas y proveedores del sistema"
      collectionName="empresas"
      columns={columns}
      formFields={formFields}
    />
  )
}
