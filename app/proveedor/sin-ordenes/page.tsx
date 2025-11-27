"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { useVecinos } from "@/hooks/use-vecinos"
import { useProviderOrders } from "@/hooks/use-provider-orders"
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
import { Checkbox } from "@/components/ui/checkbox"
import { formatDateArgentina } from "@/utils/date-utils"

interface Cuadrilla {
  _id?: string
  id?: string
  idcuadrilla?: string
  nombre?: string
  descripcion?: string
  cod_empres?: string
  proveedorId?: string
}

// Lista de actividades sin órdenes
const actividadesSinOrdenes = [
  {
    id: "quema-controlada",
    nombre: "Quema Controlada Protección",
    descripcion: "Actividad de quema controlada sin orden de trabajo asociada"
  },
  {
    id: "mantenimiento-alambrado",
    nombre: "Mantenimiento Alambrado",
    descripcion: "Registra las actividades de mantenimiento y reparación de alambrados sin orden asociada"
  },
  {
    id: "mantenimiento-cortafuego",
    nombre: "Mantenimiento de cortafuego",
    descripcion: "Registra intervenciones de mantenimiento de cortafuegos sin orden asociada"
  }
]

export default function SinOrdenesPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const { vecinos, isLoading: loadingVecinos } = useVecinos()
  const { orders, loading: ordersLoading } = useProviderOrders()
  const prediosUnicos = Array.from(new Set((orders || []).map((o) => o.campo).filter(Boolean)))
  const [actividadSeleccionada, setActividadSeleccionada] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [cuadrillas, setCuadrillas] = useState<Cuadrilla[]>([])
  const [loadingCuadrillas, setLoadingCuadrillas] = useState(false)
  const [avancesRecientes, setAvancesRecientes] = useState<any[]>([])
  const [loadingAvances, setLoadingAvances] = useState(false)

  const actividadConfig = actividadesSinOrdenes.find((a) => a.id === actividadSeleccionada)
  const isQuemaControlada = actividadSeleccionada === "quema-controlada"
  const isMantenimientoAlambrado = actividadSeleccionada === "mantenimiento-alambrado"
  const isMantenimientoCortafuego = actividadSeleccionada === "mantenimiento-cortafuego"
  
  const createInitialFormData = (nombreEmpresa?: string) => ({
    empresa: nombreEmpresa || "",
    actividad: "",
    fecha: new Date().toISOString().split("T")[0],
    ubicacion: "",
    cuadrilla: "",
    cuadrillaId: "",
    cantPersonal: "",
    jornada: "8",
    superficie: "",
    vecino: "",
    estado: "Pendiente",
    // Campos específicos de Quemas Controladas
    horaR29: "",
    horaR8: "",
    horaR7: "",
    horaR28: "",
    tiempoHs: "",
    jornadaHs: "",
    comentarios: "",
    referencia: "",
    // Mantenimiento Alambrado
    horaInicio: "",
    horaTermino: "",
    // Mantenimiento cortafuego
    empresaProveedora: nombreEmpresa || "",
    prediosTexto: "",
    rodal: "",
    jornalesCortafuego: "",
    cantidadCortafuego: "",
    herramienta: false,
    rastra: false,
    champion: false,
    topador: false,
    despejador: false,
    motoguadana: false,
    motosierra: false
  })

  const [formData, setFormData] = useState(() => createInitialFormData(user?.nombre))

  // Actualizar empresa cuando el usuario esté disponible
  useEffect(() => {
    if (user?.nombre) {
      setFormData(prev => ({
        ...prev,
        empresa: user.nombre,
        empresaProveedora: user.nombre
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

  useEffect(() => {
    const loadAvancesRecientes = async () => {
      if (!user?.providerId) return

      setLoadingAvances(true)
      try {
        const data = await avancesTrabajoAPI.getByProviderId(user.providerId)
        const fechaCorte = new Date("2025-10-15")

        const filtrados = (Array.isArray(data) ? data : [])
          .filter((avance) => {
            if (!avance) return false
            const fechaAvance = avance.fecha ? new Date(avance.fecha) : null
            if (!fechaAvance || Number.isNaN(fechaAvance.getTime())) return false
            const esReciente = fechaAvance >= fechaCorte
            const esSinOrden = avance.sinOrden === true
            return esReciente && esSinOrden
          })
          .sort((a, b) => {
            const fechaA = new Date(a.fecha || 0).getTime()
            const fechaB = new Date(b.fecha || 0).getTime()
            return fechaB - fechaA
          })

        setAvancesRecientes(filtrados)
      } catch (error) {
        console.error("Error al cargar avances recientes:", error)
      } finally {
        setLoadingAvances(false)
      }
    }

    loadAvancesRecientes()
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
    setFormData({
      ...createInitialFormData(user?.nombre),
      actividad: value
    })
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }))
  }

  const handleHoraTrabajoChange = (name: "horaInicio" | "horaTermino", value: string) => {
    setFormData(prev => {
      const updated = { ...prev, [name]: value }
      const inicio = name === "horaInicio" ? value : updated.horaInicio
      const termino = name === "horaTermino" ? value : updated.horaTermino

      if (inicio && termino) {
        const tiempo = calcularTiempo(inicio, termino)
        updated.tiempoHs = tiempo
        if (updated.cantPersonal) {
          const jornada = calcularJornada(tiempo, updated.cantPersonal)
          updated.jornadaHs = jornada
        } else {
          updated.jornadaHs = ""
        }
      } else {
        updated.tiempoHs = ""
        updated.jornadaHs = ""
      }

      return updated
    })
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
      if (!actividadConfig) {
        setIsSubmitting(false)
        return
      }

      const actividadBase = {
        proveedorId: user?.providerId || user?.id,
        fecha: formData.fecha,
        actividad: actividadConfig?.nombre || "",
        sinOrden: true,
        numeroOrden: "SIN-ORDEN",
        estado: formData.estado || "Pendiente",
        empresa: user?.nombre || "",
        ubicacion: formData.ubicacion || formData.prediosTexto || ""
      }

      let actividadData: Record<string, any> = { ...actividadBase }

      if (isQuemaControlada) {
        actividadData = {
          ...actividadData,
          observaciones: formData.referencia,
          predio: formData.ubicacion,
          cuadrilla: formData.cuadrilla,
          cuadrillaId: formData.cuadrillaId,
          cantPersonal: Number(formData.cantPersonal) || 0,
          jornada: Number(formData.jornada) || 8,
          superficie: Number(formData.superficie) || 0,
          vecino: formData.vecino || "sin vecinos",
          horaR29: formData.horaR29,
          horaR8: formData.horaR8,
          horaR7: formData.horaR7,
          horaR28: formData.horaR28,
          tiempoHs: formData.tiempoHs,
          jornadaHs: formData.jornadaHs,
          comentarios: formData.comentarios
        }
      } else if (isMantenimientoAlambrado) {
        actividadData = {
          ...actividadData,
          observaciones: formData.comentarios,
          predio: formData.ubicacion,
          cantPersonal: Number(formData.cantPersonal) || 0,
          horaInicio: formData.horaInicio,
          horaTermino: formData.horaTermino,
          tiempoHs: formData.tiempoHs,
          jornadaHs: formData.jornadaHs,
          jornales: formData.jornadaHs ? Number(formData.jornadaHs) : undefined
        }
      } else if (isMantenimientoCortafuego) {
        actividadData = {
          ...actividadData,
          observaciones: formData.comentarios,
          empresaProveedora: formData.empresaProveedora,
          predio: formData.prediosTexto || formData.ubicacion,
          ubicacion: formData.prediosTexto || formData.ubicacion || "",
          rodal: formData.rodal,
          intervencionMecanizado: {
            herramienta: formData.herramienta,
            rastra: formData.rastra,
            champion: formData.champion,
            topador: formData.topador,
            despejador: formData.despejador
          },
          intervencionManual: {
            motoguadana: formData.motoguadana,
            motosierra: formData.motosierra
          },
          jornales: formData.jornalesCortafuego ? Number(formData.jornalesCortafuego) : undefined,
          cantidad: formData.cantidadCortafuego ? Number(formData.cantidadCortafuego) : undefined
        }
      }

      // Enviar a la API
      await avancesTrabajoAPI.create(actividadData)
      
      toast({
        title: "Actividad registrada",
        description: "La actividad sin orden ha sido registrada correctamente"
      })
      
      // Resetear formulario
      setFormData({
        ...createInitialFormData(user?.nombre),
        actividad: actividadSeleccionada
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
            <CardTitle>Avances registrados desde el 15/10/2025</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingAvances ? (
              <p className="text-muted-foreground text-sm">Cargando avances...</p>
            ) : avancesRecientes.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No hay avances registrados desde esa fecha.
              </p>
            ) : (
              <div className="space-y-3">
                {avancesRecientes.map((avance) => {
                  const key = avance._id || avance.id || avance.ordenTrabajoId || `${avance.fecha}-${avance.actividad}`
                  return (
                    <div
                      key={key}
                      className="rounded-lg border p-4 grid gap-2 md:grid-cols-4 md:items-center"
                    >
                      <div>
                        <p className="text-sm font-semibold">Fecha</p>
                        <p className="text-sm text-muted-foreground">
                          {avance.fecha ? formatDateArgentina(avance.fecha) : "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold">Actividad</p>
                        <p className="text-sm text-muted-foreground">
                          {avance.actividad || "Sin actividad"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold">Ubicación</p>
                        <p className="text-sm text-muted-foreground">
                          {avance.predio || avance.ubicacion || "Sin datos"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold">Estado</p>
                        <p className="text-sm text-muted-foreground">
                          {avance.estado || "Sin estado"}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

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
                  <DialogTitle>
                    {actividadConfig
                      ? `Registrar Actividad Sin Orden - ${actividadConfig.nombre}`
                      : "Registrar Actividad Sin Orden"}
                  </DialogTitle>
                  <DialogDescription>
                    Completa los datos para registrar la actividad: {actividadConfig?.nombre}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {isQuemaControlada && (
                    <>
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
                      <Select
                        value={String(formData.ubicacion || "")}
                        onValueChange={(value) => handleSelectChange("ubicacion", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={ordersLoading ? "Cargando predios..." : "Seleccionar predio"} />
                        </SelectTrigger>
                        <SelectContent>
                          {prediosUnicos.length === 0 ? (
                            <SelectItem value="">Sin predios disponibles</SelectItem>
                          ) : (
                            prediosUnicos.map((predio) => {
                              const p = String(predio)
                              return (
                                <SelectItem key={p} value={p}>{p}</SelectItem>
                              )
                            })
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Cuadrilla */}
                    <div className="space-y-2">
                      <Label htmlFor="cuadrilla">Cuadrilla <span className="text-red-500">*</span></Label>
                      <Select 
                        value={String(formData.cuadrilla || "")} 
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
                        step="0.1"
                        min="0.1"
                        max="24"
                        value={formData.jornada}
                        onChange={handleInputChange}
                        placeholder="Ej: 7.3, 8.5, 1.4"
                        required
                      />
                    </div>

                    {/* Vecino */}
                    <div className="space-y-2">
                      <Label htmlFor="vecino">Vecino</Label>
                      <Select 
                        value={String(formData.vecino || "")} 
                        onValueChange={(value) => handleSelectChange("vecino", value)}
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

                    {/* Estado */}
                    <div className="space-y-2">
                      <Label htmlFor="estado">Estado <span className="text-red-500">*</span></Label>
                      <Select 
                        value={String(formData.estado || "Pendiente")} 
                        onValueChange={(value) => handleSelectChange("estado", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar estado" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Pendiente">Pendiente</SelectItem>
                          <SelectItem value="R7 (terminado)">Terminado</SelectItem>
                        </SelectContent>
                      </Select>
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
                    </>
                  )}

                  {isMantenimientoAlambrado && (
                    <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="actividad-alambrado">Actividad</Label>
                      <Input id="actividad-alambrado" value={actividadConfig?.nombre || ""} disabled className="bg-muted" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="fecha-alambrado">Fecha <span className="text-red-500">*</span></Label>
                      <Input
                        id="fecha-alambrado"
                        name="fecha"
                        type="date"
                        value={formData.fecha}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="ubicacion-alambrado">Predio <span className="text-red-500">*</span></Label>
                      <Select
                        value={String(formData.ubicacion || "")}
                        onValueChange={(value) => handleSelectChange("ubicacion", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={ordersLoading ? "Cargando predios..." : "Seleccionar predio"} />
                        </SelectTrigger>
                        <SelectContent>
                          {prediosUnicos.length === 0 ? (
                            <SelectItem value="">Sin predios disponibles</SelectItem>
                          ) : (
                            prediosUnicos.map((predio) => {
                              const p = String(predio)
                              return (
                                <SelectItem key={p} value={p}>{p}</SelectItem>
                              )
                            })
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cantPersonal-alambrado">Cant. Operarios <span className="text-red-500">*</span></Label>
                      <Input
                        id="cantPersonal-alambrado"
                        name="cantPersonal"
                        type="number"
                        min="1"
                        value={formData.cantPersonal}
                        onChange={(e) => {
                          handleInputChange(e)
                          if (formData.tiempoHs) {
                            const jornada = calcularJornada(formData.tiempoHs, e.target.value)
                            handleSelectChange("jornadaHs", jornada)
                          }
                        }}
                        placeholder="Número de operarios"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="horaInicio">Hs Inicio <span className="text-red-500">*</span></Label>
                      <Input
                        id="horaInicio"
                        name="horaInicio"
                        type="time"
                        value={formData.horaInicio}
                        onChange={(e) => handleHoraTrabajoChange("horaInicio", e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="horaTermino">Hs Término <span className="text-red-500">*</span></Label>
                      <Input
                        id="horaTermino"
                        name="horaTermino"
                        type="time"
                        value={formData.horaTermino}
                        onChange={(e) => handleHoraTrabajoChange("horaTermino", e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tiempoHs">Hs Trabajadas</Label>
                      <Input
                        id="tiempoHs"
                        name="tiempoHs"
                        type="number"
                        step="0.01"
                        value={formData.tiempoHs}
                        readOnly
                        disabled
                        className="bg-gray-100 cursor-not-allowed"
                        placeholder="Se calcula automáticamente"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="jornadaHs">Jornales (Sistema)</Label>
                      <Input
                        id="jornadaHs"
                        name="jornadaHs"
                        type="number"
                        step="0.01"
                        value={formData.jornadaHs}
                        readOnly
                        disabled
                        className="bg-gray-100 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="comentarios-alambrado">Observaciones</Label>
                    <Textarea
                      id="comentarios-alambrado"
                      name="comentarios"
                      value={formData.comentarios}
                      onChange={handleInputChange}
                      placeholder="Observaciones del mantenimiento"
                      rows={3}
                    />
                  </div>
                    </>
                  )}

                  {isMantenimientoCortafuego && (
                    <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="empresaProveedora">Empresa Proveedora</Label>
                      <Input
                        id="empresaProveedora"
                        name="empresaProveedora"
                        value={formData.empresaProveedora}
                        onChange={handleInputChange}
                        placeholder="Nombre de la empresa proveedora"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="fecha-cortafuego">Fecha <span className="text-red-500">*</span></Label>
                      <Input
                        id="fecha-cortafuego"
                        name="fecha"
                        type="date"
                        value={formData.fecha}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="prediosTexto">Predios</Label>
                      <Textarea
                        id="prediosTexto"
                        name="prediosTexto"
                        value={formData.prediosTexto}
                        onChange={handleInputChange}
                        placeholder="Detalle los predios intervenidos"
                        rows={2}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="rodal">Rodal</Label>
                      <Input
                        id="rodal"
                        name="rodal"
                        value={formData.rodal}
                        onChange={handleInputChange}
                        placeholder="Ingrese el rodal"
                      />
                    </div>
                  </div>

                  <div className="space-y-4 border rounded-lg p-4">
                    <Label className="text-sm font-semibold">Tipo Intervención: Mecanizado</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {[
                        { id: "herramienta", label: "Herramienta" },
                        { id: "rastra", label: "Rastra" },
                        { id: "champion", label: "Champion" },
                        { id: "topador", label: "Topador" },
                        { id: "despejador", label: "Despejador" }
                      ].map((item) => (
                        <label key={item.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={item.id}
                            checked={Boolean(formData[item.id as keyof typeof formData])}
                            onCheckedChange={(checked) => handleCheckboxChange(item.id, checked === true)}
                          />
                          <span className="text-sm">{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4 border rounded-lg p-4">
                    <Label className="text-sm font-semibold">Tipo Intervención: Manual</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {[
                        { id: "motoguadana", label: "Motoguadaña" },
                        { id: "motosierra", label: "Motosierra" }
                      ].map((item) => (
                        <label key={item.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={item.id}
                            checked={Boolean(formData[item.id as keyof typeof formData])}
                            onCheckedChange={(checked) => handleCheckboxChange(item.id, checked === true)}
                          />
                          <span className="text-sm">{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="jornalesCortafuego">Jornales</Label>
                      <Input
                        id="jornalesCortafuego"
                        name="jornalesCortafuego"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.jornalesCortafuego}
                        onChange={handleInputChange}
                        placeholder="Ingrese los jornales"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cantidadCortafuego">Cantidad</Label>
                      <Input
                        id="cantidadCortafuego"
                        name="cantidadCortafuego"
                        type="number"
                        min="0"
                        value={formData.cantidadCortafuego}
                        onChange={handleInputChange}
                        placeholder="Ingrese la cantidad"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="comentarios-cortafuego">Observaciones</Label>
                    <Textarea
                      id="comentarios-cortafuego"
                      name="comentarios"
                      value={formData.comentarios}
                      onChange={handleInputChange}
                      placeholder="Observaciones del mantenimiento de cortafuegos"
                      rows={3}
                    />
                  </div>
                    </>
                  )}

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
