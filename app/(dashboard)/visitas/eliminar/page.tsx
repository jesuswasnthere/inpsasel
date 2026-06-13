import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { userCanManageVisits } from '@/lib/auth/permissions'
import { EliminarVisitaForm } from '@/components/forms/EliminarVisitaForm'

export const metadata: Metadata = { title: 'Eliminar Visita — INPSASEL' }

export default async function EliminarVisitaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const roleName = (user?.user_metadata?.roleName as string) ?? ''

  // Guard de permisos a nivel de page (reemplaza requireVisitManagementPermission)
  if (!userCanManageVisits(roleName)) {
    redirect('/menu')
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Eliminar Visita</h1>
      <EliminarVisitaForm />
    </div>
  )
}
