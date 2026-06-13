import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Menu — INPSASEL' }

export default function MenuPage() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          Bienvenido al Sistema
        </h1>
        <p className="text-gray-500 text-sm">
          Seleccione una opcion en el menu lateral para continuar.
        </p>
      </div>
    </div>
  )
}
