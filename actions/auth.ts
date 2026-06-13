'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { loginSchema } from '@/lib/validations/auth.schema'

export type AuthState = { error: string } | null

/**
 * Reemplaza authController.login de Express.
 * Supabase Auth valida credenciales — no se necesita bcrypt manual.
 *
 * NOTA: Los usuarios del sistema anterior (tabla USUARIOS con bcrypt)
 * deben migrarse a auth.users de Supabase. Ver MIGRATION_PLAN.md § "Migrar usuarios".
 * El email de Supabase Auth debe ser `${username}@inpsasel.internal` o similar.
 */
export async function loginAction(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    username: formData.get('username'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return { error: 'Datos inválidos. Revisa los campos.' }
  }

  const supabase = await createClient()

  // Supabase Auth usa email — usamos el username como prefijo de email interno
  const email = `${parsed.data.username}@inpsasel.internal`

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: parsed.data.password,
  })

  if (error) {
    return { error: 'Usuario o contraseña incorrectos.' }
  }

  // next puede venir del middleware como ?next=/ruta-original
  redirect('/menu')
}

/**
 * Reemplaza authController.logout de Express.
 */
export async function logoutAction(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
