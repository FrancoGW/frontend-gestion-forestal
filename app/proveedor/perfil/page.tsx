"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Building2, Mail, Phone, Tag, FileText, User, CheckCircle2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function ProviderProfilePage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    email: user?.email || "",
    telefono: user?.telefono || "",
  })

  // Si no hay usuario, mostrar mensaje de carga
  if (!user) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center">Cargando información del perfil...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Simulamos la actualización de datos
    toast({
      title: "Perfil actualizado",
      description: "La información de contacto ha sido actualizada correctamente.",
    })
    setIsEditing(false)
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Mi Perfil</h1>
          <p className="text-muted-foreground">Gestiona tu información personal</p>
        </div>

        <Tabs defaultValue="informacion" className="w-full">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 lg:w-[400px]">
            <TabsTrigger value="informacion">Información Personal</TabsTrigger>
            <TabsTrigger value="actividad">Actividad Reciente</TabsTrigger>
          </TabsList>
          <TabsContent value="informacion" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Información Personal
                </CardTitle>
                <CardDescription>Información básica de tu cuenta de proveedor</CardDescription>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="nombre">Nombre de la Empresa</Label>
                        <Input id="nombre" value={user.nombre} disabled />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cuit">CUIT</Label>
                        <Input id="cuit" value={user.cuit || "No especificado"} disabled />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Correo Electrónico</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="correo@empresa.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="telefono">Teléfono</Label>
                        <Input
                          id="telefono"
                          name="telefono"
                          value={formData.telefono}
                          onChange={handleChange}
                          placeholder="11-1234-5678"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit">Guardar Cambios</Button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1">
                        <Label className="text-muted-foreground text-sm">Nombre de la Empresa</Label>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{user.nombre}</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-muted-foreground text-sm">CUIT</Label>
                        <div className="flex items-center gap-2">
                          <Tag className="h-4 w-4 text-muted-foreground" />
                          <span>{user.cuit || "No especificado"}</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-muted-foreground text-sm">Correo Electrónico</Label>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span>{user.email || "No especificado"}</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-muted-foreground text-sm">Teléfono</Label>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{user.telefono || "No especificado"}</span>
                        </div>
                      </div>
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <Label className="text-muted-foreground text-sm">Rubros</Label>
                      <div className="flex flex-wrap gap-2">
                        {user.rubros && user.rubros.length > 0 ? (
                          user.rubros.map((rubro, index) => (
                            <Badge key={index} variant="outline">
                              {rubro}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground">No hay rubros especificados</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Cuenta verificada</span>
                </div>
                {!isEditing && (
                  <Button onClick={() => setIsEditing(true)} className="w-full sm:w-auto">
                    Editar Información
                  </Button>
                )}
              </CardFooter>
            </Card>
          </TabsContent>
          <TabsContent value="actividad" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Actividad Reciente
                </CardTitle>
                <CardDescription>Historial de actividades y cambios en tu cuenta</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border rounded-md p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">Inicio de sesión exitoso</p>
                        <p className="text-sm text-muted-foreground">Acceso desde navegador Chrome</p>
                      </div>
                      <span className="text-sm text-muted-foreground">Hace 5 minutos</span>
                    </div>
                  </div>
                  <div className="border rounded-md p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">Orden de trabajo actualizada</p>
                        <p className="text-sm text-muted-foreground">Orden #OT-2023-302 marcada como en progreso</p>
                      </div>
                      <span className="text-sm text-muted-foreground">Ayer</span>
                    </div>
                  </div>
                  <div className="border rounded-md p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">Nueva orden de trabajo asignada</p>
                        <p className="text-sm text-muted-foreground">Orden #OT-2023-316 asignada a tu empresa</p>
                      </div>
                      <span className="text-sm text-muted-foreground">Hace 3 días</span>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  Ver historial completo
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
