const express = require('express');
const router = express.Router();
const authRoutes = require('./auth');

// Ruta base
router.get('/', (req, res) => {
  res.json({ message: 'API InduReport funcionando correctamente' });
});

// Rutas de autenticación
router.use('/auth', authRoutes);

module.exports = router;