"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { avancesTrabajoAPI } from "@/lib/api-client"
import { useProviders } from "@/hooks/use-providers"
import { Skeleton } from "@/components/ui/skeleton"
import { CalendarIcon, SearchIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export function ProviderProgressTable() {
  const [avances, setAvances] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { providers, loading: loadingProviders } = useProviders()

  // Filtros
  const [selectedProvider, setSelectedProvider] = useState("todos")
  const [searchTerm, setSearchTerm] = useState("")
  const [dateRange, setDateRange] = useState({ from: null, to: null })

  useEffect(() => {
    const fetchAvances = async () => {
      setLoading(true)
      try {
        const data = await avancesTrabajoAPI.getAll()
        console.log("Avances obtenidos:", data)

        // Normalizar la estructura de datos
        let avancesData = []
        if (Array.isArray(data)) {
          avancesData = data
        } else if (data.avances && Array.isArray(data.avances)) {
          avancesData = data.avances
        } else if (data.data && Array.isArray(data.data)) {
          avancesData = data.data
        }

        setAvances(avancesData)
      } catch (err) {
        console.error("Error al obtener avances:", err)
        setError("No se pudieron cargar los avances")
      } finally {
        setLoading(false)
      }
    }

    fetchAvances()
  }, [])

  // Filtrar avances según los criterios seleccionados
  const filteredAvances = avances.filter((avance) => {
    // Filtro por proveedor
    if (selectedProvider !== "todos" && avance.proveedorId !== selectedProvider) {
      return false
    }

    // Filtro por término de búsqueda (en descripción o actividad)
    if (
      searchTerm &&
      !(
        avance.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        avance.actividad?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        avance.ordenTrabajoId?.toString().includes(searchTerm)
      )
    ) {
      return false
    }

    // Filtro por rango de fechas
    if (dateRange.from || dateRange.to) {
      const avanceDate = new Date(avance.fecha)

      if (dateRange.from && avanceDate < dateRange.from) {
        return false
      }

      if (dateRange.to) {
        const toDateEnd = new Date(dateRange.to)
        toDateEnd.setHours(23, 59, 59, 999)
        if (avanceDate > toDateEnd) {
          return false
        }
      }
    }

    return true
  })

  // Encontrar el nombre del proveedor por ID
  const getProviderName = (providerId) => {
    const provider = providers.find((p) => p.id === providerId)
    return provider ? provider.nombre : `Proveedor ${providerId}`
  }

  // Formatear fecha
  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: es })
    } catch (e) {
      return dateString || "Fecha no disponible"
    }
  }

  // Limpiar filtros
  const clearFilters = () => {
    setSelectedProvider("todos")
    setSearchTerm("")
    setDateRange({ from: null, to: null })
  }

  if (loading || loadingProviders) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cargando avances de proveedores...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">{error}</p>
          <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
            Reintentar
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Avances por Proveedor</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por descripción o actividad..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="w-full md:w-64">
            <Select value={selectedProvider} onValueChange={setSelectedProvider}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por proveedor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los proveedores</SelectItem>
                {providers.map((provider) => (
                  <SelectItem key={provider.id} value={provider.id}>
                    {provider.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full md:w-64">
            <DatePicker
              selected={dateRange}
              onSelect={setDateRange}
              locale={es}
              showOutsideDays
              mode="range"
              numberOfMonths={1}
              className="w-full"
            >
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "dd/MM/yyyy")} - {format(dateRange.to, "dd/MM/yyyy")}
                    </>
                  ) : (
                    format(dateRange.from, "dd/MM/yyyy")
                  )
                ) : (
                  "Seleccionar fechas"
                )}
              </Button>
            </DatePicker>
          </div>

          <Button variant="ghost" onClick={clearFilters} className="w-full md:w-auto">
            Limpiar filtros
          </Button>
        </div>

        {filteredAvances.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No se encontraron avances con los filtros seleccionados
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Orden ID</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Actividad</TableHead>
                  <TableHead>Avance</TableHead>
                  <TableHead>Descripción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAvances.map((avance, index) => (
                  <TableRow key={avance._id || index}>
                    <TableCell>
                      <Badge variant="outline">{avance.ordenTrabajoId || "N/A"}</Badge>
                    </TableCell>
                    <TableCell>{getProviderName(avance.proveedorId)}</TableCell>
                    <TableCell>{formatDate(avance.fecha)}</TableCell>
                    <TableCell>{avance.actividad || "No especificada"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{avance.porcentaje || 0}%</Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{avance.descripcion || "Sin descripción"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="mt-4 text-sm text-muted-foreground">
          Mostrando {filteredAvances.length} de {avances.length} avances
        </div>
      </CardContent>
    </Card>
  )
}
