"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Users, Clock, Scissors, TreePine, MessageSquare } from "lucide-react"
import { useEspeciesPoda } from "@/hooks/use-admin-collection"

interface ActivityField {
  name: string
  label: string
  type: string
  required: boolean
  isSystemField?: boolean
  category?: string
  description?: string
  placeholder?: string
  options?: Array<{ value: string; label: string }>
}

interface ActivityDataFormProps {
  activityType: string
  onSubmit: (data: any) => void
  initialData?: any
  isLoading?: boolean
}

// Campos del sistema base para todas las actividades
const baseSystemFields: ActivityField[] = [
  {
    name: "fecha",
    label: "Fecha",
    type: "date",
    required: true,
    isSystemField: true,
    description: "Fecha de realización de la actividad",
  },
  {
    name: "rodal",
    label: "Rodal",
    type: "select",
    required: true,
    isSystemField: true,
    description: "Rodal donde se realizará la actividad",
    options: [
      { value: "R001", label: "Rodal 001" },
      { value: "R002", label: "Rodal 002" },
      { value: "R003", label: "Rodal 003" },
    ],
  },
  {
    name: "predioCampo",
    label: "Predio/Campo",
    type: "text",
    required: true,
    isSystemField: true,
    description: "Predio o campo donde se realizará la actividad",
  },
  {
    name: "cuadrilla",
    label: "Cuadrilla",
    type: "select",
    required: true,
    isSystemField: true,
    description: "Cuadrilla asignada a la actividad",
    options: [
      { value: "C001", label: "Cuadrilla 001" },
      { value: "C002", label: "Cuadrilla 002" },
      { value: "C003", label: "Cuadrilla 003" },
    ],
  },
  {
    name: "cantidadPersonal",
    label: "Cantidad de Personal",
    type: "number",
    required: true,
    isSystemField: true,
    description: "Número de personas asignadas",
    placeholder: "Ej: 5",
  },
  {
    name: "jornadaHs",
    label: "Jornada (hs)",
    type: "number",
    required: true,
    isSystemField: true,
    description: "Horas de trabajo programadas",
    placeholder: "Ej: 7.3, 8.5, 1.4",
  },
]

// Campos específicos para actividades de poda
const podaSystemFields: ActivityField[] = [
  {
    name: "tipoPoda",
    label: "Tipo de Poda",
    type: "select",
    required: true,
    isSystemField: true,
    category: "poda",
    description: "Tipo de poda a realizar",
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
    name: "especiesForestales",
    label: "Especies Forestales",
    type: "select",
    required: true,
    isSystemField: true,
    category: "poda",
    description: "Especie forestal a podar",
  },
  {
    name: "cantidadPlantas",
    label: "Cantidad de Plantas",
    type: "number",
    required: true,
    isSystemField: true,
    category: "poda",
    description: "Número de plantas a podar",
    placeholder: "Ej: 500",
  },
]

// Campo de observaciones (opcional)
const observacionesField: ActivityField = {
  name: "observaciones",
  label: "Observaciones",
  type: "textarea",
  required: false,
  description: "Observaciones adicionales sobre la actividad",
}

