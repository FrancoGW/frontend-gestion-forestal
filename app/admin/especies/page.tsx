"use client"

import { useState, useMemo } from "react"
import { useAdminCollection } from "@/hooks/use-admin-collection"
import { AdminDataTable } from "@/components/admin-data-table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"

export default function EspeciesPage() {
  const [activeTab, setActiveTab] = useState("plantacion")

  // Obtener todas las especies
  const {
    data: allEspecies,
    isLoading,
    isError,
    refreshData,
    addItem,
    updateItem,
    deleteItem,
  } = useAdminCollection("especies")

  // Filtrar especies por categoría
  const especiesPlantacion = useMemo(() => {
    return allEspecies.filter((especie) => especie.category !== "poda")
  }, [allEspecies])

  const especiesPoda = useMemo(() => {
    return allEspecies.filter((especie) => especie.category === "poda")
  }, [allEspecies])

  // Columnas para especies de plantación
  const columnasPlantacion = [
    {
      header: "ID",
      accessorKey: "_id",
    },
    {
      header: "Especie",
      accessorKey: "especie",
    },
    {
      header: "Densidad (plantas/ha)",
      accessorKey: "densidad",
      cell: (item) => {
        const value = item.densidad
        if (value === undefined || value === null || value === "") {
          return "No definida"
        }
        // Asegurarse de que sea un número antes de formatearlo
        const numValue = typeof value === "string" ? Number.parseFloat(value) : value
        return isNaN(numValue) ? "No definida" : `${numValue.toLocaleString()} plantas/ha`
      },
    },
  ]

  // Columnas para especies de poda
  const columnasPoda = [
    {
      header: "ID",
      accessorKey: "_id",
    },
    {
      header: "Especie",
      accessorKey: "especie",
    },
    {
      header: "Descripción",
      accessorKey: "descripcion",
      cell: (item) => item.descripcion || "-",
    },
    {
      header: "Tipo de Poda",
      accessorKey: "tipoPoda",
      cell: (item) => item.tipoPoda || "General",
    },
    {
      header: "Cantidad de Plantas",
      accessorKey: "cantidadPlantas",
      cell: (item) => {
        const value = item.cantidadPlantas
        if (value === undefined || value === null || value === "") {
          return "No definida"
        }
        const numValue = typeof value === "string" ? Number.parseFloat(value) : value
        return isNaN(numValue) ? "No definida" : `${numValue.toLocaleString()} plantas`
      },
    },
  ]

  // Campos de formulario para especies de plantación
  const camposPlantacion = [
    {
      name: "especie",
      label: "Nombre de la Especie",
      type: "text",
      required: true,
    },
    {
      name: "densidad",
      label: "Densidad de Plantación (plantas por hectárea)",
      type: "number",
      required: false,
      placeholder: "Ej: 1111, 1600, 2500",
    },
  ]

  // Campos de formulario para especies de poda
  const camposPoda = [
    {
      name: "especie",
      label: "Nombre de la Especie",
      type: "text",
      required: true,
    },
    {
      name: "descripcion",
      label: "Descripción",
      type: "textarea",
      required: false,
    },
    {
      name: "tipoPoda",
      label: "Tipo de Poda",
      type: "select",
      required: true,
      options: [
        { value: "Primera poda", label: "Primera poda" },
        { value: "Segunda poda", label: "Segunda poda" },
        { value: "Tercera poda", label: "Tercera poda" },
        { value: "Poda de formación", label: "Poda de formación" },
        { value: "Poda sanitaria", label: "Poda sanitaria" },
        { value: "Poda de aclareo", label: "Poda de aclareo" },
        { value: "General", label: "General" },
      ],
    },
    {
      name: "cantidadPlantas",
      label: "Cantidad de Plantas",
      type: "number",
      required: true,
      placeholder: "Ej: 100, 500, 1000",
      description: "Número de plantas a podar por unidad de medida",
    },
  ]

  // Funciones para manejar las operaciones CRUD con la categoría correcta
  const handleAddPlantacion = (data) => {
    addItem({ ...data, category: "plantacion" })
  }

  const handleAddPoda = (data) => {
    // Asignar un ID mayor a 1000 para especies de poda
    const maxId = Math.max(...especiesPoda.map((e) => Number.parseInt(e._id) || 0), 1000)
    addItem({ ...data, category: "poda", _id: (maxId + 1).toString() })
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Especies Forestales</h1>
        <p className="text-muted-foreground">Administración de especies para plantación y poda</p>
      </div>

      <Separator />

      <Tabs defaultValue="plantacion" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="plantacion">🌱 Especies para Plantación</TabsTrigger>
          <TabsTrigger value="poda">✂️ Especies para Poda</TabsTrigger>
        </TabsList>

        <TabsContent value="plantacion" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Especies para Plantación</CardTitle>
              <CardDescription>
                Gestione las especies forestales utilizadas en plantaciones. Puede definir la densidad recomendada de
                plantas por hectárea para cada especie.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AdminDataTable
                title="Especies para Plantación"
                description="Administre las especies utilizadas en plantaciones forestales"
                data={especiesPlantacion}
                isLoading={isLoading}
                isError={isError}
                columns={columnasPlantacion}
                onRefresh={refreshData}
                onAdd={handleAddPlantacion}
                onEdit={updateItem}
                onDelete={deleteItem}
                formFields={camposPlantacion}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="poda" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Especies para Poda</CardTitle>
              <CardDescription>
                Gestione las especies forestales utilizadas en actividades de poda. Puede especificar el tipo de poda
                recomendado y añadir descripciones específicas.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AdminDataTable
                title="Especies para Poda"
                description="Administre las especies utilizadas en actividades de poda"
                data={especiesPoda}
                isLoading={isLoading}
                isError={isError}
                columns={columnasPoda}
                onRefresh={refreshData}
                onAdd={handleAddPoda}
                onEdit={updateItem}
                onDelete={deleteItem}
                formFields={camposPoda}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
