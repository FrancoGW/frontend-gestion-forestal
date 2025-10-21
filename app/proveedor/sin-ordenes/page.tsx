"use client"

import { useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { FileX, Plus } from "lucide-react"
import { avancesTrabajoAPI } from "@/lib/api-client"

// Lista de actividades sin órdenes (por ahora solo Quema Controlada)
const actividadesSinOrdenes = [
  {
    id: "quema-controlada",
    nombre: "Quema Controlada",
    descripcion: "Actividad de quema controlada sin orden de trabajo asociada"
  }
]

export default function SinOrdenesPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [actividadSeleccionada, setActividadSeleccionada] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [formData, setFormData] = useState({
    empresa: user?.empresa || "",
    actividad: "",
    fecha: new Date().toISOString().split('T')[0],
    ubicacion: "",
    referencia: ""
  })

  const handleActividadChange = (value: string) => {
    setActividadSeleccionada(value)
    setFormData(prev => ({ ...prev, actividad: value }))
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleRegistrar = () => {
    if (!actividadSeleccionada) {
      toast({
        title: "Error",
        description: "Por favor selecciona una actividad",
        variant: "destructive"
      })
      return
    }
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Preparar datos para enviar
      const actividadData = {
        // Campos requeridos para avances
        proveedorId: user?.id || user?._id,
        fecha: formData.fecha,
        actividad: actividadesSinOrdenes.find(a => a.id === actividadSeleccionada)?.nombre || "",
        estado: "Pendiente",
        observaciones: formData.referencia,
        
        // Campos específicos para actividades sin orden
        ubicacion: formData.ubicacion,
        empresa: formData.empresa,
        sinOrden: true, // Marcar como actividad sin orden
        
        // Campos adicionales para compatibilidad
        cuadrilla: "",
        cuadrillaId: "",
        cantPersonal: 0,
        jornada: 0,
        superficie: 0,
        predio: formData.ubicacion,
        numeroOrden: "SIN-ORDEN"
      }

      // Enviar a la API
      await avancesTrabajoAPI.create(actividadData)
      
      toast({
        title: "Actividad registrada",
        description: "La actividad sin orden ha sido registrada correctamente"
      })
      
      // Resetear formulario
      setFormData({
        empresa: user?.empresa || "",
        actividad: actividadSeleccionada,
        fecha: new Date().toISOString().split('T')[0],
        ubicacion: "",
        referencia: ""
      })
      setIsDialogOpen(false)
      
    } catch (error) {
      console.error("Error al registrar actividad sin orden:", error)
      toast({
        title: "Error",
        description: "No se pudo registrar la actividad. Inténtalo de nuevo.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <FileX className="h-8 w-8" />
            Actividades Sin Órdenes
          </h1>
          <p className="text-muted-foreground">
            Registra actividades que no requieren orden de trabajo asociada
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Seleccionar Actividad</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="actividad">Selecciona la actividad</Label>
              <Select value={actividadSeleccionada} onValueChange={handleActividadChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona la actividad" />
                </SelectTrigger>
                <SelectContent>
                  {actividadesSinOrdenes.map((actividad) => (
                    <SelectItem key={actividad.id} value={actividad.id}>
                      {actividad.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {actividadSeleccionada && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  {actividadesSinOrdenes.find(a => a.id === actividadSeleccionada)?.descripcion}
                </p>
              </div>
            )}

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  onClick={handleRegistrar}
                  disabled={!actividadSeleccionada}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Registrar
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Registrar Actividad Sin Orden</DialogTitle>
                  <DialogDescription>
                    Completa los datos para registrar la actividad: {actividadesSinOrdenes.find(a => a.id === actividadSeleccionada)?.nombre}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="empresa">Empresa</Label>
                    <Input
                      id="empresa"
                      name="empresa"
                      value={formData.empresa}
                      onChange={handleInputChange}
                      disabled
                      className="bg-muted"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="actividad">Actividad</Label>
                    <Input
                      id="actividad"
                      name="actividad"
                      value={actividadesSinOrdenes.find(a => a.id === actividadSeleccionada)?.nombre || ""}
                      disabled
                      className="bg-muted"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fecha">Fecha</Label>
                    <Input
                      id="fecha"
                      name="fecha"
                      type="date"
                      value={formData.fecha}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ubicacion">Ubicación</Label>
                    <Input
                      id="ubicacion"
                      name="ubicacion"
                      value={formData.ubicacion}
                      onChange={handleInputChange}
                      placeholder="Ingresa la ubicación"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="referencia">Referencia</Label>
                    <Textarea
                      id="referencia"
                      name="referencia"
                      value={formData.referencia}
                      onChange={handleInputChange}
                      placeholder="Ingresa una referencia o descripción adicional"
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                      disabled={isSubmitting}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Registrando..." : "Registrar"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
