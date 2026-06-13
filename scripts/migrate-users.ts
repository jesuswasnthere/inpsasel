/**
 * migrate-users.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Migra los usuarios de la tabla USUARIOS a Supabase Auth.
 *
 * Formato de email:  {username}@inpsasel.internal
 * user_metadata:     { id_usuario, nombre_completo, roleName, id_rol }
 *
 * USO:
 *   npx tsx scripts/migrate-users.ts
 *
 * Variables de entorno necesarias (en .env.local o exportadas en shell):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SECRET_KEY          ← Service Role Key del panel de Supabase
 *   TEMP_PASSWORD                ← Contraseña temporal (opcional, default: Inpsasel2024!)
 *
 * IMPORTANTE: Este script usa la Service Role Key — ejecutar solo en entorno
 * de administración, nunca en el cliente ni en el runtime de Next.js.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

// ── Configuración ────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SECRET_KEY
const TEMP_PASSWORD = process.env.TEMP_PASSWORD ?? 'Inpsasel2024!'

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌  Faltan variables de entorno:')
  console.error('    NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SECRET_KEY son requeridas.')
  process.exit(1)
}

// El cliente admin requiere la Service Role Key para gestionar auth.users
const supabase = createClient<Database>(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ── Tipos auxiliares ─────────────────────────────────────────────────────────

type UsuarioRow = Database['public']['Tables']['usuarios']['Row']

interface MigrationResult {
  username: string
  email: string
  status: 'created' | 'skipped' | 'error'
  detail?: string
}

// ── Script principal ─────────────────────────────────────────────────────────

async function main() {
  console.log('🔄  Iniciando migración de usuarios a Supabase Auth...\n')

  // 1. Leer todos los usuarios + nombre de rol desde Supabase
  const { data: usuarios, error: fetchError } = await supabase
    .from('usuarios')
    .select(`
      id_usuario,
      username,
      nombre_completo,
      id_rol,
      roles ( nombre_rol )
    `)

  if (fetchError || !usuarios) {
    console.error('❌  Error al leer la tabla usuarios:', fetchError?.message)
    process.exit(1)
  }

  console.log(`📋  Encontrados ${usuarios.length} usuario(s) en la tabla USUARIOS.\n`)

  const results: MigrationResult[] = []

  for (const u of usuarios as (UsuarioRow & { roles: { nombre_rol: string } | null })[]) {
    const email = `${u.username}@inpsasel.internal`
    const roleName = u.roles?.nombre_rol ?? ''

    // 2. Crear usuario en Supabase Auth con la Admin API
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password: TEMP_PASSWORD,
      email_confirm: true,           // confirmar email automáticamente
      user_metadata: {
        id_usuario: u.id_usuario,
        nombre_completo: u.nombre_completo,
        roleName,
        id_rol: u.id_rol,
      },
    })

    if (error) {
      // Si el usuario ya existe, registrar como skipped
      if (error.message.toLowerCase().includes('already')) {
        results.push({ username: u.username, email, status: 'skipped', detail: 'Ya existe en Auth' })
      } else {
        results.push({ username: u.username, email, status: 'error', detail: error.message })
      }
    } else {
      results.push({ username: u.username, email, status: 'created', detail: data.user.id })
    }
  }

  // 3. Resumen
  console.log('═══════════════════════════════════════════════════════')
  console.log('  RESULTADO DE LA MIGRACIÓN')
  console.log('═══════════════════════════════════════════════════════')

  for (const r of results) {
    const icon = r.status === 'created' ? '✅' : r.status === 'skipped' ? '⏭️ ' : '❌'
    console.log(`${icon}  ${r.username.padEnd(20)} ${r.email}`)
    if (r.status !== 'created') {
      console.log(`       → ${r.detail}`)
    }
  }

  const created = results.filter(r => r.status === 'created').length
  const skipped = results.filter(r => r.status === 'skipped').length
  const errors  = results.filter(r => r.status === 'error').length

  console.log('═══════════════════════════════════════════════════════')
  console.log(`  Creados: ${created}  |  Ya existían: ${skipped}  |  Errores: ${errors}`)
  console.log('═══════════════════════════════════════════════════════\n')

  if (created > 0) {
    console.log(`🔑  Contraseña temporal asignada: "${TEMP_PASSWORD}"`)
    console.log('    Solicita a cada usuario que la cambie en el primer acceso.\n')
  }

  if (errors > 0) {
    console.log('⚠️   Algunos usuarios tuvieron errores. Revisa el detalle arriba.')
    process.exit(1)
  }
}

main().catch((err) => {
  console.error('❌  Error inesperado:', err)
  process.exit(1)
})
