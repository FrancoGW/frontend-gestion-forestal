"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Lock, User } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import Image from "next/image"

export default function ProviderLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const { login, user, isAuthenticated } = useAuth()
  const router = useRouter()

  // Redirección automática si ya está autenticado
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log("🔄 Usuario ya autenticado, redirigiendo...")

      // Redirección según el rol
      switch (user.rol) {
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
          router.push("/")
      }
    }
  }, [isAuthenticated, user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    console.log("🚀 Iniciando proceso de login...")

    try {
      const result = await login(email, password)

      if (result.success && result.user) {
        console.log("✅ Login exitoso, redirigiendo...")

        // Redirección según el rol
        switch (result.user.rol) {
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
            router.push("/")
        }
      } else {
        setError(result.error || "Error al iniciar sesión")
      }
    } catch (err) {
      console.error("❌ Error en handleSubmit:", err)
      setError("Error inesperado al iniciar sesión")
    } finally {
      setIsLoading(false)
    }
  }

  const handleTestLogin = (testEmail: string, testPassword: string) => {
    setEmail(testEmail)
    setPassword(testPassword)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4">
          <div className="flex justify-center">
            <Image src="/logo-forestal.svg" alt="Forestal Argentina" width={200} height={80} className="h-16 w-auto" />
          </div>
          <div className="text-center">
            <CardTitle className="text-2xl font-bold text-green-800">Sistema de Órdenes de Trabajo</CardTitle>
            <CardDescription className="text-green-600">Acceso para Proveedores</CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="usuario@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Contraseña
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Iniciando Sesión...
                </>
              ) : (
                <>
                  <Lock className="mr-2 h-4 w-4" />
                  Iniciar Sesión
                </>
              )}
            </Button>
          </form>

          <div className="space-y-3">
            <p className="text-sm text-gray-600 text-center">Usuarios de prueba:</p>

            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-left justify-start bg-transparent"
                onClick={() => handleTestLogin("cecilia.pizzini@supervisor.com", "123")}
                disabled={isLoading}
              >
                👩‍💼 Supervisor: Cecilia Pizzini
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="w-full text-left justify-start bg-transparent"
                onClick={() => handleTestLogin("admin@sistema.com", "admin")}
                disabled={isLoading}
              >
                👨‍💻 Admin: Sistema
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="w-full text-left justify-start bg-transparent"
                onClick={() => handleTestLogin("contacto@kauffmann.com", "123")}
                disabled={isLoading}
              >
                🏢 Proveedor: Kauffmann
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
