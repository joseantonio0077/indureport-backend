const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { auth, checkRole } = require('../middleware/auth');

// Rutas públicas
router.post('/register', authController.register);
router.post('/login', authController.login);

// Rutas protegidas
router.get('/verify', auth, authController.verify);

// Rutas adicionales (opcionales)
// router.post('/logout', auth, authController.logout);
// router.post('/change-password', auth, authController.changePassword);

module.exports = router;