export function ActivityDataForm({ activityType, onSubmit, initialData, isLoading }: ActivityDataFormProps) {
  const [formData, setFormData] = useState<Record<string, any>>({})
  const { options: especiesPodaOptions, isLoading: loadingEspecies } = useEspeciesPoda()

  // Determinar qué campos mostrar según el tipo de actividad
  const getFieldsForActivity = () => {
    let fields = [...baseSystemFields]

    if (activityType.toLowerCase().includes("poda")) {
      // Para actividades de poda, agregar campos específicos
      const podaFields = [...podaSystemFields]

      // Actualizar el campo de especies forestales con las opciones reales
      const especiesField = podaFields.find((f) => f.name === "especiesForestales")
      if (especiesField) {
        especiesField.options = especiesPodaOptions
      }

      fields = [...fields, ...podaFields]
    }

    // Agregar observaciones al final
    fields.push(observacionesField)

    return fields
  }

  const fields = getFieldsForActivity()

  useEffect(() => {
    if (initialData) {
      setFormData(initialData)
    }
  }, [initialData])

  const handleInputChange = (name: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const getFieldIcon = (field: ActivityField) => {
    switch (field.name) {
      case "fecha":
        return <Calendar className="h-4 w-4" />
      case "rodal":
      case "predioCampo":
        return <MapPin className="h-4 w-4" />
      case "cuadrilla":
      case "cantidadPersonal":
        return <Users className="h-4 w-4" />
      case "jornadaHs":
        return <Clock className="h-4 w-4" />
      case "tipoPoda":
      case "especiesForestales":
      case "cantidadPlantas":
        return <Scissors className="h-4 w-4" />
      case "observaciones":
        return <MessageSquare className="h-4 w-4" />
      default:
        return <TreePine className="h-4 w-4" />
    }
  }

  const renderField = (field: ActivityField) => {
    const value = formData[field.name] || ""

    switch (field.type) {
      case "select":
        return (
          <Select value={value} onValueChange={(val) => handleInputChange(field.name, val)}>
            <SelectTrigger>
              <SelectValue placeholder={`Seleccionar ${field.label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case "textarea":
        return (
          <Textarea
            value={value}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            placeholder={field.placeholder || `Ingrese ${field.label.toLowerCase()}`}
            rows={3}
          />
        )

      case "number":
        return (
          <Input
            type="number"
            step={field.name === "jornadaHs" || field.name === "tiempoHs" || field.name === "jornada" ? "0.1" : "1"}
            value={value}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            placeholder={field.placeholder || `Ingrese ${field.label.toLowerCase()}`}
            min={field.name === "jornadaHs" || field.name === "tiempoHs" || field.name === "jornada" ? "0.1" : "0"}
          />
        )

      case "date":
        return <Input type="date" value={value} onChange={(e) => handleInputChange(field.name, e.target.value)} />

      default:
        return (
          <Input
            type="text"
            value={value}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            placeholder={field.placeholder || `Ingrese ${field.label.toLowerCase()}`}
          />
        )
    }
  }

  // Agrupar campos por categoría
  const systemFields = fields.filter((f) => f.isSystemField && !f.category)
  const podaFields = fields.filter((f) => f.isSystemField && f.category === "poda")
  const otherFields = fields.filter((f) => !f.isSystemField)

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
        ℹ️ Los campos del sistema se actualizan automáticamente según el nombre y código. Esta plantilla incluye campos
        específicos de {activityType.toLowerCase()}.
      </div>

      {/* Campos del sistema base */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Campos de la Plantilla ({fields.length} total)</CardTitle>
          <CardDescription>
            Los campos del sistema se actualizan automáticamente según el nombre y código. Esta plantilla incluye campos
            específicos de {activityType.toLowerCase()}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {systemFields.map((field) => (
            <div key={field.name} className="space-y-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2">
                {getFieldIcon(field)}
                <Label htmlFor={field.name} className="font-medium">
                  {field.label}
                </Label>
                <span className="text-sm text-muted-foreground">
                  ({field.type}, {field.required ? "requerido" : "opcional"})
                </span>
                <Badge variant="secondary" className="text-xs">
                  Campo del sistema
                </Badge>
              </div>
              {renderField(field)}
              {field.description && <p className="text-sm text-muted-foreground">{field.description}</p>}
            </div>
          ))}

          {/* Campos específicos de poda */}
          {podaFields.length > 0 && (
            <>
              {podaFields.map((field) => (
                <div key={field.name} className="space-y-2 p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="flex items-center gap-2">
                    {getFieldIcon(field)}
                    <Label htmlFor={field.name} className="font-medium">
                      {field.label}
                    </Label>
                    <span className="text-sm text-muted-foreground">
                      ({field.type}, {field.required ? "requerido" : "opcional"})
                    </span>
                    <Badge variant="outline" className="text-xs border-orange-300 text-orange-700">
                      Campo del sistema - Poda
                    </Badge>
                  </div>
                  {field.name === "especiesForestales" && loadingEspecies ? (
                    <div className="text-sm text-muted-foreground">Cargando especies...</div>
                  ) : (
                    renderField(field)
                  )}
                  {field.description && <p className="text-sm text-muted-foreground">{field.description}</p>}
                </div>
              ))}
            </>
          )}

          {/* Otros campos */}
          {otherFields.map((field) => (
            <div key={field.name} className="space-y-2">
              <div className="flex items-center gap-2">
                {getFieldIcon(field)}
                <Label htmlFor={field.name} className="font-medium">
                  {field.label}
                </Label>
                <span className="text-sm text-muted-foreground">({field.type})</span>
              </div>
              {renderField(field)}
              {field.description && <p className="text-sm text-muted-foreground">{field.description}</p>}
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline">
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Guardando..." : "Guardar Plantilla"}
        </Button>
      </div>
    </form>
  )
}
