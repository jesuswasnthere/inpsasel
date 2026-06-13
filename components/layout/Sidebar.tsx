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
    <aside className="w-60 shrink-0 flex flex-col min-h-screen shadow-xl"
      style={{ background: 'linear-gradient(180deg, #1e3a8a 0%, #1e40af 60%, #1d4ed8 100%)' }}>
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/10">
        <span className="text-lg font-bold tracking-widest text-white">INPSASEL</span>
        <p className="text-xs text-blue-200 mt-0.5 truncate">{roleName}</p>
      </div>

      {/* Navegación */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all
              ${pathname === href
                ? 'bg-white/20 text-white shadow-sm'
                : 'text-blue-200 hover:bg-white/10 hover:text-white'
              }`}
          >
            {label}
          </Link>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-white/10">
        <form action={logoutAction}>
          <button
            type="submit"
            className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-blue-300
                       hover:bg-white/10 hover:text-white transition-all"
          >
            Cerrar sesión
          </button>
        </form>
      </div>
    </aside>
  )
}
