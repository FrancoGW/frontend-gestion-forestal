"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ChevronDown, Edit, Trash2, RefreshCw, Plus, X, Save } from "lucide-react"
import { useActivityTemplates, type ActivityTemplate, type ActivityField } from "@/hooks/use-activity-templates"
import { useToast } from "@/hooks/use-toast"

export default function PlantillasPage() {
  const {
    templates,
    loading,
    error,
    updateTemplate,
    updateTemplateField,
    addTemplate,
    deleteTemplate,
    refreshTemplates,
  } = useActivityTemplates()
  const [expandedTemplates, setExpandedTemplates] = useState<Record<string, boolean>>({})
  const [editingTemplate, setEditingTemplate] = useState<ActivityTemplate | null>(null)
  const [editingField, setEditingField] = useState<{ templateId: string; field: ActivityField } | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ templateId: string; templateName: string } | null>(null)
  const [showNewTemplate, setShowNewTemplate] = useState(false)
  const { toast } = useToast()

  const toggleTemplate = (id: string) => {
    setExpandedTemplates((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const getTemplateIcon = (templateName: string) => {
    const name = templateName.toLowerCase()
    if (name.includes("poda")) return "✂️"
    if (name.includes("raleo")) return "🌲"
    if (name.includes("plantacion")) return "🌱"
    if (name.includes("cosecha")) return "🪓"
    if (name.includes("mantenimiento")) return "🔧"
    if (name.includes("replantacion")) return "🌿"
    if (name.includes("hormigas")) return "🐜"
    if (name.includes("malezas")) return "🌿"
    if (name.includes("rebrote")) return "🌿"
    return "📋"
  }

  const getTemplateBadgeColor = (categoria: string) => {
    switch (categoria.toLowerCase()) {
      case "silvicultura":
        return "bg-green-100 text-green-800"
      case "control de plagas":
        return "bg-red-100 text-red-800"
      case "control de malezas":
        return "bg-orange-100 text-orange-800"
      case "cosecha":
        return "bg-blue-100 text-blue-800"
      case "mantenimiento":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleEditTemplate = (template: ActivityTemplate) => {
    setEditingTemplate(JSON.parse(JSON.stringify(template)))
  }

  const handleSaveTemplate = () => {
    if (!editingTemplate) return

    const success = updateTemplate(editingTemplate.id, editingTemplate)
    if (success) {
      toast({
        title: "Plantilla actualizada",
        description: `La plantilla "${editingTemplate.nombre}" ha sido actualizada correctamente.`,
      })
      setEditingTemplate(null)
      refreshTemplates()
    } else {
      toast({
        title: "Error",
        description: "No se pudo actualizar la plantilla.",
        variant: "destructive",
      })
    }
  }

  const handleEditField = (templateId: string, field: ActivityField) => {
    setEditingField({ templateId, field: JSON.parse(JSON.stringify(field)) })
  }

  const handleSaveField = () => {
    if (!editingField) return

    const success = updateTemplateField(editingField.templateId, editingField.field.id, editingField.field)
    if (success) {
      toast({
        title: "Campo actualizado",
        description: `El campo "${editingField.field.nombre}" ha sido actualizado correctamente.`,
      })
      setEditingField(null)
      refreshTemplates()
    } else {
      toast({
        title: "Error",
        description: "No se pudo actualizar el campo.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteTemplate = (templateId: string, templateName: string) => {
    setDeleteConfirm({ templateId, templateName })
  }

  const confirmDelete = () => {
    if (!deleteConfirm) return

    const success = deleteTemplate(deleteConfirm.templateId)
    if (success) {
      toast({
        title: "Plantilla eliminada",
        description: `La plantilla "${deleteConfirm.templateName}" ha sido eliminada.`,
      })
      setDeleteConfirm(null)
      refreshTemplates()
    } else {
      toast({
        title: "Error",
        description: "No se pudo eliminar la plantilla.",
        variant: "destructive",
      })
    }
  }

  const handleAddNewTemplate = () => {
    const newTemplate: ActivityTemplate = {
      id: `template-${Date.now()}`,
      nombre: "Nueva Plantilla",
      descripcion: "",
      categoria: "Silvicultura",
      unidad: "Ha",
      patronesCoincidencia: [],
      campos: [],
      activo: true,
    }
    setEditingTemplate(newTemplate)
    setShowNewTemplate(false)
  }

  const handleSaveNewTemplate = () => {
    if (!editingTemplate) return

    const success = addTemplate(editingTemplate)
    if (success) {
      toast({
        title: "Plantilla creada",
        description: `La plantilla "${editingTemplate.nombre}" ha sido creada correctamente.`,
      })
      setEditingTemplate(null)
      refreshTemplates()
    } else {
      toast({
        title: "Error",
        description: "No se pudo crear la plantilla.",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Plantillas de Actividades</h1>
          <p className="text-muted-foreground">Gestiona las plantillas para diferentes actividades</p>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
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
          <h1 className="text-3xl font-bold tracking-tight">Plantillas de Actividades</h1>
          <p className="text-muted-foreground">Gestiona las plantillas para diferentes actividades</p>
        </div>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Plantillas de Actividades</h1>
          <p className="text-muted-foreground">Gestiona las plantillas para diferentes actividades</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex items-center gap-2" onClick={refreshTemplates}>
            <RefreshCw className="h-4 w-4" />
            Actualizar
          </Button>
          <Button className="flex items-center gap-2" onClick={() => setShowNewTemplate(true)}>
            <Plus className="h-4 w-4" />
            Nueva Plantilla
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {templates.map((template) => {
          const systemFieldsCount = template.campos.filter((campo) => campo.esDelSistema).length
          const customFieldsCount = template.campos.length - systemFieldsCount

          return (
            <Card key={template.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <span>{getTemplateIcon(template.nombre)}</span>
                      <span>{template.nombre}</span>
                      <Badge variant="outline" className="text-xs">
                        {template.unidad}
                      </Badge>
                      <Badge className={`text-xs ${getTemplateBadgeColor(template.categoria)}`}>
                        {getTemplateIcon(template.categoria)} {template.categoria}
                      </Badge>
                      {!template.activo && (
                        <Badge variant="outline" className="text-xs text-gray-500">
                          Inactiva
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {template.descripcion}
                      <div className="mt-2 text-xs text-blue-600">
                        <strong>Asociada con actividades que contengan:</strong>{" "}
                        {template.patronesCoincidencia.map((patron, index) => (
                          <span key={index}>
                            "{patron.toLowerCase()}"
                            {index < template.patronesCoincidencia.length - 1 ? " o " : ""}
                          </span>
                        ))}
                        {template.actividadCodigo && <span> o código "{template.actividadCodigo}"</span>}
                      </div>
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEditTemplate(template)}>
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 bg-transparent"
                      onClick={() => handleDeleteTemplate(template.id, template.nombre)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Eliminar
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="border rounded-md">
                  <button
                    className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 focus:outline-none"
                    onClick={() => toggleTemplate(template.id)}
                  >
                    <span className="font-medium text-sm">
                      Ver campos ({template.campos.length} total, {systemFieldsCount} del sistema
                      {customFieldsCount > 0 && ` + ${customFieldsCount} personalizados`})
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 transition-transform duration-200 ${
                        expandedTemplates[template.id] ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {expandedTemplates[template.id] && (
                    <div className="border-t p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {template.campos
                          .sort((a, b) => (a.orden || 0) - (b.orden || 0))
                          .map((campo) => (
                            <div
                              key={campo.id}
                              className={`border rounded-md p-3 ${
                                campo.esDelSistema ? "bg-blue-50 border-blue-200" : "bg-gray-50"
                              }`}
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="font-medium text-sm flex items-center gap-1">
                                    {campo.esDelSistema && <span className="text-blue-600 text-xs">🔒</span>}
                                    {campo.nombre}
                                  </div>
                                  <div className="text-xs text-muted-foreground mt-1">
                                    <span className="capitalize">{campo.tipo}</span>
                                    {campo.unidad && <span> • {campo.unidad}</span>}
                                    {campo.requerido && <span> • Requerido</span>}
                                    {campo.esDelSistema && <span className="text-blue-600"> • Sistema</span>}
                                  </div>
                                  {campo.opciones && campo.opciones.length > 0 && (
                                    <div className="text-xs text-muted-foreground mt-1">
                                      <strong>Opciones:</strong> {campo.opciones.join(", ")}
                                    </div>
                                  )}
                                  {campo.descripcion && (
                                    <div className="text-xs text-muted-foreground mt-1 italic">{campo.descripcion}</div>
                                  )}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => handleEditField(template.id, campo)}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Dialog para editar plantilla completa */}
      {editingTemplate && (
        <Dialog open={!!editingTemplate} onOpenChange={(open) => !open && setEditingTemplate(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {templates.find((t) => t.id === editingTemplate.id) ? "Editar Plantilla" : "Nueva Plantilla"}
              </DialogTitle>
              <DialogDescription>
                Modifica los datos de la plantilla. Los cambios se guardarán en localStorage.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nombre">Nombre *</Label>
                  <Input
                    id="nombre"
                    value={editingTemplate.nombre}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, nombre: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="categoria">Categoría *</Label>
                  <Input
                    id="categoria"
                    value={editingTemplate.categoria}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, categoria: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  value={editingTemplate.descripcion}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, descripcion: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="unidad">Unidad *</Label>
                  <Input
                    id="unidad"
                    value={editingTemplate.unidad}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, unidad: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="actividadCodigo">Código de Actividad</Label>
                  <Input
                    id="actividadCodigo"
                    value={editingTemplate.actividadCodigo || ""}
                    onChange={(e) =>
                      setEditingTemplate({ ...editingTemplate, actividadCodigo: e.target.value || undefined })
                    }
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="patrones">Patrones de Coincidencia (separados por comas)</Label>
                <Input
                  id="patrones"
                  value={editingTemplate.patronesCoincidencia.join(", ")}
                  onChange={(e) =>
                    setEditingTemplate({
                      ...editingTemplate,
                      patronesCoincidencia: e.target.value.split(",").map((p) => p.trim()).filter((p) => p),
                    })
                  }
                  placeholder="poda, primera poda, segunda poda"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="activo"
                  checked={editingTemplate.activo}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, activo: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="activo">Plantilla activa</Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingTemplate(null)}>
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  if (templates.find((t) => t.id === editingTemplate.id)) {
                    handleSaveTemplate()
                  } else {
                    handleSaveNewTemplate()
                  }
                }}
              >
                <Save className="h-4 w-4 mr-2" />
                Guardar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog para editar campo individual */}
      {editingField && (
        <Dialog open={!!editingField} onOpenChange={(open) => !open && setEditingField(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar Campo: {editingField.field.nombre}</DialogTitle>
              <DialogDescription>
                Modifica las propiedades del campo. Los cambios se guardarán en localStorage.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="field-nombre">Nombre *</Label>
                  <Input
                    id="field-nombre"
                    value={editingField.field.nombre}
                    onChange={(e) =>
                      setEditingField({
                        ...editingField,
                        field: { ...editingField.field, nombre: e.target.value },
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="field-tipo">Tipo *</Label>
                  <select
                    id="field-tipo"
                    value={editingField.field.tipo}
                    onChange={(e) =>
                      setEditingField({
                        ...editingField,
                        field: { ...editingField.field, tipo: e.target.value as ActivityField["tipo"] },
                      })
                    }
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  >
                    <option value="texto">Texto</option>
                    <option value="numero">Número</option>
                    <option value="fecha">Fecha</option>
                    <option value="seleccion">Selección</option>
                    <option value="checkbox">Checkbox</option>
                    <option value="textarea">Textarea</option>
                    <option value="dinamico">Dinámico</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="field-orden">Orden</Label>
                  <Input
                    id="field-orden"
                    type="number"
                    value={editingField.field.orden || ""}
                    onChange={(e) =>
                      setEditingField({
                        ...editingField,
                        field: { ...editingField.field, orden: parseInt(e.target.value) || undefined },
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="field-unidad">Unidad</Label>
                  <Input
                    id="field-unidad"
                    value={editingField.field.unidad || ""}
                    onChange={(e) =>
                      setEditingField({
                        ...editingField,
                        field: { ...editingField.field, unidad: e.target.value || undefined },
                      })
                    }
                  />
                </div>
                <div className="flex items-center space-x-2 pt-8">
                  <input
                    type="checkbox"
                    id="field-requerido"
                    checked={editingField.field.requerido}
                    onChange={(e) =>
                      setEditingField({
                        ...editingField,
                        field: { ...editingField.field, requerido: e.target.checked },
                      })
                    }
                    className="rounded"
                  />
                  <Label htmlFor="field-requerido">Requerido</Label>
                </div>
              </div>

              {editingField.field.tipo === "seleccion" && (
                <div>
                  <Label htmlFor="field-opciones">Opciones (una por línea)</Label>
                  <Textarea
                    id="field-opciones"
                    value={editingField.field.opciones?.join("\n") || ""}
                    onChange={(e) =>
                      setEditingField({
                        ...editingField,
                        field: {
                          ...editingField.field,
                          opciones: e.target.value
                            .split("\n")
                            .map((o) => o.trim())
                            .filter((o) => o),
                        },
                      })
                    }
                    placeholder="Opción 1&#10;Opción 2&#10;Opción 3"
                    rows={5}
                  />
                </div>
              )}

              <div>
                <Label htmlFor="field-placeholder">Placeholder</Label>
                <Input
                  id="field-placeholder"
                  value={editingField.field.placeholder || ""}
                  onChange={(e) =>
                    setEditingField({
                      ...editingField,
                      field: { ...editingField.field, placeholder: e.target.value || undefined },
                    })
                  }
                />
              </div>

              <div>
                <Label htmlFor="field-descripcion">Descripción</Label>
                <Textarea
                  id="field-descripcion"
                  value={editingField.field.descripcion || ""}
                  onChange={(e) =>
                    setEditingField({
                      ...editingField,
                      field: { ...editingField.field, descripcion: e.target.value || undefined },
                    })
                  }
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingField(null)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveField}>
                <Save className="h-4 w-4 mr-2" />
                Guardar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog de confirmación para eliminar */}
      {deleteConfirm && (
        <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción eliminará permanentemente la plantilla "{deleteConfirm.templateName}". Esta acción no se
                puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeleteConfirm(null)}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  )
}
