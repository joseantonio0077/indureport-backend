const { check } = require('express-validator');

exports.registerValidation = [
  check('username')
    .notEmpty().withMessage('El nombre de usuario es obligatorio')
    .isLength({ min: 3, max: 30 }).withMessage('El nombre de usuario debe tener entre 3 y 30 caracteres'),
  
  check('password')
    .notEmpty().withMessage('La contraseña es obligatoria')
    .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
  
  check('name')
    .notEmpty().withMessage('El nombre es obligatorio'),
  
  check('email')
    .notEmpty().withMessage('El email es obligatorio')
    .isEmail().withMessage('El email no es válido')
    .normalizeEmail(),
  
  check('role')
    .optional()
    .isIn(['operator', 'supervisor', 'admin']).withMessage('Rol no válido')
];

exports.loginValidation = [
  check('username')
    .notEmpty().withMessage('El nombre de usuario es obligatorio'),
  
  check('password')
    .notEmpty().withMessage('La contraseña es obligatoria')
];