"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Database, AlertTriangle, Search, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageLoader } from "@/components/ui/page-loader"

interface AdminData {
  [key: string]: any[]
}

export default function UsuariosGISPage() {
  const [data, setData] = useState<AdminData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState<string>("")

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch("/api/usuarios-gis")
      const result = await response.json()

      if (result.success && result.data) {
        setData(result.data)
        const keys = Object.keys(result.data)
        if (keys.length > 0 && !activeTab) {
          setActiveTab(keys[0])
        }
      } else {
        throw new Error(result.error || "Error al cargar datos")
      }
    } catch (err: any) {
      console.error("Error:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const getTableKeys = () => {
    if (!data) return []
    return Object.keys(data)
  }

  const getColumns = (tableName: string) => {
    if (!data || !data[tableName] || data[tableName].length === 0) return []
    return Object.keys(data[tableName][0])
  }

  const filterData = (items: any[]) => {
    if (!searchTerm) return items
    return items.filter((item) =>
      Object.values(item).some((val) =>
        String(val).toLowerCase().includes(searchTerm.toLowerCase())
      )
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <PageLoader message="Cargando datos GIS..." submessage="Obteniendo información administrativa" />
      </div>
    )
  }

  const tableKeys = getTableKeys()

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Usuarios GIS</h1>
          <p className="text-gray-600">Datos administrativos desde ADMIN_API_URL</p>
        </div>
        <Button onClick={loadData} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualizar
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!error && data && (
        <Alert>
          <Database className="w-4 h-4 text-green-600" />
          <AlertDescription>
            ✅ Conectado a ADMIN_API_URL - {tableKeys.length} tablas encontradas
          </AlertDescription>
        </Alert>
      )}

      {/* Búsqueda */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-500" />
            <Input
              placeholder="Buscar en todos los campos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabs con las tablas */}
      {data && tableKeys.length > 0 && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex flex-wrap h-auto gap-1">
            {tableKeys.map((key) => (
              <TabsTrigger key={key} value={key} className="text-xs">
                {key} ({data[key]?.length || 0})
              </TabsTrigger>
            ))}
          </TabsList>

          {tableKeys.map((tableName) => (
            <TabsContent key={tableName} value={tableName}>
              <Card>
                <CardHeader>
                  <CardTitle>{tableName}</CardTitle>
                  <CardDescription>
                    {filterData(data[tableName] || []).length} registros
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {getColumns(tableName).map((col) => (
                            <TableHead key={col} className="whitespace-nowrap">
                              {col}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filterData(data[tableName] || []).map((row, idx) => (
                          <TableRow key={idx}>
                            {getColumns(tableName).map((col) => (
                              <TableCell key={col} className="whitespace-nowrap">
                                {typeof row[col] === "object"
                                  ? JSON.stringify(row[col])
                                  : String(row[col] ?? "")}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  )
}

