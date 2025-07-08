"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { PlusCircle, Edit, Trash2, Search } from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile"
import { v4 as uuidv4 } from "uuid"
import { useToast } from "@/hooks/use-toast"

interface SubActividad {
  id: string
  nombre: string
  descripcion?: string
  categoria: string
  activo: boolean
  fechaCreacion: string
}

const SUB_ACTIVIDADES_DEFAULT: Omit<SubActividad, "id" | "fechaCreacion">[] = [
  { nombre: "Ctrl QRebrote", descripcion: "Control de rebrote", categoria: "Control", activo: true },
  { nombre: "HT manual", descripcion: "Herbicida total manual", categoria: "Herbicida", activo: true },
  { nombre: "HT mecanizado", descripcion: "Herbicida total mecanizado", categoria: "Herbicida", activo: true },
  { nombre: "HB mecanizado", descripcion: "Herbicida banda mecanizado", categoria: "Herbicida", activo: true },
  { nombre: "HB manual", descripcion: "Herbicida banda manual", categoria: "Herbicida", activo: true },
  { nombre: "Pulpo Fordor", descripcion: "Aplicación con pulpo Fordor", categoria: "Mecanizado", activo: true },
  { nombre: "Lineo corrido manual", descripcion: "Línea corrida manual", categoria: "Manual", activo: true },
  { nombre: "Lineo corrido pulpo", descripcion: "Línea corrida con pulpo", categoria: "Mecanizado", activo: true },
  { nombre: "Entrelinea manual", descripcion: "Entre líneas manual", categoria: "Manual", activo: true },
  { nombre: "Cajon - entrelinea", descripcion: "Cajón entre líneas", categoria: "Mecanizado", activo: true },
  { nombre: "Entrelinea Pulpo", descripcion: "Entre líneas con pulpo", categoria: "Mecanizado", activo: true },
  { nombre: "Pico Libre", descripcion: "Aplicación pico libre", categoria: "Manual", activo: true },
]

