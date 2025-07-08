"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Lock, Database, HardDrive } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import Image from "next/image"

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [authSource, setAuthSource] = useState<"database" | "local" | null>(null)
  const { login, error } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setAuthSource(null)

    try {
      const success = await login(email, password)
      if (success) {
        // Determinar la fuente de autenticación basándose en si hay error de red
        setAuthSource(error ? "local" : "database")

        // Redirigir según el rol del usuario
        const userData = JSON.parse(sessionStorage.getItem("user") || "{}")
        const userRole = userData.rol

        console.log("🎯 Redirigiendo usuario con rol:", userRole)

        switch (userRole) {
          case "admin":
            router.push("/admin")
            break
          case "supervisor":
            router.push("/supervisor")
            break
          case "provider":
            router.push("/proveedor")
            break
          default:
            router.push("/admin")
        }
      }
    } catch (err) {
      console.error("Error en login:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const fillCredentials = (userEmail: string, userPassword: string) => {
    setEmail(userEmail)
    setPassword(userPassword)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex justify-center pb-2">
          <div className="w-64 h-24 relative">
            <Image src="/logo-forestal.svg" alt="Logo Forestal Argentina" fill className="object-contain" priority />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="usuario@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {authSource && (
              <Alert>
                <div className="flex items-center gap-2">
                  {authSource === "database" ? (
                    <Database className="w-4 h-4 text-green-600" />
                  ) : (
                    <HardDrive className="w-4 h-4 text-blue-600" />
                  )}
                  <AlertDescription>
                    {authSource === "database"
                      ? "✅ Autenticado con base de datos"
                      : "⚠️ Autenticado con datos locales (backend no disponible)"}
                  </AlertDescription>
                </div>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                <>
                  <Lock className="mr-2 h-4 w-4" />
                  Iniciar Sesión
                </>
              )}
            </Button>
          </form>

          <div className="space-y-2">
            <p className="text-sm text-gray-600 text-center">Usuarios de prueba:</p>
            <div className="grid grid-cols-1 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fillCredentials("cecilia.pizzini@supervisor.com", "123")}
                disabled={isLoading}
                className="text-xs"
              >
                👩‍💼 Supervisor: Cecilia Pizzini
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fillCredentials("alejandro.wayer@supervisor.com", "123")}
                disabled={isLoading}
                className="text-xs"
              >
                👨‍💼 Supervisor: Alejandro Wayer
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fillCredentials("diego.nonino@supervisor.com", "123")}
                disabled={isLoading}
                className="text-xs"
              >
                👨‍💼 Supervisor: Diego Nonino
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fillCredentials("martin.alvarez@supervisor.com", "123")}
                disabled={isLoading}
                className="text-xs"
              >
                👨‍💼 Supervisor: Martín Álvarez
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fillCredentials("admin@sistema.com", "admin")}
                disabled={isLoading}
                className="text-xs"
              >
                👨‍💻 Admin: Sistema
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fillCredentials("contacto@kauffmann.com", "123")}
                disabled={isLoading}
                className="text-xs"
              >
                🏢 Proveedor: Kauffmann
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fillCredentials("contacto@wisefor.com", "123")}
                disabled={isLoading}
                className="text-xs"
              >
                🏢 Proveedor: WISEFOR
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fillCredentials("contacto@logistica.com", "123")}
                disabled={isLoading}
                className="text-xs"
              >
                🏢 Proveedor: Logística
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fillCredentials("contacto@forestadorauruguay.com", "123")}
                disabled={isLoading}
                className="text-xs"
              >
                🏢 Proveedor: Forestadora Uruguay
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fillCredentials("contacto@elombu.com", "123")}
                disabled={isLoading}
                className="text-xs"
              >
                🏢 Proveedor: El Ombu
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fillCredentials("contacto@arroser.com", "123")}
                disabled={isLoading}
                className="text-xs"
              >
                🏢 Proveedor: Arroser
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
