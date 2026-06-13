import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/Sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Doble verificación — el middleware ya protege, pero aquí obtenemos el user
  // para pasarle los datos al Sidebar.
  if (!user) redirect('/login')

  const roleName = (user.user_metadata?.roleName as string) ?? ''

  return (
    <div className="flex min-h-screen">
      <Sidebar roleName={roleName} />
      <main className="flex-1 p-6 md:p-8 overflow-auto">
        {children}
      </main>
    </div>
  )
}
