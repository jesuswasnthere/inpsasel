'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { userCanManageVisits } from '@/lib/auth/permissions'
import {
  registrarVisitaSchema,
  eliminarVisitaSchema,
} from '@/lib/validations/visita.schema'

export type ActionState = { error: string } | { success: string } | null

/**
 * Registra una nueva visita.
 * Reemplaza la lógica de POST /register-visit del Express original.
 */
export async function registrarVisitaAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Mapear FormData a objeto plano para Zod
  const raw = Object.fromEntries(formData.entries())
  const parsed = registrarVisitaSchema.safeParse(raw)

  if (!parsed.success) {
    const firstError = parsed.error.errors[0]?.message ?? 'Datos inválidos'
    return { error: firstError }
  }

  const { error } = await supabase.from('visitas').insert({
    ...parsed.data,
    id_usuario: Number(user.user_metadata?.id_usuario ?? 0),
  })

  if (error) {
    console.error('registrarVisita:', error.message)
    return { error: 'No se pudo registrar la visita. Intenta nuevamente.' }
  }

  revalidatePath('/visitas/hoy')
  return { success: 'Visita registrada correctamente.' }
}

/**
 * Elimina una visita por código.
 * Reemplaza POST /delete-visit con requireVisitManagementPermission.
 */
export async function eliminarVisitaAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Verificar permisos (reemplaza requireVisitManagementPermission)
  const roleName = (user.user_metadata?.roleName as string) ?? ''
  if (!userCanManageVisits(roleName)) {
    return { error: 'No tiene permisos para eliminar visitas.' }
  }

  const parsed = eliminarVisitaSchema.safeParse({
    codigo_visita: formData.get('codigo_visita'),
  })

  if (!parsed.success) {
    return { error: 'Código de visita inválido.' }
  }

  const { error } = await supabase
    .from('visitas')
    .delete()
    .eq('codigo_visita', parsed.data.codigo_visita)

  if (error) {
    return { error: 'No se pudo eliminar la visita.' }
  }

  revalidatePath('/visitas/hoy')
  redirect('/menu')
}
