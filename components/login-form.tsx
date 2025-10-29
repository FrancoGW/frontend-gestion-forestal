"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, User, Mail, Lock, Database, HardDrive } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"

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
          case "jda":
            router.push("/jda")
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



  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-green-100 to-emerald-200 p-4 relative overflow-hidden">
      {/* Elementos decorativos de fondo */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-green-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-96 h-96 bg-green-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>

      {/* Contenedor principal con efecto glassmorphism */}
      <div className="relative w-full max-w-md">
        {/* Icono de usuario flotante */}
        <div className="flex justify-center mb-[-40px] relative z-10">
          <div className="w-20 h-20 bg-gradient-to-br from-green-600 to-green-700 rounded-full flex items-center justify-center shadow-2xl border-4 border-white/50">
            <User className="w-10 h-10 text-white" />
          </div>
        </div>

        {/* Panel de login con glassmorphism */}
        <div className="backdrop-blur-xl bg-white/70 rounded-3xl shadow-2xl p-8 pt-16 border border-white/40">
          {/* Título */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-green-800 mb-2">Sistema Forestal</h1>
            <p className="text-green-600 text-sm">Bienvenido de vuelta</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Campo Email */}
            <div className="space-y-2">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/80 z-10" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="pl-12 h-12 bg-green-700/80 border-green-600/50 text-white placeholder:text-white/60 focus:bg-green-700 focus:border-green-500 transition-all rounded-xl"
                />
              </div>
            </div>

            {/* Campo Contraseña */}
            <div className="space-y-2">
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/80 z-10" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="pl-12 h-12 bg-green-700/80 border-green-600/50 text-white placeholder:text-white/60 focus:bg-green-700 focus:border-green-500 transition-all rounded-xl"
                />
              </div>
            </div>

            {/* Remember me */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="remember"
                className="w-4 h-4 text-green-600 bg-green-100 border-green-300 rounded focus:ring-green-500 focus:ring-2"
              />
              <label htmlFor="remember" className="ml-2 text-sm text-green-700 cursor-pointer">
                Recordarme
              </label>
            </div>

            {/* Mensajes de error */}
            {error && (
              <Alert variant="destructive" className="rounded-xl">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Mensaje de fuente de autenticación */}
            {authSource && (
              <Alert className="rounded-xl border-green-200 bg-green-50/50">
                <div className="flex items-center gap-2">
                  {authSource === "database" ? (
                    <Database className="w-4 h-4 text-green-600" />
                  ) : (
                    <HardDrive className="w-4 h-4 text-amber-600" />
                  )}
                  <AlertDescription className="text-sm">
                    {authSource === "database"
                      ? "✅ Autenticado con base de datos"
                      : "⚠️ Autenticado con datos locales"}
                  </AlertDescription>
                </div>
              </Alert>
            )}

            {/* Botón de login */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 mt-6"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                "LOGIN"
              )}
            </Button>
          </form>
        </div>
      </div>

      {/* Estilos para animaciones de blob */}
      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  )
}
