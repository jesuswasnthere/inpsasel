require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const app = require('./src/app');
const { databaseUrl, databaseHost } = require('./src/config/db');
const { ensureDefaultUserExists, ensureReadonlyUserExists } = require('./src/controllers/authController');

const port = Number(process.env.PORT || 3000);

async function runMigrationsIfNeeded() {
  const migrationsRunner = path.join(__dirname, 'apply_migrations.js');
  if (!fs.existsSync(migrationsRunner)) {
    return;
  }

  return new Promise((resolve) => {
    console.log('Ejecutando migraciones en la base de datos (si hay nuevas)...');
    const child = execFile(process.execPath, [migrationsRunner], { env: process.env }, (error, stdout, stderr) => {
      if (error) {
        console.warn('Advertencia: las migraciones retornaron un error. Esto puede ser seguro si las migraciones usan IF NOT EXISTS.');
        console.warn(error && error.message ? error.message : error);
      }
      if (stdout) console.log(stdout.toString());
      if (stderr) console.error(stderr.toString());
      resolve();
    });
    // Safety timeout: si tarda mucho, no bloqueamos el inicio indefinidamente
    setTimeout(() => {
      try { child.kill(); } catch (e) {}
      resolve();
    }, 30 * 1000);
  });
}

function logStartupDbError(err) {
  const dbHost = databaseUrl ? '(connection string)' : (databaseHost || '127.0.0.1');
  const dbPort = Number(process.env.DB_PORT || 5432);

  if (err && err.code === 'ECONNREFUSED') {
    console.error('No se pudo conectar a PostgreSQL.');
    console.error(`Intento de conexión: ${dbHost}:${dbPort}`);
    console.error('Verifique que el servicio de PostgreSQL esté iniciado y escuchando en ese host/puerto.');
    console.error('Si está en Windows, puede iniciarlo desde una consola con permisos de administrador.');
    return;
  }

  console.error('No se pudo iniciar el servidor:', err);
}

async function startServer() {
  const maxAttempts = 5;
  let currentPort = port;

  try {
    await runMigrationsIfNeeded();
  } catch (err) {
    console.warn('Error ejecutando migraciones al inicio (continuando):', err && err.message ? err.message : err);
  }
  try {
    await ensureDefaultUserExists();
  } catch (err) {
    console.warn('Error asegurando usuario por defecto (continuando):', err && err.message ? err.message : err);
  }
  try {
    await ensureReadonlyUserExists();
  } catch (err) {
    console.warn('Error asegurando usuario reducido (continuando):', err && err.message ? err.message : err);
  }

  async function tryListen(p) {
    return new Promise((resolve, reject) => {
      const server = app.listen(p, () => resolve(server));
      server.on('error', (err) => reject(err));
    });
  }

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const server = await tryListen(currentPort);
      console.log(`Servidor corriendo en http://localhost:${currentPort}`);
      return;
    } catch (err) {
      if (err && err.code === 'EADDRINUSE') {
        console.error(`Puerto ${currentPort} ya está en uso.`);
        if (attempt < maxAttempts - 1) {
          currentPort += 1;
          console.log(`Intentando puerto ${currentPort}...`);
          continue;
        }
        console.error('No se pudo iniciar el servidor: puerto en uso. Usa otra variable PORT o libera el puerto.');
        process.exit(1);
      }

      logStartupDbError(err);
      process.exit(1);
    }
  }
}

if (require.main === module) {
  startServer();
}

module.exports = app;
