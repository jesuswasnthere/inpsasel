const { Pool } = require('pg');

const DB_CONNECTION_TIMEOUT_MS = Number(process.env.DB_CONNECTION_TIMEOUT_MS || 5000);
const DB_QUERY_TIMEOUT_MS = Number(process.env.DB_QUERY_TIMEOUT_MS || 10000);

const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.DATABASE_URL_UNPOOLED || process.env.POSTGRES_URL_NON_POOLING || '';
const databaseHost = process.env.DB_HOST || '';
let useSsl;
if (typeof process.env.DB_SSL !== 'undefined') {
  useSsl = process.env.DB_SSL === 'true';
} else if (databaseUrl) {
  try {
    const parsed = new URL(databaseUrl);
    const hostFromUrl = parsed.hostname || '';
    useSsl = !(hostFromUrl === 'localhost' || hostFromUrl === '127.0.0.1' || hostFromUrl === '');
  } catch (err) {
    useSsl = Boolean(databaseHost) && databaseHost !== '127.0.0.1' && databaseHost !== 'localhost';
  }
} else {
  useSsl = Boolean(databaseHost) && databaseHost !== '127.0.0.1' && databaseHost !== 'localhost';
}

const pool = databaseUrl
  ? new Pool({
    connectionString: databaseUrl,
    ssl: useSsl ? { rejectUnauthorized: false } : undefined,
    connectionTimeoutMillis: DB_CONNECTION_TIMEOUT_MS,
    query_timeout: DB_QUERY_TIMEOUT_MS,
  })
  : new Pool({
    user: process.env.DB_USER || process.env.PGUSER || 'tu_usuario',
    host: databaseHost || process.env.PGHOST || '127.0.0.1',
    database: process.env.DB_NAME || process.env.PGDATABASE || 'ipsasel_db',
    password: process.env.DB_PASSWORD || process.env.PGPASSWORD || 'tu_password',
    port: Number(process.env.DB_PORT || process.env.PGPORT || 5432),
    ssl: useSsl ? { rejectUnauthorized: false } : undefined,
    connectionTimeoutMillis: DB_CONNECTION_TIMEOUT_MS,
    query_timeout: DB_QUERY_TIMEOUT_MS,
  });

pool.on('error', (err) => {
  console.error('PostgreSQL pool error:', err && err.message ? err.message : err);
});

module.exports = {
  pool,
  databaseUrl,
  databaseHost,
};
