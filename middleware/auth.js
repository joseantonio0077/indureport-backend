// middleware/auth.js
const jwt = require('jsonwebtoken');

const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret', (err, user) => {
      if (err) {
        return res.status(403).json({ message: 'Token inválido o expirado' });
      }

      req.user = user;
      next();
    });
  } else {
    res.status(401).json({ message: 'Token de autenticación no proporcionado' });
  }
};

module.exports = { authenticateJWT };
