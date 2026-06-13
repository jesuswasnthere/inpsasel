import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Inicio — INPSASEL' }

export default function MenuPage() {
  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <div className="bg-white rounded-2xl shadow-lg px-12 py-10 text-center max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Bienvenido al Sistema
        </h1>
        <p className="text-gray-500 text-sm">
          Seleccione una opción en el menú lateral para comenzar.
        </p>
      </div>
    </div>
  )
}
