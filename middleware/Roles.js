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
