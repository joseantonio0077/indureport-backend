const { validationResult } = require('express-validator');

// Middleware para validar resultados de express-validator
exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Middleware para validación de contraseñas
exports.validatePassword = (req, res, next) => {
  const { password, newPassword } = req.body;
  const passwordToCheck = newPassword || password;
  
  if (!passwordToCheck) {
    return next();
  }
  
  // Validar longitud mínima
  if (passwordToCheck.length < 6) {
    return res.status(400).json({ 
      error: 'La contraseña debe tener al menos 6 caracteres' 
    });
  }
  
  next();
};