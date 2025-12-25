"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Edit, Trash2, Users, UserCheck, UserX, AlertTriangle, Database, HardDrive, RefreshCw, Key } from "lucide-react"
import { usuariosAdminAPI } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"

interface Usuario {
  _id: number
  nombre: string
  apellido: string
  email: string
  rol: "admin" | "supervisor" | "provider"
  activo: boolean
  fechaCreacion: string
  cuit?: string
  telefono?: string
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [backendAvailable, setBackendAvailable] = useState(false)
  const [selectedRole, setSelectedRole] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<Usuario | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<any>(null)
  const { toast } = useToast()

  // Estados para el formulario
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    email: "",
    password: "",
    rol: "provider" as "admin" | "supervisor" | "provider",
    activo: true,
    cuit: "",
    telefono: "",
  })

  // Datos de fallback cuando el backend no está disponible
  const fallbackUsuarios: Usuario[] = [
    {
      _id: 999,
      nombre: "Administrador",
      apellido: "Sistema",
      email: "admin@sistema.com",
      rol: "admin",
      activo: true,
      fechaCreacion: "2024-01-01T00:00:00.000Z",
    },
    {
      _id: 44,
      nombre: "Cecilia",
      apellido: "Pizzini",
      email: "cecilia.pizzini@supervisor.com",
      rol: "supervisor",
      activo: true,
      fechaCreacion: "2024-01-01T00:00:00.000Z",
    },
    {
      _id: 21,
      nombre: "Alejandro",
      apellido: "Wayer",
      email: "alejandro.wayer@supervisor.com",
      rol: "supervisor",
      activo: true,
      fechaCreacion: "2024-01-01T00:00:00.000Z",
    },
    {
      _id: 56,
      nombre: "Diego",
      apellido: "Nonino",
      email: "diego.nonino@supervisor.com",
      rol: "supervisor",
      activo: true,
      fechaCreacion: "2024-01-01T00:00:00.000Z",
    },
    {
      _id: 4,
      nombre: "RAMON OMAR KAUFFMANN",
      apellido: "",
      email: "contacto@kauffmann.com",
      rol: "provider",
      activo: true,
      fechaCreacion: "2024-01-01T00:00:00.000Z",
      cuit: "30-34567890-1",
      telefono: "11-3456-7890",
    },
    {
      _id: 6,
      nombre: "WISEFOR S.R.L.",
      apellido: "",
      email: "contacto@wisefor.com",
      rol: "provider",
      activo: true,
      fechaCreacion: "2024-01-01T00:00:00.000Z",
      cuit: "30-56789012-3",
      telefono: "11-5678-9012",
    },
    // AGREGAR LOS USUARIOS FALTANTES:
    {
      _id: 7,
      nombre: "LOGISTICA",
      apellido: "",
      email: "contacto@logistica.com",
      rol: "provider",
      activo: true,
      fechaCreacion: "2024-01-01T00:00:00.000Z",
      cuit: "30-78901234-5",
      telefono: "11-7890-1234",
    },
    {
      _id: 1,
      nombre: "Forestadora Uruguay",
      apellido: "",
      email: "contacto@forestadorauruguay.com",
      rol: "provider",
      activo: true,
      fechaCreacion: "2024-01-01T00:00:00.000Z",
      cuit: "30-12345678-9",
      telefono: "11-1234-5678",
    },
    {
      _id: 2,
      nombre: "El Ombu",
      apellido: "",
      email: "contacto@elombu.com",
      rol: "provider",
      activo: true,
      fechaCreacion: "2024-01-01T00:00:00.000Z",
      cuit: "30-23456789-0",
      telefono: "11-2345-6789",
    },
    {
      _id: 3,
      nombre: "Arroser",
      apellido: "",
      email: "contacto@arroser.com",
      rol: "provider",
      activo: true,
      fechaCreacion: "2024-01-01T00:00:00.000Z",
      cuit: "30-34567890-1",
      telefono: "11-3456-7890",
    },
  ]

  // Cargar usuarios
  const loadUsuarios = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await usuariosAdminAPI.getAll()

      if (response && response.success && response.data) {
        setUsuarios(response.data)
        setBackendAvailable(true)
      } else {
        throw new Error("Respuesta inválida del backend")
      }
    } catch (err: any) {
      console.error("❌ Error al cargar usuarios desde backend:", err.message)

      setUsuarios(fallbackUsuarios)
      setBackendAvailable(false)
      setError("Backend no disponible. Mostrando datos de ejemplo.")
    } finally {
      setLoading(false)
    }
  }

  // Crear usuario
  const createUsuario = async () => {
    try {
      if (backendAvailable) {
        // Solo incluir password si está presente
        const dataToSend = { ...formData }
        if (!dataToSend.password) {
          delete dataToSend.password
        }
        const response = await usuariosAdminAPI.create(dataToSend)
        if (response && response.success) {
          await loadUsuarios()
          setIsDialogOpen(false)
          resetForm()
          toast({
            title: "Usuario creado",
            description: "El usuario ha sido creado exitosamente",
          })
        }
      } else {
        // Simular creación en modo offline
        const newUser: Usuario = {
          _id: Math.max(...usuarios.map((u) => u._id)) + 1,
          ...formData,
          fechaCreacion: new Date().toISOString(),
        }
        setUsuarios([...usuarios, newUser])
        setIsDialogOpen(false)
        resetForm()
      }
    } catch (err: any) {
      setError(`Error al crear usuario: ${err.message}`)
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      })
    }
  }

  // Actualizar usuario
  const updateUsuario = async () => {
    if (!editingUser) return

    try {
      if (backendAvailable) {
        // Solo incluir password si está presente (para actualizar contraseña)
        const dataToSend = { ...formData }
        if (!dataToSend.password) {
          delete dataToSend.password
        }
        const response = await usuariosAdminAPI.update(String(editingUser._id), dataToSend)
        if (response && response.success) {
          await loadUsuarios()
          setIsDialogOpen(false)
          setEditingUser(null)
          resetForm()
          toast({
            title: "Usuario actualizado",
            description: "El usuario ha sido actualizado exitosamente",
          })
        }
      } else {
        // Simular actualización en modo offline
        setUsuarios(usuarios.map((u) => (u._id === editingUser._id ? { ...u, ...formData } : u)))
        setIsDialogOpen(false)
        setEditingUser(null)
        resetForm()
      }
    } catch (err: any) {
      setError(`Error al actualizar usuario: ${err.message}`)
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      })
    }
  }

  // Eliminar usuario
  const deleteUsuario = async (id: number) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este usuario?")) return

    try {
      if (backendAvailable) {
        const response = await usuariosAdminAPI.delete(String(id))
        if (response && response.success) {
          await loadUsuarios()
          toast({
            title: "Usuario eliminado",
            description: "El usuario ha sido eliminado exitosamente",
          })
        }
      } else {
        // Simular eliminación en modo offline
        setUsuarios(usuarios.filter((u) => u._id !== id))
      }
    } catch (err: any) {
      setError(`Error al eliminar usuario: ${err.message}`)
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      })
    }
  }

  // Generar contraseña aleatoria
  const generarPassword = () => {
    const caracteres = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*"
    let password = ""
    for (let i = 0; i < 12; i++) {
      password += caracteres.charAt(Math.floor(Math.random() * caracteres.length))
    }
    setFormData({ ...formData, password })
  }

  // Resetear formulario
  const resetForm = () => {
    setFormData({
      nombre: "",
      apellido: "",
      email: "",
      password: "",
      rol: "provider",
      activo: true,
      cuit: "",
      telefono: "",
    })
  }

  // Sincronizar con GIS
  const handleSync = async () => {
    setSyncing(true)
    setSyncResult(null)
    try {
      const response = await fetch("/api/usuarios_admin/sync", {
        method: "POST",
      })
      const result = await response.json()

      if (result.success) {
        setSyncResult(result.resumen)
        toast({
          title: "Sincronización exitosa",
          description: `Procesados: ${result.resumen.procesados}, Nuevos: ${result.resumen.nuevos}, Actualizados: ${result.resumen.actualizados}`,
        })
        // Recargar usuarios
        await loadUsuarios()
      } else {
        throw new Error(result.message || "Error en la sincronización")
      }
    } catch (err: any) {
      toast({
        title: "Error en sincronización",
        description: err.message || "No se pudo sincronizar con Usuarios GIS",
        variant: "destructive",
      })
    } finally {
      setSyncing(false)
    }
  }

  // Abrir dialog para editar
  const openEditDialog = (usuario: Usuario) => {
    setEditingUser(usuario)
    setFormData({
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      email: usuario.email,
      password: "", // No mostrar contraseña existente
      rol: usuario.rol,
      activo: usuario.activo,
      cuit: usuario.cuit || "",
      telefono: usuario.telefono || "",
    })
    setIsDialogOpen(true)
  }

  // Filtrar usuarios
  const filteredUsuarios = usuarios.filter((usuario) => {
    const matchesRole = selectedRole === "all" || usuario.rol === selectedRole
    const matchesSearch =
      usuario.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.email.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesRole && matchesSearch
  })

  // Estadísticas
  const stats = {
    total: usuarios.length,
    admins: usuarios.filter((u) => u.rol === "admin").length,
    supervisors: usuarios.filter((u) => u.rol === "supervisor").length,
    providers: usuarios.filter((u) => u.rol === "provider").length,
    active: usuarios.filter((u) => u.activo).length,
    inactive: usuarios.filter((u) => !u.activo).length,
  }

  useEffect(() => {
    loadUsuarios()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p>Cargando usuarios...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
          <p className="text-gray-600">Administra usuarios del sistema</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSync} disabled={syncing} variant="outline">
            <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Sincronizando..." : "Sincronizar con GIS"}
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Usuario
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingUser ? "Editar Usuario" : "Nuevo Usuario"}</DialogTitle>
              <DialogDescription>
                {editingUser ? "Modifica los datos del usuario" : "Completa los datos del nuevo usuario"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nombre">Nombre</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Nombre"
                  />
                </div>
                <div>
                  <Label htmlFor="apellido">Apellido</Label>
                  <Input
                    id="apellido"
                    value={formData.apellido}
                    onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                    placeholder="Apellido"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="usuario@empresa.com"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={generarPassword}
                    className="h-7 text-xs"
                  >
                    <Key className="w-3 h-3 mr-1" />
                    Generar
                  </Button>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={editingUser ? "Dejar vacío para mantener la actual" : "Ingrese contraseña"}
                />
                {editingUser && (
                  <p className="text-xs text-gray-500 mt-1">
                    Dejar vacío para mantener la contraseña actual. Use "Generar" para crear una nueva.
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="rol">Rol</Label>
                <Select value={formData.rol} onValueChange={(value: any) => setFormData({ ...formData, rol: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="supervisor">Supervisor</SelectItem>
                    <SelectItem value="provider">Proveedor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formData.rol === "provider" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cuit">CUIT</Label>
                    <Input
                      id="cuit"
                      value={formData.cuit}
                      onChange={(e) => setFormData({ ...formData, cuit: e.target.value })}
                      placeholder="30-12345678-9"
                    />
                  </div>
                  <div>
                    <Label htmlFor="telefono">Teléfono</Label>
                    <Input
                      id="telefono"
                      value={formData.telefono}
                      onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                      placeholder="11-1234-5678"
                    />
                  </div>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="activo"
                  checked={formData.activo}
                  onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                />
                <Label htmlFor="activo">Usuario activo</Label>
              </div>
              <div className="flex gap-2">
                <Button onClick={editingUser ? updateUsuario : createUsuario} className="flex-1">
                  {editingUser ? "Actualizar" : "Crear"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false)
                    setEditingUser(null)
                    resetForm()
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {syncResult && (
        <Alert>
          <Database className="w-4 h-4 text-green-600" />
          <AlertDescription>
            ✅ Sincronización completada: {syncResult.procesados} procesados, {syncResult.nuevos} nuevos,{" "}
            {syncResult.actualizados} actualizados
            {syncResult.errores > 0 && `, ${syncResult.errores} errores`}
          </AlertDescription>
        </Alert>
      )}

      {/* Estado del backend */}
      <Alert>
        <div className="flex items-center gap-2">
          {backendAvailable ? (
            <Database className="w-4 h-4 text-green-600" />
          ) : (
            <HardDrive className="w-4 h-4 text-orange-600" />
          )}
          <AlertDescription>
            {backendAvailable
              ? "✅ Conectado al backend - Datos en tiempo real"
              : "⚠️ Backend no disponible - Mostrando datos de ejemplo"}
          </AlertDescription>
        </div>
      </Alert>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="w-8 h-8 mx-auto mb-2 text-blue-600" />
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-gray-600">Total</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.admins}</div>
            <div className="text-sm text-gray-600">Admins</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.supervisors}</div>
            <div className="text-sm text-gray-600">Supervisores</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.providers}</div>
            <div className="text-sm text-gray-600">Proveedores</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <UserCheck className="w-8 h-8 mx-auto mb-2 text-green-600" />
            <div className="text-2xl font-bold">{stats.active}</div>
            <div className="text-sm text-gray-600">Activos</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <UserX className="w-8 h-8 mx-auto mb-2 text-red-600" />
            <div className="text-2xl font-bold">{stats.inactive}</div>
            <div className="text-sm text-gray-600">Inactivos</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Buscar</Label>
              <Input
                id="search"
                placeholder="Buscar por nombre, apellido o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="role-filter">Rol</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="supervisor">Supervisor</SelectItem>
                  <SelectItem value="provider">Proveedor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de usuarios */}
      <Card>
        <CardHeader>
          <CardTitle>Usuarios ({filteredUsuarios.length})</CardTitle>
          <CardDescription>Lista de todos los usuarios del sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha Creación</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsuarios.map((usuario) => {
                const usuarioConSync = usuario as Usuario & { sincronizadoDesdeGIS?: boolean }
                return (
                  <TableRow key={usuario._id}>
                    <TableCell className="font-mono">
                      {usuario._id}
                      {usuarioConSync.sincronizadoDesdeGIS && (
                        <span className="ml-2 text-xs text-blue-600" title="Sincronizado desde GIS">
                          🔄
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {usuario.nombre} {usuario.apellido}
                        </div>
                        {usuario.cuit && <div className="text-sm text-gray-500">CUIT: {usuario.cuit}</div>}
                        {usuario.telefono && <div className="text-sm text-gray-500">Tel: {usuario.telefono}</div>}
                      </div>
                    </TableCell>
                  <TableCell>{usuario.email}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        usuario.rol === "admin" ? "destructive" : usuario.rol === "supervisor" ? "default" : "secondary"
                      }
                    >
                      {usuario.rol === "admin"
                        ? "Administrador"
                        : usuario.rol === "supervisor"
                          ? "Supervisor"
                          : "Proveedor"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={usuario.activo ? "default" : "secondary"}>
                      {usuario.activo ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(usuario.fechaCreacion).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEditDialog(usuario)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteUsuario(usuario._id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
