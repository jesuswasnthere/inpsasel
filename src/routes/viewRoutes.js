const express = require('express');
const router = express.Router();
const { sendStaticHtml, loadHtmlPage } = require('../utils/assets');
const {
  getAuthenticatedUser,
  requireAuth,
  requireVisitManagementPermission,
  userCanManageVisits,
} = require('../middlewares/auth');
const visitController = require('../controllers/visitController');

router.get('/', (req, res) => {
  if (getAuthenticatedUser(req)) {
    return res.redirect('/menu');
  }
  return sendStaticHtml(res, 'login.html');
});

router.get('/login', (req, res) => {
  if (getAuthenticatedUser(req)) {
    return res.redirect('/menu');
  }
  return sendStaticHtml(res, 'login.html');
});

router.get('/register-visit', (req, res) => {
  sendStaticHtml(res, 'index.html');
});

router.get('/modify-visit', requireVisitManagementPermission, (req, res) => {
  sendStaticHtml(res, 'modify_visit.html');
});

router.get('/delete-visit', requireVisitManagementPermission, (req, res) => {
  sendStaticHtml(res, 'delete_visit.html');
});

router.post('/delete-visit', requireVisitManagementPermission, visitController.deleteVisit);

router.get('/menu', (req, res) => {
  const user = getAuthenticatedUser(req);
  const html = loadHtmlPage('menu_index.html');

  const visitLinks = userCanManageVisits(user)
    ? `
                        <li><a class="menu-btn" href="/register-visit">Registrar</a></li>
                        <li><a class="menu-btn" href="/modify-visit">Modificar</a></li>
                        <li><a class="menu-btn" href="/delete-visit">Eliminar</a></li>
    `
    : `
                        <li><a class="menu-btn" href="/register-visit">Registrar</a></li>
    `;

  res.type('html').send(html.replace('<!-- VISIT_ACTIONS -->', visitLinks));
});

router.get('/2index', (req, res) => {
  sendStaticHtml(res, '2index.html');
});

router.get('/success', (req, res) => {
  sendStaticHtml(res, 'success.html');
});

router.get('/visitas-del-dia', (req, res) => {
  sendStaticHtml(res, 'visitas_del_dia.html');
});

module.exports = router;
