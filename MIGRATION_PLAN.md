# Plan de Migración: Express.js → Next.js 15+ con Supabase

## Contexto del Repo Actual

| Aspecto | Estado actual |
|---|---|
| Runtime | Express.js + serverless-http (Vercel Function) |
| Frontend | HTML estático en `/public` |
| Auth | Cookies HMAC manuales + express-session |
| DB | `pg` (Pool directo a PostgreSQL) |
| TypeScript | ❌ No |
| Framework CSS | Ninguno (CSS manual) |
| Supabase SDK | ❌ No (conexión directa) |

---

## Fase 1 — Entorno base y estructura (Semana 1)

**Objetivo:** Proyecto Next.js 15 funcional con Supabase conectado, tipos generados, Tailwind configurado.

1. Crear proyecto Next.js 15 con App Router, TypeScript y Tailwind
2. Instalar dependencias: `@supabase/supabase-js`, `@supabase/ssr`, `zod`
3. Crear `lib/supabase/client.ts` (cliente browser) y `lib/supabase/server.ts` (cliente SSR)
4. Configurar variables de entorno (`.env.local`)
5. Ejecutar `supabase gen types` para generar tipos desde las migraciones existentes
6. Subir migraciones SQL a Supabase (o apuntar a la misma Postgres existente)

**Entregable:** `npm run dev` funciona y los tipos de BD están disponibles en TypeScript.

---

## Fase 2 — Autenticación con Supabase Auth (Semana 1-2)

**Objetivo:** Reemplazar el sistema HMAC manual con Supabase Auth + middleware Next.js.

1. Configurar `middleware.ts` para proteger rutas (reemplaza `requireAuth`)
2. Crear `app/(auth)/login/page.tsx` con Server Action para login
3. Crear Server Action `logout` 
4. Mapear roles existentes (`Admin`, `Registro y calendario`) a metadata de usuario Supabase
5. Crear helper `lib/auth/permissions.ts` (reemplaza `userCanManageVisits`)

**Reemplaza:** `src/middlewares/auth.js`, `src/routes/authRoutes.js`

---

## Fase 3 — Páginas y Server Actions (Semana 2-3)

**Objetivo:** Migrar cada ruta Express a una page/action de Next.js.

| Ruta Express | Equivalente Next.js |
|---|---|
| `GET /` → redirect | `app/page.tsx` con redirect |
| `GET /login` | `app/(auth)/login/page.tsx` |
| `GET /menu` | `app/(dashboard)/menu/page.tsx` |
| `GET /register-visit` | `app/(dashboard)/visitas/registrar/page.tsx` |
| `GET /modify-visit` | `app/(dashboard)/visitas/modificar/page.tsx` |
| `GET /delete-visit` | `app/(dashboard)/visitas/eliminar/page.tsx` |
| `POST /delete-visit` | Server Action `deleteVisit()` en `actions/visitas.ts` |
| `GET /visitas-del-dia` | `app/(dashboard)/visitas/hoy/page.tsx` |
| `GET /success` | Reemplazar con toast/redirect en el flujo |

1. Crear layouts: `app/(auth)/layout.tsx` y `app/(dashboard)/layout.tsx`
2. Crear componentes UI base con Tailwind (mobile-first)
3. Migrar formularios HTML a React con `useActionState`

---

## Fase 4 — Lógica de negocio como Server Actions (Semana 3)

**Objetivo:** Reemplazar la lógica de `pg` directo con consultas Supabase.

1. `actions/visitas.ts` → CRUD completo de VISITAS
2. `actions/contactos.ts` → Gestión de CONTACTOS
3. `actions/auth.ts` → login/logout
4. Validación con `zod` en cada action antes de tocar la BD

---

## Fase 5 — Pulido y deploy (Semana 4)

1. Eliminar `vercel.json` (Next.js no lo necesita en Vercel)
2. Configurar variables de entorno en Vercel dashboard
3. Tests básicos de integración
4. Eliminar `/public` HTML estático y `/src` Express

---

## Estructura de Carpetas Next.js 15

