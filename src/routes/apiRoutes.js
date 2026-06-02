const express = require('express');
const router = express.Router();
const visitController = require('../controllers/visitController');
const { requireVisitManagementPermission } = require('../middlewares/auth');

// Apply requireContactColumns middleware to all routes in this router since they all query/mutate DB tables that touch contacts
router.use(visitController.requireContactColumns);

// POST requests for mutation
router.post('/register-visit', visitController.registerVisit);
router.post('/modify-visit', requireVisitManagementPermission, visitController.modifyVisit);

// GET requests for query
router.get('/api/visitas', visitController.getVisitas);
router.get('/visitas', visitController.getRecentVisitas);
router.get('/api/visitas-del-dia', visitController.getVisitasDelDia);
router.get('/api/visitas-por-fecha', visitController.getVisitasPorFecha);
router.get('/api/visitas-calendario-resumen', visitController.getVisitasCalendarioResumen);
router.get('/api/visitas-eventos', visitController.getVisitasEventos);

module.exports = router;
