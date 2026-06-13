-- ════════════════════════════════════════════════════════════════════
--  INPSASEL — Schema completo para Supabase (PostgreSQL)
--  Consolida las migraciones 001–006.
--
--  Ejecutar en: Supabase Dashboard → SQL Editor → New query
--  ⚠️  BORRA las tablas existentes antes de recrearlas.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── Limpiar schema anterior (si existe) ──────────────────────────────
DROP TABLE IF EXISTS VISITAS        CASCADE;
DROP TABLE IF EXISTS ORDENES_TRABAJO CASCADE;
DROP TABLE IF EXISTS CONTACTOS      CASCADE;
DROP TABLE IF EXISTS AUDITORIA      CASCADE;
DROP TABLE IF EXISTS USUARIOS       CASCADE;
DROP TABLE IF EXISTS EMPLEADO       CASCADE;
DROP TABLE IF EXISTS DEPARTAMENTO   CASCADE;
DROP TABLE IF EXISTS EMPRESA        CASCADE;
DROP TABLE IF EXISTS ROLES          CASCADE;
DROP TABLE IF EXISTS MAESTRA        CASCADE;

DROP TYPE IF EXISTS tipo_contacto_enum CASCADE;
DROP TYPE IF EXISTS tipo_visita_enum   CASCADE;
DROP TYPE IF EXISTS estatus_enum       CASCADE;

-- ── Tipos ENUM ───────────────────────────────────────────────────────
CREATE TYPE tipo_contacto_enum AS ENUM (
  'Individual', 'Empresa', 'Organización'
);

-- Incluye 'Consulta' (migration 005)
CREATE TYPE tipo_visita_enum AS ENUM (
  'Técnica', 'Comercial', 'Soporte', 'Inspección',
  'Personal', 'Administrativa', 'Consulta'
);

CREATE TYPE estatus_enum AS ENUM (
  'Planificada', 'En Curso', 'Completada', 'Revisada',
  'Cancelada', 'No Programada', 'Emergencia'
);

-- ── Tablas sin dependencias ──────────────────────────────────────────
CREATE TABLE MAESTRA (
  id_maestra       SERIAL PRIMARY KEY,
  tabla_referencia VARCHAR(100) NOT NULL,
  clave_parametro  VARCHAR(100) NOT NULL,
  valor_parametro  VARCHAR(255) NOT NULL,
  activo           BOOLEAN DEFAULT TRUE
);

CREATE TABLE EMPRESA (
  id_empresa      SERIAL PRIMARY KEY,
  rif             VARCHAR(20)  UNIQUE NOT NULL,
  razon_social    VARCHAR(255) NOT NULL,
  direccion_fiscal TEXT
);

CREATE TABLE ROLES (
  id_rol     SERIAL PRIMARY KEY,
  nombre_rol VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE CONTACTOS (
  id_contacto    SERIAL PRIMARY KEY,
  cedula_rif     VARCHAR(20)  NOT NULL,
  nombre_completo VARCHAR(255),
  entidad        VARCHAR(255),
  nombre_entidad VARCHAR(255) NOT NULL,
  telefono       VARCHAR(20),
  tipo_contacto  tipo_contacto_enum NOT NULL
);

CREATE TABLE ORDENES_TRABAJO (
  id_orden   SERIAL PRIMARY KEY,
  codigo_ot  VARCHAR(20) UNIQUE NOT NULL,
  detalle    TEXT
);

-- ── Tablas de primer nivel ───────────────────────────────────────────
CREATE TABLE DEPARTAMENTO (
  id_departamento    SERIAL PRIMARY KEY,
  id_empresa         INTEGER NOT NULL,
  nombre_departamento VARCHAR(150) NOT NULL,
  CONSTRAINT fk_departamento_empresa
    FOREIGN KEY (id_empresa) REFERENCES EMPRESA(id_empresa) ON DELETE CASCADE
);

-- ── Tablas de segundo nivel ──────────────────────────────────────────
CREATE TABLE EMPLEADO (
  id_empleado     SERIAL PRIMARY KEY,
  id_departamento INTEGER NOT NULL,
  cedula          VARCHAR(20)  UNIQUE NOT NULL,
  nombres         VARCHAR(100) NOT NULL,
  apellidos       VARCHAR(100) NOT NULL,
  cargo_tecnico   VARCHAR(100),
  CONSTRAINT fk_empleado_departamento
    FOREIGN KEY (id_departamento) REFERENCES DEPARTAMENTO(id_departamento) ON DELETE SET NULL
);

-- ── Usuarios y Auditoría ─────────────────────────────────────────────
CREATE TABLE USUARIOS (
  id_usuario      SERIAL PRIMARY KEY,
  id_rol          INTEGER NOT NULL,
  id_empleado     INTEGER,
  nombre_completo VARCHAR(255) NOT NULL,
  username        VARCHAR(50)  UNIQUE NOT NULL,
  password        VARCHAR(255) NOT NULL,
  CONSTRAINT fk_usuario_rol
    FOREIGN KEY (id_rol) REFERENCES ROLES(id_rol) ON DELETE RESTRICT,
  CONSTRAINT fk_usuario_empleado
    FOREIGN KEY (id_empleado) REFERENCES EMPLEADO(id_empleado) ON DELETE SET NULL
);

CREATE TABLE AUDITORIA (
  id_auditoria   SERIAL PRIMARY KEY,
  id_usuario     INTEGER,
  accion         VARCHAR(255) NOT NULL,
  tabla_afectada VARCHAR(100) NOT NULL,
  fecha_hora     TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_auditoria_usuario
    FOREIGN KEY (id_usuario) REFERENCES USUARIOS(id_usuario) ON DELETE SET NULL
);

-- ── VISITAS (incluye columnas de migraciones 001, 004 y 006) ─────────
CREATE TABLE VISITAS (
  id_visita          SERIAL PRIMARY KEY,
  codigo_visita      VARCHAR(20)  UNIQUE NOT NULL,
  fecha              DATE         NOT NULL,
  hora               TIME         NOT NULL,
  tipo_visita        tipo_visita_enum NOT NULL,
  estatus            estatus_enum     NOT NULL,
  -- migration 001
  cordinacion_referida VARCHAR(255),
  observaciones        TEXT,
  -- claves foráneas
  id_contacto        INTEGER NOT NULL,
  -- Nullable: la identidad del registrador se obtiene de Supabase Auth (user_metadata.id_usuario).
  -- Sin FK a USUARIOS porque la autenticación migró a auth.users.
  id_usuario         INTEGER,
  id_orden           INTEGER,
  -- migration 004
  sexo               VARCHAR(20),
  edad               INTEGER,
  municipio          VARCHAR(255),
  sector             VARCHAR(100),
  cargo              VARCHAR(255),
  funcion            VARCHAR(50),
  actividad_economica VARCHAR(255),
  funcionario        VARCHAR(255),
  -- migration 006
  motivo_visita      TEXT,

  CONSTRAINT fk_visita_contacto
    FOREIGN KEY (id_contacto) REFERENCES CONTACTOS(id_contacto) ON DELETE RESTRICT,
  CONSTRAINT fk_visita_orden
    FOREIGN KEY (id_orden)    REFERENCES ORDENES_TRABAJO(id_orden) ON DELETE SET NULL
);

-- ── Datos iniciales: Roles ───────────────────────────────────────────
INSERT INTO ROLES (nombre_rol) VALUES
  ('Administrador'),
  ('Admin'),
  ('Registro y calendario')
ON CONFLICT (nombre_rol) DO NOTHING;

COMMIT;
