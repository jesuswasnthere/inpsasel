import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { userCanManageVisits } from '@/lib/auth/permissions'

export const metadata: Metadata = { title: 'Modificar Visita — INPSASEL' }

export default async function ModificarVisitaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const roleName = (user?.user_metadata?.roleName as string) ?? ''

  if (!userCanManageVisits(roleName)) {
    redirect('/menu')
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Modificar Visita</h1>
      {/* TODO: ModificarVisitaForm — implementar en Fase 3 */}
      <p className="text-gray-500">Formulario de modificación en construcción.</p>
    </div>
  )
}
