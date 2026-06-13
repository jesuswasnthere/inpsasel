import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'

export const metadata: Metadata = { title: 'Visitas del Día — INPSASEL' }

type Visita = Database['public']['Tables']['visitas']['Row']

export default async function VisitasDelDiaPage() {
  const supabase = await createClient()
  const hoy = new Date().toISOString().split('T')[0] // 'YYYY-MM-DD'

  const { data: visitas, error } = await supabase
    .from('visitas')
    .select(`
      id_visita,
      codigo_visita,
      hora,
      tipo_visita,
      estatus,
      motivo_visita,
      contactos ( nombre_completo, nombre_entidad )
    `)
    .eq('fecha', hoy)
    .order('hora', { ascending: true })

  if (error) {
    return <p className="text-red-600">Error al cargar visitas: {error.message}</p>
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Visitas del Día</h1>
      <p className="text-gray-500 mb-6">{hoy}</p>

      {visitas?.length === 0 ? (
        <p className="text-gray-400 text-center py-12">No hay visitas registradas para hoy.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Código', 'Hora', 'Contacto', 'Tipo', 'Estatus'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {visitas?.map((v: Visita & { contactos?: { nombre_completo: string | null; nombre_entidad: string } | null }) => (
                <tr key={v.id_visita} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs">{v.codigo_visita}</td>
                  <td className="px-4 py-3">{v.hora}</td>
                  <td className="px-4 py-3">{v.contactos?.nombre_completo ?? '—'}</td>
                  <td className="px-4 py-3">{v.tipo_visita}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800">
                      {v.estatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
