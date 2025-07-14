"use client"

import { useJdaData } from "@/hooks/use-jda-data"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Calendar, TrendingUp } from "lucide-react"

export default function JdaSupervisoresPage() {
  const { jda, loading, error } = useJdaData()

  if (loading) return <div>Cargando supervisores...</div>
  if (error) return <div>Error: {error}</div>

  const supervisores = jda?.supervisoresAsignados || []

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Mis Supervisores</h1>
          <p className="text-muted-foreground">
            Jefe de Área: {jda?.nombre || "-"} | Gestión y seguimiento de supervisores asignados
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Supervisores</p>
                <p className="text-2xl font-bold">{supervisores.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Activos</p>
                <p className="text-2xl font-bold">{supervisores.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Supervisores */}
      <div className="space-y-4">
        {supervisores.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <h3 className="text-lg font-semibold mb-2">No hay supervisores asignados</h3>
              <p className="text-muted-foreground">Aún no tienes supervisores asignados.</p>
            </CardContent>
          </Card>
        ) : (
          supervisores.map((sup: any) => (
            <Card key={sup.supervisorId} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{sup.nombre}</CardTitle>
                    <CardDescription className="flex items-center gap-4 mt-1">
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {sup.nombre}
                      </span>
                      {sup.fechaAsignacion && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(sup.fechaAsignacion).toLocaleDateString()}
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                      Activo
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Aquí puedes agregar más info o acciones si lo deseas */}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
