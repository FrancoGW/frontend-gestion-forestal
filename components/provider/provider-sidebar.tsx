"use client"

import { useAuth } from "@/hooks/use-auth"
import { useProviderProfile } from "@/hooks/use-provider-profile"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Home, FileText, TrendingUp, User, LogOut, FileX } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

const navigation = [
  {
    name: "Inicio",
    href: "/proveedor",
    icon: Home,
  },
  {
    name: "Mis Órdenes",
    href: "/proveedor/ordenes",
    icon: FileText,
  },
  {
    name: "Sin Órdenes",
    href: "/proveedor/sin-ordenes",
    icon: FileX,
  },
  {
    name: "Avances",
    href: "/proveedor/avances",
    icon: TrendingUp,
  },
  {
    name: "Mi Perfil",
    href: "/proveedor/perfil",
    icon: User,
  },
]

export function ProviderSidebar() {
  const { user, logout } = useAuth()
  const { profile, loading: profileLoading } = useProviderProfile()
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    await logout()
    router.push("/login") // Changed from "/proveedor/login" to "/login"
  }

  // Determinar el nombre del proveedor con prioridad
  const getProviderName = () => {
    if (profileLoading) return "Cargando..."

    // Prioridad: profile.nombre > user.nombre > user.email > fallback
    if (profile?.nombre) return profile.nombre
    if (user?.nombre) return user.nombre
    if (user?.email) return user.email
    return "Proveedor"
  }

  // Calcular iniciales del nombre
  const getInitials = (name: string) => {
    if (name === "Cargando..." || name === "Proveedor") return "P"

    const words = name.split(" ").filter((word) => word.length > 0)
    if (words.length === 0) return "P"
    if (words.length === 1) return words[0].charAt(0).toUpperCase()

    // Tomar primera letra de las primeras dos palabras
    return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase()
  }

  const providerName = getProviderName()
  const initials = getInitials(providerName)

  // Truncar nombre si es muy largo
  const displayName = providerName.length > 20 ? `${providerName.substring(0, 17)}...` : providerName

  return (
    <div className="w-64 h-full flex-shrink-0 bg-white border-r border-gray-200">
      {/* Header con información del proveedor */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-200">
        <Avatar className="h-10 w-10">
          <AvatarFallback className="bg-green-500 text-white font-semibold">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">Hola, {displayName}</p>
          {profile?.descripcion && <p className="text-xs text-gray-500 truncate">{profile.descripcion}</p>}
        </div>
      </div>

      {/* Navegación */}
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive ? "bg-gray-900 text-white" : "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Footer con botón de logout */}
      <div className="border-t border-gray-200 p-4">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Cerrar Sesión
        </Button>
      </div>
    </div>
  )
}
