"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, Edit, Trash2, RefreshCw, Plus } from "lucide-react"
import { useActivityTemplates } from "@/hooks/use-activity-templates"
import { useToast } from "@/hooks/use-toast"

export default function PlantillasPage() {
  const { templates, loading, error } = useActivityTemplates()
  const [expandedTemplates, setExpandedTemplates] = useState<Record<string, boolean>>({})
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
          <Button variant="outline" className="flex items-center gap-2 bg-transparent">
            <RefreshCw className="h-4 w-4" />
            Actualizar Unidades
          </Button>
          <Button className="flex items-center gap-2">
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
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {template.descripcion}
                      <div className="mt-2 text-xs text-blue-600">
                        <strong>Asociada con actividades que contengan:</strong>{" "}
                        {template.patronesCoincidencia.map((patron, index) => (
                          <span key={index}>
                            "{patron.toLowerCase()}"{index < template.patronesCoincidencia.length - 1 ? " o " : ""}
                          </span>
                        ))}
                        {template.actividadCodigo && <span> o código "{template.actividadCodigo}"</span>}
                      </div>
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 bg-transparent">
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
    </div>
  )
}
