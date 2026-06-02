const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const {
  SESSION_SECRET,
  AUTH_COOKIE_MAX_AGE_MS,
  isPublicRequest,
  requireAuth
} = require('./middlewares/auth');
const { loadTextAsset } = require('./utils/assets');

const app = express();
app.set('trust proxy', 1);

function applyCorsHeaders(req, res) {
  const requestOrigin = req.headers.origin;
  res.setHeader('Access-Control-Allow-Origin', requestOrigin || '*');
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization');
}

// CORS setup
app.use((req, res, next) => {
  applyCorsHeaders(req, res);
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  return next();
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Session setup
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: AUTH_COOKIE_MAX_AGE_MS,
  },
}));

// Route protection middleware
app.use((req, res, next) => {
  if (isPublicRequest(req)) {
    return next();
  }
  return requireAuth(req, res, next);
});

// Serve static assets from new public directory
app.use(express.static(path.join(__dirname, '..', 'public'), { index: false }));

// Fallback CSS loaders
app.get('/style.css', (req, res) => {
  res.type('text/css').send(loadTextAsset('style.css', 'body { font-family: sans-serif; }'));
});

app.get('/menu_style.css', (req, res) => {
  res.type('text/css').send(loadTextAsset('menu_style.css', 'body { font-family: sans-serif; }'));
});

// Enrutadores
const authRoutes = require('./routes/authRoutes');
const viewRoutes = require('./routes/viewRoutes');
const apiRoutes = require('./routes/apiRoutes');

app.use('/', authRoutes);
app.use('/', viewRoutes);
app.use('/', apiRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  const wantsJson = req.headers.accept && req.headers.accept.includes('application/json');
  if (wantsJson) {
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
  return res.status(500).send('Error interno del servidor');
});

module.exports = app;
