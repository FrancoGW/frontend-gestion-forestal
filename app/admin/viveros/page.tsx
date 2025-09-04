"use client"

import { useState } from "react"
import { useViveros } from "@/hooks/use-viveros"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Edit, Trash2, Leaf, Search, Building, Dna, Eye, X } from "lucide-react"

export default function ViverosPage() {
  const {
    viveros,
    especies,
    isLoading,
    searchTerm,
    setSearchTerm,
    selectedVivero,
    setSelectedVivero,
    crearVivero,
    actualizarVivero,
    eliminarVivero,
    agregarClon,
    actualizarClon,
    eliminarClon,
    getEstadisticas,
  } = useViveros()
  
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isClonDialogOpen, setIsClonDialogOpen] = useState(false)
  const [editingVivero, setEditingVivero] = useState<any>(null)
  const [editingClon, setEditingClon] = useState<any>(null)
  const [formData, setFormData] = useState({
    nombre: "",
    ubicacion: "",
    contacto: "",
    activo: true,
    especies: [] as string[],
    especiesTexto: [] as string[],
    clones: [] as any[]
  })

  const [clonFormData, setClonFormData] = useState({
    codigo: "",
    especieAsociada: "",
    origen: "",
    descripcion: "",
    caracteristicas: "",
    activo: true
  })

  const [nuevaEspecieTexto, setNuevaEspecieTexto] = useState("")
  const [nuevoClonTexto, setNuevoClonTexto] = useState("")

  const estadisticas = getEstadisticas()

  const resetForm = () => {
    setFormData({
      nombre: "",
      ubicacion: "",
      contacto: "",
      activo: true,
      especies: [],
      especiesTexto: [],
      clones: []
    })
    setEditingVivero(null)
    setNuevaEspecieTexto("")
    setNuevoClonTexto("")
  }

  const resetClonForm = () => {
    setClonFormData({
      codigo: "",
      especieAsociada: "",
      origen: "",
      descripcion: "",
      caracteristicas: "",
      activo: true
    })
    setEditingClon(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      // Combinar especies seleccionadas y especies de texto
      const todasLasEspecies = [
        ...formData.especies,
        ...formData.especiesTexto
      ]

      const datosCompletos = {
        ...formData,
        especies: todasLasEspecies
      }

      if (editingVivero) {
        await actualizarVivero(editingVivero._id, datosCompletos)
      } else {
        await crearVivero(datosCompletos)
      }
      
      resetForm()
      setIsDialogOpen(false)
    } catch (error) {
      console.error("Error al guardar vivero:", error)
    }
  }

  const handleClonSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedVivero) return
    
    try {
      if (editingClon) {
        await actualizarClon(selectedVivero._id, editingClon._id, clonFormData)
      } else {
        await agregarClon(selectedVivero._id, clonFormData)
      }
      
      resetClonForm()
      setIsClonDialogOpen(false)
    } catch (error) {
      console.error("Error al guardar clon:", error)
    }
  }

  const handleEdit = (vivero: any) => {
    setEditingVivero(vivero)
    
    // Separar especies existentes de especies de texto
    const especiesExistentes = vivero.especies?.filter((esp: string) => 
      especies?.some((e: any) => e._id === esp || e.id === esp)
    ) || []
    
    const especiesTexto = vivero.especies?.filter((esp: string) => 
      !especies?.some((e: any) => e._id === esp || e.id === esp)
    ) || []

    setFormData({
      nombre: vivero.nombre || "",
      ubicacion: vivero.ubicacion || "",
      contacto: vivero.contacto || "",
      activo: vivero.activo !== false,
      especies: especiesExistentes,
      especiesTexto: especiesTexto,
      clones: vivero.clones || []
    })
    setIsDialogOpen(true)
  }

  const handleEditClon = (clon: any) => {
    setEditingClon(clon)
    setClonFormData({
      codigo: clon.codigo || "",
      especieAsociada: clon.especieAsociada || "",
      origen: clon.origen || "",
      descripcion: clon.descripcion || "",
      caracteristicas: clon.caracteristicas || "",
      activo: clon.activo !== false
    })
    setIsClonDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar este vivero?")) {
      await eliminarVivero(id)
    }
  }

  const handleDeleteClon = async (clonId: string) => {
    if (!selectedVivero) return
    
    if (confirm("¿Estás seguro de que quieres eliminar este clon?")) {
      await eliminarClon(selectedVivero._id, clonId)
    }
  }

  const toggleEspecie = (especieId: string) => {
    setFormData(prev => ({
      ...prev,
      especies: prev.especies.includes(especieId)
        ? prev.especies.filter(id => id !== especieId)
        : [...prev.especies, especieId]
    }))
  }

  const agregarEspecieTexto = () => {
    if (nuevaEspecieTexto.trim()) {
      setFormData(prev => ({
        ...prev,
        especiesTexto: [...prev.especiesTexto, nuevaEspecieTexto.trim()]
      }))
      setNuevaEspecieTexto("")
    }
  }

  const eliminarEspecieTexto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      especiesTexto: prev.especiesTexto.filter((_, i) => i !== index)
    }))
  }

  const agregarClonTexto = () => {
    if (nuevoClonTexto.trim()) {
      const nuevoClon = {
        _id: Date.now().toString(),
        codigo: nuevoClonTexto.trim(),
        especieAsociada: "",
        origen: "",
        descripcion: "",
        caracteristicas: "",
        activo: true
      }
      setFormData(prev => ({
        ...prev,
        clones: [...prev.clones, nuevoClon]
      }))
      setNuevoClonTexto("")
    }
  }

  const eliminarClonTexto = (clonId: string) => {
    setFormData(prev => ({
      ...prev,
      clones: prev.clones.filter(clon => clon._id !== clonId)
    }))
  }

  const handleViewVivero = (vivero: any) => {
    setSelectedVivero(vivero)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Viveros</h1>
          <p className="text-muted-foreground">
            Administra los viveros, sus especies y clones asociados
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Vivero
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingVivero ? "Editar Vivero" : "Nuevo Vivero"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre del Vivero *</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                    placeholder="Ej: Paul, Loreto, Von Wernich"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ubicacion">Ubicación</Label>
                  <Input
                    id="ubicacion"
                    value={formData.ubicacion}
                    onChange={(e) => setFormData(prev => ({ ...prev, ubicacion: e.target.value }))}
                    placeholder="Ej: Misiones, Corrientes"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="contacto">Contacto</Label>
                <Input
                  id="contacto"
                  value={formData.contacto}
                  onChange={(e) => setFormData(prev => ({ ...prev, contacto: e.target.value }))}
                  placeholder="Ej: Juan Pérez"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="activo"
                  checked={formData.activo}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, activo: checked as boolean }))
                  }
                />
                <Label htmlFor="activo">Estado Activo</Label>
              </div>

              <Separator />

              {/* Especies Asociadas */}
              <div className="space-y-4">
                <Label className="text-base font-medium">Especies Asociadas</Label>
                
                {/* Especies existentes */}
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Seleccionar especies existentes:</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-md p-3">
                    {especies?.map((especie: any) => (
                      <div key={especie._id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`especie-${especie._id}`}
                          checked={formData.especies.includes(especie._id)}
                          onCheckedChange={() => toggleEspecie(especie._id)}
                        />
                        <Label 
                          htmlFor={`especie-${especie._id}`}
                          className="text-sm cursor-pointer flex-1"
                        >
                          {especie.especie || especie.nombre}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Agregar nuevas especies */}
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Agregar nuevas especies:</Label>
                  <div className="flex space-x-2">
                    <Input
                      value={nuevaEspecieTexto}
                      onChange={(e) => setNuevaEspecieTexto(e.target.value)}
                      placeholder="Escribir nueva especie..."
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), agregarEspecieTexto())}
                    />
                    <Button type="button" onClick={agregarEspecieTexto} size="sm">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Mostrar especies de texto agregadas */}
                {formData.especiesTexto.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Especies agregadas:</Label>
                    <div className="flex flex-wrap gap-2">
                      {formData.especiesTexto.map((especie, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          <Leaf className="w-3 h-3" />
                          {especie}
                          <button
                            type="button"
                            onClick={() => eliminarEspecieTexto(index)}
                            className="ml-1 hover:text-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Clones */}
              <div className="space-y-4">
                <Label className="text-base font-medium">Clones del Vivero</Label>
                
                {/* Agregar nuevos clones */}
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Agregar nuevos clones:</Label>
                  <div className="flex space-x-2">
                    <Input
                      value={nuevoClonTexto}
                      onChange={(e) => setNuevoClonTexto(e.target.value)}
                      placeholder="Código del clon (ej: FA 13, INTA 36)..."
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), agregarClonTexto())}
                    />
                    <Button type="button" onClick={agregarClonTexto} size="sm">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Mostrar clones agregados */}
                {formData.clones.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Clones agregados:</Label>
                    <div className="space-y-2">
                      {formData.clones.map((clon) => (
                        <div key={clon._id} className="flex items-center gap-2 p-2 border rounded-md">
                          <Badge variant="outline" className="font-mono">
                            {clon.codigo}
                          </Badge>
                          <button
                            type="button"
                            onClick={() => eliminarClonTexto(clon._id)}
                            className="ml-auto hover:text-red-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingVivero ? "Actualizar" : "Crear"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Building className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Viveros</p>
                <p className="text-2xl font-bold">{estadisticas.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="h-3 w-3 bg-green-500 rounded-full"></div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Activos</p>
                <p className="text-2xl font-bold text-green-600">{estadisticas.activos}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="h-3 w-3 bg-red-500 rounded-full"></div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Inactivos</p>
                <p className="text-2xl font-bold text-red-600">{estadisticas.inactivos}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Dna className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Clones</p>
                <p className="text-2xl font-bold text-purple-600">{estadisticas.totalClones}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="lista" className="space-y-4">
        <TabsList>
          <TabsTrigger value="lista">Lista de Viveros</TabsTrigger>
          {selectedVivero && (
            <TabsTrigger value="detalle">
              {selectedVivero.nombre} - Detalle
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="lista" className="space-y-4">
          {/* Búsqueda */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Search className="h-5 w-5" />
                <CardTitle>Buscar Viveros</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="Buscar por nombre, ubicación o contacto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-md"
              />
            </CardContent>
          </Card>

          {/* Lista de Viveros */}
          <Card>
            <CardHeader>
              <CardTitle>Lista de Viveros</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : viveros.length === 0 ? (
                <div className="text-center py-8">
                  <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {searchTerm ? "No se encontraron viveros con ese criterio de búsqueda." : "No hay viveros registrados."}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-medium">Nombre</th>
                        <th className="text-left p-3 font-medium">Ubicación</th>
                        <th className="text-left p-3 font-medium">Contacto</th>
                        <th className="text-left p-3 font-medium">Especies</th>
                        <th className="text-left p-3 font-medium">Clones</th>
                        <th className="text-left p-3 font-medium">Estado</th>
                        <th className="text-left p-3 font-medium">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viveros.map((vivero: any) => (
                        <tr key={vivero._id} className="border-b hover:bg-muted/50">
                          <td className="p-3 font-medium">{vivero.nombre}</td>
                          <td className="p-3">{vivero.ubicacion || "-"}</td>
                          <td className="p-3">{vivero.contacto || "-"}</td>
                          <td className="p-3">
                            <div className="flex flex-wrap gap-1">
                              {vivero.especies && vivero.especies.length > 0 ? (
                                vivero.especies.map((especieId: string, index: number) => {
                                  const especie = especies?.find((e: any) => e._id === especieId || e.id === especieId)
                                  return especie ? (
                                    <Badge key={especieId} variant="secondary" className="text-xs">
                                      <Leaf className="w-3 h-3 mr-1" />
                                      {especie.especie || especie.nombre}
                                    </Badge>
                                  ) : (
                                    <Badge key={index} variant="outline" className="text-xs">
                                      <Leaf className="w-3 h-3 mr-1" />
                                      {especieId}
                                    </Badge>
                                  )
                                })
                              ) : (
                                <span className="text-muted-foreground text-sm">Sin especies</span>
                              )}
                            </div>
                          </td>
                          <td className="p-3">
                            <Badge variant="outline" className="text-xs">
                              {vivero.clones?.length || 0} clones
                            </Badge>
                          </td>
                          <td className="p-3">
        <span
          className={`px-2 py-1 rounded-full text-xs ${
                                vivero.activo ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}
        >
                              {vivero.activo ? "Activo" : "Inactivo"}
        </span>
                          </td>
                          <td className="p-3">
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewVivero(vivero)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(vivero)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(vivero._id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {selectedVivero && (
          <TabsContent value="detalle" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Vivero: {selectedVivero.nombre}</CardTitle>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedVivero(null)}
                  >
                    Volver a Lista
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="font-medium">Ubicación</Label>
                    <p className="text-muted-foreground">{selectedVivero.ubicacion || "No especificada"}</p>
                  </div>
                  <div>
                    <Label className="font-medium">Contacto</Label>
                    <p className="text-muted-foreground">{selectedVivero.contacto || "No especificado"}</p>
                  </div>
                </div>
                
                <div>
                  <Label className="font-medium">Especies Asociadas</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedVivero.especies && selectedVivero.especies.length > 0 ? (
                      selectedVivero.especies.map((especieId: string, index: number) => {
                        const especie = especies?.find((e: any) => e._id === especieId || e.id === especieId)
                        return especie ? (
                          <Badge key={especieId} variant="secondary">
                            <Leaf className="w-3 h-3 mr-1" />
                            {especie.especie || especie.nombre}
                          </Badge>
                        ) : (
                          <Badge key={index} variant="outline">
                            <Leaf className="w-3 h-3 mr-1" />
                            {especieId}
                          </Badge>
                        )
                      })
                    ) : (
                      <span className="text-muted-foreground">Sin especies asociadas</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Clones del Vivero</CardTitle>
                  <Dialog open={isClonDialogOpen} onOpenChange={setIsClonDialogOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={() => resetClonForm()}>
                        <Plus className="w-4 h-4 mr-2" />
                        Nuevo Clon
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>
                          {editingClon ? "Editar Clon" : "Nuevo Clon"}
                        </DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleClonSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="codigo">Código del Clon *</Label>
                            <Input
                              id="codigo"
                              value={clonFormData.codigo}
                              onChange={(e) => setClonFormData(prev => ({ ...prev, codigo: e.target.value }))}
                              placeholder="Ej: FA 13, INTA 36"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="especieAsociada">Especie Asociada *</Label>
                            <Input
                              id="especieAsociada"
                              value={clonFormData.especieAsociada}
                              onChange={(e) => setClonFormData(prev => ({ ...prev, especieAsociada: e.target.value }))}
                              placeholder="Ej: Eucalipto, Pino"
                              required
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="origen">Origen</Label>
                          <Input
                            id="origen"
                            value={clonFormData.origen}
                            onChange={(e) => setClonFormData(prev => ({ ...prev, origen: e.target.value }))}
                            placeholder="Ej: Forestal Argentina, INTA"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="descripcion">Descripción</Label>
                          <Input
                            id="descripcion"
                            value={clonFormData.descripcion}
                            onChange={(e) => setClonFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                            placeholder="Descripción del clon"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="caracteristicas">Características</Label>
                          <Input
                            id="caracteristicas"
                            value={clonFormData.caracteristicas}
                            onChange={(e) => setClonFormData(prev => ({ ...prev, caracteristicas: e.target.value }))}
                            placeholder="Características especiales"
                          />
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="clon-activo"
                            checked={clonFormData.activo}
                            onCheckedChange={(checked) => 
                              setClonFormData(prev => ({ ...prev, activo: checked as boolean }))
                            }
                          />
                          <Label htmlFor="clon-activo">Estado Activo</Label>
                        </div>

                        <div className="flex justify-end space-x-2 pt-4">
                          <Button type="button" variant="outline" onClick={() => setIsClonDialogOpen(false)}>
                            Cancelar
                          </Button>
                          <Button type="submit">
                            {editingClon ? "Actualizar" : "Crear"}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {selectedVivero.clones && selectedVivero.clones.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3 font-medium">Código</th>
                          <th className="text-left p-3 font-medium">Especie</th>
                          <th className="text-left p-3 font-medium">Origen</th>
                          <th className="text-left p-3 font-medium">Descripción</th>
                          <th className="text-left p-3 font-medium">Estado</th>
                          <th className="text-left p-3 font-medium">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedVivero.clones.map((clon: any) => (
                          <tr key={clon._id} className="border-b hover:bg-muted/50">
                            <td className="p-3">
                              <Badge variant="outline" className="font-mono">
                                {clon.codigo}
                              </Badge>
                            </td>
                            <td className="p-3">
                              <div className="flex items-center space-x-2">
                                <Leaf className="w-4 h-4 text-green-600" />
                                <span>{clon.especieAsociada}</span>
                              </div>
                            </td>
                            <td className="p-3">{clon.origen || "-"}</td>
                            <td className="p-3">
                              <span className="text-sm text-muted-foreground">
                                {clon.descripcion || "Sin descripción"}
                              </span>
                            </td>
                            <td className="p-3">
                              <span
                                className={`px-2 py-1 rounded-full text-xs ${
                                  clon.activo ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                }`}
                              >
                                {clon.activo ? "Activo" : "Inactivo"}
                              </span>
                            </td>
                            <td className="p-3">
                              <div className="flex space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditClon(clon)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteClon(clon._id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Dna className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No hay clones registrados en este vivero.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
