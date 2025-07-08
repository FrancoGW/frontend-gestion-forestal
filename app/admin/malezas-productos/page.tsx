"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { AlertCircle, CheckCircle, Edit, Plus, Trash2 } from "lucide-react"
import { useMalezasProductos, type MalezasProducto } from "@/hooks/use-malezas-productos"

export default function MalezasProductosPage() {
  const { productos, loading, error, addProducto, updateProducto, deleteProducto, refetch } = useMalezasProductos()

  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<MalezasProducto | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    tipo: "Sistémico",
    unidadMedida: "cm3",
    categoria: "Herbicida total",
    activo: true,
  })

  const resetForm = () => {
    setFormData({
      nombre: "",
      descripcion: "",
      tipo: "Sistémico",
      unidadMedida: "cm3",
      categoria: "Herbicida total",
      activo: true,
    })
    setEditingProduct(null)
    setShowForm(false)
    setSubmitError(null)
    setSubmitSuccess(null)
  }

  const handleEdit = (producto: MalezasProducto) => {
    setFormData({
      nombre: producto.nombre || "",
      descripcion: producto.descripcion || producto.concentracion || "",
      tipo: producto.tipo || "Sistémico",
      unidadMedida: producto.unidadMedida || "cm3",
      categoria: producto.categoria || "Herbicida total",
      activo: producto.activo ?? true,
    })
    setEditingProduct(producto)
    setShowForm(true)
    setSubmitError(null)
    setSubmitSuccess(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitError(null)
    setSubmitSuccess(null)

    try {
      let result

      if (editingProduct) {
        const id = editingProduct._id || editingProduct.id || ""
        result = await updateProducto(id, formData)
      } else {
        result = await addProducto(formData)
      }

      if (result.success) {
        setSubmitSuccess(editingProduct ? "Producto actualizado correctamente" : "Producto creado correctamente")
        resetForm()
        await refetch()
      } else {
        setSubmitError(result.error || "Error al guardar el producto")
      }
    } catch (error: any) {
      console.error("Error al guardar producto:", error)
      setSubmitError(`Error al guardar producto: ${error.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (producto: MalezasProducto) => {
    if (!confirm(`¿Está seguro de que desea eliminar el producto "${producto.nombre}"?`)) {
      return
    }

    try {
      const id = producto._id || producto.id || ""
      const result = await deleteProducto(id)

      if (result.success) {
        setSubmitSuccess("Producto eliminado correctamente")
        await refetch()
      } else {
        setSubmitError(result.error || "Error al eliminar el producto")
      }
    } catch (error: any) {
      console.error("Error al eliminar producto:", error)
      setSubmitError(`Error al eliminar producto: ${error.message}`)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-4"></div>
          <span>Cargando productos de malezas...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Productos de Malezas</h1>
          <p className="text-muted-foreground">Gestiona los productos utilizados para el control de malezas</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nuevo Producto
        </Button>
      </div>

      {/* Error de carga */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Error al cargar productos: {error}</AlertDescription>
        </Alert>
      )}

      {/* Mensajes de éxito/error */}
      {submitError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}

      {submitSuccess && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{submitSuccess}</AlertDescription>
        </Alert>
      )}

      {/* Formulario */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingProduct ? "Editar Producto" : "Nuevo Producto"}</CardTitle>
            <CardDescription>
              {editingProduct ? "Modifica los datos del producto" : "Agrega un nuevo producto para control de malezas"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nombre */}
                <div className="space-y-2">
                  <Label htmlFor="nombre">
                    Nombre del Producto <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Ej: Glifosato 48%"
                    required
                  />
                </div>

                {/* Tipo */}
                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo</Label>
                  <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sistémico">Sistémico</SelectItem>
                      <SelectItem value="Preemergente">Preemergente</SelectItem>
                      <SelectItem value="Postemergente">Postemergente</SelectItem>
                      <SelectItem value="Contacto">Contacto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Unidad de Medida */}
                <div className="space-y-2">
                  <Label htmlFor="unidadMedida">Unidad de Medida</Label>
                  <Select
                    value={formData.unidadMedida}
                    onValueChange={(value) => setFormData({ ...formData, unidadMedida: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cm3">cm³</SelectItem>
                      <SelectItem value="ml">ml</SelectItem>
                      <SelectItem value="g">g</SelectItem>
                      <SelectItem value="kg">kg</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Categoría */}
                <div className="space-y-2">
                  <Label htmlFor="categoria">Categoría</Label>
                  <Select
                    value={formData.categoria}
                    onValueChange={(value) => setFormData({ ...formData, categoria: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Herbicida total">Herbicida total</SelectItem>
                      <SelectItem value="Herbicida selectivo">Herbicida selectivo</SelectItem>
                      <SelectItem value="Inhibidor fotosíntesis">Inhibidor fotosíntesis</SelectItem>
                      <SelectItem value="Graminicida">Graminicida</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Descripción */}
              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Descripción del producto, concentración, etc."
                  className="min-h-[80px]"
                />
              </div>

              {/* Estado Activo */}
              <div className="flex items-center space-x-2">
                <Switch
                  id="activo"
                  checked={formData.activo}
                  onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
                />
                <Label htmlFor="activo">Producto activo</Label>
              </div>

              {/* Botones */}
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      {editingProduct ? "Actualizando..." : "Creando..."}
                    </>
                  ) : editingProduct ? (
                    "Actualizar Producto"
                  ) : (
                    "Crear Producto"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Lista de Productos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>🧪</span>
            Lista de Productos
          </CardTitle>
          <CardDescription>{productos.length} productos registrados</CardDescription>
        </CardHeader>
        <CardContent>
          {productos.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No hay productos registrados</p>
              <Button onClick={() => setShowForm(true)} className="mt-4">
                Agregar primer producto
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Nombre del Producto</th>
                    <th className="text-left p-2">Descripción</th>
                    <th className="text-left p-2">Tipo</th>
                    <th className="text-left p-2">Categoría</th>
                    <th className="text-left p-2">Estado</th>
                    <th className="text-left p-2">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {productos.map((producto) => {
                    const id = producto._id || producto.id || ""
                    return (
                      <tr key={id} className="border-b hover:bg-muted/50">
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            <span>🧪</span>
                            <span className="font-medium">{producto.nombre}</span>
                          </div>
                        </td>
                        <td className="p-2">
                          <span className="text-sm text-muted-foreground">
                            {producto.descripcion || producto.concentracion || "No especificada"}
                          </span>
                        </td>
                        <td className="p-2">
                          <Badge variant="outline">{producto.tipo || "Sistémico"}</Badge>
                        </td>
                        <td className="p-2">
                          <span className="text-sm text-muted-foreground">
                            {producto.categoria || "Herbicida total"}
                          </span>
                        </td>
                        <td className="p-2">
                          <Badge variant={producto.activo ? "default" : "secondary"}>
                            {producto.activo ? "Activo" : "Inactivo"}
                          </Badge>
                        </td>
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(producto)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(producto)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
