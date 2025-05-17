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



// middleware/roles.js
const roles = {
  ADMIN: 'admin',
  SUPERVISOR: 'supervisor',
  OPERATOR: 'operador'
};

// Middleware para verificar si el usuario tiene el rol requerido
const checkRole = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autorizado' });
    }
    
    if (requiredRole === roles.ADMIN && req.user.role !== roles.ADMIN) {
      return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de administrador' });
    }
    
    if (requiredRole === roles.SUPERVISOR && 
        (req.user.role !== roles.SUPERVISOR && req.user.role !== roles.ADMIN)) {
      return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de supervisor o administrador' });
    }
    
    next();
  };
};

// Middleware para verificar si el usuario es administrador
const isAdmin = (req, res, next) => {
  checkRole(roles.ADMIN)(req, res, next);
};

// Middleware para verificar si el usuario es supervisor o admin
const isSupervisor = (req, res, next) => {
  checkRole(roles.SUPERVISOR)(req, res, next);
};

module.exports = {
  roles,
  checkRole,
  isAdmin,
  isSupervisor
};