```
ipsasel/
├── app/
│   ├── (auth)/
│   │   ├── layout.tsx              # Layout sin sidebar
│   │   └── login/
│   │       └── page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx              # Layout con sidebar/nav
│   │   ├── menu/
│   │   │   └── page.tsx
│   │   └── visitas/
│   │       ├── registrar/
│   │       │   └── page.tsx
│   │       ├── modificar/
│   │       │   └── page.tsx
│   │       ├── eliminar/
│   │       │   └── page.tsx
│   │       └── hoy/
│   │           └── page.tsx
│   ├── api/                        # Solo si se necesitan webhooks externos
│   │   └── health/
│   │       └── route.ts
│   ├── globals.css
│   ├── layout.tsx                  # Root layout
│   └── page.tsx                    # Redirect a /login o /menu
├── actions/                        # Server Actions (reemplazan controllers)
│   ├── auth.ts
│   ├── visitas.ts
│   └── contactos.ts
├── components/
│   ├── ui/                         # Componentes reutilizables (Button, Input, etc.)
│   ├── forms/
│   │   ├── LoginForm.tsx
│   │   ├── RegistrarVisitaForm.tsx
│   │   └── EliminarVisitaForm.tsx
│   └── layout/
│       ├── Sidebar.tsx
│       └── Header.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # createBrowserClient
│   │   └── server.ts               # createServerClient (cookies)
│   ├── auth/
│   │   └── permissions.ts          # userCanManageVisits, etc.
│   └── validations/
│       ├── visita.schema.ts        # Zod schemas
│       └── auth.schema.ts
├── types/
│   └── database.ts                 # Generado por supabase gen types
├── middleware.ts                   # Protección de rutas (reemplaza requireAuth)
├── migrations/                     # Mantener migraciones SQL existentes
├── .env.local
├── .env.example
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

---

## Migración de Controllers → Server Actions

### Principio clave

En Express, el flujo es: `Request → Middleware → Controller → Response`.
En Next.js, el flujo es: `Form submit → Server Action → redirect/revalidate`.

Las Server Actions **corren en el servidor**, nunca exponen lógica al cliente, y están protegidas automáticamente por CSRF de Next.js.

### Ejemplo: `authController.login` → Server Action

**Express actual (inferido del código existente):**
```js
// src/controllers/authController.js
async function login(req, res) {
  const { username, password } = req.body;
  const result = await pool.query(
    'SELECT u.*, r.nombre_rol as "roleName" FROM usuarios u JOIN roles r ON u.id_rol = r.id_rol WHERE u.username = $1',
    [username]
  );
  const user = result.rows[0];
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.redirect('/login?error=1');
  }
  establishLoginSession(req, res, user, '/menu');
}
```

**Next.js 15 — Server Action:**
```ts
// actions/auth.ts
'use server'

import { createServerClient } from '@/lib/supabase/server'
import { loginSchema } from '@/lib/validations/auth.schema'
import { redirect } from 'next/navigation'

export async function loginAction(prevState: unknown, formData: FormData) {
  const parsed = loginSchema.safeParse({
    username: formData.get('username'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return { error: 'Datos inválidos' }
  }

  const supabase = await createServerClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.username,   // o buscar el email por username
    password: parsed.data.password,
  })

  if (error) return { error: 'Usuario o contraseña incorrectos' }

  redirect('/menu')
}
```

**Formulario que llama la action:**
```tsx
// components/forms/LoginForm.tsx
'use client'

import { useActionState } from 'react'
import { loginAction } from '@/actions/auth'

export function LoginForm() {
  const [state, action, isPending] = useActionState(loginAction, null)

  return (
    <form action={action} className="flex flex-col gap-4 w-full max-w-sm">
      <input name="username" type="text" placeholder="Usuario" required
        className="border rounded px-3 py-2 w-full" />
      <input name="password" type="password" placeholder="Contraseña" required
        className="border rounded px-3 py-2 w-full" />
      {state?.error && (
        <p className="text-red-600 text-sm">{state.error}</p>
      )}
      <button type="submit" disabled={isPending}
        className="bg-blue-600 text-white rounded px-4 py-2 disabled:opacity-50">
        {isPending ? 'Ingresando...' : 'Ingresar'}
      </button>
    </form>
  )
}
```

### Ejemplo: `visitController.deleteVisit` → Server Action

**Express actual (`POST /delete-visit` con `requireVisitManagementPermission`):**

**Next.js 15 — Server Action con verificación de permisos:**
```ts
// actions/visitas.ts
'use server'

import { createServerClient } from '@/lib/supabase/server'
import { userCanManageVisits } from '@/lib/auth/permissions'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function deleteVisitAction(formData: FormData) {
  const supabase = await createServerClient()

  // 1. Verificar sesión (reemplaza requireVisitManagementPermission)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const roleName = user.user_metadata?.roleName as string
  if (!userCanManageVisits(roleName)) {
    return { error: 'Sin permisos para eliminar visitas' }
  }

  // 2. Validar input
  const codigoVisita = formData.get('codigo_visita') as string
  if (!codigoVisita?.trim()) return { error: 'Código requerido' }

  // 3. Ejecutar en BD
  const { error } = await supabase
    .from('visitas')
    .delete()
    .eq('codigo_visita', codigoVisita)

  if (error) return { error: 'Error al eliminar la visita' }

  revalidatePath('/visitas/hoy')
  redirect('/menu')
}
```

### Ventajas vs Express en Vercel

| Express + serverless-http | Next.js 15 Server Actions |
|---|---|
| Cold start: inicializa Express completo | Cold start: solo la action ejecutada |
| CORS manual necesario | No aplica (mismo origen) |
| CSRF manual | Protección automática de Next.js |
| Session store necesario | Supabase Auth maneja sesiones via cookies |
| `vercel.json` rewrite hacky | Deploy nativo en Vercel |

---

## Configuración Inicial del Entorno

### 1. Inicializar proyecto

```bash
npx create-next-app@latest ipsasel \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \        # opcional, omitir si prefieres raíz
  --import-alias "@/*"

