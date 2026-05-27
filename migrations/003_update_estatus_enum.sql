-- Migration: align estatus_enum with current form values
-- Safe to run on existing database; adds missing values if they do not exist
BEGIN;

ALTER TYPE estatus_enum ADD VALUE IF NOT EXISTS 'Procesada';
ALTER TYPE estatus_enum ADD VALUE IF NOT EXISTS 'Rechasada';
ALTER TYPE estatus_enum ADD VALUE IF NOT EXISTS 'En Revision';
ALTER TYPE estatus_enum ADD VALUE IF NOT EXISTS 'Otras';

COMMIT;
