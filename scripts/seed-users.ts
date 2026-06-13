/**
 * seed-users.ts
 * Crea los usuarios iniciales en Supabase Auth con su roleName en user_metadata.
 *
 * USO:
 *   $env:SUPABASE_SECRET_KEY="sb_secret_..."
 *   npx tsx scripts/seed-users.ts
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY  = process.env.SUPABASE_SECRET_KEY!

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SECRET_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const USERS = [
  {
    username: 'inpsaseladmin',
    password: 'sup3rusu4r10',
    nombre_completo: 'Administrador INPSASEL',
    roleName: 'Administrador',
  },
  {
    username: 'inpsaselusuario',
    password: '1nps4s3l4dm1n2026',
    nombre_completo: 'Usuario INPSASEL',
    roleName: 'Registro y calendario',
  },
]

async function main() {
  console.log('Creando usuarios en Supabase Auth...\n')

  for (const u of USERS) {
    const email = `${u.username}@inpsasel.internal`

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password: u.password,
      email_confirm: true,
      user_metadata: {
        nombre_completo: u.nombre_completo,
        roleName: u.roleName,
      },
    })

    if (error) {
      if (error.message.toLowerCase().includes('already')) {
        // Si ya existe, actualizamos la contraseña y metadata
        const list = await supabase.auth.admin.listUsers()
        const existing = list.data?.users.find(x => x.email === email)
        if (existing) {
          await supabase.auth.admin.updateUserById(existing.id, {
            password: u.password,
            user_metadata: { nombre_completo: u.nombre_completo, roleName: u.roleName },
          })
          console.log(`♻️  Actualizado:  ${u.username}  (${u.roleName})`)
        }
      } else {
        console.error(`❌ Error con ${u.username}:`, error.message)
      }
    } else {
      console.log(`✅ Creado:       ${u.username}  →  ${email}  (${u.roleName})`)
    }
  }

  console.log('\nListo. Credenciales de acceso:')
  USERS.forEach(u => console.log(`  ${u.username} / ${u.password}`))
}

main().catch(console.error)