cd ipsasel
```

> **Nota:** Dado que el repo ya existe, en vez de `create-next-app`, puedes inicializar manualmente (ver Fase 1 detallada abajo).

### 2. Instalar dependencias

```bash
npm install @supabase/supabase-js @supabase/ssr
npm install zod
npm install -D @types/node
```

### 3. Crear `lib/supabase/server.ts`

```ts
// lib/supabase/server.ts
import { createServerClient as createClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

export async function createServerClient() {
  const cookieStore = await cookies()

  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component — cookies de solo lectura, ignorar
          }
        },
      },
    }
  )
}
```

### 4. Crear `lib/supabase/client.ts`

```ts
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

export function createClientSupabase() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### 5. Variables de entorno

```bash
# .env.local (nunca commitear)
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # Solo server-side, nunca exponer al cliente
```

```bash
# .env.example (sí commitear)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

### 6. Middleware de protección de rutas

```ts
// middleware.ts (en la raíz del proyecto)
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const isPublicPath = request.nextUrl.pathname.startsWith('/login')

  if (!user && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user && isPublicPath) {
    return NextResponse.redirect(new URL('/menu', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
```

---

## Sincronizar Tipos TypeScript con el Esquema de BD

### Requisito previo: Supabase CLI

```bash
# Instalar Supabase CLI
npm install -g supabase

# Verificar
supabase --version
```

### Opción A — Generar tipos desde el proyecto Supabase remoto (recomendado)

```bash
# Login
supabase login

# Obtener el project-id desde dashboard.supabase.com → Settings → General
supabase gen types typescript \
  --project-id TU_PROJECT_ID \
  --schema public \
  > types/database.ts
```

### Opción B — Generar tipos desde BD local (si usas Supabase CLI localmente)

```bash
# Inicializar Supabase local (solo la primera vez)
supabase init

# Iniciar contenedores locales
supabase start

# Aplicar migraciones existentes
supabase db push   # o: psql -f migrations/002_recreate_schema.sql ...

# Generar tipos
supabase gen types typescript --local > types/database.ts
```

### Validar que las tablas están sincronizadas

```bash
# Ver diferencias entre schema local y remoto
supabase db diff --schema public

# Si hay diferencias, crear una nueva migración
supabase db diff --schema public --file migrations/007_sync.sql
```

### Resultado esperado en `types/database.ts`

El archivo generado contendrá algo como:

```ts
export type Database = {
  public: {
    Tables: {
      visitas: {
        Row: {
          id_visita: number
          codigo_visita: string
          fecha: string
          hora: string
          tipo_visita: 'Técnica' | 'Comercial' | 'Soporte' | 'Inspección' | 'Personal' | 'Administrativa' | 'Consulta'
          estatus: 'Planificada' | 'En Curso' | 'Completada' | 'Revisada' | 'Cancelada' | 'No Programada' | 'Emergencia'
          sexo: string | null
          edad: number | null
          municipio: string | null
          sector: string | null
          cargo: string | null
          funcion: string | null
          actividad_economica: string | null
          funcionario: string | null
          motivo_visita: string | null
          // ... resto de columnas
        }
        Insert: { /* ... */ }
        Update: { /* ... */ }
      }
      // ... resto de tablas
    }
    Enums: {
      tipo_visita_enum: 'Técnica' | 'Comercial' | 'Soporte' | 'Inspección' | 'Personal' | 'Administrativa' | 'Consulta'
      estatus_enum: 'Planificada' | 'En Curso' | 'Completada' | 'Revisada' | 'Cancelada' | 'No Programada' | 'Emergencia'
      tipo_contacto_enum: 'Individual' | 'Empresa' | 'Organización'
    }
  }
}
```

### Script para automatizar la regeneración

Añadir en `package.json`:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "types:db": "supabase gen types typescript --project-id TU_PROJECT_ID --schema public > types/database.ts",
    "types:db:local": "supabase gen types typescript --local > types/database.ts"
  }
}
```

Ejecutar con `npm run types:db` cada vez que hagas una migración.

---

## Notas Importantes para la Migración

1. **Migrar usuarios a Supabase Auth**: Los usuarios actuales en la tabla `USUARIOS` con passwords bcrypt necesitan ser migrados a `auth.users` de Supabase. Usar `supabase admin createUser` o el dashboard para crear cuentas, luego vincular `id_usuario` via `user_metadata`.

2. **Mantener la tabla `USUARIOS` existente** como tabla de perfil (`profiles`) vinculada a `auth.users` por UUID, en lugar de reemplazarla completamente. Así no se pierde el historial de auditoría.

3. **RLS (Row Level Security)**: Activar RLS en Supabase para las tablas sensibles y crear políticas que reemplacen la lógica de `requireVisitManagementPermission`.

4. **El `vercel.json` actual** puede eliminarse una vez migrado a Next.js — Vercel detecta Next.js automáticamente.
