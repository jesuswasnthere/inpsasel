const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { pool, databaseUrl, databaseHost } = require('../config/db');
const {
  establishLoginSession,
  sanitizeRedirect,
  clearAuthCookie,
  DEFAULT_USER_ID,
  READONLY_VISIT_ROLE_NAME,
} = require('../middlewares/auth');

const APP_ADMIN_USERNAME = (process.env.APP_ADMIN_USERNAME || '').trim();
const APP_ADMIN_PASSWORD = (process.env.APP_ADMIN_PASSWORD || '').trim();
const APP_ADMIN_PASSWORD_HASH = (process.env.APP_ADMIN_PASSWORD_HASH || '').trim();
const APP_ADMIN_NAME = (process.env.APP_ADMIN_NAME || 'Administrador INPSASEL').trim();

const READONLY_USER_USERNAME = (process.env.READONLY_USER_USERNAME || '').trim();
const READONLY_USER_PASSWORD = (process.env.READONLY_USER_PASSWORD || '').trim();
const READONLY_USER_PASSWORD_HASH = (process.env.READONLY_USER_PASSWORD_HASH || '').trim();
const READONLY_USER_NAME = (process.env.READONLY_USER_NAME || 'Usuario de registro').trim();

function hasConfiguredDatabase() {
  if (!databaseUrl && process.env.VERCEL && ['127.0.0.1', 'localhost'].includes(databaseHost)) {
    return false;
  }

  return Boolean(
    databaseUrl ||
    process.env.DB_USER ||
    process.env.DB_HOST ||
    process.env.DB_NAME ||
    process.env.DB_PASSWORD ||
    process.env.PGUSER ||
    process.env.PGHOST ||
    process.env.PGDATABASE ||
    process.env.PGPASSWORD
  );
}

async function authenticateConfiguredAdmin(username, password) {
  if (!APP_ADMIN_USERNAME || username !== APP_ADMIN_USERNAME) {
    return null;
  }

  const configuredHash = (APP_ADMIN_PASSWORD_HASH || '').trim();
  const configuredPlain = (APP_ADMIN_PASSWORD || '').trim();

  let match = false;
  if (configuredHash) {
    match = await bcrypt.compare(password, configuredHash);
  } else if (configuredPlain) {
    match = password === configuredPlain;
  }

  if (!match) {
    return null;
  }

  if (!hasConfiguredDatabase()) {
    return {
      id_usuario: DEFAULT_USER_ID,
      username: APP_ADMIN_USERNAME,
      id_rol: null,
      roleName: 'Admin',
    };
  }

  try {
    let passwordForStorage = configuredHash;
    if (!passwordForStorage && configuredPlain) {
      const salt = await bcrypt.genSalt(10);
      passwordForStorage = await bcrypt.hash(configuredPlain, salt);
    }

    const roleResult = await pool.query(
      `INSERT INTO ROLES (nombre_rol)
       VALUES ($1)
       ON CONFLICT (nombre_rol) DO UPDATE SET nombre_rol = EXCLUDED.nombre_rol
       RETURNING id_rol, nombre_rol`,
      ['Admin']
    );

    const userResult = await pool.query(
      `INSERT INTO USUARIOS (id_rol, nombre_completo, username, password)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (username) DO UPDATE SET
         id_rol = EXCLUDED.id_rol,
         nombre_completo = EXCLUDED.nombre_completo,
         password = EXCLUDED.password
       RETURNING id_usuario, username, id_rol`,
      [
        roleResult.rows[0].id_rol,
        APP_ADMIN_NAME,
        APP_ADMIN_USERNAME,
        passwordForStorage,
      ]
    );

    return {
      ...userResult.rows[0],
      roleName: roleResult.rows[0].nombre_rol,
    };
  } catch (err) {
    console.warn('No se pudo sincronizar el usuario administrador en PostgreSQL:', err && err.message ? err.message : err);
    return {
      id_usuario: DEFAULT_USER_ID,
      username: APP_ADMIN_USERNAME,
      id_rol: null,
      roleName: 'Admin',
    };
  }
}

