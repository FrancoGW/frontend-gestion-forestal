"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertCircle, WifiOff } from "lucide-react"

interface BackendStatusAlertProps {
  status: "connected" | "disconnected" | "error"
  loading?: boolean
  onRetry?: () => void
}

export function BackendStatusAlert({ status, loading = false, onRetry }: BackendStatusAlertProps) {
  if (status === "connected") {
    return null
  }

  return (
    <Alert variant={status === "error" ? "destructive" : "default"} className="mb-4">
      <div className="flex items-center gap-2">
        {status === "disconnected" ? <WifiOff className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
        <AlertDescription className="flex-1">
          {status === "disconnected"
            ? "Sin conexión al servidor. Algunos datos pueden no estar actualizados."
            : "Error al conectar con el servidor. Por favor, intenta nuevamente."}
        </AlertDescription>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry} disabled={loading}>
            {loading ? "Conectando..." : "Reintentar"}
          </Button>
        )}
      </div>
    </Alert>
  )
}
