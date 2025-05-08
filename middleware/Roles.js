// Verificar si el usuario es operador
const isOperator = (req, res, next) => {
  if (req.user.role === 'operator' || req.user.role === 'supervisor' || req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ message: 'Acceso denegado: Se requiere rol de operador' });
};

// Verificar si el usuario es supervisor
const isSupervisor = (req, res, next) => {
  if (req.user.role === 'supervisor' || req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ message: 'Acceso denegado: Se requiere rol de supervisor' });
};

// Verificar si el usuario es administrador
const isAdmin = (req, res, next) => {
  if (req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ message: 'Acceso denegado: Se requiere rol de administrador' });
};

module.exports = { isOperator, isSupervisor, isAdmin };