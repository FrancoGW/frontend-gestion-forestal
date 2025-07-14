// Copiado y adaptado de components/supervisor/supervisor-sidebar.tsx
"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Home, Users, ClipboardList, TrendingUp, LogOut } from "lucide-react"

const navigation = [
  { name: "Dashboard", href: "/jda", icon: Home },
  { name: "Mis Supervisores", href: "/jda/supervisores", icon: Users },
  { name: "Órdenes de Trabajo", href: "/jda/ordenes", icon: ClipboardList },
]

export function JDASidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [jdaName, setJdaName] = useState("")

  useEffect(() => {
    // Get JDA name from sessionStorage
    const storedUser = sessionStorage.getItem("user")
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser)
        if ((user.rol === "jda" || user.rol === "supervisor") && user.nombre) {
          setJdaName(user.nombre)
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

  // Get first letter of JDA name for avatar
  const getInitial = () => {
    return jdaName ? jdaName.charAt(0).toUpperCase() : "J"
  }

  // Get display name - use first name if available, otherwise full name
  const getDisplayName = () => {
    if (!jdaName) return "Jefe de Área"
    const firstName = jdaName.split(" ")[0]
    return firstName || jdaName
  }

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200">
      {/* Header */}
      <div className="flex items-center h-16 px-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-green-700 rounded-full flex items-center justify-center">
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