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
import { Plus, Edit, Trash2, Users, UserCheck, UserX, AlertTriangle, Database, HardDrive, RefreshCw, Key, CheckCircle2, WifiOff, ShieldCheck } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { usuariosAdminAPI } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import type { RolGestionableAdmin } from "@/lib/constants/roles"
import { ROL_LABEL } from "@/lib/constants/roles"

interface JefeDeAreaAsignado {
  jdaId: number
  nombre: string
  email?: string
  fechaAsignacion?: string
}

interface Usuario {
  _id: number | string
  nombre: string
  apellido: string
  email: string
  rol: RolGestionableAdmin
  activo: boolean
  fechaCreacion: string
  cuit?: string
  telefono?: string
  jefesDeAreaAsignados?: JefeDeAreaAsignado[]
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
    rol: "provider" as RolGestionableAdmin,
    activo: true,
    cuit: "",
    telefono: "",
    jefesDeAreaAsignados: [] as JefeDeAreaAsignado[],
  })

  // Lista de jefes de área para asignar al subgerente
  const [jefesDeAreaLista, setJefesDeAreaLista] = useState<Array<{ _id: number; nombre: string; apellido?: string; email: string }>>([])

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
        const dataToSend: Record<string, unknown> = { ...formData }
        if (!dataToSend.password) {
          delete dataToSend.password
        }
        if (formData.rol !== "subgerente") {
          delete dataToSend.jefesDeAreaAsignados
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
        const maxId = Math.max(
          ...usuarios.map((u) => (typeof u._id === "number" ? u._id : 0)),
          0
        )
        const newUser: Usuario = {
          _id: maxId + 1,
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
        const dataToSend: Record<string, unknown> = { ...formData }
        if (!dataToSend.password) {
          delete dataToSend.password
        }
        if (formData.rol !== "subgerente") {
          delete dataToSend.jefesDeAreaAsignados
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
  const deleteUsuario = async (id: number | string) => {
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
      jefesDeAreaAsignados: [],
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
      password: "",
      rol: usuario.rol,
      activo: usuario.activo,
      cuit: usuario.cuit || "",
      telefono: usuario.telefono || "",
      jefesDeAreaAsignados: usuario.jefesDeAreaAsignados || [],
    })
    setIsDialogOpen(true)
  }

  const toggleJdaAsignado = (jda: { _id: number; nombre: string; apellido?: string; email: string }) => {
    const nombreCompleto = [jda.nombre, jda.apellido].filter(Boolean).join(" ").trim() || jda.nombre
    const asignados = formData.jefesDeAreaAsignados || []
    const yaAsignado = asignados.some((a) => a.jdaId === jda._id)
    if (yaAsignado) {
      setFormData({
        ...formData,
        jefesDeAreaAsignados: asignados.filter((a) => a.jdaId !== jda._id),
      })
    } else {
      setFormData({
        ...formData,
        jefesDeAreaAsignados: [
          ...asignados,
          { jdaId: jda._id, nombre: nombreCompleto, email: jda.email, fechaAsignacion: new Date().toISOString() },
        ],
      })
    }
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
    subgerentes: usuarios.filter((u) => u.rol === "subgerente").length,
    supervisors: usuarios.filter((u) => u.rol === "supervisor").length,
    providers: usuarios.filter((u) => u.rol === "provider").length,
    active: usuarios.filter((u) => u.activo).length,
    inactive: usuarios.filter((u) => !u.activo).length,
  }

  // Cargar lista de jefes de área para asignar al subgerente
  useEffect(() => {
    const loadJefesDeArea = async () => {
      try {
        const res = await fetch("/api/jefes_de_area")
        const data = await res.json()
        const list = data?.data ?? (Array.isArray(data) ? data : [])
        setJefesDeAreaLista(
          list.map((j: any) => ({
            _id: j._id,
            nombre: j.nombre || "",
            apellido: j.apellido || "",
            email: j.email || "",
          }))
        )
      } catch (e) {
        console.error("Error al cargar jefes de área:", e)
      }
    }
    loadJefesDeArea()
  }, [])

  useEffect(() => {
    loadUsuarios()
  }, [])

  // Badge de rol
  const roleBadgeClass = (rol: string) => {
    switch (rol) {
      case "admin": return "bg-red-100 text-red-800 border-red-200"
      case "subgerente": return "bg-indigo-100 text-indigo-800 border-indigo-200"
      case "supervisor": return "bg-blue-100 text-blue-800 border-blue-200"
      case "provider": return "bg-emerald-100 text-emerald-800 border-emerald-200"
      case "jda": return "bg-amber-100 text-amber-800 border-amber-200"
      default: return "bg-gray-100 text-gray-700 border-gray-200"
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-4 w-40" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-40" />
            <Skeleton className="h-9 w-36" />
          </div>
        </div>
        <div className="grid grid-cols-7 gap-3">
          {Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
        <Skeleton className="h-16" />
        <Card>
          <CardContent className="p-0">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex gap-4 px-6 py-3 border-b last:border-b-0">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-56 ml-auto" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  // Dialog form (extracted for reuse)
  const userForm = (
    <div className="space-y-4 pt-2">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="nombre">Nombre</Label>
          <Input id="nombre" value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} placeholder="Nombre" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="apellido">Apellido</Label>
          <Input id="apellido" value={formData.apellido} onChange={(e) => setFormData({ ...formData, apellido: e.target.value })} placeholder="Apellido" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="usuario@empresa.com" />
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Contraseña</Label>
          <Button type="button" variant="outline" size="sm" onClick={generarPassword} className="h-7 text-xs gap-1">
            <Key className="w-3 h-3" /> Generar
          </Button>
        </div>
        <Input id="password" type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder={editingUser ? "Dejar vacío para mantener la actual" : "Contraseña"} />
        {editingUser && <p className="text-xs text-muted-foreground">Dejar vacío para no cambiar la contraseña actual.</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="rol">Rol</Label>
        <Select value={formData.rol} onValueChange={(value: RolGestionableAdmin) => setFormData({ ...formData, rol: value })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">{ROL_LABEL.admin}</SelectItem>
            <SelectItem value="subgerente">{ROL_LABEL.subgerente}</SelectItem>
            <SelectItem value="supervisor">{ROL_LABEL.supervisor}</SelectItem>
            <SelectItem value="provider">{ROL_LABEL.provider}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {formData.rol === "provider" && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="cuit">CUIT</Label>
            <Input id="cuit" value={formData.cuit} onChange={(e) => setFormData({ ...formData, cuit: e.target.value })} placeholder="30-12345678-9" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="telefono">Teléfono</Label>
            <Input id="telefono" value={formData.telefono} onChange={(e) => setFormData({ ...formData, telefono: e.target.value })} placeholder="11-1234-5678" />
          </div>
        </div>
      )}
      {formData.rol === "subgerente" && (
        <div className="space-y-1.5">
          <Label>Jefes de área a cargo</Label>
          <p className="text-xs text-muted-foreground">El subgerente verá en su panel las actividades de estos JDAs, supervisores y proveedores.</p>
          <div className="border rounded-sm p-3 max-h-48 overflow-y-auto space-y-1">
            {jefesDeAreaLista.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay jefes de área disponibles.</p>
            ) : (
              jefesDeAreaLista.map((jda) => {
                const nombreCompleto = [jda.nombre, jda.apellido].filter(Boolean).join(" ").trim() || jda.nombre
                const asignado = (formData.jefesDeAreaAsignados || []).some((a) => a.jdaId === jda._id)
                return (
                  <label key={jda._id} className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 px-2 py-1.5 rounded-sm">
                    <input type="checkbox" checked={asignado} onChange={() => toggleJdaAsignado(jda)} className="border-border" />
                    <span className="text-sm">{nombreCompleto}{jda.email && <span className="text-muted-foreground"> — {jda.email}</span>}</span>
                  </label>
                )
              })
            )}
          </div>
        </div>
      )}
      <div className="flex items-center gap-2 pt-1">
        <input type="checkbox" id="activo" checked={formData.activo} onChange={(e) => setFormData({ ...formData, activo: e.target.checked })} />
        <Label htmlFor="activo" className="font-normal cursor-pointer">Usuario activo</Label>
      </div>
      <div className="flex gap-2 pt-2 border-t">
        <Button onClick={editingUser ? updateUsuario : createUsuario} className="flex-1">
          {editingUser ? "Guardar cambios" : "Crear usuario"}
        </Button>
        <Button variant="outline" onClick={() => { setIsDialogOpen(false); setEditingUser(null); resetForm() }}>
          Cancelar
        </Button>
      </div>
    </div>
  )

  return (
    <div className="container mx-auto p-6 space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Gestión de Usuarios</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Administra los usuarios del sistema</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSync} disabled={syncing} variant="outline" size="sm">
            <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Sincronizando..." : "Sincronizar con GIS"}
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={resetForm}>
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Usuario
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingUser ? "Editar Usuario" : "Nuevo Usuario"}</DialogTitle>
                <DialogDescription>
                  {editingUser ? "Modificá los datos del usuario seleccionado." : "Completá los datos para crear un nuevo usuario."}
                </DialogDescription>
              </DialogHeader>
              {userForm}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Alertas */}
      {syncResult && (
        <Alert className="border-emerald-200 bg-emerald-50">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <AlertDescription className="text-emerald-800">
            Sincronización completada — {syncResult.procesados} procesados, {syncResult.nuevos} nuevos, {syncResult.actualizados} actualizados
            {syncResult.errores > 0 && `, ${syncResult.errores} con error`}
          </AlertDescription>
        </Alert>
      )}

      <div className={`flex items-center gap-2 text-sm px-3 py-2 border rounded-sm ${backendAvailable ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}>
        {backendAvailable
          ? <><CheckCircle2 className="w-4 h-4 shrink-0" /> Conectado al backend — datos en tiempo real</>
          : <><WifiOff className="w-4 h-4 shrink-0" /> Backend no disponible — mostrando datos de ejemplo</>
        }
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {[
          { label: "Total", value: stats.total, color: "text-foreground", accent: "border-l-2 border-l-slate-400" },
          { label: "Admins", value: stats.admins, color: "text-red-700", accent: "border-l-2 border-l-red-400" },
          { label: "Subgerentes", value: stats.subgerentes, color: "text-indigo-700", accent: "border-l-2 border-l-indigo-400" },
          { label: "Supervisores", value: stats.supervisors, color: "text-blue-700", accent: "border-l-2 border-l-blue-400" },
          { label: "Proveedores", value: stats.providers, color: "text-emerald-700", accent: "border-l-2 border-l-emerald-400" },
          { label: "Activos", value: stats.active, color: "text-emerald-700", accent: "border-l-2 border-l-emerald-400" },
          { label: "Inactivos", value: stats.inactive, color: "text-red-700", accent: "border-l-2 border-l-red-400" },
        ].map((s) => (
          <div key={s.label} className={`border rounded-sm bg-card px-4 py-3 flex flex-col justify-between ${s.accent}`}>
            <div className={`text-2xl font-semibold tabular-nums ${s.color}`}>{s.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filtros + Tabla */}
      <Card className="rounded-sm">
        <CardHeader className="pb-3 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1">
              <Input
                placeholder="Buscar por nombre, apellido o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm rounded-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">Rol:</span>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="w-44 rounded-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los roles</SelectItem>
                  <SelectItem value="admin">{ROL_LABEL.admin}</SelectItem>
                  <SelectItem value="subgerente">{ROL_LABEL.subgerente}</SelectItem>
                  <SelectItem value="supervisor">{ROL_LABEL.supervisor}</SelectItem>
                  <SelectItem value="provider">{ROL_LABEL.provider}</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground whitespace-nowrap">{filteredUsuarios.length} resultado{filteredUsuarios.length !== 1 ? "s" : ""}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-28 pl-6">ID</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Alta</TableHead>
                <TableHead className="text-right pr-6">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsuarios.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    No se encontraron usuarios con los filtros aplicados.
                  </TableCell>
                </TableRow>
              ) : filteredUsuarios.map((usuario) => {
                const usuarioConSync = usuario as Usuario & { sincronizadoDesdeGIS?: boolean }
                const displayId = typeof usuario._id === "string"
                  ? usuario._id.replace(/^supervisor_|^provider_/, "")
                  : usuario._id
                return (
                  <TableRow key={usuario._id}>
                    <TableCell className="font-mono text-xs text-muted-foreground pl-6">
                      <span className="flex items-center gap-1">
                        {displayId}
                        {usuarioConSync.sincronizadoDesdeGIS && (
                          <RefreshCw className="w-3 h-3 text-blue-500 shrink-0" title="Sincronizado desde GIS" />
                        )}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-sm">{usuario.nombre} {usuario.apellido}</div>
                      {usuario.cuit && <div className="text-xs text-muted-foreground">CUIT: {usuario.cuit}</div>}
                      {usuario.telefono && <div className="text-xs text-muted-foreground">Tel: {usuario.telefono}</div>}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{usuario.email || "—"}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium border rounded-sm ${roleBadgeClass(usuario.rol)}`}>
                        {ROL_LABEL[usuario.rol]}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center gap-1 text-xs font-medium ${usuario.activo ? "text-emerald-700" : "text-muted-foreground"}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${usuario.activo ? "bg-emerald-500" : "bg-gray-400"}`} />
                        {usuario.activo ? "Activo" : "Inactivo"}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(usuario.fechaCreacion).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" })}
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(usuario)} className="h-8 w-8 p-0">
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteUsuario(usuario._id)} className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50">
                          <Trash2 className="w-3.5 h-3.5" />
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
