// routes/auth.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { authenticateJWT } = require('../middleware/auth');

// Ruta para iniciar sesión
router.post('/login', async (req, res) => {
  try {
    console.log("Recibida petición de login:", req.body);
    
    // Extraer credenciales con nombres de campo alternativos
    const username = req.body.username || req.body.usuario || req.body.email;
    const password = req.body.password;
    const company = req.body.company || req.body.compania || req.body.empresa;
    
    console.log('Datos normalizados:', { username, company });
    
    // Verificar campos requeridos
    if (!username || !password) {
      return res.status(400).json({ message: 'El nombre de usuario y la contraseña son obligatorios' });
    }
    
    // Buscar usuario
    let user = await User.findOne({ 
      $or: [
        { username: username },
        { email: username }
      ]
    });
    
    if (!user) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }
    
    // Si la compañía es requerida, verificarla
    if (company && user.company && user.company !== company) {
      return res.status(401).json({ message: 'Compañía incorrecta' });
    }
    
    // Verificar contraseña
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }
    
    // Generar token JWT
    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'indureportsecret',
      { expiresIn: '7d' }
    );
    
    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        company: user.company || ''
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

// Verificar token
router.get('/verify', authenticateJWT, async (req, res) => {
  try {
    // En este punto, el middleware auth ya verificó el token y añadió el usuario al request
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    res.json({
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        company: user.company || ''
      }
    });
  } catch (error) {
    console.error('Error verificando token:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

// Recuperar contraseña
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'El correo electrónico es obligatorio' });
    }
    
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    // Aquí normalmente enviarías un correo de recuperación
    // Por ahora, simplemente respondemos que se envió
    
    res.json({ 
      message: 'Se ha enviado un correo con instrucciones para restablecer tu contraseña',
      success: true
    });
  } catch (error) {
    console.error('Error en recuperación de contraseña:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

// Cambiar contraseña
router.post('/change-password', authenticateJWT, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: 'Ambas contraseñas son obligatorias' });
    }
    
    // Obtener usuario
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    // Verificar contraseña actual
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'La contraseña actual es incorrecta' });
    }
    
    // Encriptar nueva contraseña
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    
    await user.save();
    
    res.json({ message: 'Contraseña actualizada correctamente', success: true });
  } catch (error) {
    console.error('Error cambiando contraseña:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

module.exports = router;
