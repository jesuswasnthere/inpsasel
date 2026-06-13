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

  if (!user) redirect('/login')

  const roleName = (user.user_metadata?.roleName as string) ?? ''

  return (
    <div className="flex min-h-screen" style={{ background: 'linear-gradient(135deg, #dbeafe 0%, #eff6ff 60%, #e0f2fe 100%)' }}>
      <Sidebar roleName={roleName} />
      <main className="flex-1 p-6 md:p-8 overflow-auto">
        {children}
      </main>
    </div>
  )
}
