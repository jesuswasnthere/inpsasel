const { Client } = require('pg');

const config = {
  host: process.env.PGHOST || 'aws-1-us-east-1.pooler.supabase.com',
  port: parseInt(process.env.PGPORT || '6543', 10),
  database: process.env.PGDATABASE || 'postgres',
  user: process.env.PGUSER || 'postgres.ridmsexeymlbmvspzied',
  password: process.env.PGPASSWORD,
  ssl: { rejectUnauthorized: false }
};

if (!config.password) {
  console.error('Error: no hay PGPASSWORD definido. Exporta la contraseña en PGPASSWORD y vuelve a ejecutar.');
  console.error('Por ejemplo (PowerShell): $env:PGPASSWORD = "TU_PASSWORD"');
  process.exit(1);
}

const client = new Client(config);

(async () => {
  try {
    await client.connect();
    const res = await client.query('SELECT now() AS now, version() AS version');
    console.log('Conexión OK. Resultado de prueba:');
    console.log(res.rows[0]);
    await client.end();
  } catch (err) {
    console.error('Error de conexión:', err.message || err);
    process.exit(2);
  }
})();
