const express = require('express');
const router = express.Router();
const { auth, checkRole } = require('../middleware/auth');
const reportController = require('../controllers/reportController');

// Ruta de prueba
router.get('/test', auth, (req, res) => {
  res.json({ message: 'API de reportes funcionando correctamente' });
});

// Rutas de reportes
router.get('/', auth, reportController.getReports);
router.post('/', auth, reportController.createReport);
router.get('/:id', auth, reportController.getReportById);
router.put('/:id', auth, reportController.updateReport);
router.delete('/:id', auth, reportController.deleteReport);

module.exports = router;