export default function SubActividadesPage() {
  const [subActividades, setSubActividades] = useState<SubActividad[]>([])
  const [filteredSubActividades, setFilteredSubActividades] = useState<SubActividad[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSubActividad, setSelectedSubActividad] = useState<SubActividad | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const isMobile = useIsMobile()
  const { toast } = useToast()

  const [newSubActividad, setNewSubActividad] = useState<Omit<SubActividad, "id" | "fechaCreacion">>({
    nombre: "",
    descripcion: "",
    categoria: "General",
    activo: true,
  })

  useEffect(() => {
    // Cargar sub actividades desde localStorage
    const stored = localStorage.getItem("subActividades")
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setSubActividades(parsed)
        setFilteredSubActividades(parsed)
      } catch (err) {
        console.error("Error parsing stored sub actividades:", err)
        createDefaultSubActividades()
      }
    } else {
      createDefaultSubActividades()
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    // Guardar en localStorage cuando cambian
    if (subActividades.length > 0) {
      localStorage.setItem("subActividades", JSON.stringify(subActividades))
    }
  }, [subActividades])

  useEffect(() => {
    // Filtrar sub actividades según el término de búsqueda
    const filtered = subActividades.filter(
      (subActividad) =>
        subActividad.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subActividad.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (subActividad.descripcion && subActividad.descripcion.toLowerCase().includes(searchTerm.toLowerCase())),
    )
    setFilteredSubActividades(filtered)
  }, [searchTerm, subActividades])

  const createDefaultSubActividades = () => {
    const defaultSubActividades: SubActividad[] = SUB_ACTIVIDADES_DEFAULT.map((item) => ({
      ...item,
      id: uuidv4(),
      fechaCreacion: new Date().toISOString(),
    }))

    setSubActividades(defaultSubActividades)
    setFilteredSubActividades(defaultSubActividades)
  }

  const handleAddSubActividad = async () => {
    if (!newSubActividad.nombre.trim()) return

    const subActividadToAdd: SubActividad = {
      ...newSubActividad,
      id: uuidv4(),
      fechaCreacion: new Date().toISOString(),
    }

    setSubActividades((prev) => [...prev, subActividadToAdd])
    setNewSubActividad({
      nombre: "",
      descripcion: "",
      categoria: "General",
      activo: true,
    })
    setIsAddDialogOpen(false)

    toast({
      title: "Sub Actividad creada",
      description: `La sub actividad "${subActividadToAdd.nombre}" se creó correctamente.`,
    })
  }

  const handleUpdateSubActividad = async () => {
    if (!selectedSubActividad) return

    setSubActividades((prev) => prev.map((item) => (item.id === selectedSubActividad.id ? selectedSubActividad : item)))
    setSelectedSubActividad(null)
    setIsEditDialogOpen(false)

    toast({
      title: "Sub Actividad actualizada",
      description: "Los cambios se guardaron correctamente.",
    })
  }

  const handleDeleteSubActividad = async () => {
    if (!selectedSubActividad) return

    setSubActividades((prev) => prev.filter((item) => item.id !== selectedSubActividad.id))
    setSelectedSubActividad(null)
    setIsDeleteDialogOpen(false)

    toast({
      title: "Sub Actividad eliminada",
      description: "La sub actividad se eliminó correctamente.",
    })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sub Actividades</h1>
          <p className="text-muted-foreground">Gestiona las sub actividades para control de malezas</p>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Sub Actividades</h1>
          <p className="text-muted-foreground">
            Gestiona las sub actividades para control de malezas ({filteredSubActividades.length} total)
          </p>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-1 w-full sm:w-auto" size={isMobile ? "sm" : "default"}>
              <PlusCircle className="h-4 w-4" />
              Nueva Sub Actividad
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Crear Nueva Sub Actividad</DialogTitle>
              <DialogDescription>Agrega una nueva sub actividad para control de malezas.</DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="nombre">Nombre *</Label>
                <Input
                  id="nombre"
                  value={newSubActividad.nombre}
                  onChange={(e) => setNewSubActividad((prev) => ({ ...prev, nombre: e.target.value }))}
                  placeholder="Ej: HT manual"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <Input
                  id="descripcion"
                  value={newSubActividad.descripcion || ""}
                  onChange={(e) => setNewSubActividad((prev) => ({ ...prev, descripcion: e.target.value }))}
                  placeholder="Descripción opcional"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="categoria">Categoría</Label>
                <Input
                  id="categoria"
                  value={newSubActividad.categoria}
                  onChange={(e) => setNewSubActividad((prev) => ({ ...prev, categoria: e.target.value }))}
                  placeholder="Ej: Herbicida, Manual, Mecanizado"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddSubActividad} disabled={!newSubActividad.nombre.trim()}>
                Crear Sub Actividad
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Barra de búsqueda */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Buscar sub actividades..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {filteredSubActividades.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground text-center">
              {searchTerm
                ? "No se encontraron sub actividades que coincidan con la búsqueda."
                : "No hay sub actividades definidas."}
            </p>
            {!searchTerm && (
              <Button className="mt-4" onClick={() => setIsAddDialogOpen(true)}>
                Crear Primera Sub Actividad
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Lista de Sub Actividades</CardTitle>
            <CardDescription>
              {filteredSubActividades.length} sub actividad{filteredSubActividades.length !== 1 ? "es" : ""} encontrada
              {filteredSubActividades.length !== 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead className="hidden md:table-cell">Descripción</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubActividades.map((subActividad) => (
                    <TableRow key={subActividad.id}>
                      <TableCell className="font-medium">{subActividad.nombre}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {subActividad.categoria}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {subActividad.descripcion || "Sin descripción"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={subActividad.activo ? "default" : "secondary"}>
                          {subActividad.activo ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedSubActividad(subActividad)
                              setIsEditDialogOpen(true)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                            {!isMobile && <span className="ml-1">Editar</span>}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700 bg-transparent"
                            onClick={() => {
                              setSelectedSubActividad(subActividad)
                              setIsDeleteDialogOpen(true)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Diálogo para editar */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Sub Actividad</DialogTitle>
            <DialogDescription>Modifica los datos de la sub actividad.</DialogDescription>
          </DialogHeader>

          {selectedSubActividad && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-nombre">Nombre *</Label>
                <Input
                  id="edit-nombre"
                  value={selectedSubActividad.nombre}
                  onChange={(e) =>
                    setSelectedSubActividad((prev) => (prev ? { ...prev, nombre: e.target.value } : null))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-descripcion">Descripción</Label>
                <Input
                  id="edit-descripcion"
                  value={selectedSubActividad.descripcion || ""}
                  onChange={(e) =>
                    setSelectedSubActividad((prev) => (prev ? { ...prev, descripcion: e.target.value } : null))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-categoria">Categoría</Label>
                <Input
                  id="edit-categoria"
                  value={selectedSubActividad.categoria}
                  onChange={(e) =>
                    setSelectedSubActividad((prev) => (prev ? { ...prev, categoria: e.target.value } : null))
                  }
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateSubActividad} disabled={!selectedSubActividad?.nombre.trim()}>
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para eliminar */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar la sub actividad "{selectedSubActividad?.nombre}"? Esta acción no se
              puede deshacer.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteSubActividad}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
