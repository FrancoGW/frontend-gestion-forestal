"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Home, Users, ClipboardList, TrendingUp, LogOut, FileText } from "lucide-react"

const navigation = [
  { name: "Dashboard", href: "/supervisor", icon: Home },
  { name: "Mis Proveedores", href: "/supervisor/proveedores", icon: Users },
  { name: "Órdenes de Trabajo", href: "/supervisor/ordenes", icon: ClipboardList },
  { name: "Informes de Avances", href: "/supervisor/informes", icon: FileText },
]

export function SupervisorSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [supervisorName, setSupervisorName] = useState("")

  useEffect(() => {
    // Get supervisor name from sessionStorage
    const storedUser = sessionStorage.getItem("user")
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser)
        if ((user.rol === "supervisor" || user.rol === "jda") && user.nombre) {
          setSupervisorName(user.nombre)
        }
      } catch (error) {
        console.error("Error parsing user data:", error)
      }
    }
  }, [])

  const handleLogout = () => {
    sessionStorage.clear()
    router.push("/login")
  }

  // Get first letter of supervisor name for avatar
  const getInitial = () => {
    return supervisorName ? supervisorName.charAt(0).toUpperCase() : "S"
  }

  // Get display name - use first name if available, otherwise full name
  const getDisplayName = () => {
    if (!supervisorName) return "Supervisor"

    // If the name contains spaces, use only the first name
    const firstName = supervisorName.split(" ")[0]
    return firstName || supervisorName
  }

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200">
      {/* Header */}
      <div className="flex items-center h-16 px-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-lg">{getInitial()}</span>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Hola, {getDisplayName()}</h1>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                isActive ? "bg-gray-900 text-white" : "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
              )}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start text-gray-700 hover:bg-gray-100 py-3"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Cerrar Sesión
        </Button>
      </div>
    </div>
  )
}
