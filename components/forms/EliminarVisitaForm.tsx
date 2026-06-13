'use client'

import { useActionState } from 'react'
import { eliminarVisitaAction } from '@/actions/visitas'

export function EliminarVisitaForm() {
  const [state, action, isPending] = useActionState(eliminarVisitaAction, null)

  return (
    <form action={action} className="space-y-4 bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div>
        <label htmlFor="codigo_visita" className="block text-sm font-medium text-gray-700 mb-1">
          Código de Visita
        </label>
        <input
          id="codigo_visita"
          name="codigo_visita"
          type="text"
          required
          className="input-field"
          placeholder="Ej: VIS-2024-001"
        />
      </div>

      {state && 'error' in state && (
        <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {state.error}
        </p>
      )}

      {state && 'success' in state && (
        <p role="status" className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2">
          {state.success}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full inline-flex items-center justify-center rounded-md bg-red-600 px-4 py-2
                   text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
      >
        {isPending ? 'Eliminando...' : 'Eliminar Visita'}
      </button>
    </form>
  )
}
