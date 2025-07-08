"use client"

import { useState } from "react"
import { useActivities } from "@/hooks/use-activities"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { PlusCircle, Edit, Tag, AlertCircle, RefreshCw } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import type { Activity } from "@/types/activity"

export default function ActividadesPage() {
  const { activities, categories, loading, error, addActivity, updateActivity, addCategory, updateAllActivityUnits } =
    useActivities()
  const [isAddActivityDialogOpen, setIsAddActivityDialogOpen] = useState(false)
  const [isAddCategoryDialogOpen, setIsAddCategoryDialogOpen] = useState(false)
  const [isUpdatingUnits, setIsUpdatingUnits] = useState(false)
  const { toast } = useToast()
  const [newActivity, setNewActivity] = useState<Omit<Activity, "id">>({
    codigo: "",
    nombre: "",
    descripcion: "",
    unidad: "Ha",
    categoria: "",
    activo: true,
  })
  const [newCategory, setNewCategory] = useState({
    nombre: "",
    descripcion: "",
  })
  const [activeTab, setActiveTab] = useState("actividades")

  const handleAddActivity = async () => {
    if (!newActivity.codigo || !newActivity.nombre) return

    const result = await addActivity(newActivity)
    if (result.success) {
      setNewActivity({
        codigo: "",
        nombre: "",
        descripcion: "",
        unidad: "Ha", // Reset to default
        categoria: categories.length > 0 ? categories[0].id : "",
        activo: true,
      })
      setIsAddActivityDialogOpen(false)
    }
  }

  const handleAddCategory = async () => {
    if (!newCategory.nombre) return

    const result = await addCategory(newCategory)
    if (result.success) {
      setNewCategory({
        nombre: "",
        descripcion: "",
      })
      setIsAddCategoryDialogOpen(false)
    }
  }

  const handleUpdateAllUnits = async () => {
    setIsUpdatingUnits(true)
    try {
      const result = await updateAllActivityUnits()
      if (result.success) {
        toast({
          title: "Unidades actualizadas",
          description: "Todas las actividades ahora tienen la unidad correcta",
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudieron actualizar las unidades",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Ocurrió un error al actualizar las unidades",
        variant: "destructive",
      })
    } finally {
      setIsUpdatingUnits(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Actividades</h1>
          <p className="text-muted-foreground">Gestiona las actividades del sistema</p>
        </div>

        <div className="space-y-4">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex justify-between">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-6 w-24" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Actividades</h1>
          <p className="text-muted-foreground">Gestiona las actividades del sistema</p>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Actividades</h1>
          <p className="text-muted-foreground">Gestiona las actividades del sistema</p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex items-center gap-1"
            onClick={handleUpdateAllUnits}
            disabled={isUpdatingUnits}
          >
            <RefreshCw className={`h-4 w-4 ${isUpdatingUnits ? "animate-spin" : ""}`} />
            {isUpdatingUnits ? "Actualizando..." : "Actualizar Unidades"}
          </Button>

          <Dialog open={isAddCategoryDialogOpen} onOpenChange={setIsAddCategoryDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-1">
                <Tag className="h-4 w-4" />
                Nueva Categoría
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Agregar Nueva Categoría</DialogTitle>
                <DialogDescription>
                  Complete los datos para registrar una nueva categoría de actividades
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="nombre-categoria" className="text-right">
                    Nombre
                  </Label>
                  <Input
                    id="nombre-categoria"
                    value={newCategory.nombre}
                    onChange={(e) => setNewCategory((prev) => ({ ...prev, nombre: e.target.value }))}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="descripcion-categoria" className="text-right">
                    Descripción
                  </Label>
                  <Input
                    id="descripcion-categoria"
                    value={newCategory.descripcion}
                    onChange={(e) => setNewCategory((prev) => ({ ...prev, descripcion: e.target.value }))}
                    className="col-span-3"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddCategoryDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleAddCategory} disabled={!newCategory.nombre}>
                  Agregar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isAddActivityDialogOpen} onOpenChange={setIsAddActivityDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-1">
                <PlusCircle className="h-4 w-4" />
                Nueva Actividad
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Agregar Nueva Actividad</DialogTitle>
                <DialogDescription>
                  Complete los datos para registrar una nueva actividad en el sistema
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="codigo" className="text-right">
                    Código SAP
                  </Label>
                  <Input
                    id="codigo"
                    value={newActivity.codigo}
                    onChange={(e) => setNewActivity((prev) => ({ ...prev, codigo: e.target.value }))}
                    className="col-span-3"
                    placeholder="Ej: 600170102"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="nombre" className="text-right">
                    Nombre
                  </Label>
                  <Input
                    id="nombre"
                    value={newActivity.nombre}
                    onChange={(e) => setNewActivity((prev) => ({ ...prev, nombre: e.target.value }))}
                    className="col-span-3"
                    placeholder="Ej: CONTROL DE HORMIGAS PRE PLANTACION"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="descripcion" className="text-right">
                    Descripción
                  </Label>
                  <Input
                    id="descripcion"
                    value={newActivity.descripcion}
                    onChange={(e) => setNewActivity((prev) => ({ ...prev, descripcion: e.target.value }))}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="unidad" className="text-right">
                    Unidad
                  </Label>
                  <Select
                    value={newActivity.unidad}
                    onValueChange={(value) => setNewActivity((prev) => ({ ...prev, unidad: value }))}
                  >
                    <SelectTrigger id="unidad" className="col-span-3">
                      <SelectValue placeholder="Seleccionar unidad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ha">Hectáreas (Ha)</SelectItem>
                      <SelectItem value="Jornal">Jornales (Jornal)</SelectItem>
                      <SelectItem value="Mes">Meses (Mes)</SelectItem>
                      <SelectItem value="Km">Kilómetros (Km)</SelectItem>
                      <SelectItem value="Hora">Horas (Hora)</SelectItem>
                      <SelectItem value="Parcela">Parcelas (Parcela)</SelectItem>
                      <SelectItem value="UN">Unidades (UN)</SelectItem>
                      <SelectItem value="M3">Metros cúbicos (M3)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {categories.length > 0 && (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="categoria" className="text-right">
                      Categoría
                    </Label>
                    <Select
                      value={newActivity.categoria}
                      onValueChange={(value) => setNewActivity((prev) => ({ ...prev, categoria: value }))}
                    >
                      <SelectTrigger id="categoria" className="col-span-3">
                        <SelectValue placeholder="Seleccionar categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddActivityDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleAddActivity} disabled={!newActivity.codigo || !newActivity.nombre}>
                  Agregar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Información</AlertTitle>
        <AlertDescription>
          Las actividades se obtienen directamente del sistema SAP. Algunas funcionalidades pueden estar limitadas.
        </AlertDescription>
      </Alert>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="actividades">Actividades</TabsTrigger>
          <TabsTrigger value="categorias">Categorías</TabsTrigger>
        </TabsList>

        <TabsContent value="actividades" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Lista de Actividades</CardTitle>
              <CardDescription>Actividades disponibles en el sistema</CardDescription>
            </CardHeader>
            <CardContent>
              {activities.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <p className="text-muted-foreground text-center">No hay actividades registradas.</p>
                  <Button className="mt-4" onClick={() => setIsAddActivityDialogOpen(true)}>
                    Crear Primera Actividad
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código SAP</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Unidad</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activities.map((activity) => (
                      <TableRow key={activity.id}>
                        <TableCell className="font-medium">{activity.codigo || "N/A"}</TableCell>
                        <TableCell>{activity.nombre}</TableCell>
                        <TableCell>{activity.unidad}</TableCell>
                        <TableCell>
                          <Badge variant={activity.activo ? "default" : "secondary"}>
                            {activity.activo ? "Activo" : "Inactivo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Editar</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categorias" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Categorías de Actividades</CardTitle>
              <CardDescription>Categorías para clasificar las actividades</CardDescription>
            </CardHeader>
            <CardContent>
              {categories.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <p className="text-muted-foreground text-center">No hay categorías registradas.</p>
                  <Button className="mt-4" onClick={() => setIsAddCategoryDialogOpen(true)}>
                    Crear Primera Categoría
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Actividades</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((category) => {
                      const categoryActivities = activities.filter((a) => a.categoria === category.id)
                      return (
                        <TableRow key={category.id}>
                          <TableCell className="font-medium">{category.nombre}</TableCell>
                          <TableCell>{category.descripcion || "Sin descripción"}</TableCell>
                          <TableCell>{categoryActivities.length}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Editar</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
