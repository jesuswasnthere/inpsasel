const fs = require('fs');
const path = require('path');

const LOGIN_FALLBACK_HTML = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Inicio de sesion - INPSASEL</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(180deg, #f8fafc 0%, #dbeafe 100%);
      color: #0f172a;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .login-shell { width: min(100%, 460px); }
    .login-panel {
      background: rgba(255, 255, 255, 0.94);
      border: 1px solid rgba(148, 163, 184, 0.22);
      border-radius: 24px;
      box-shadow: 0 32px 80px rgba(15, 23, 42, 0.12);
      padding: 34px;
    }
    .login-brand {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 16px;
      align-items: center;
      margin-bottom: 18px;
    }
    .login-logo {
      width: 72px;
      height: 72px;
      border-radius: 18px;
      border: 1px solid rgba(148, 163, 184, 0.35);
      object-fit: cover;
    }
    .login-eyebrow {
      margin: 0 0 6px;
      color: #0369a1;
      font-size: 0.78rem;
      font-weight: 800;
      text-transform: uppercase;
    }
    h1 { margin: 0; font-size: 1.55rem; line-height: 1.2; }
    .login-copy { margin: 0 0 22px; color: #475569; line-height: 1.6; }
    .login-form { display: grid; gap: 18px; }
    .form-group { display: flex; flex-direction: column; }
    label { font-weight: 700; margin-bottom: 10px; color: #344054; }
    input {
      width: 100%;
      padding: 14px 16px;
      border: 1px solid rgba(148, 163, 184, 0.45);
      border-radius: 16px;
      background: white;
      font-size: 1rem;
      color: #0f172a;
    }
    input:focus {
      border-color: #2563eb;
      outline: none;
      box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.16);
    }
    .btn-submit {
      padding: 16px;
      border: none;
      border-radius: 20px;
      font-size: 1.05rem;
      font-weight: 700;
      color: white;
      background: linear-gradient(135deg, #2563eb, #06b6d4);
      cursor: pointer;
      box-shadow: 0 18px 35px rgba(37, 99, 235, 0.18);
    }
    .login-message {
      margin-bottom: 18px;
      padding: 12px 14px;
      border-radius: 14px;
      font-weight: 700;
      line-height: 1.4;
    }
    .login-message.error {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #991b1b;
    }
    .login-message.success {
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      color: #166534;
    }
  </style>
</head>
<body>
  <main class="login-shell">
    <section class="login-panel" aria-labelledby="login-title">
      <div class="login-brand">
        <img src="https://tse3.mm.bing.net/th/id/OIP.EM3DltdiNLHzZh23cV-MYQHaHa?rs=1&pid=ImgDetMain&o=7&rm=3" alt="Logo INPSASEL" class="login-logo">
        <div>
          <p class="login-eyebrow">Acceso privado</p>
          <h1 id="login-title">Sistema de Registro de Visitas</h1>
        </div>
      </div>
      <p class="login-copy">Ingrese con el usuario autorizado para continuar.</p>
      <div id="login-message" class="login-message" hidden></div>
      <form class="login-form" action="/login" method="POST">
        <input type="hidden" id="next" name="next" value="/menu">
        <div class="form-group">
          <label for="username">Usuario</label>
          <input type="text" id="username" name="username" autocomplete="username" required autofocus>
        </div>
        <div class="form-group">
          <label for="password">Contrasena</label>
          <input type="password" id="password" name="password" autocomplete="current-password" required>
        </div>
        <button type="submit" class="btn-submit">Iniciar sesion</button>
      </form>
    </section>
  </main>
  <script>
    const params = new URLSearchParams(window.location.search);
    const next = params.get('next');
    const error = params.get('error');
    const loggedOut = params.get('logged_out');
    const message = document.getElementById('login-message');
    const nextInput = document.getElementById('next');
    if (next && next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/login')) {
      nextInput.value = next;
    }
    if (error) {
      message.textContent = error;
      message.classList.add('error');
      message.hidden = false;
    } else if (loggedOut) {
      message.textContent = 'Sesion cerrada correctamente.';
      message.classList.add('success');
      message.hidden = false;
    }
  </script>
</body>
</html>`;

const HTML_PAGES = {
  'login.html': LOGIN_FALLBACK_HTML,
  'menu_index.html': '<!doctype html><html><head><meta charset="utf-8"><title>INPSASEL</title></head><body><h1>INPSASEL</h1></body></html>',
  'index.html': '<!doctype html><html><head><meta charset="utf-8"><title>Registro</title></head><body><h1>Registro de visita</h1></body></html>',
  'modify_visit.html': '<!doctype html><html><head><meta charset="utf-8"><title>Modificar</title></head><body><h1>Modificar visita</h1></body></html>',
  'delete_visit.html': '<!doctype html><html><head><meta charset="utf-8"><title>Eliminar</title></head><body><h1>Eliminar visita</h1></body></html>',
  'success.html': '<!doctype html><html><head><meta charset="utf-8"><title>Éxito</title></head><body><h1>Operación exitosa</h1></body></html>',
  'visitas_del_dia.html': '<!doctype html><html><head><meta charset="utf-8"><title>Visitas del día</title></head><body><h1>Visitas del día</h1></body></html>',
  '2index.html': '<!doctype html><html><head><meta charset="utf-8"><title>Inicio</title></head><body><h1>Inicio</h1></body></html>',
};

const assetPathCache = new Map();

function findAssetPath(rootDir, fileName, depth = 0) {
  if (!rootDir || depth > 4) {
    return null;
  }

  let entries;
  try {
    entries = fs.readdirSync(rootDir, { withFileTypes: true });
  } catch (err) {
    return null;
  }

  for (const entry of entries) {
    const fullPath = path.join(rootDir, entry.name);
    if (entry.isFile() && entry.name === fileName) {
      return fullPath;
    }
  }

  for (const entry of entries) {
    if (!entry.isDirectory() || ['.git', '.vercel', 'node_modules'].includes(entry.name)) {
      continue;
    }

    const foundPath = findAssetPath(path.join(rootDir, entry.name), fileName, depth + 1);
    if (foundPath) {
      return foundPath;
    }
  }

  return null;
}

function resolveAssetPath(fileName) {
  if (assetPathCache.has(fileName)) {
    return assetPathCache.get(fileName);
  }

  const candidatePaths = [
    path.join(__dirname, '..', '..', 'public', fileName),
    path.join(__dirname, '..', '..', fileName),
    path.join(__dirname, '..', '..', 'api', fileName),
    path.join(process.cwd(), 'public', fileName),
    path.join(process.cwd(), fileName),
    path.join(process.cwd(), 'api', fileName),
    path.join(__dirname, '..', fileName),
  ];

  const directPath = candidatePaths.find((candidatePath) => fs.existsSync(candidatePath));
  const resolvedPath = directPath
    || findAssetPath(path.join(process.cwd(), 'public'), fileName)
    || findAssetPath(process.cwd(), fileName)
    || findAssetPath(__dirname, fileName)
    || candidatePaths[0];

  assetPathCache.set(fileName, resolvedPath);
  return resolvedPath;
}

function loadHtmlPage(fileName) {
  const filePath = resolveAssetPath(fileName);
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    console.warn(`No se pudo leer ${fileName}; se usará una versión mínima embebida.`);
    return HTML_PAGES[fileName] || '<!doctype html><html><head><meta charset="utf-8"></head><body></body></html>';
  }
}

function loadTextAsset(fileName, fallbackContent) {
  const filePath = resolveAssetPath(fileName);
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    console.warn(`No se pudo leer ${fileName}; se usará un fallback embebido.`);
    return fallbackContent;
  }
}

function sendStaticHtml(res, fileName) {
  res.type('html').send(loadHtmlPage(fileName));
}

module.exports = {
  resolveAssetPath,
  loadHtmlPage,
  loadTextAsset,
  sendStaticHtml,
};
