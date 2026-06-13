import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// El middleware ya redirige sin sesión a /login,
// pero esta page cubre el caso del root "/" con sesión activa.
export default async function RootPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/menu')
  }

  redirect('/login')
}
