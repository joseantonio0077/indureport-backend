const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authenticateJWT } = require('../middleware/auth');
const { isSupervisor, isAdmin } = require('../middleware/roles');

// Obtener todos los usuarios (solo supervisores y admin)
router.get('/', authenticateJWT, isSupervisor, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

// Obtener perfil del usuario actual
router.get('/profile', authenticateJWT, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

// Actualizar usuario (solo admin o el mismo usuario)
router.put('/:id', authenticateJWT, async (req, res) => {
  try {
    // Verificar permisos
    if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
      return res.status(403).json({ message: 'No tienes permiso para actualizar este usuario' });
    }
    
    const { name, email, status } = req.body;
    
    // Evitar cambio de rol si no es admin
    const updateData = req.user.role === 'admin' 
      ? { name, email, status, role: req.body.role }
      : { name, email };
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

module.exports = router;