import type { Metadata } from 'next'
import { RegistrarVisitaForm } from '@/components/forms/RegistrarVisitaForm'

export const metadata: Metadata = { title: 'Registrar Visita — INPSASEL' }

export default function RegistrarVisitaPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Registrar Visita</h1>
      <RegistrarVisitaForm />
    </div>
  )
}
