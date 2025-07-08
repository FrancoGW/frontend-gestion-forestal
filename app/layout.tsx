import type React from "react"
import type { Metadata } from "next"
import { ReactQueryProvider } from "@/lib/react-query"
import "./globals.css"

export const metadata: Metadata = {
  title: "Sistema de Órdenes de Trabajo",
  description: "Sistema de gestión de órdenes de trabajo forestal",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body>
        <ReactQueryProvider>{children}</ReactQueryProvider>
      </body>
    </html>
  )
}
