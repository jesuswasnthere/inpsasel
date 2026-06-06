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
    console.log('Conectado, creando tablas core si no existen...');

    const statements = [
      `CREATE TABLE IF NOT EXISTS ROLES (
        id_rol SERIAL PRIMARY KEY,
        nombre_rol VARCHAR(100) NOT NULL UNIQUE
      );`,

      `CREATE TABLE IF NOT EXISTS EMPRESA (
        id_empresa SERIAL PRIMARY KEY,
        rif VARCHAR(20) UNIQUE NOT NULL,
        razon_social VARCHAR(255) NOT NULL,
        direccion_fiscal TEXT
      );`,

      `CREATE TABLE IF NOT EXISTS DEPARTAMENTO (
        id_departamento SERIAL PRIMARY KEY,
        id_empresa INTEGER NOT NULL,
        nombre_departamento VARCHAR(150) NOT NULL,
        CONSTRAINT fk_departamento_empresa FOREIGN KEY (id_empresa) REFERENCES EMPRESA(id_empresa) ON DELETE CASCADE
      );`,

      `CREATE TABLE IF NOT EXISTS EMPLEADO (
        id_empleado SERIAL PRIMARY KEY,
        id_departamento INTEGER NOT NULL,
        cedula VARCHAR(20) UNIQUE NOT NULL,
        nombres VARCHAR(100) NOT NULL,
        apellidos VARCHAR(100) NOT NULL,
        cargo_tecnico VARCHAR(100),
        CONSTRAINT fk_empleado_departamento FOREIGN KEY (id_departamento) REFERENCES DEPARTAMENTO(id_departamento) ON DELETE SET NULL
      );`,

      `CREATE TABLE IF NOT EXISTS USUARIOS (
        id_usuario SERIAL PRIMARY KEY,
        id_rol INTEGER NOT NULL,
        id_empleado INTEGER,
        nombre_completo VARCHAR(255) NOT NULL,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        CONSTRAINT fk_usuario_rol FOREIGN KEY (id_rol) REFERENCES ROLES(id_rol) ON DELETE RESTRICT,
        CONSTRAINT fk_usuario_empleado FOREIGN KEY (id_empleado) REFERENCES EMPLEADO(id_empleado) ON DELETE SET NULL
      );`,

      `CREATE TABLE IF NOT EXISTS AUDITORIA (
        id_auditoria SERIAL PRIMARY KEY,
        id_usuario INTEGER,
        accion VARCHAR(255) NOT NULL,
        tabla_afectada VARCHAR(100) NOT NULL,
        fecha_hora TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_auditoria_usuario FOREIGN KEY (id_usuario) REFERENCES USUARIOS(id_usuario) ON DELETE SET NULL
      );`,

      `CREATE TABLE IF NOT EXISTS MAESTRA (
        id_maestra SERIAL PRIMARY KEY,
        tabla_referencia VARCHAR(100) NOT NULL,
        clave_parametro VARCHAR(100) NOT NULL,
        valor_parametro VARCHAR(255) NOT NULL,
        activo BOOLEAN DEFAULT TRUE
      );`,

      `CREATE TABLE IF NOT EXISTS CONTACTOS (
        id_contacto SERIAL PRIMARY KEY,
        cedula_rif VARCHAR(20) NOT NULL,
        nombre_completo VARCHAR(255),
        entidad VARCHAR(255),
        nombre_entidad VARCHAR(255) NOT NULL,
        telefono VARCHAR(20),
        tipo_contacto tipo_contacto_enum NOT NULL
      );`,

      `CREATE TABLE IF NOT EXISTS ORDENES_TRABAJO (
        id_orden SERIAL PRIMARY KEY,
        codigo_ot VARCHAR(20) UNIQUE NOT NULL,
        detalle TEXT
      );`,

      `CREATE TABLE IF NOT EXISTS VISITAS (
        id_visita SERIAL PRIMARY KEY,
        codigo_visita VARCHAR(20) UNIQUE NOT NULL,
        fecha DATE NOT NULL,
        hora TIME NOT NULL,
        tipo_visita tipo_visita_enum NOT NULL,
        estatus estatus_enum NOT NULL,
        cordinacion_referida VARCHAR(255),
        observaciones TEXT,
        id_contacto INTEGER NOT NULL,
        id_usuario INTEGER NOT NULL,
        id_orden INTEGER,
        CONSTRAINT fk_visita_contacto FOREIGN KEY (id_contacto) REFERENCES CONTACTOS(id_contacto) ON DELETE RESTRICT,
        CONSTRAINT fk_visita_usuario FOREIGN KEY (id_usuario) REFERENCES USUARIOS(id_usuario) ON DELETE RESTRICT,
        CONSTRAINT fk_visita_orden FOREIGN KEY (id_orden) REFERENCES ORDENES_TRABAJO(id_orden) ON DELETE SET NULL
      );`
    ];

    for (const s of statements) {
      try {
        await client.query(s);
        console.log('OK:', s.split('\n')[0]);
      } catch (err) {
        console.warn('Aviso ejecutando statement:', err && err.message ? err.message : err);
      }
    }

    console.log('Creación de tablas core finalizada.');
    await client.end();
  } catch (err) {
    console.error('Error creando tablas core:', err && err.message ? err.message : err);
    process.exit(2);
  }
})();
