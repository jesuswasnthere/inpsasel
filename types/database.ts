/**
 * ESTE ARCHIVO ES GENERADO AUTOMÁTICAMENTE.
 * No editar manualmente — ejecutar: npm run types:db
 *
 * El esquema refleja las migraciones 001–006 aplicadas sobre PostgreSQL/Supabase.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      auditoria: {
        Row: {
          id_auditoria: number
          id_usuario: number | null
          accion: string
          tabla_afectada: string
          fecha_hora: string | null
        }
        Insert: {
          id_auditoria?: number
          id_usuario?: number | null
          accion: string
          tabla_afectada: string
          fecha_hora?: string | null
        }
        Update: {
          id_auditoria?: number
          id_usuario?: number | null
          accion?: string
          tabla_afectada?: string
          fecha_hora?: string | null
        }
        Relationships: [
          { foreignKeyName: 'fk_auditoria_usuario'; columns: ['id_usuario']; referencedRelation: 'usuarios'; referencedColumns: ['id_usuario'] }
        ]
      }
      contactos: {
        Row: {
          id_contacto: number
          cedula_rif: string
          nombre_completo: string | null
          entidad: string | null
          nombre_entidad: string
          telefono: string | null
          tipo_contacto: Database['public']['Enums']['tipo_contacto_enum']
        }
        Insert: {
          id_contacto?: number
          cedula_rif: string
          nombre_completo?: string | null
          entidad?: string | null
          nombre_entidad: string
          telefono?: string | null
          tipo_contacto: Database['public']['Enums']['tipo_contacto_enum']
        }
        Update: Partial<Database['public']['Tables']['contactos']['Insert']>
        Relationships: []
      }
      departamento: {
        Row: {
          id_departamento: number
          id_empresa: number
          nombre_departamento: string
        }
        Insert: {
          id_departamento?: number
          id_empresa: number
          nombre_departamento: string
        }
        Update: Partial<Database['public']['Tables']['departamento']['Insert']>
        Relationships: [
          { foreignKeyName: 'fk_departamento_empresa'; columns: ['id_empresa']; referencedRelation: 'empresa'; referencedColumns: ['id_empresa'] }
        ]
      }
      empleado: {
        Row: {
          id_empleado: number
          id_departamento: number
          cedula: string
          nombres: string
          apellidos: string
          cargo_tecnico: string | null
        }
        Insert: {
          id_empleado?: number
          id_departamento: number
          cedula: string
          nombres: string
          apellidos: string
          cargo_tecnico?: string | null
        }
        Update: Partial<Database['public']['Tables']['empleado']['Insert']>
        Relationships: [
          { foreignKeyName: 'fk_empleado_departamento'; columns: ['id_departamento']; referencedRelation: 'departamento'; referencedColumns: ['id_departamento'] }
        ]
      }
      empresa: {
        Row: {
          id_empresa: number
          rif: string
          razon_social: string
          direccion_fiscal: string | null
        }
        Insert: {
          id_empresa?: number
          rif: string
          razon_social: string
          direccion_fiscal?: string | null
        }
        Update: Partial<Database['public']['Tables']['empresa']['Insert']>
        Relationships: []
      }
      maestra: {
        Row: {
          id_maestra: number
          tabla_referencia: string
          clave_parametro: string
          valor_parametro: string
          activo: boolean | null
        }
        Insert: {
          id_maestra?: number
          tabla_referencia: string
          clave_parametro: string
          valor_parametro: string
          activo?: boolean | null
        }
        Update: Partial<Database['public']['Tables']['maestra']['Insert']>
        Relationships: []
      }
      ordenes_trabajo: {
        Row: {
          id_orden: number
          codigo_ot: string
          detalle: string | null
        }
        Insert: {
          id_orden?: number
          codigo_ot: string
          detalle?: string | null
        }
        Update: Partial<Database['public']['Tables']['ordenes_trabajo']['Insert']>
        Relationships: []
      }
      roles: {
        Row: {
          id_rol: number
          nombre_rol: string
        }
        Insert: {
          id_rol?: number
          nombre_rol: string
        }
        Update: Partial<Database['public']['Tables']['roles']['Insert']>
        Relationships: []
      }
      usuarios: {
        Row: {
          id_usuario: number
          id_rol: number
          id_empleado: number | null
          nombre_completo: string
          username: string
          password: string
        }
        Insert: {
          id_usuario?: number
          id_rol: number
          id_empleado?: number | null
          nombre_completo: string
          username: string
          password: string
        }
        Update: Partial<Database['public']['Tables']['usuarios']['Insert']>
        Relationships: [
          { foreignKeyName: 'fk_usuario_rol'; columns: ['id_rol']; referencedRelation: 'roles'; referencedColumns: ['id_rol'] },
          { foreignKeyName: 'fk_usuario_empleado'; columns: ['id_empleado']; referencedRelation: 'empleado'; referencedColumns: ['id_empleado'] }
        ]
      }
      visitas: {
        Row: {
          id_visita: number
          codigo_visita: string
          fecha: string
          hora: string
          tipo_visita: Database['public']['Enums']['tipo_visita_enum']
          estatus: Database['public']['Enums']['estatus_enum']
          cordinacion_referida: string | null
          observaciones: string | null
          id_contacto: number
          id_usuario: number
          id_orden: number | null
          // Columnas añadidas en migrations 004 y 006
          sexo: string | null
          edad: number | null
          municipio: string | null
          sector: string | null
          cargo: string | null
          funcion: string | null
          actividad_economica: string | null
          funcionario: string | null
          motivo_visita: string | null
        }
        Insert: {
          id_visita?: number
          codigo_visita: string
          fecha: string
          hora: string
          tipo_visita: Database['public']['Enums']['tipo_visita_enum']
          estatus: Database['public']['Enums']['estatus_enum']
          cordinacion_referida?: string | null
          observaciones?: string | null
          id_contacto: number
          id_usuario: number
          id_orden?: number | null
          sexo?: string | null
          edad?: number | null
          municipio?: string | null
          sector?: string | null
          cargo?: string | null
          funcion?: string | null
          actividad_economica?: string | null
          funcionario?: string | null
          motivo_visita?: string | null
        }
        Update: Partial<Database['public']['Tables']['visitas']['Insert']>
        Relationships: [
          { foreignKeyName: 'fk_visita_contacto'; columns: ['id_contacto']; referencedRelation: 'contactos'; referencedColumns: ['id_contacto'] },
          { foreignKeyName: 'fk_visita_usuario'; columns: ['id_usuario']; referencedRelation: 'usuarios'; referencedColumns: ['id_usuario'] },
          { foreignKeyName: 'fk_visita_orden'; columns: ['id_orden']; referencedRelation: 'ordenes_trabajo'; referencedColumns: ['id_orden'] }
        ]
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      tipo_contacto_enum: 'Individual' | 'Empresa' | 'Organización'
      tipo_visita_enum: 'Técnica' | 'Comercial' | 'Soporte' | 'Inspección' | 'Personal' | 'Administrativa' | 'Consulta'
      estatus_enum: 'Planificada' | 'En Curso' | 'Completada' | 'Revisada' | 'Cancelada' | 'No Programada' | 'Emergencia'
    }
    CompositeTypes: Record<string, never>
  }
}
