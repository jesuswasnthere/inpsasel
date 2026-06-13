/**
 * Reemplaza la lógica de userCanManageVisits / FULL_VISIT_ACCESS_ROLE_NAMES de auth.js
 */

const READONLY_ROLE = process.env.READONLY_VISIT_ROLE_NAME ?? 'Registro y calendario'
const ADMIN_ROLES = new Set(
  (process.env.FULL_VISIT_ACCESS_ROLE_NAMES ?? 'Admin,Administrador')
    .split(',')
    .map((r) => r.trim())
    .filter(Boolean)
)

export function userCanManageVisits(roleName: string | null | undefined): boolean {
  if (!roleName) return false
  if (roleName.trim() === READONLY_ROLE) return false
  return ADMIN_ROLES.has(roleName.trim())
}
