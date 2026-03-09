"use client"

import type React from "react"
import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import {
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

export function AdminSidebar({ children }: { children?: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isOtrosOpen, setIsOtrosOpen] = useState(false)

  const handleLogout = () => {
    sessionStorage.removeItem("user")
    router.push("/login")
  }

  const isActive = (path: string) => {
    if (path === "/admin") return pathname === "/admin"
    return pathname === path || pathname.startsWith(path + "/")
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
  ]

  const hasActiveOtros = otrosNavItems.some(({ href }) => isActive(href))

  return (
    <>
      {/* Fixed Sidebar */}
      <div className="fixed left-0 top-0 w-60 h-screen bg-card border-r border-border flex flex-col z-50">
        {/* Header */}
        <div className="px-4 py-4 border-b border-border flex-shrink-0">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">
            Panel de Gestión
          </p>
          <h2 className="text-sm font-semibold text-foreground">Forestal</h2>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          <div className="space-y-0.5">
            {mainNavItems.map(({ href, label, icon: Icon }) => {
              const active = isActive(href)
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2.5 px-3 py-2 text-sm rounded-sm transition-colors w-full ${
                    active
                      ? "bg-primary/10 text-primary font-medium border-l-2 border-primary pl-[10px]"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{label}</span>
                </Link>
              )
            })}

            {/* Separator */}
            <div className="my-2 border-t border-border" />

            {/* Dropdown "Otros" */}
            <div>
              <button
                onClick={() => setIsOtrosOpen(!isOtrosOpen)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-sm transition-colors text-left ${
                  hasActiveOtros
                    ? "bg-primary/10 text-primary font-medium border-l-2 border-primary pl-[10px]"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <MoreHorizontal className="h-4 w-4 flex-shrink-0" />
                <span className="flex-1 truncate">Otros</span>
                {isOtrosOpen
                  ? <ChevronDown className="h-3.5 w-3.5 flex-shrink-0" />
                  : <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" />
                }
              </button>

              {isOtrosOpen && (
                <div className="mt-0.5 ml-4 pl-3 border-l border-border space-y-0.5">
                  {otrosNavItems.map(({ href, label, icon: Icon }) => {
                    const active = isActive(href)
                    return (
                      <Link
                        key={href}
                        href={href}
                        className={`flex items-center gap-2 px-2 py-1.5 text-xs rounded-sm transition-colors ${
                          active
                            ? "text-primary font-medium"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="truncate">{label}</span>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </nav>

        {/* Footer */}
        <div className="px-3 py-3 border-t border-border flex-shrink-0">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-sm transition-colors"
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-60 min-h-screen bg-background">
        <div className="p-6">{children}</div>
      </div>
    </>
  )
}
