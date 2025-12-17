"use client"

interface PageLoaderProps {
  message?: string
  submessage?: string
}

export function PageLoader({ 
  message = "Cargando...", 
  submessage = "Por favor espere" 
}: PageLoaderProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-primary/20 rounded-full animate-pulse"></div>
        <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-primary rounded-full animate-spin"></div>
      </div>
      <div className="text-center space-y-2">
        <p className="text-lg font-medium text-foreground">{message}</p>
        <p className="text-sm text-muted-foreground">{submessage}</p>
      </div>
    </div>
  )
}

