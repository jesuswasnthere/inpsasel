import { z } from 'zod'

export const TIPOS_VISITA = [
  'Técnica', 'Comercial', 'Soporte', 'Inspección',
  'Personal', 'Administrativa', 'Consulta',
] as const

export const ESTATUS_VISITA = [
  'Planificada', 'En Curso', 'Completada', 'Revisada',
  'Cancelada', 'No Programada', 'Emergencia',
] as const

export const registrarVisitaSchema = z.object({
  codigo_visita: z.string().min(1).trim(),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato: YYYY-MM-DD'),
  hora: z.string().regex(/^\d{2}:\d{2}$/, 'Formato: HH:MM'),
  tipo_visita: z.enum(TIPOS_VISITA),
  estatus: z.enum(ESTATUS_VISITA),
  id_contacto: z.coerce.number().int().positive(),
  cordinacion_referida: z.string().optional(),
  observaciones: z.string().optional(),
  motivo_visita: z.string().optional(),
  sexo: z.string().optional(),
  edad: z.coerce.number().int().positive().optional(),
  municipio: z.string().optional(),
  sector: z.string().optional(),
  cargo: z.string().optional(),
  funcion: z.string().optional(),
  actividad_economica: z.string().optional(),
  funcionario: z.string().optional(),
})

export type RegistrarVisitaInput = z.infer<typeof registrarVisitaSchema>

export const eliminarVisitaSchema = z.object({
  codigo_visita: z.string().min(1, 'El código de visita es requerido').trim(),
})
