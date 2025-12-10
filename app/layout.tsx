import type React from "react"
import type { Metadata } from "next"
import { ReactQueryProvider } from "@/lib/react-query"
import "./globals.css"
import { useFrontendVersion } from "@/hooks/useFrontendVersion"
import { FrontendVersionEffect } from "@/components/FrontendVersionEffect"
import { Toaster } from "@/components/ui/toaster"

export const metadata: Metadata = {
  title: "Sistema de Órdenes de Trabajo",
  description: "Sistema de gestión de órdenes de trabajo forestal",
    generator: 'v0.dev'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <FrontendVersionEffect />
        <ReactQueryProvider>
          {children}
        </ReactQueryProvider>
        <Toaster />
      </body>
    </html>
  );
}
