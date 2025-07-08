"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { useQuery } from "convex/react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useParams } from "next/navigation"
import { TestTube } from "lucide-react"
import { capitalizeFirstLetter, formatHectareas } from "@/lib/utils"
import { useState, useEffect } from "react"

interface Avance {
  _id: Id<"avances">
  fecha: string
  predio: string
  rodal: string
  rodalEnsayo: boolean
  hectareas: number
  descripcion: string
  imagenes: string[]
}

const generateShortId = (id: Id<"avances">) => {
  return id.slice(-5)
}

const Page = () => {
  const params = useParams()
  const providerId = params.providerId as Id<"proveedores">
  const ordenId = params.ordenId as Id<"ordenes">

  const avances = useQuery(api.avances.getByOrdenId, { ordenId })

  const [rodalesData, setRodalesData] = useState<{ [key: string]: number }>({})

  useEffect(() => {
    const fetchRodalesData = async () => {
      try {
        const data = await api.rodales.getRodalesWithHectares()
        setRodalesData(data)
      } catch (error) {
        console.error("Error fetching rodales data:", error)
      }
    }

    fetchRodalesData()
  }, [])

  const getRodalHectares = (rodalName: string) => {
    return rodalesData[rodalName] || 0
  }

  if (!avances) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-[200px]" />
        <Separator />
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <CardTitle>
                  <Skeleton className="h-6 w-full" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-[70%]" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Avances</h2>
          <p className="text-muted-foreground">Listado de avances para la orden {ordenId.slice(-5)}</p>
        </div>
        <Button>Agregar Avance</Button>
      </div>
      <Separator />
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {avances.map((avance: Avance) => (
          <Card key={avance._id}>
            <CardHeader>
              <CardTitle>{format(new Date(avance.fecha), "PPP", { locale: es })}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm text-muted-foreground mb-2">ID: {generateShortId(avance._id)}</div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-muted-foreground">Predio:</span>
                  <p className="font-medium">{capitalizeFirstLetter(avance.predio) || "Sin especificar"}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Rodal:</span>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{capitalizeFirstLetter(avance.rodal) || "Sin especificar"}</p>
                    {avance.rodalEnsayo && (
                      <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800">
                        <TestTube className="h-3 w-3 mr-1" />
                        Ensayo
                      </Badge>
                    )}
                  </div>
                  {getRodalHectares(avance.rodal) > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Disponibles: {formatHectareas(getRodalHectares(avance.rodal))} ha
                    </p>
                  )}
                </div>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Descripción:</span>
                <p className="font-medium">{avance.descripcion || "Sin especificar"}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default Page
