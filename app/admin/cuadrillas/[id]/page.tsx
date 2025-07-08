"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useCuadrillas } from "@/hooks/use-cuadrillas"
import { useProviders } from "@/hooks/use-providers"
import type { Cuadrilla, MiembroCuadrilla } from "@/types/cuadrilla"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
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
import { Skeleton } from "@/components/ui/skeleton"
import {
  Users,
  ArrowLeft,
  UserPlus,
  Truck,
  PenToolIcon as Tool,
  Plus,
  Edit,
  Trash2,
  Calendar,
  Phone,
  Mail,
  User,
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export default function CuadrillaDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { getCuadrillaById, updateCuadrilla, addMiembroCuadrilla, updateMiembroCuadrilla, deleteMiembroCuadrilla } =
    useCuadrillas()
  const { providers } = useProviders()

  const [cuadrilla, setCuadrilla] = useState<Cuadrilla | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<Partial<Cuadrilla>>({})
  const [newMiembro, setNewMiembro] = useState<Partial<MiembroCuadrilla>>({})
  const [isAddingMiembro, setIsAddingMiembro] = useState(false)
  const [isAddingVehiculo, setIsAddingVehiculo] = useState(false)
  const [isAddingEquipo, setIsAddingEquipo] = useState(false)
  const [newVehiculo, setNewVehiculo] = useState("")
  const [newEquipo, setNewEquipo] = useState("")

  useEffect(() => {
    if (params.id) {
      const id = Array.isArray(params.id) ? params.id[0] : params.id
      const foundCuadrilla = getCuadrillaById(id)

      if (foundCuadrilla) {
        setCuadrilla(foundCuadrilla)
        setFormData(foundCuadrilla)
      }

      setIsLoading(false)
    }
  }, [params.id, getCuadrillaById])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSwitchChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, activa: checked }))
  }

  const handleSaveChanges = () => {
    if (cuadrilla && formData) {
      updateCuadrilla(cuadrilla.id, formData)
      setCuadrilla({ ...cuadrilla, ...formData })
      setIsEditing(false)
    }
  }

  const handleMiembroInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setNewMiembro((prev) => ({ ...prev, [name]: value }))
  }

  const handleAddMiembro = () => {
    if (cuadrilla && newMiembro.nombre && newMiembro.apellido && newMiembro.dni && newMiembro.rol) {
      const miembroCompleto = {
        ...newMiembro,
        fechaIngreso: new Date().toISOString().split("T")[0],
      } as Omit<MiembroCuadrilla, "id">

      const addedMiembro = addMiembroCuadrilla(cuadrilla.id, miembroCompleto)

      // Actualizar el estado local
      setCuadrilla({
        ...cuadrilla,
        miembros: [...cuadrilla.miembros, addedMiembro],
      })

      setNewMiembro({})
      setIsAddingMiembro(false)
    }
  }

  const handleAddVehiculo = () => {
    if (cuadrilla && newVehiculo.trim()) {
      const updatedVehiculos = [...cuadrilla.vehiculos, newVehiculo.trim()]
      updateCuadrilla(cuadrilla.id, { vehiculos: updatedVehiculos })

      // Actualizar el estado local
      setCuadrilla({
        ...cuadrilla,
        vehiculos: updatedVehiculos,
      })

      setNewVehiculo("")
      setIsAddingVehiculo(false)
    }
  }

  const handleAddEquipo = () => {
    if (cuadrilla && newEquipo.trim()) {
      const updatedEquipamiento = [...cuadrilla.equipamiento, newEquipo.trim()]
      updateCuadrilla(cuadrilla.id, { equipamiento: updatedEquipamiento })

      // Actualizar el estado local
      setCuadrilla({
        ...cuadrilla,
        equipamiento: updatedEquipamiento,
      })

      setNewEquipo("")
      setIsAddingEquipo(false)
    }
  }

  const handleDeleteMiembro = (miembroId: string) => {
    if (cuadrilla) {
      deleteMiembroCuadrilla(cuadrilla.id, miembroId)

      // Actualizar el estado local
      setCuadrilla({
        ...cuadrilla,
        miembros: cuadrilla.miembros.filter((m) => m.id !== miembroId),
      })
    }
  }

  const handleDeleteVehiculo = (index: number) => {
    if (cuadrilla) {
      const updatedVehiculos = cuadrilla.vehiculos.filter((_, i) => i !== index)
      updateCuadrilla(cuadrilla.id, { vehiculos: updatedVehiculos })

      // Actualizar el estado local
      setCuadrilla({
        ...cuadrilla,
        vehiculos: updatedVehiculos,
      })
    }
  }

  const handleDeleteEquipo = (index: number) => {
    if (cuadrilla) {
      const updatedEquipamiento = cuadrilla.equipamiento.filter((_, i) => i !== index)
      updateCuadrilla(cuadrilla.id, { equipamiento: updatedEquipamiento })

      // Actualizar el estado local
      setCuadrilla({
        ...cuadrilla,
        equipamiento: updatedEquipamiento,
      })
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[400px] w-full rounded-lg" />
      </div>
    )
  }

  if (!cuadrilla) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-muted-foreground">No se encontró la cuadrilla solicitada.</p>
            <Button variant="outline" className="mt-4" onClick={() => router.push("/admin/cuadrillas")}>
              Volver a Cuadrillas
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={() => router.push("/admin/cuadrillas")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold ml-2">Detalle de Cuadrilla</h1>
        </div>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Editar Cuadrilla
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsEditing(false)
                setFormData(cuadrilla)
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleSaveChanges}>Guardar Cambios</Button>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center text-xl">
                <Users className="h-5 w-5 mr-2 text-primary" />
                {isEditing ? (
                  <Input
                    name="nombre"
                    value={formData.nombre || ""}
                    onChange={handleInputChange}
                    className="max-w-md"
                  />
                ) : (
                  cuadrilla.nombre
                )}
              </CardTitle>
              <CardDescription>
                {isEditing ? (
                  <select
                    name="proveedorId"
                    value={formData.proveedorId || ""}
                    onChange={handleInputChange}
                    className="mt-2 flex h-10 w-full max-w-md rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {providers.map((provider) => (
                      <option key={provider.id} value={provider.id}>
                        {provider.nombre}
                      </option>
                    ))}
                  </select>
                ) : (
                  <>Proveedor: {cuadrilla.proveedorNombre}</>
                )}
              </CardDescription>
            </div>
            <Badge variant={cuadrilla.activa ? "default" : "secondary"} className="ml-auto">
              {cuadrilla.activa ? "Activa" : "Inactiva"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="responsable">Responsable</Label>
                <Input
                  id="responsable"
                  name="responsable"
                  value={formData.responsable || ""}
                  onChange={handleInputChange}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="activa" checked={formData.activa} onCheckedChange={handleSwitchChange} />
                <Label htmlFor="activa">Cuadrilla activa</Label>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Información General</h3>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <User className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="font-medium mr-2">Responsable:</span>
                      {cuadrilla.responsable}
                    </div>
                    <div className="flex items-center text-sm">
                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="font-medium mr-2">Fecha de creación:</span>
                      {format(new Date(cuadrilla.fechaCreacion), "dd/MM/yyyy", { locale: es })}
                    </div>
                    <div className="flex items-center text-sm">
                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="font-medium mr-2">Última actualización:</span>
                      {format(new Date(cuadrilla.ultimaActualizacion), "dd/MM/yyyy", { locale: es })}
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Resumen</h3>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="font-medium mr-2">Miembros:</span>
                      {cuadrilla.miembros.length}
                    </div>
                    <div className="flex items-center text-sm">
                      <Truck className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="font-medium mr-2">Vehículos:</span>
                      {cuadrilla.vehiculos.length}
                    </div>
                    <div className="flex items-center text-sm">
                      <Tool className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="font-medium mr-2">Equipamiento:</span>
                      {cuadrilla.equipamiento.length}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="miembros" className="w-full">
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="miembros">Miembros</TabsTrigger>
          <TabsTrigger value="vehiculos">Vehículos</TabsTrigger>
          <TabsTrigger value="equipamiento">Equipamiento</TabsTrigger>
        </TabsList>

        <TabsContent value="miembros" className="mt-0">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle>Miembros de la Cuadrilla</CardTitle>
                <Dialog open={isAddingMiembro} onOpenChange={setIsAddingMiembro}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <UserPlus className="mr-2 h-4 w-4" />
                      Añadir Miembro
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Añadir Nuevo Miembro</DialogTitle>
                      <DialogDescription>Complete los datos del nuevo miembro de la cuadrilla.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="nombre">Nombre</Label>
                          <Input
                            id="nombre"
                            name="nombre"
                            value={newMiembro.nombre || ""}
                            onChange={handleMiembroInputChange}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="apellido">Apellido</Label>
                          <Input
                            id="apellido"
                            name="apellido"
                            value={newMiembro.apellido || ""}
                            onChange={handleMiembroInputChange}
                          />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="dni">DNI</Label>
                        <Input id="dni" name="dni" value={newMiembro.dni || ""} onChange={handleMiembroInputChange} />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="rol">Rol</Label>
                        <Input id="rol" name="rol" value={newMiembro.rol || ""} onChange={handleMiembroInputChange} />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="telefono">Teléfono (opcional)</Label>
                        <Input
                          id="telefono"
                          name="telefono"
                          value={newMiembro.telefono || ""}
                          onChange={handleMiembroInputChange}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="email">Email (opcional)</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={newMiembro.email || ""}
                          onChange={handleMiembroInputChange}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddingMiembro(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleAddMiembro}>Añadir Miembro</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {cuadrilla.miembros.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">No hay miembros en esta cuadrilla.</p>
                  <Button variant="outline" className="mt-4" onClick={() => setIsAddingMiembro(true)}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Añadir el primer miembro
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>DNI</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead>Contacto</TableHead>
                      <TableHead>Fecha Ingreso</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cuadrilla.miembros.map((miembro) => (
                      <TableRow key={miembro.id}>
                        <TableCell className="font-medium">
                          {miembro.nombre} {miembro.apellido}
                        </TableCell>
                        <TableCell>{miembro.dni}</TableCell>
                        <TableCell>{miembro.rol}</TableCell>
                        <TableCell>
                          <div className="flex flex-col space-y-1">
                            {miembro.telefono && (
                              <div className="flex items-center text-xs">
                                <Phone className="h-3 w-3 mr-1" />
                                {miembro.telefono}
                              </div>
                            )}
                            {miembro.email && (
                              <div className="flex items-center text-xs">
                                <Mail className="h-3 w-3 mr-1" />
                                {miembro.email}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {miembro.fechaIngreso
                            ? format(new Date(miembro.fechaIngreso), "dd/MM/yyyy", { locale: es })
                            : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteMiembro(miembro.id)}>
                            <Trash2 className="h-4 w-4" />
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

        <TabsContent value="vehiculos" className="mt-0">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle>Vehículos</CardTitle>
                <Dialog open={isAddingVehiculo} onOpenChange={setIsAddingVehiculo}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Añadir Vehículo
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Añadir Nuevo Vehículo</DialogTitle>
                      <DialogDescription>Ingrese los datos del vehículo (tipo, modelo, patente).</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="vehiculo">Descripción del Vehículo</Label>
                        <Input
                          id="vehiculo"
                          placeholder="Ej: Toyota Hilux - AB123CD"
                          value={newVehiculo}
                          onChange={(e) => setNewVehiculo(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddingVehiculo(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleAddVehiculo}>Añadir Vehículo</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {cuadrilla.vehiculos.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">No hay vehículos registrados.</p>
                  <Button variant="outline" className="mt-4" onClick={() => setIsAddingVehiculo(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Añadir el primer vehículo
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Descripción</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cuadrilla.vehiculos.map((vehiculo, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{vehiculo}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteVehiculo(index)}>
                            <Trash2 className="h-4 w-4" />
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

        <TabsContent value="equipamiento" className="mt-0">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle>Equipamiento</CardTitle>
                <Dialog open={isAddingEquipo} onOpenChange={setIsAddingEquipo}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Añadir Equipamiento
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Añadir Nuevo Equipamiento</DialogTitle>
                      <DialogDescription>Ingrese la descripción del equipamiento.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="equipo">Descripción del Equipamiento</Label>
                        <Input
                          id="equipo"
                          placeholder="Ej: Motosierras Stihl (3)"
                          value={newEquipo}
                          onChange={(e) => setNewEquipo(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddingEquipo(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleAddEquipo}>Añadir Equipamiento</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {cuadrilla.equipamiento.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">No hay equipamiento registrado.</p>
                  <Button variant="outline" className="mt-4" onClick={() => setIsAddingEquipo(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Añadir el primer equipamiento
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Descripción</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cuadrilla.equipamiento.map((equipo, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{equipo}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteEquipo(index)}>
                            <Trash2 className="h-4 w-4" />
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
      </Tabs>
    </div>
  )
}
