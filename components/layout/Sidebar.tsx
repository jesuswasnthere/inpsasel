'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logoutAction } from '@/actions/auth'
import { userCanManageVisits } from '@/lib/auth/permissions'

interface SidebarProps {
  roleName: string
}

export function Sidebar({ roleName }: SidebarProps) {
  const pathname = usePathname()
  const canManage = userCanManageVisits(roleName)

  const links = [
    { href: '/menu', label: 'Menú' },
    { href: '/visitas/registrar', label: 'Registrar Visita' },
    { href: '/visitas/hoy', label: 'Visitas del Día' },
    ...(canManage
      ? [
          { href: '/visitas/modificar', label: 'Modificar Visita' },
          { href: '/visitas/eliminar', label: 'Eliminar Visita' },
        ]
      : []),
  ]

  return (
    <aside className="w-60 shrink-0 bg-brand-900 text-white flex flex-col min-h-screen">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-brand-700">
        <span className="text-lg font-bold tracking-wide">INPSASEL</span>
        <p className="text-xs text-brand-300 mt-0.5 truncate">{roleName}</p>
      </div>

      {/* Navegación */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors
              ${pathname === href
                ? 'bg-brand-700 text-white'
                : 'text-brand-200 hover:bg-brand-800 hover:text-white'
              }`}
          >
            {label}
          </Link>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-brand-700">
        <form action={logoutAction}>
          <button
            type="submit"
            className="w-full text-left px-3 py-2 rounded-md text-sm text-brand-300
                       hover:bg-brand-800 hover:text-white transition-colors"
          >
            Cerrar sesión
          </button>
        </form>
      </div>
    </aside>
  )
}
