import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { userCanManageVisits } from '@/lib/auth/permissions'

export const metadata: Metadata = { title: 'Menú — INPSASEL' }

export default async function MenuPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const roleName = (user?.user_metadata?.roleName as string) ?? ''
  const canManage = userCanManageVisits(roleName)

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Menú Principal</h1>
      <p className="text-gray-500 mb-8">Selecciona una acción</p>

      <nav className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <MenuCard href="/visitas/registrar" label="Registrar Visita" />
        <MenuCard href="/visitas/hoy" label="Visitas del Día" />
        {canManage && (
          <>
            <MenuCard href="/visitas/modificar" label="Modificar Visita" />
            <MenuCard href="/visitas/eliminar" label="Eliminar Visita" />
          </>
        )}
      </nav>
    </div>
  )
}

function MenuCard({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-center rounded-xl border-2 border-brand-200 bg-white
                 px-6 py-8 text-center text-base font-semibold text-brand-700
                 hover:border-brand-500 hover:bg-brand-50 transition-colors shadow-sm"
    >
      {label}
    </Link>
  )
}
