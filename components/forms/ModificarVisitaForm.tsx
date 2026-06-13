'use client'

import { useActionState } from 'react'
import { modificarVisitaAction } from '@/actions/visitas'
import { TIPOS_VISITA, ESTATUS_VISITA } from '@/lib/validations/visita.schema'
import type { Database } from '@/types/database'

type VisitaRow = Database['public']['Tables']['visitas']['Row']

interface ModificarVisitaFormProps {
  visita: VisitaRow
}

export function ModificarVisitaForm({ visita }: ModificarVisitaFormProps) {
  const [state, action, isPending] = useActionState(modificarVisitaAction, null)

  return (
    <form action={action} className="card space-y-6">
      {/* Campo oculto — identificador de negocio */}
      <input type="hidden" name="codigo_visita" value={visita.codigo_visita} />

      {/* Encabezado del registro */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-800">
            {visita.codigo_visita}
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">Editando campos modificables</p>
        </div>
        <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800">
          {visita.estatus}
        </span>
      </div>

      {/* Datos de la visita */}
      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          Datos de la Visita
        </legend>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            label="Fecha"
            name="fecha"
            type="date"
            required
            defaultValue={visita.fecha}
          />
          <Field
            label="Hora"
            name="hora"
            type="time"
            required
            defaultValue={visita.hora}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Visita <span className="text-red-500">*</span>
            </label>
            <select name="tipo_visita" required defaultValue={visita.tipo_visita} className="input-field">
              {TIPOS_VISITA.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estatus <span className="text-red-500">*</span>
            </label>
            <select name="estatus" required defaultValue={visita.estatus} className="input-field">
              {ESTATUS_VISITA.map((e) => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
          </div>

          <Field
            label="ID Contacto"
            name="id_contacto"
            type="number"
            required
            defaultValue={String(visita.id_contacto)}
          />
          <Field
            label="Coordinación Referida"
            name="cordinacion_referida"
            defaultValue={visita.cordinacion_referida ?? ''}
          />
        </div>

        <Field
          label="Motivo de Visita"
          name="motivo_visita"
          defaultValue={visita.motivo_visita ?? ''}
        />
        <Field
          label="Observaciones"
          name="observaciones"
          defaultValue={visita.observaciones ?? ''}
        />
      </fieldset>

      {/* Datos del visitante */}
      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          Datos del Visitante
        </legend>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Funcionario" name="funcionario" defaultValue={visita.funcionario ?? ''} />
          <Field label="Sexo" name="sexo" defaultValue={visita.sexo ?? ''} />
          <Field label="Edad" name="edad" type="number" defaultValue={visita.edad != null ? String(visita.edad) : ''} />
          <Field label="Municipio" name="municipio" defaultValue={visita.municipio ?? ''} />
          <Field label="Sector" name="sector" defaultValue={visita.sector ?? ''} />
          <Field label="Cargo" name="cargo" defaultValue={visita.cargo ?? ''} />
          <Field label="Función" name="funcion" defaultValue={visita.funcion ?? ''} />
          <Field label="Actividad Económica" name="actividad_economica" defaultValue={visita.actividad_economica ?? ''} />
        </div>
      </fieldset>

      {/* Estado */}
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

      <button type="submit" disabled={isPending} className="btn-primary w-full">
        {isPending ? 'Guardando...' : 'Guardar Cambios'}
      </button>
    </form>
  )
}

function Field({
  label,
  name,
  type = 'text',
  required = false,
  defaultValue = '',
}: {
  label: string
  name: string
  type?: string
  required?: boolean
  defaultValue?: string
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        className="input-field"
      />
    </div>
  )
}
