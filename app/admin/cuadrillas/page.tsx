"use client"

import { useState } from "react"
import { useCuadrillas } from "@/hooks/use-cuadrillas"
import { useProviders } from "@/hooks/use-providers"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Plus, Users, Trash2, Search, RefreshCw, AlertTriangle } from "lucide-react"
import { toast } from "@/hooks/use-toast"

export default function CuadrillasPage() {
  const {
    cuadrillas,
    isLoading: cuadrillasLoading,
    isError: cuadrillasError,
    addCuadrilla,
    deleteCuadrilla,
    reloadCuadrillas,
  } = useCuadrillas()
  const { providers, loading: providersLoading, error: providersError } = useProviders()
  const [searchTerm, setSearchTerm] = useState("")
  const [newCuadrillaName, setNewCuadrillaName] = useState("")
  const [selectedProviderId, setSelectedProviderId] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isReloading, setIsReloading] = useState(false)

  // Estados para el diálogo de confirmación de eliminación
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [cuadrillaToDelete, setCuadrillaToDelete] = useState<string | null>(null)
  const [cuadrillaNameToDelete, setCuadrillaNameToDelete] = useState<string>("")

  const isLoading = cuadrillasLoading || providersLoading
  const isError = cuadrillasError || !!providersError


  // Filtrar proveedores según el término de búsqueda
  const filteredProviders = providers.filter((provider) => {
    const matchesSearch = provider.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const handleAddCuadrilla = async () => {
    if (!newCuadrillaName.trim() || !selectedProviderId) {
      toast({
        title: "Error",
        description: "Por favor ingrese un nombre para la cuadrilla y seleccione un proveedor",
        variant: "destructive",
      })
      return
    }

    const provider = providers.find((p) => String(p.id) === selectedProviderId)

    try {
      await addCuadrilla({
        nombre: newCuadrillaName,
        proveedorId: selectedProviderId,
        proveedorNombre: provider?.nombre || "Proveedor Desconocido",
        activa: true,
      })

      // Limpiar el formulario
      setNewCuadrillaName("")
      setSelectedProviderId("")
      setIsDialogOpen(false)

      // No es necesario recargar toda la página, ya que el hook useCuadrillas
      // ya actualizó el estado local con la nueva cuadrilla
    } catch (error) {
      console.error("Error al crear cuadrilla:", error)
    }
  }

  // Función para abrir el diálogo de confirmación de eliminación
  const openDeleteDialog = (id: string, nombre: string) => {
    setCuadrillaToDelete(id)
    setCuadrillaNameToDelete(nombre)
    setIsDeleteDialogOpen(true)
  }

  // Función para confirmar la eliminación
  const confirmDelete = async () => {
    if (cuadrillaToDelete) {
      try {
        await deleteCuadrilla(cuadrillaToDelete)
        setIsDeleteDialogOpen(false)
        setCuadrillaToDelete(null)
        setCuadrillaNameToDelete("")
      } catch (error) {
        console.error("Error al eliminar cuadrilla:", error)
      }
    }
  }

  const handleReload = async () => {
    setIsReloading(true)
    try {
      await reloadCuadrillas()
      toast({
        title: "Datos actualizados",
        description: "Las cuadrillas se han actualizado correctamente.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron actualizar las cuadrillas.",
        variant: "destructive",
      })
    } finally {
      setIsReloading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Cuadrillas</h1>
        <Button variant="outline" size="sm" onClick={handleReload} disabled={isReloading || isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isReloading ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar proveedores..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Cuadrilla
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Crear Nueva Cuadrilla</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="nombre" className="text-right">
                  Nombre
                </Label>
                <Input
                  id="nombre"
                  className="col-span-3"
                  placeholder="Nombre de la cuadrilla"
                  value={newCuadrillaName}
                  onChange={(e) => setNewCuadrillaName(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="proveedor" className="text-right">
                  Proveedor
                </Label>
                <select
                  id="proveedor"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 col-span-3"
                  value={selectedProviderId}
                  onChange={(e) => setSelectedProviderId(e.target.value)}
                >
                  <option value="">Seleccionar proveedor...</option>
                  {providers.map((provider) => (
                    <option key={provider.id} value={String(provider.id)}>
                      {provider.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={handleAddCuadrilla}>
                Crear Cuadrilla
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Diálogo de confirmación de eliminación */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Confirmar eliminación
            </DialogTitle>
            <DialogDescription>
              ¿Está seguro que desea eliminar la cuadrilla{" "}
              <span className="font-semibold">{cuadrillaNameToDelete}</span>? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[150px] w-full rounded-lg" />
          ))}
        </div>
      ) : isError ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-muted-foreground">Error al cargar los datos. Intente nuevamente.</p>
              <Button variant="outline" className="mt-4" onClick={handleReload}>
                Reintentar
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : filteredProviders.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-muted-foreground">No se encontraron proveedores.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Usamos Set para obtener IDs únicos de proveedores y evitar duplicados */}
          {Array.from(new Set(filteredProviders.map((p) => String(p.id)))).map((providerIdString) => {
            const provider = filteredProviders.find((p) => String(p.id) === providerIdString)
            if (!provider) return null

            const providerCuadrillas = cuadrillas.filter((cuadrilla) => cuadrilla.proveedorId === providerIdString)

            return (
              <Card key={providerIdString} className="overflow-hidden">
                <CardHeader className="bg-muted/50 py-3">
                  <CardTitle className="text-lg flex items-center">
                    <Users className="h-5 w-5 mr-2 text-primary" />
                    {provider.nombre}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {providerCuadrillas.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      No hay cuadrillas registradas para este proveedor.
                    </div>
                  ) : (
                    <ul className="divide-y">
                      {providerCuadrillas.map((cuadrilla) => (
                        <li key={cuadrilla.id} className="flex items-center justify-between p-4">
                          <div className="flex items-center">
                            <span className="font-medium">{cuadrilla.nombre}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDeleteDialog(cuadrilla.id, cuadrilla.nombre)}
                            className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="p-2 border-t bg-muted/30">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-center"
                      onClick={() => {
                        setSelectedProviderId(providerIdString)
                        setIsDialogOpen(true)
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Añadir Cuadrilla
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
