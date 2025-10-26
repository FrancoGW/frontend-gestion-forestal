"use client"

import type React from "react"
import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import {
  BarChart3,
  Home,
  LogOut,
  Package,
  Users,
  FileText,
  Activity,
  Map,
  User,
  Building,
  Leaf,
  Layers,
  Droplet,
  UserIcon as UserGroup,
  TrendingUp,
  UserCheck,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  Beaker,
  UserPlus,
} from "lucide-react"

import { Button } from "@/components/ui/button"

/**
 * Admin navigation sidebar - Completely fixed position
 */
export function AdminSidebar({ children }: { children?: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isOtrosOpen, setIsOtrosOpen] = useState(false)

  const handleLogout = () => {
    sessionStorage.removeItem("user")
    router.push("/login")
  }

  /** Returns true when the supplied href should be considered "active" */
  const isActive = (path: string) => {
    if (path === "/admin") return pathname === "/admin"
    return pathname.startsWith(path)
  }

  const mainNavItems = [
    { href: "/admin", label: "Dashboard", icon: Home },
    { href: "/admin/usuarios", label: "Usuarios", icon: User },
    { href: "/admin/supervisores", label: "Supervisores", icon: UserCheck },
    { href: "/admin/ordenes", label: "Órdenes de Trabajo", icon: FileText },
    { href: "/admin/avances", label: "Avances", icon: TrendingUp },
    { href: "/admin/empresas", label: "Empresas / Proveedores", icon: Building },
    { href: "/admin/propietarios", label: "Propietarios", icon: Users },
  ]

  const otrosNavItems = [
    { href: "/admin/actividades", label: "Actividades", icon: Activity },
    { href: "/admin/sub-actividades", label: "Sub Actividades", icon: Activity },
    { href: "/admin/plantillas", label: "Plantillas", icon: Layers },
    { href: "/admin/cuadrillas", label: "Cuadrillas", icon: UserGroup },
    { href: "/admin/zonas", label: "Zonas", icon: Map },
    { href: "/admin/campos", label: "Campos", icon: Map },
    { href: "/admin/tipos-uso", label: "Tipos de Uso", icon: Layers },
    { href: "/admin/especies", label: "Especies", icon: Leaf },
    { href: "/admin/viveros", label: "Viveros", icon: Building },
    { href: "/admin/ambientales", label: "Aspectos Ambientales", icon: Droplet },
    { href: "/admin/insumos", label: "Insumos", icon: Package },
    { href: "/admin/malezas-productos", label: "Malezas Productos", icon: Beaker },
    { href: "/admin/vecinos", label: "Vecinos", icon: UserPlus },
    { href: "/admin/estadisticas", label: "Estadísticas", icon: BarChart3 },
  ]

  return (
    <>
      {/* Fixed Sidebar */}
      <div className="fixed left-0 top-0 w-64 h-screen bg-card border-r border-border flex flex-col z-50">
        {/* Fixed Header */}
        <div className="p-4 border-b border-border flex-shrink-0">
          <h2 className="text-xl font-bold text-foreground">Admin Panel</h2>
        </div>

        {/* Scrollable Navigation */}
        <div className="flex-1 overflow-y-auto p-2">
          <div className="space-y-1">
            {mainNavItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors w-full ${
                  isActive(href)
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span className="truncate">{label}</span>
              </Link>
            ))}

            {/* Dropdown "Otros" */}
            <div className="space-y-1">
              <button
                onClick={() => setIsOtrosOpen(!isOtrosOpen)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-left ${
                  otrosNavItems.some(({ href }) => isActive(href))
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                <MoreHorizontal className="h-5 w-5 flex-shrink-0" />
                <span className="truncate flex-1">Otros</span>
                {isOtrosOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>

              {isOtrosOpen && (
                <div className="ml-6 space-y-1">
                  {otrosNavItems.map(({ href, label, icon: Icon }) => (
                    <Link
                      key={href}
                      href={href}
                      className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                        isActive(href)
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate text-sm">{label}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="p-4 border-t border-border flex-shrink-0">
          <Button variant="outline" className="w-full justify-start gap-2 bg-transparent" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
            Cerrar Sesión
          </Button>
        </div>
      </div>

      {/* Main Content with left margin to account for fixed sidebar */}
      <div className="ml-64 min-h-screen bg-background">
        <div className="p-6">{children}</div>
      </div>
    </>
  )
}
