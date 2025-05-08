const express = require('express');
const router = express.Router();
const { auth, checkRole } = require('../middleware/auth');

// Si tienes un controlador para reportes, impórtalo así:
// const reportController = require('../controllers/reportController');

// Ruta de prueba para verificar que funciona
router.get('/test', auth, (req, res) => {
  res.json({ message: 'API de reportes funcionando correctamente' });
});

// Aquí puedes definir tus rutas para reportes
// router.get('/', auth, reportController.getReports);
// router.post('/', auth, reportController.createReport);
// router.get('/:id', auth, reportController.getReportById);
// router.put('/:id', auth, reportController.updateReport);
// router.delete('/:id', auth, reportController.deleteReport);

module.exports = router;