import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { userCanManageVisits } from '@/lib/auth/permissions'
import { ModificarVisitaForm } from '@/components/forms/ModificarVisitaForm'

export const metadata: Metadata = { title: 'Modificar Visita — INPSASEL' }

interface PageProps {
  searchParams: Promise<{ codigo?: string }>
}

export default async function ModificarVisitaPage({ searchParams }: PageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const roleName = (user?.user_metadata?.roleName as string) ?? ''

  if (!userCanManageVisits(roleName)) redirect('/menu')

  const { codigo } = await searchParams

  // Si hay código en la URL, buscamos la visita
  let visita = null
  let fetchError: string | null = null

  if (codigo) {
    const { data, error } = await supabase
      .from('visitas')
      .select('*')
      .eq('codigo_visita', codigo.trim())
      .single()

    if (error || !data) {
      fetchError = `No se encontró ninguna visita con código "${codigo}".`
    } else {
      visita = data
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Modificar Visita</h1>
        <p className="text-sm text-gray-500 mt-1">Busca por código de visita para editar sus datos.</p>
      </div>

      {/* Formulario de búsqueda — simple GET que actualiza la URL */}
      <form method="GET" className="flex gap-2">
        <input
          type="text"
          name="codigo"
          defaultValue={codigo ?? ''}
          placeholder="Ej: VIS-2024-001"
          className="input-field flex-1"
          required
        />
        <button
          type="submit"
          className="btn-primary px-6"
        >
          Buscar
        </button>
      </form>

      {/* Error de búsqueda */}
      {fetchError && (
        <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {fetchError}
        </p>
      )}

      {/* Formulario de edición — solo cuando hay visita */}
      {visita && <ModificarVisitaForm visita={visita} />}
    </div>
  )
}
