-- Migration: Add cordinacion_referida and observaciones to VISITAS
-- Safe: uses IF NOT EXISTS to avoid errors on repeated runs
BEGIN;

ALTER TABLE IF EXISTS VISITAS
  ADD COLUMN IF NOT EXISTS cordinacion_referida VARCHAR(255);

ALTER TABLE IF EXISTS VISITAS
  ADD COLUMN IF NOT EXISTS observaciones TEXT;

COMMIT;
