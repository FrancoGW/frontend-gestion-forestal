"use client"

import type React from "react"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Plus, Edit, Trash2, Search, RefreshCw } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { useIsMobile } from "@/hooks/use-mobile"

interface AdminDataTableProps {
  title: string
  description: string
  data: any[]
  isLoading: boolean
  isError: boolean
  columns: {
    header: string
    accessorKey: string
    cell?: (item: any) => React.ReactNode
  }[]
  onRefresh: () => void
  onAdd?: (data: any) => void
  onEdit?: (id: string | number, data: any) => void
  onDelete?: (id: string | number) => void
  formFields?: {
    name: string
    label: string
    type: string
    required?: boolean
    options?: { value: string; label: string }[]
  }[]
}

export function AdminDataTable({
  title,
  description,
  data,
  isLoading,
  isError,
  columns,
  onRefresh,
  onAdd,
  onEdit,
  onDelete,
  formFields = [],
}: AdminDataTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [currentItem, setCurrentItem] = useState<any>(null)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const isMobile = useIsMobile()

  const filteredData = data?.filter((item) => {
    if (!searchTerm) return true

    return Object.values(item).some(
      (value) => value && value.toString().toLowerCase().includes(searchTerm.toLowerCase()),
    )
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target

    // Convertir strings "true"/"false" a booleanos para campos específicos
    let processedValue: any = value
    if (name === "activo") {
      processedValue = value === "true"
    }

    setFormData((prev) => ({ ...prev, [name]: processedValue }))
  }

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (onAdd) {
      onAdd(formData)
      setIsAddDialogOpen(false)
      setFormData({})
    }
  }

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (onEdit && currentItem) {
      // Usar _id si está disponible, de lo contrario usar id
      const itemId = currentItem._id !== undefined ? currentItem._id : currentItem.id
      onEdit(itemId, formData)
      setIsEditDialogOpen(false)
      setFormData({})
      setCurrentItem(null)
    }
  }

  const handleDeleteConfirm = () => {
    if (onDelete && currentItem) {
      // Usar _id si está disponible, de lo contrario usar id
      const itemId = currentItem._id !== undefined ? currentItem._id : currentItem.id
      onDelete(itemId)
      setIsDeleteDialogOpen(false)
      setCurrentItem(null)
    }
  }

  const openEditDialog = (item: any) => {
    setCurrentItem(item)
    setFormData(item)
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (item: any) => {
    setCurrentItem(item)
    setIsDeleteDialogOpen(true)
  }

  const renderFormFields = () => {
    return formFields.map((field) => (
      <div className="grid gap-2" key={field.name}>
        <Label htmlFor={field.name}>{field.label}</Label>
        {field.type === "select" ? (
          <select
            id={field.name}
            name={field.name}
            value={formData[field.name] || ""}
            onChange={handleInputChange}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            required={field.required}
          >
            <option value="" disabled>
              Seleccionar {field.label.toLowerCase()}...
            </option>
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : field.type === "textarea" ? (
          <textarea
            id={field.name}
            name={field.name}
            value={formData[field.name] || ""}
            onChange={(e) => setFormData((prev) => ({ ...prev, [field.name]: e.target.value }))}
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            required={field.required}
          />
        ) : (
          <Input
            id={field.name}
            name={field.name}
            type={field.type}
            value={formData[field.name] || ""}
            onChange={handleInputChange}
            required={field.required}
          />
        )}
      </div>
    ))
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button variant="outline" size="icon" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            {onAdd && (
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full sm:w-auto">
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Agregar {title.slice(0, -1)}</DialogTitle>
                    <DialogDescription>Complete el formulario para agregar un nuevo registro.</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddSubmit}>
                    <div className="grid gap-4 py-4">{renderFormFields()}</div>
                    <DialogFooter className="flex-col sm:flex-row gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsAddDialogOpen(false)}
                        className="w-full sm:w-auto"
                      >
                        Cancelar
                      </Button>
                      <Button type="submit" className="w-full sm:w-auto">
                        Guardar
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 mt-4">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
      </CardHeader>
      <CardContent>
        {isError ? (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              No se pudieron cargar los datos. Por favor, intente nuevamente.
              <Button variant="outline" size="sm" className="mt-2 bg-transparent" onClick={onRefresh}>
                Reintentar
              </Button>
            </AlertDescription>
          </Alert>
        ) : null}

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((column) => (
                    <TableHead key={column.accessorKey}>{column.header}</TableHead>
                  ))}
                  {(onEdit || onDelete) && <TableHead className="text-right">Acciones</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData && filteredData.length > 0 ? (
                  filteredData.map((item) => (
                    <TableRow key={item._id || item.id}>
                      {columns.map((column) => (
                        <TableCell key={`${item._id || item.id}-${column.accessorKey}`} className="break-words">
                          {column.cell ? column.cell(item) : item[column.accessorKey] || "-"}
                        </TableCell>
                      ))}
                      {(onEdit || onDelete) && (
                        <TableCell className="text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            {onEdit && (
                              <Button variant="ghost" size="icon" onClick={() => openEditDialog(item)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            {onDelete && (
                              <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(item)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length + (onEdit || onDelete ? 1 : 0)} className="h-24 text-center">
                      No se encontraron resultados.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="text-sm text-muted-foreground">Total: {filteredData?.length || 0} registros</div>
      </CardFooter>

      {/* Edit Dialog */}
      {onEdit && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar {title.slice(0, -1)}</DialogTitle>
              <DialogDescription>Modifique los campos que desea actualizar.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditSubmit}>
              <div className="grid gap-4 py-4">{renderFormFields()}</div>
              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                  className="w-full sm:w-auto"
                >
                  Cancelar
                </Button>
                <Button type="submit" className="w-full sm:w-auto">
                  Actualizar
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Dialog */}
      {onDelete && (
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Confirmar eliminación</DialogTitle>
              <DialogDescription>
                ¿Está seguro que desea eliminar este registro? Esta acción no se puede deshacer.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
                className="w-full sm:w-auto"
              >
                Cancelar
              </Button>
              <Button type="button" variant="destructive" onClick={handleDeleteConfirm} className="w-full sm:w-auto">
                Eliminar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  )
}
