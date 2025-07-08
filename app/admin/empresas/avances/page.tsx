"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft, Search, X, FileDown } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useProviders } from "@/hooks/use-providers"
import { avancesTrabajoAPI } from "@/lib/api-client"

// Tipo para los avances de trabajo
interface AvanceTrabajo {
  _id: string
  ordenTrabajoId: string | number
  proveedorId: string | number
  fecha: string
  descripcion?: string
  porcentaje?: number
  superficie?: number
  cantidadPlantas?: number
  cantPersonal?: number
  jornada?: number
  observaciones?: string
  usuario?: string
  predio?: string
  rodal?: string
  actividad?: string
  fechaRegistro?: string
  ultimaActualizacion?: string
}

export default function AvancesProveedoresPage() {
  const router = useRouter()
  const [avances, setAvances] = useState<AvanceTrabajo[]>([])
  const [filteredAvances, setFilteredAvances] = useState<AvanceTrabajo[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedProveedor, setSelectedProveedor] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { providers, loading: loadingProviders } = useProviders()

  // Cargar avances de trabajo
  useEffect(() => {
    const fetchAvances = async () => {
      try {
        setIsLoading(true)
        const avancesData = await avancesTrabajoAPI.getAll()
        console.log("Avances obtenidos:", avancesData)

        // Verificar la estructura de la respuesta
        const avancesArray = Array.isArray(avancesData) ? avancesData : avancesData?.data || []

        if (!avancesArray || avancesArray.length === 0) {
          setAvances([])
          setFilteredAvances([])
          setIsLoading(false)
          return
        }

        // Ordenar por fecha de registro (más reciente primero)
        const avancesOrdenados = [...avancesArray].sort((a, b) => {
          const fechaA = a.fechaRegistro || a.fecha || ""
          const fechaB = b.fechaRegistro || b.fecha || ""
          return new Date(fechaB).getTime() - new Date(fechaA).getTime()
        })

        setAvances(avancesOrdenados)
        setFilteredAvances(avancesOrdenados)
      } catch (err) {
        console.error("Error al cargar avances:", err)
        setError("Error al cargar los avances de trabajo")
      } finally {
        setIsLoading(false)
      }
    }

    fetchAvances()
  }, [])

  // Filtrar avances cuando cambian los criterios de búsqueda
  useEffect(() => {
    if (avances.length === 0) return

    let filtered = [...avances]

    // Filtrar por término de búsqueda
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (avance) =>
          (avance.descripcion && avance.descripcion.toLowerCase().includes(searchLower)) ||
          (avance.actividad && avance.actividad.toLowerCase().includes(searchLower)) ||
          (avance.ordenTrabajoId && avance.ordenTrabajoId.toString().includes(searchLower)) ||
          (avance.predio && avance.predio.toLowerCase().includes(searchLower)) ||
          (avance.rodal && avance.rodal.toLowerCase().includes(searchLower)),
      )
    }

    // Filtrar por proveedor
    if (selectedProveedor && selectedProveedor !== "todos") {
      filtered = filtered.filter((avance) => {
        return avance.proveedorId.toString() === selectedProveedor
      })
    }

    setFilteredAvances(filtered)
  }, [searchTerm, selectedProveedor, avances])

  // Limpiar filtros
  const handleClearFilters = () => {
    setSearchTerm("")
    setSelectedProveedor("")
  }

  // Formatear fecha
  const formatDate = (dateString: string) => {
    if (!dateString) return "Fecha no disponible"

    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: es })
    } catch (error) {
      console.warn("Error al formatear fecha:", dateString, error)
      return dateString
    }
  }

  // Obtener nombre del proveedor
  const getProviderName = (avance: AvanceTrabajo) => {
    // Si el avance tiene usuario, usarlo directamente
    if (avance.usuario) {
      return avance.usuario
    }

    // Buscar en providers por ID
    if (avance.proveedorId) {
      const provider = providers?.find(
        (p) =>
          p._id === avance.proveedorId ||
          p.id === avance.proveedorId ||
          p._id?.toString() === avance.proveedorId.toString() ||
          p.id?.toString() === avance.proveedorId.toString(),
      )

      if (provider) {
        return provider.empresa || provider.nombre || `Proveedor ${avance.proveedorId}`
      }
    }

    return `Proveedor ${avance.proveedorId}`
  }

  // Obtener porcentaje de avance
  const getAvancePercent = (avance: AvanceTrabajo) => {
    return avance.porcentaje !== undefined ? avance.porcentaje : 0
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Avances de Proveedores</h2>
          <p className="text-muted-foreground">Visualización de avances reportados por los proveedores</p>
        </div>
        <Button variant="outline" onClick={() => router.push("/admin/empresas")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a Empresas
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por descripción, actividad o ID de orden..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  className="absolute right-0 top-0 h-9 w-9 p-0"
                  onClick={() => setSearchTerm("")}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Limpiar búsqueda</span>
                </Button>
              )}
            </div>
            <div className="w-full md:w-[200px]">
              <Select value={selectedProveedor} onValueChange={setSelectedProveedor}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por proveedor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los proveedores</SelectItem>
                  {!loadingProviders &&
                    providers?.map((proveedor) => (
                      <SelectItem
                        key={proveedor._id || proveedor.id}
                        value={proveedor._id?.toString() || proveedor.id?.toString()}
                      >
                        {proveedor.empresa || proveedor.nombre}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={handleClearFilters}>
              Limpiar filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Avances Registrados</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {filteredAvances.length} resultado{filteredAvances.length !== 1 ? "s" : ""}
              </Badge>
              <Button variant="outline" size="sm" className="h-8">
                <FileDown className="mr-2 h-4 w-4" />
                Exportar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="flex h-[300px] items-center justify-center">
              <p className="text-center text-muted-foreground">{error}</p>
            </div>
          ) : filteredAvances.length === 0 ? (
            <div className="flex h-[300px] items-center justify-center">
              <p className="text-center text-muted-foreground">
                No se encontraron avances que coincidan con los criterios de búsqueda
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID Orden</TableHead>
                    <TableHead>Proveedor</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Actividad</TableHead>
                    <TableHead>Avance</TableHead>
                    <TableHead>Descripción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAvances.map((avance) => (
                    <TableRow key={avance._id}>
                      <TableCell>
                        <Badge variant="outline">{avance.ordenTrabajoId}</Badge>
                      </TableCell>
                      <TableCell>{getProviderName(avance)}</TableCell>
                      <TableCell>{formatDate(avance.fecha)}</TableCell>
                      <TableCell>{avance.actividad || "No especificada"}</TableCell>
                      <TableCell>
                        <Badge
                          variant={getAvancePercent(avance) >= 100 ? "success" : "secondary"}
                          className={getAvancePercent(avance) >= 100 ? "bg-green-100 text-green-800" : ""}
                        >
                          {getAvancePercent(avance)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[300px] truncate">
                        {avance.observaciones || "Sin descripción"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
