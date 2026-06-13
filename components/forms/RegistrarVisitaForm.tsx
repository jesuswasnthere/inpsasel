'use client'

import { useActionState } from 'react'
import { registrarVisitaAction } from '@/actions/visitas'
import { TIPOS_VISITA, ESTATUS_VISITA } from '@/lib/validations/visita.schema'

export function RegistrarVisitaForm() {
  const [state, action, isPending] = useActionState(registrarVisitaAction, null)

  return (
    <form action={action} className="card space-y-6">

      {/* Sección: Datos de la visita */}
      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          Datos de la Visita
        </legend>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Fecha" name="fecha" type="date" required />
          <Field label="Hora" name="hora" type="time" required />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Visita</label>
            <select name="tipo_visita" required className="input-field">
              <option value="">Seleccionar...</option>
              {TIPOS_VISITA.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estatus</label>
            <select name="estatus" required className="input-field">
              <option value="">Seleccionar...</option>
              {ESTATUS_VISITA.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>

          <Field label="Coordinación Referida" name="cordinacion_referida" placeholder="Opcional" />
        </div>

        <Field label="Motivo de Visita" name="motivo_visita" placeholder="Describe el motivo..." />
        <Field label="Observaciones" name="observaciones" placeholder="Observaciones adicionales..." />
      </fieldset>

      {/* Sección: Datos del contacto/visitante */}
      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          Datos del Visitante
        </legend>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="ID Contacto" name="id_contacto" type="number" required placeholder="ID en el sistema" />
          <Field label="Funcionario" name="funcionario" placeholder="Funcionario responsable" />
          <Field label="Sexo" name="sexo" placeholder="Masculino / Femenino" />
          <Field label="Edad" name="edad" type="number" placeholder="Años" />
          <Field label="Municipio" name="municipio" />
          <Field label="Sector" name="sector" />
          <Field label="Cargo" name="cargo" />
          <Field label="Función" name="funcion" />
          <Field label="Actividad Económica" name="actividad_economica" />
        </div>
      </fieldset>

      {/* Mensajes de estado */}
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
        {isPending ? 'Registrando...' : 'Registrar Visita'}
      </button>
    </form>
  )
}

// Componente auxiliar para evitar repetición
function Field({
  label, name, type = 'text', required = false, placeholder = '',
}: {
  label: string
  name: string
  type?: string
  required?: boolean
  placeholder?: string
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
        placeholder={placeholder}
        className="input-field"
      />
    </div>
  )
}
