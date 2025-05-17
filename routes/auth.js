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
    const isMatch = await
