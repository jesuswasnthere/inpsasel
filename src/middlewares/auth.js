const crypto = require('crypto');

const SESSION_SECRET = process.env.SESSION_SECRET || 'secreto_ipsasel';
const AUTH_COOKIE_NAME = 'ipsasel_auth';
const AUTH_COOKIE_MAX_AGE_MS = Number(process.env.AUTH_COOKIE_MAX_AGE_MS || 8 * 60 * 60 * 1000);
const DEFAULT_USER_ID = Number(process.env.DEFAULT_USER_ID || 1);
const READONLY_VISIT_ROLE_NAME = (process.env.READONLY_VISIT_ROLE_NAME || 'Registro y calendario').trim();
const FULL_VISIT_ACCESS_ROLE_NAMES = new Set(
  (process.env.FULL_VISIT_ACCESS_ROLE_NAMES || 'Admin,Administrador').split(',').map((name) => name.trim()).filter(Boolean)
);

function parseCookies(req) {
  const header = req.headers.cookie || '';
  return header.split(';').reduce((cookies, pair) => {
    const separatorIndex = pair.indexOf('=');
    if (separatorIndex === -1) {
      return cookies;
    }

    const key = pair.slice(0, separatorIndex).trim();
    const value = pair.slice(separatorIndex + 1).trim();
    if (key) {
      cookies[key] = decodeURIComponent(value);
    }
    return cookies;
  }, {});
}

function signAuthPayload(payload) {
  return crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payload)
    .digest('base64url');
}

function userCanManageVisits(user) {
  if (!user) return false;
  if (user.roleName === READONLY_VISIT_ROLE_NAME) {
    return false;
  }
  return Boolean(user.roleName) && FULL_VISIT_ACCESS_ROLE_NAMES.has(user.roleName);
}

function createAuthCookieValue(user) {
  const payload = Buffer.from(JSON.stringify({
    userId: user.id_usuario,
    username: user.username,
    idRol: user.id_rol || null,
    roleName: user.roleName || '',
    exp: Date.now() + AUTH_COOKIE_MAX_AGE_MS,
  })).toString('base64url');

  return `${payload}.${signAuthPayload(payload)}`;
}

function verifyAuthCookie(req) {
  const rawCookie = parseCookies(req)[AUTH_COOKIE_NAME];
  if (!rawCookie) {
    return null;
  }

  const [payload, signature] = rawCookie.split('.');
  if (!payload || !signature) {
    return null;
  }

  const expectedSignature = signAuthPayload(payload);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!data.exp || Date.now() > data.exp || !data.userId) {
      return null;
    }

    return {
      userId: Number(data.userId),
      username: String(data.username || ''),
      idRol: data.idRol ? Number(data.idRol) : null,
      roleName: String(data.roleName || ''),
    };
  } catch (err) {
    return null;
  }
}

function setAuthCookie(res, user) {
  res.cookie(AUTH_COOKIE_NAME, createAuthCookieValue(user), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: AUTH_COOKIE_MAX_AGE_MS,
    path: '/',
  });
}

function clearAuthCookie(res) {
  res.clearCookie(AUTH_COOKIE_NAME, {
    path: '/',
  });
}

function getAuthenticatedUser(req) {
  if (req.session && req.session.isAuthenticated) {
    return {
      userId: Number(req.session.userId || DEFAULT_USER_ID),
      username: req.session.username || '',
      idRol: req.session.idRol ? Number(req.session.idRol) : null,
      roleName: req.session.roleName || '',
    };
  }

  const cookieUser = verifyAuthCookie(req);
  if (!cookieUser) {
    return null;
  }

  if (req.session) {
    req.session.isAuthenticated = true;
    req.session.userId = cookieUser.userId;
    req.session.username = cookieUser.username;
    req.session.idRol = cookieUser.idRol;
    req.session.roleName = cookieUser.roleName;
  }

  return cookieUser;
}

function wantsJsonResponse(req) {
  const acceptHeader = req.headers.accept || '';
  return req.path.startsWith('/api') || acceptHeader.includes('application/json');
}

function sanitizeRedirect(target) {
  if (!target || typeof target !== 'string') {
    return '/menu';
  }

  if (!target.startsWith('/') || target.startsWith('//') || target === '/' || target.startsWith('/login')) {
    return '/menu';
  }

  return target;
}

function loginRedirectUrl(req) {
  if (!req.originalUrl || req.originalUrl === '/' || req.originalUrl.startsWith('/login')) {
    return '/login';
  }

  return `/login?next=${encodeURIComponent(req.originalUrl)}`;
}

function requireAuth(req, res, next) {
  const authUser = getAuthenticatedUser(req);
  if (authUser) {
    req.authUser = authUser;
    return next();
  }

  if (wantsJsonResponse(req)) {
    return res.status(401).json({
      success: false,
      message: 'Sesion expirada. Inicie sesion nuevamente.',
    });
  }

  return res.redirect(303, loginRedirectUrl(req));
}

function requireVisitManagementPermission(req, res, next) {
  const authUser = getAuthenticatedUser(req);
  if (!authUser) {
    return requireAuth(req, res, next);
  }

  if (userCanManageVisits(authUser)) {
    req.authUser = authUser;
    return next();
  }

  if (wantsJsonResponse(req)) {
    return res.status(403).json({
      success: false,
      message: 'No tiene permisos para modificar o eliminar visitas.',
    });
  }

  return res.status(403).send('No tiene permisos para modificar o eliminar visitas.');
}

function isPublicAsset(pathname) {
  return /\.(css|png|jpe?g|gif|svg|ico|webp)$/i.test(pathname);
}

function isPublicRequest(req) {
  if (req.method === 'OPTIONS') {
    return true;
  }

  if (req.method === 'GET' && (req.path === '/' || req.path === '/login' || req.path === '/login.html')) {
    return true;
  }

  if (req.method === 'POST' && req.path === '/login') {
    return true;
  }

  return req.method === 'GET' && isPublicAsset(req.path);
}

function establishLoginSession(req, res, user, redirectTo) {
  req.session.isAuthenticated = true;
  req.session.userId = user.id_usuario;
  req.session.username = user.username;
  req.session.idRol = user.id_rol || null;
  req.session.roleName = user.roleName || '';
  setAuthCookie(res, user);
  return res.redirect(303, redirectTo);
}

module.exports = {
  SESSION_SECRET,
  AUTH_COOKIE_NAME,
  AUTH_COOKIE_MAX_AGE_MS,
  DEFAULT_USER_ID,
  READONLY_VISIT_ROLE_NAME,
  FULL_VISIT_ACCESS_ROLE_NAMES,
  userCanManageVisits,
  setAuthCookie,
  clearAuthCookie,
  getAuthenticatedUser,
  requireAuth,
  requireVisitManagementPermission,
  isPublicRequest,
  establishLoginSession,
  sanitizeRedirect,
};
