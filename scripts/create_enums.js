const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || '';
if (!connectionString) {
  console.error('Error: no hay DATABASE_URL definido. Define DATABASE_URL y vuelve a ejecutar.');
  process.exit(1);
}

const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });

(async () => {
  try {
    await client.connect();
    const sql = `
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_contacto_enum') THEN
    CREATE TYPE tipo_contacto_enum AS ENUM ('Individual', 'Empresa', 'Organización');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_visita_enum') THEN
    CREATE TYPE tipo_visita_enum AS ENUM ('Técnica', 'Comercial', 'Soporte', 'Inspección', 'Personal', 'Administrativa');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'estatus_enum') THEN
    CREATE TYPE estatus_enum AS ENUM ('Planificada', 'En Curso', 'Completada', 'Revisada', 'Cancelada', 'No Programada', 'Emergencia');
  END IF;
END
$$;
`;
    await client.query(sql);
    console.log('Enums creados o ya existentes.');
    await client.end();
  } catch (err) {
    console.error('Error creando enums:', err && err.message ? err.message : err);
    process.exit(2);
  }
})();
