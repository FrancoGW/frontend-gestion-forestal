"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { useVecinos } from "@/hooks/use-vecinos"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { FileX, Plus } from "lucide-react"
import { avancesTrabajoAPI, cuadrillasAPI } from "@/lib/api-client"

interface Cuadrilla {
  _id?: string
  id?: string
  idcuadrilla?: string
  nombre?: string
  descripcion?: string
  cod_empres?: string
  proveedorId?: string
}

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
  const { vecinos, isLoading: loadingVecinos } = useVecinos()
  const [actividadSeleccionada, setActividadSeleccionada] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [cuadrillas, setCuadrillas] = useState<Cuadrilla[]>([])
  const [loadingCuadrillas, setLoadingCuadrillas] = useState(false)
  
  const [formData, setFormData] = useState({
    empresa: user?.nombre || "",
    actividad: "",
    fecha: new Date().toISOString().split('T')[0],
    ubicacion: "",
    rodal: "",
    cuadrilla: "",
    cuadrillaId: "",
    cantPersonal: "",
    jornada: "8",
    superficie: "",
    vecino: "",
    // Campos específicos de Quemas Controladas
    horaR29: "",
    horaR8: "",
    horaR7: "",
    horaR28: "",
    tiempoHs: "",
    jornadaHs: "",
    comentarios: "",
    referencia: ""
  })

  // Actualizar empresa cuando el usuario esté disponible
  useEffect(() => {
    if (user?.nombre) {
      setFormData(prev => ({
        ...prev,
        empresa: user.nombre
      }))
    }
  }, [user?.nombre])

  // Cargar cuadrillas
  useEffect(() => {
    const loadCuadrillas = async () => {
      if (!user?.providerId) return
      
      setLoadingCuadrillas(true)
      try {
        const allCuadrillas = await cuadrillasAPI.getAll()
        const providerCuadrillas = allCuadrillas.filter(
          (c: Cuadrilla) => String(c.cod_empres || c.proveedorId) === String(user.providerId)
        )
        setCuadrillas(providerCuadrillas)
      } catch (error) {
        console.error("Error al cargar cuadrillas:", error)
      } finally {
        setLoadingCuadrillas(false)
      }
    }
    loadCuadrillas()
  }, [user?.providerId])

  // Función para calcular tiempo entre horas
  const calcularTiempo = (r8: string, r7: string) => {
    if (!r8 || !r7) return ""
    
    try {
      const [h8, m8] = r8.split(":").map(Number)
      const [h7, m7] = r7.split(":").map(Number)
      
      const inicio = h8 * 60 + m8
      const fin = h7 * 60 + m7
      
      let diferencia = fin - inicio
      if (diferencia < 0) diferencia += 24 * 60
      
      const horas = Math.floor(diferencia / 60)
      const minutos = diferencia % 60
      
      return (horas + minutos / 60).toFixed(2)
    } catch {
      return ""
    }
  }

  // Función para calcular jornales
  const calcularJornada = (tiempo: string, operarios: string) => {
    if (!tiempo || !operarios) return ""
    
    const tiempoNum = Number.parseFloat(tiempo)
    const operariosNum = Number.parseInt(operarios)
    
    if (isNaN(tiempoNum) || isNaN(operariosNum)) return ""
    
    return ((tiempoNum * operariosNum) / 8).toFixed(2)
  }

  const handleActividadChange = (value: string) => {
    setActividadSeleccionada(value)
    setFormData(prev => ({ ...prev, actividad: value }))
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
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
        proveedorId: user?.providerId || user?.id || user?._id,
        fecha: formData.fecha,
        actividad: actividadesSinOrdenes.find(a => a.id === actividadSeleccionada)?.nombre || "",
        estado: "Pendiente",
        observaciones: formData.referencia,
        
        // Campos específicos para actividades sin orden
        ubicacion: formData.ubicacion,
        empresa: user?.nombre || "",
        sinOrden: true, // Marcar como actividad sin orden
        
        // Campos de ubicación
        predio: formData.ubicacion,
        rodal: formData.rodal,
        
        // Campos de cuadrilla
        cuadrilla: formData.cuadrilla,
        cuadrillaId: formData.cuadrillaId,
        cantPersonal: Number(formData.cantPersonal) || 0,
        jornada: Number(formData.jornada) || 8,
        
        // Campo de superficie
        superficie: Number(formData.superficie) || 0,
        
        // Campo de vecino
        vecino: formData.vecino || "sin vecinos",
        
        // Campos específicos de Quemas Controladas
        horaR29: formData.horaR29,
        horaR8: formData.horaR8,
        horaR7: formData.horaR7,
        horaR28: formData.horaR28,
        tiempoHs: formData.tiempoHs,
        jornadaHs: formData.jornadaHs,
        comentarios: formData.comentarios,
        
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
        empresa: user?.nombre || "",
        actividad: actividadSeleccionada,
        fecha: new Date().toISOString().split('T')[0],
        ubicacion: "",
        rodal: "",
        cuadrilla: "",
        cuadrillaId: "",
        cantPersonal: "",
        jornada: "8",
        superficie: "",
        vecino: "",
        horaR29: "",
        horaR8: "",
        horaR7: "",
        horaR28: "",
        tiempoHs: "",
        jornadaHs: "",
        comentarios: "",
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
              <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Registrar Actividad Sin Orden - Quema Controlada</DialogTitle>
                  <DialogDescription>
                    Completa los datos para registrar la actividad: {actividadesSinOrdenes.find(a => a.id === actividadSeleccionada)?.nombre}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Empresa */}
                    <div className="space-y-2">
                      <Label htmlFor="empresa">Empresa</Label>
                      <Input
                        id="empresa"
                        name="empresa"
                        value={formData.empresa}
                        disabled
                        className="bg-muted"
                      />
                    </div>

                    {/* Actividad */}
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

                    {/* Fecha */}
                    <div className="space-y-2">
                      <Label htmlFor="fecha">Fecha <span className="text-red-500">*</span></Label>
                      <Input
                        id="fecha"
                        name="fecha"
                        type="date"
                        value={formData.fecha}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    {/* Ubicación */}
                    <div className="space-y-2">
                      <Label htmlFor="ubicacion">Ubicación/Predio <span className="text-red-500">*</span></Label>
                      <Input
                        id="ubicacion"
                        name="ubicacion"
                        value={formData.ubicacion}
                        onChange={handleInputChange}
                        placeholder="Ingresa la ubicación"
                        required
                      />
                    </div>

                    {/* Rodal */}
                    <div className="space-y-2">
                      <Label htmlFor="rodal">Rodal</Label>
                      <Input
                        id="rodal"
                        name="rodal"
                        value={formData.rodal}
                        onChange={handleInputChange}
                        placeholder="Número de rodal"
                      />
                    </div>

                    {/* Vecino */}
                    <div className="space-y-2">
                      <Label htmlFor="vecino">Vecino</Label>
                      <Select 
                        value={formData.vecino} 
                        onValueChange={(value) => handleSelectChange("vecino", value)}
                        disabled={loadingVecinos}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={loadingVecinos ? "Cargando vecinos..." : "Seleccionar vecino"} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sin vecinos">Sin vecinos</SelectItem>
                          {vecinos.map((vecino) => (
                            <SelectItem key={vecino._id || vecino.id} value={vecino.nombre}>
                              {vecino.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Cuadrilla */}
                    <div className="space-y-2">
                      <Label htmlFor="cuadrilla">Cuadrilla <span className="text-red-500">*</span></Label>
                      <Select 
                        value={formData.cuadrilla} 
                        onValueChange={(value) => {
                          const cuadrillaSeleccionada = cuadrillas.find((c) => {
                            const nombre = c.nombre || c.descripcion || ""
                            return nombre === value
                          })
                          if (cuadrillaSeleccionada) {
                            const id = cuadrillaSeleccionada._id || cuadrillaSeleccionada.id || cuadrillaSeleccionada.idcuadrilla || ""
                            const nombre = cuadrillaSeleccionada.nombre || cuadrillaSeleccionada.descripcion || `Cuadrilla ${id}`
                            handleSelectChange("cuadrillaId", String(id))
                            handleSelectChange("cuadrilla", nombre)
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar cuadrilla" />
                        </SelectTrigger>
                        <SelectContent>
                          {loadingCuadrillas ? (
                            <SelectItem value="loading">Cargando...</SelectItem>
                          ) : cuadrillas.length === 0 ? (
                            <SelectItem value="no-data">No hay cuadrillas disponibles</SelectItem>
                          ) : (
                            cuadrillas.map((cuadrilla) => {
                              const id = cuadrilla._id || cuadrilla.id || cuadrilla.idcuadrilla || ""
                              const nombre = cuadrilla.nombre || cuadrilla.descripcion || `Cuadrilla ${id}`
                              if (!id) return null
                              return (
                                <SelectItem key={id} value={nombre}>
                                  {nombre}
                                </SelectItem>
                              )
                            })
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Superficie */}
                    <div className="space-y-2">
                      <Label htmlFor="superficie">Superficie (Ha) <span className="text-red-500">*</span></Label>
                      <Input
                        id="superficie"
                        name="superficie"
                        type="number"
                        step="0.0001"
                        min="0"
                        value={formData.superficie}
                        onChange={handleInputChange}
                        placeholder="Superficie a quemar"
                        required
                      />
                    </div>

                    {/* Cantidad de Personal */}
                    <div className="space-y-2">
                      <Label htmlFor="cantPersonal">Cantidad de Personal <span className="text-red-500">*</span></Label>
                      <Input
                        id="cantPersonal"
                        name="cantPersonal"
                        type="number"
                        min="1"
                        value={formData.cantPersonal}
                        onChange={(e) => {
                          handleInputChange(e)
                          // Recalcular jornales si hay tiempo
                          if (formData.tiempoHs) {
                            const jornada = calcularJornada(formData.tiempoHs, e.target.value)
                            handleSelectChange("jornadaHs", jornada)
                          }
                        }}
                        placeholder="Número de personal"
                        required
                      />
                    </div>

                    {/* Jornada */}
                    <div className="space-y-2">
                      <Label htmlFor="jornada">Jornada (hs) <span className="text-red-500">*</span></Label>
                      <Input
                        id="jornada"
                        name="jornada"
                        type="number"
                        min="1"
                        max="24"
                        value={formData.jornada}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  {/* Sección de Horarios */}
                  <div className="space-y-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                    <Label className="text-lg font-semibold text-blue-800">
                      Horarios de Trabajo <span className="text-red-500">*</span>
                    </Label>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {/* R29 */}
                      <div className="space-y-2">
                        <Label htmlFor="horaR29">R29 - Salida <span className="text-red-500">*</span></Label>
                        <Input
                          id="horaR29"
                          name="horaR29"
                          type="text"
                          value={formData.horaR29}
                          onChange={handleInputChange}
                          placeholder="HH:MM"
                          pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$"
                          required
                        />
                      </div>

                      {/* R8 */}
                      <div className="space-y-2">
                        <Label htmlFor="horaR8">R8 - Inicio <span className="text-red-500">*</span></Label>
                        <Input
                          id="horaR8"
                          name="horaR8"
                          type="text"
                          value={formData.horaR8}
                          onChange={(e) => {
                            handleInputChange(e)
                            const tiempo = calcularTiempo(e.target.value, formData.horaR7)
                            if (tiempo) {
                              handleSelectChange("tiempoHs", tiempo)
                              if (formData.cantPersonal) {
                                const jornada = calcularJornada(tiempo, formData.cantPersonal)
                                handleSelectChange("jornadaHs", jornada)
                              }
                            }
                          }}
                          placeholder="HH:MM"
                          pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$"
                          required
                        />
                      </div>

                      {/* R7 */}
                      <div className="space-y-2">
                        <Label htmlFor="horaR7">R7 - Término <span className="text-red-500">*</span></Label>
                        <Input
                          id="horaR7"
                          name="horaR7"
                          type="text"
                          value={formData.horaR7}
                          onChange={(e) => {
                            handleInputChange(e)
                            const tiempo = calcularTiempo(formData.horaR8, e.target.value)
                            if (tiempo) {
                              handleSelectChange("tiempoHs", tiempo)
                              if (formData.cantPersonal) {
                                const jornada = calcularJornada(tiempo, formData.cantPersonal)
                                handleSelectChange("jornadaHs", jornada)
                              }
                            }
                          }}
                          placeholder="HH:MM"
                          pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$"
                          required
                        />
                      </div>

                      {/* R28 */}
                      <div className="space-y-2">
                        <Label htmlFor="horaR28">R28 - Regreso <span className="text-red-500">*</span></Label>
                        <Input
                          id="horaR28"
                          name="horaR28"
                          type="text"
                          value={formData.horaR28}
                          onChange={handleInputChange}
                          placeholder="HH:MM"
                          pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Campos calculados */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="tiempoHs">Hs Trabajadas (Calculado automáticamente)</Label>
                      <Input
                        id="tiempoHs"
                        name="tiempoHs"
                        type="number"
                        step="0.01"
                        value={formData.tiempoHs}
                        readOnly
                        disabled
                        className="bg-gray-100 cursor-not-allowed"
                        placeholder="Se calcula automáticamente (R7-R8)"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="jornadaHs">Jornales Sistema (Calculado automáticamente)</Label>
                      <Input
                        id="jornadaHs"
                        name="jornadaHs"
                        type="number"
                        step="0.01"
                        value={formData.jornadaHs}
                        readOnly
                        disabled
                        className="bg-gray-100 cursor-not-allowed"
                        placeholder="(R7-R8) × Operarios ÷ 8"
                      />
                    </div>
                  </div>

                  {/* Comentarios */}
                  <div className="space-y-2">
                    <Label htmlFor="comentarios">Comentarios</Label>
                    <Textarea
                      id="comentarios"
                      name="comentarios"
                      value={formData.comentarios}
                      onChange={handleInputChange}
                      placeholder="Comentarios adicionales sobre la quema controlada"
                      rows={3}
                    />
                  </div>

                  {/* Referencia */}
                  <div className="space-y-2">
                    <Label htmlFor="referencia">Referencia/Observaciones</Label>
                    <Textarea
                      id="referencia"
                      name="referencia"
                      value={formData.referencia}
                      onChange={handleInputChange}
                      placeholder="Ingresa una referencia o descripción adicional"
                      rows={2}
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