async function ensureDefaultUserExists() {
  const id = Number(DEFAULT_USER_ID || 0);
  if (!id || id <= 0) return;

  try {
    const check = await pool.query('SELECT id_usuario FROM USUARIOS WHERE id_usuario = $1', [id]);
    if (check.rows.length > 0) return;

    console.log(`Usuario por defecto id=${id} no existe. Intentando crear uno a partir de variables de entorno.`);

    let roleRes = await pool.query('SELECT id_rol FROM ROLES LIMIT 1');
    let id_rol;
    if (roleRes.rows.length === 0) {
      const ins = await pool.query("INSERT INTO ROLES (nombre_rol) VALUES ($1) RETURNING id_rol", ['Admin']);
      id_rol = ins.rows[0].id_rol;
    } else {
      id_rol = roleRes.rows[0].id_rol;
    }

    const username = (APP_ADMIN_USERNAME || '').trim() || `admin${id}`;
    let passwordHash = (APP_ADMIN_PASSWORD_HASH || '').trim();
    if (!passwordHash) {
      const plain = process.env.APP_ADMIN_PASSWORD || crypto.randomBytes(6).toString('hex');
      const salt = await bcrypt.genSalt(10);
      passwordHash = await bcrypt.hash(plain, salt);
      console.warn(`Se creó un usuario administrativo: username='${username}' id=${id}. Si se generó contraseña aleatoria, revisa los logs (no recomendable en producción).`);
    }

    const nombre = APP_ADMIN_NAME || username;

    await pool.query(
      `INSERT INTO USUARIOS (id_usuario, id_rol, id_empleado, nombre_completo, username, password)
       VALUES ($1, $2, NULL, $3, $4, $5)`,
      [id, id_rol, nombre, username, passwordHash]
    );

    console.log('Usuario por defecto creado satisfactoriamente.');
  } catch (err) {
    console.warn('No se pudo crear/verificar el usuario por defecto:', err && err.message ? err.message : err);
  }
}

async function ensureReadonlyUserExists() {
  const username = (process.env.READONLY_USER_USERNAME || '').trim();
  const passwordHashEnv = (process.env.READONLY_USER_PASSWORD_HASH || '').trim();
  const passwordPlain = (process.env.READONLY_USER_PASSWORD || '').trim();
  const fullName = (process.env.READONLY_USER_NAME || '').trim() || 'Usuario de registro';

  if (!username) {
    return;
  }

  try {
    let passwordHash = passwordHashEnv;
    if (!passwordHash) {
      if (!passwordPlain) {
        console.warn(`READONLY_USER_USERNAME está definido pero falta READONLY_USER_PASSWORD o READONLY_USER_PASSWORD_HASH.`);
        return;
      }
      const salt = await bcrypt.genSalt(10);
      passwordHash = await bcrypt.hash(passwordPlain, salt);
    }

    const roleResult = await pool.query(
      `INSERT INTO ROLES (nombre_rol)
       VALUES ($1)
       ON CONFLICT (nombre_rol) DO UPDATE SET nombre_rol = EXCLUDED.nombre_rol
       RETURNING id_rol, nombre_rol`,
      [READONLY_VISIT_ROLE_NAME]
    );

    const userResult = await pool.query(
      `INSERT INTO USUARIOS (id_rol, nombre_completo, username, password)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (username) DO UPDATE SET
         id_rol = EXCLUDED.id_rol,
         nombre_completo = EXCLUDED.nombre_completo,
         password = EXCLUDED.password
       RETURNING id_usuario, username, id_rol`,
      [roleResult.rows[0].id_rol, fullName, username, passwordHash]
    );

    console.log(`Usuario reducido listo: ${userResult.rows[0].username} (${READONLY_VISIT_ROLE_NAME}).`);
  } catch (err) {
    console.warn('No se pudo crear/sincronizar el usuario reducido:', err && err.message ? err.message : err);
  }
}

