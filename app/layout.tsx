import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'INPSASEL — Sistema de Visitas',
  description: 'Sistema de gestión de visitas INPSASEL',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
