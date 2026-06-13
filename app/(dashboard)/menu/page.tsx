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
      className="flex items-center justify-center rounded-2xl bg-white/90 backdrop-blur-sm
                 px-6 py-8 text-center text-base font-semibold text-blue-800
                 shadow-md hover:shadow-lg hover:scale-[1.02]
                 border border-blue-100 transition-all duration-200"
    >
      {label}
    </Link>
  )
}
