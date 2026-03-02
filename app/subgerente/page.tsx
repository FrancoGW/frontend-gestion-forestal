"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/hooks/use-auth"
import { useSubgerenteData } from "@/hooks/use-subgerente-data"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Users, UserCheck, Building2, ClipboardList, AlertTriangle, LogIn } from "lucide-react"
import { diasHabilesDesde } from "@/utils/diasHabiles"

interface LoginLog {
  email: string
  rol?: string
  fecha: string
}

export default function SubgerentePage() {
  const { user } = useAuth()
  const { jefesDeArea, supervisores, proveedores, ordenes, avances, loading, error } = useSubgerenteData()
  const [loginLogs, setLoginLogs] = useState<LoginLog[]>([])
  const [loadingLogs, setLoadingLogs] = useState(false)

  const jdaEmails = useMemo(
    () => jefesDeArea?.map((j) => j.email).filter(Boolean) as string[],
    [jefesDeArea]
  )

  useEffect(() => {
    if (jdaEmails.length === 0) {
      setLoginLogs([])
      return
    }
    setLoadingLogs(true)
    fetch(`/api/login_logs?emails=${encodeURIComponent(jdaEmails.join(","))}`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.data && Array.isArray(data.data)) setLoginLogs(data.data)
        else setLoginLogs([])
      })
      .catch(() => setLoginLogs([]))
      .finally(() => setLoadingLogs(false))
  }, [jdaEmails.join(",")])

  const ultimoAccesoPorEmail = useMemo(() => {
    const map = new Map<string, LoginLog>()
    loginLogs.forEach((log) => {
      const email = (log.email || "").toLowerCase()
      const existing = map.get(email)
      if (!existing || new Date(log.fecha) > new Date(existing.fecha)) map.set(email, log)
    })
    return map
  }, [loginLogs])

  const DIAS_HABILES_ALERTA = 3

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  const sinJdasAsignados = !jefesDeArea?.length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Panel Subgerente</h1>
        <p className="text-gray-600 mt-1">
          Hola, {user?.nombre}. Vista consolidada de los jefes de área a tu cargo y su jerarquía.
        </p>
      </div>

      {sinJdasAsignados ? (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Aún no tenés jefes de área asignados. Un administrador debe asignarlos desde{" "}
            <strong>Admin → Usuarios</strong>: editar tu usuario (rol Subgerente) y marcar los JDAs a cargo.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          {/* Resumen */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <Users className="w-4 h-4 text-teal-600" />
                  Jefes de área
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-teal-700">{jefesDeArea.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-green-600" />
                  Supervisores
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-700">{supervisores.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-orange-600" />
                  Proveedores
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-700">{proveedores.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-blue-600" />
                  Avances
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-700">{avances.length}</div>
              </CardContent>
            </Card>
          </div>

          {/* Jerarquía: JDA > Supervisores > Proveedores */}
          <Card>
            <CardHeader>
              <CardTitle>Jerarquía a tu cargo</CardTitle>
              <CardDescription>
                Jefes de área asignados y sus supervisores. Los proveedores están vinculados vía órdenes y avances.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {jefesDeArea.map((jda) => {
                const supervisoresDelJda = supervisores.filter((s) => s.jdaId === Number(jda.id))
                return (
                  <div
                    key={jda.id}
                    className="border rounded-lg p-4 bg-gray-50/80 space-y-3"
                  >
                    <div className="font-semibold text-teal-800 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      {jda.nombre}
                      {jda.email && (
                        <span className="text-sm font-normal text-gray-500">({jda.email})</span>
                      )}
                    </div>
                    {supervisoresDelJda.length > 0 ? (
                      <div className="pl-6 space-y-1">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Supervisores ({supervisoresDelJda.length})
                        </p>
                        <ul className="list-disc list-inside text-sm text-gray-700 space-y-0.5">
                          {supervisoresDelJda.map((s) => (
                            <li key={s.id}>
                              {s.nombre}
                              {proveedores.filter((p) =>
                                avances.some(
                                  (av) => Number(av.supervisorId) === Number(s.id) && av.proveedorId === p.id
                                )
                              ).length > 0 && (
                                <span className="text-gray-500">
                                  {" "}
                                  —{" "}
                                  {
                                    proveedores.filter((p) =>
                                      avances.some(
                                        (av) =>
                                          Number(av.supervisorId) === Number(s.id) && av.proveedorId === p.id
                                      )
                                    ).length
                                  }{" "}
                                  proveedor(es)
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <p className="pl-6 text-sm text-gray-500">Sin supervisores asignados</p>
                    )}
                  </div>
                )
              })}
            </CardContent>
          </Card>

          {/* Accesos de jefes de área */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LogIn className="w-5 h-5 text-teal-600" />
                Accesos de jefes de área
              </CardTitle>
              <CardDescription>
                Registro de inicios de sesión. Se muestra alerta en rojo si no entraron en los últimos 3 días hábiles.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingLogs ? (
                <Skeleton className="h-24 w-full" />
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b">
                        <th className="text-left p-2 font-medium">Jefe de área</th>
                        <th className="text-left p-2 font-medium">Email</th>
                        <th className="text-left p-2 font-medium">Último acceso</th>
                        <th className="text-left p-2 font-medium">Días hábiles sin ingresar</th>
                        <th className="text-left p-2 font-medium">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {jefesDeArea.map((jda) => {
                        const lastLog = ultimoAccesoPorEmail.get((jda.email || "").toLowerCase())
                        const ultimaFecha = lastLog ? new Date(lastLog.fecha) : null
                        const diasHabiles = ultimaFecha != null ? diasHabilesDesde(ultimaFecha) : null
                        const sinIngresoReciente =
                          diasHabiles === null || diasHabiles > DIAS_HABILES_ALERTA
                        return (
                          <tr
                            key={jda.id}
                            className={`border-b last:border-0 ${
                              sinIngresoReciente ? "bg-red-50" : "hover:bg-gray-50/50"
                            }`}
                          >
                            <td className="p-2 font-medium">{jda.nombre}</td>
                            <td className="p-2 text-gray-600">{jda.email || "-"}</td>
                            <td className="p-2">
                              {ultimaFecha
                                ? ultimaFecha.toLocaleString("es-AR", {
                                    dateStyle: "short",
                                    timeStyle: "short",
                                  })
                                : "Nunca"}
                            </td>
                            <td className="p-2">
                              {diasHabiles !== null ? (
                                <span className={diasHabiles > DIAS_HABILES_ALERTA ? "font-semibold text-red-700" : ""}>
                                  {diasHabiles}
                                </span>
                              ) : (
                                <span className="font-semibold text-red-700">—</span>
                              )}
                            </td>
                            <td className="p-2">
                              {sinIngresoReciente ? (
                                <Badge variant="destructive" className="bg-red-600">
                                  Sin ingreso reciente
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="bg-green-100 text-green-800">
                                  OK
                                </Badge>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

        </>
      )}
    </div>
  )
}
