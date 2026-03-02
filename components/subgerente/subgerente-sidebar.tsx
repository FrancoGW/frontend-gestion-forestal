"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Home, LogOut, BarChart3 } from "lucide-react"

const navigation = [
  { name: "Inicio", href: "/subgerente", icon: Home },
  { name: "Avances", href: "/subgerente/avances", icon: BarChart3 },
]

export function SubgerenteSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [userName, setUserName] = useState("")

  useEffect(() => {
    const storedUser = sessionStorage.getItem("user")
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser)
        if (user.rol === "subgerente" && user.nombre) {
          setUserName(user.nombre)
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

  const getInitial = () => (userName ? userName.charAt(0).toUpperCase() : "S")
  const getDisplayName = () => {
    if (!userName) return "Subgerente"
    const firstName = userName.split(" ")[0]
    return firstName || userName
  }

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200">
      <div className="flex items-center h-16 px-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-teal-700 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-lg">{getInitial()}</span>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Hola, {getDisplayName()}</h1>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                isActive ? "bg-teal-700 text-white" : "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
              )}
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
          <LogOut className="w-5 h-5 mr-3" />
          Cerrar sesión
        </Button>
      </div>
    </div>
  )
}
