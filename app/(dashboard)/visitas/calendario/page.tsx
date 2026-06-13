import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Calendario de Visitas — INPSASEL' }

export default async function CalendarioPage() {
  const supabase = await createClient()

  // Obtener las visitas del mes actual agrupadas por fecha
  const hoy = new Date()
  const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0]
  const ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).toISOString().split('T')[0]

  const { data: visitas } = await supabase
    .from('visitas')
    .select('fecha, codigo_visita, hora, tipo_visita, estatus')
    .gte('fecha', primerDia)
    .lte('fecha', ultimoDia)
    .order('fecha', { ascending: true })
    .order('hora',  { ascending: true })

  // Agrupar por fecha
  const porFecha = (visitas ?? []).reduce<Record<string, typeof visitas>>((acc, v) => {
    if (!v) return acc
    acc[v.fecha] = acc[v.fecha] ?? []
    acc[v.fecha]!.push(v)
    return acc
  }, {})

  const nombreMes = hoy.toLocaleString('es-VE', { month: 'long', year: 'numeric' })

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 capitalize">
          Calendario de Visitas
        </h1>
        <p className="text-gray-500 text-sm mt-1 capitalize">{nombreMes}</p>
      </div>

      {Object.keys(porFecha).length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-8 py-12 text-center">
          <p className="text-gray-400">No hay visitas registradas este mes.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(porFecha).map(([fecha, visitas]) => (
            <div key={fecha} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Encabezado de fecha */}
              <div className="px-5 py-3 border-b border-gray-100" style={{ background: '#1a2744' }}>
                <span className="text-sm font-semibold text-white">
                  {new Date(fecha + 'T00:00:00').toLocaleDateString('es-VE', {
                    weekday: 'long', day: 'numeric', month: 'long',
                  })}
                </span>
                <span className="ml-2 text-xs text-blue-200">
                  {visitas?.length} visita{(visitas?.length ?? 0) !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Lista de visitas del día */}
              <div className="divide-y divide-gray-50">
                {visitas?.map((v) => v && (
                  <div key={v.codigo_visita} className="flex items-center gap-4 px-5 py-3">
                    <span className="text-sm font-mono text-gray-500 w-14 shrink-0">{v.hora}</span>
                    <span className="text-sm font-medium text-gray-800 flex-1">{v.codigo_visita}</span>
                    <span className="text-xs text-gray-500">{v.tipo_visita}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${estatusColor(v.estatus)}`}>
                      {v.estatus}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function estatusColor(estatus: string): string {
  const map: Record<string, string> = {
    'Planificada':    'bg-blue-50 text-blue-700',
    'En Curso':       'bg-yellow-50 text-yellow-700',
    'Completada':     'bg-green-50 text-green-700',
    'Revisada':       'bg-purple-50 text-purple-700',
    'Cancelada':      'bg-red-50 text-red-700',
    'No Programada':  'bg-gray-100 text-gray-600',
    'Emergencia':     'bg-orange-50 text-orange-700',
  }
  return map[estatus] ?? 'bg-gray-100 text-gray-600'
}