async function login(req, res) {
  const { username, password, next } = req.body;
  const redirectTo = sanitizeRedirect(next);

  if (!username || !password) {
    return res.redirect(303, `/login?error=${encodeURIComponent('Ingrese usuario y contrasena.')}&next=${encodeURIComponent(redirectTo)}`);
  }

  try {
    if (APP_ADMIN_USERNAME && username === APP_ADMIN_USERNAME) {
      const configuredAdmin = await authenticateConfiguredAdmin(username, password);
      if (configuredAdmin) {
        return establishLoginSession(req, res, configuredAdmin, redirectTo);
      }

      return res.redirect(303, `/login?error=${encodeURIComponent('Usuario o contraseña incorrectos.')}&next=${encodeURIComponent(redirectTo)}`);
    }

    const result = await pool.query(
      `SELECT u.id_usuario, u.username, u.password, u.id_rol, COALESCE(r.nombre_rol, '') AS roleName
       FROM USUARIOS u
       LEFT JOIN ROLES r ON r.id_rol = u.id_rol
       WHERE u.username = $1`,
      [username]
    );
    if (result.rows.length > 0) {
      const user = result.rows[0];
      const match = await bcrypt.compare(password, user.password);
      if (match) {
        return establishLoginSession(req, res, user, redirectTo);
      }
    }

    if (READONLY_USER_USERNAME && username === READONLY_USER_USERNAME) {
      let match = false;
      if (READONLY_USER_PASSWORD_HASH) {
        match = await bcrypt.compare(password, READONLY_USER_PASSWORD_HASH);
      } else if (READONLY_USER_PASSWORD) {
        match = password === READONLY_USER_PASSWORD;
      }

      if (match) {
        if (!hasConfiguredDatabase()) {
          const fallbackUser = {
            id_usuario: DEFAULT_USER_ID,
            username: READONLY_USER_USERNAME,
            id_rol: null,
            roleName: READONLY_VISIT_ROLE_NAME,
          };
          return establishLoginSession(req, res, fallbackUser, redirectTo);
        }

        try {
          let passwordForStorage = READONLY_USER_PASSWORD_HASH;
          if (!passwordForStorage && READONLY_USER_PASSWORD) {
            const salt = await bcrypt.genSalt(10);
            passwordForStorage = await bcrypt.hash(READONLY_USER_PASSWORD, salt);
          }

          const roleResult = await pool.query(
            `INSERT INTO ROLES (nombre_rol)
             VALUES ($1)
             ON CONFLICT (nombre_rol) DO UPDATE SET nombre_rol = EXCLUDED.nombre_rol
             RETURNING id_rol, nombre_rol`,
            [READONLY_VISIT_ROLE_NAME]
          );

          const userResult = await pool.query(
            `INSERT INTO USUARIOS (id_rol, nombre_completo, username, password)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (username) DO UPDATE SET
               id_rol = EXCLUDED.id_rol,
               nombre_completo = EXCLUDED.nombre_completo,
               password = EXCLUDED.password
             RETURNING id_usuario, username, id_rol`,
            [roleResult.rows[0].id_rol, READONLY_USER_NAME, READONLY_USER_USERNAME, passwordForStorage]
          );

          return establishLoginSession(req, res, { ...userResult.rows[0], roleName: roleResult.rows[0].nombre_rol }, redirectTo);
        } catch (err) {
          console.warn('No se pudo sincronizar el usuario reducido en PostgreSQL:', err && err.message ? err.message : err);
          const fallbackUser = {
            id_usuario: DEFAULT_USER_ID,
            username: READONLY_USER_USERNAME,
            id_rol: null,
            roleName: READONLY_VISIT_ROLE_NAME,
          };
          return establishLoginSession(req, res, fallbackUser, redirectTo);
        }
      }
    }

    return res.redirect(303, `/login?error=${encodeURIComponent('Usuario o contraseña incorrectos.')}&next=${encodeURIComponent(redirectTo)}`);
  } catch (err) {
    console.error(err);
    return res.redirect(303, `/login?error=${encodeURIComponent('No se pudo validar el acceso. Intente nuevamente.')}&next=${encodeURIComponent(redirectTo)}`);
  }
}

function logout(req, res) {
  clearAuthCookie(res);

  if (!req.session) {
    return res.redirect(303, '/login?logged_out=1');
  }

  return req.session.destroy(() => {
    res.redirect(303, '/login?logged_out=1');
  });
}

module.exports = {
  ensureDefaultUserExists,
  ensureReadonlyUserExists,
  login,
  logout,
};
