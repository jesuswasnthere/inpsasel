-- Migration 005: Añadir valor 'Consulta' al enum tipo_visita_enum si no existe
BEGIN;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'tipo_visita_enum' AND e.enumlabel = 'Consulta'
  ) THEN
    ALTER TYPE tipo_visita_enum ADD VALUE 'Consulta';
  END IF;
END
$$;
COMMIT;
