const jwt = require('jsonwebtoken');
const User = require('../models/User');
require('dotenv').config();

// Middleware para verificar token
const auth = async (req, res, next) => {
  try {
    // Obtener token del header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No hay token, acceso denegado' });
    }
    
    // Verificar token
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Guardar datos del usuario en req.user
      req.user = decoded;
      
      // Verificar si el usuario existe y está activo (opcional, pero recomendado)
      const user = await User.findById(decoded.id).select('status');
      
      if (!user) {
        return res.status(401).json({ error: 'Token inválido - Usuario no encontrado' });
      }
      
      if (user.status !== 'active') {
        return res.status(403).json({ error: 'Usuario inactivo, contacte al administrador' });
      }
      
      next();
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expirado', code: 'TOKEN_EXPIRED' });
      }
      
      return res.status(401).json({ error: 'Token inválido' });
    }
  } catch (error) {
    console.error('Error en middleware auth:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

// Middleware para verificar roles
const checkRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(500).json({ error: 'Error del sistema - Usuario no verificado' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Acción no permitida - Permisos insuficientes',
        required: roles,
        current: req.user.role
      });
    }
    
    next();
  };
};

module.exports = { auth, checkRole };