const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

// Aplicar middleware de autenticación a todas las rutas
router.use(auth);

// Rutas de reportes
router.get('/', reportController.getReports);
router.get('/:id', reportController.getReportById);
router.post('/', upload.array('images', 5), reportController.createReport);
router.put('/:id', upload.array('images', 5), reportController.updateReport);
router.delete('/:id', reportController.deleteReport);

module.exports = router;