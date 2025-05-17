// authController.js (modificado para aceptar diferentes formatos de credenciales)
const User = require('../models/User');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Registrar un nuevo usuario
exports.register = async (req, res) => {
  try {
    const { username, password, name, email, role, company } = req.body;
    
    // Verificar campos requeridos
    if (!username || !password || !name || !email) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }
    
    // Verificar si el usuario ya existe
    let user = await User.findOne({ $or: [{ username }, { email }] });
    if (user) {
      return res.status(400).json({ error: 'El usuario o email ya existe' });
    }
    
    // Crear nuevo usuario
    user = new User({
      username,
      password,
      name,
      email,
      role: role || 'operator',
      company: company || null
    });
    
    await user.save();
    
    // Generar token JWT
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, company: user.company },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        company: user.company
      }
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

// Login de usuario - MODIFICADO para aceptar diferentes formatos
exports.login = async (req, res) => {
  try {
    console.log('Body de login recibido:', req.body);
    
    // Extraer credenciales con nombres de campo alternativos
    const username = req.body.username || req.body.usuario || req.body.email || '';
    const password = req.body.password || '';
    const company = req.body.company || req.body.compania || req.body.empresa || null;
    
    console.log('Credenciales procesadas:', { username, password: '******', company });
    
    // Verificar campos requeridos
    if (!username || !password) {
      return res.status(400).json({ 
        error: 'El nombre de usuario y la contraseña son obligatorios',
        received: { username: !!username, password: !!password }
      });
    }
    
    // Buscar usuario
    let user = await User.findOne({ username });
    
    // Si no se encuentra por username, intentar con email
    if (!user && username.includes('@')) {
      user = await User.findOne({ email: username });
    }
    
    if (!user) {
      return res.status(401).json({ 
        error: 'Credenciales inválidas', 
        message: 'Usuario no encontrado' 
      });
    }
    
    // Si la compañía es requerida y el usuario tiene compañía, verificarla
    if (company && user.company && user.company !== company) {
      return res.status(401).json({ 
        error: 'Credenciales inválidas', 
        message: 'Compañía incorrecta'
      });
    }
    
    // Verificar contraseña
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ 
        error: 'Credenciales inválidas', 
        message: 'Contraseña incorrecta' 
      });
    }
    
    // Generar token JWT
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        role: user.role,
        company: user.company
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Generar refresh token
    const refreshToken = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );
    
    res.json({
      token,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        company: user.company || null
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

// Verificar token
exports.verify = async (req, res) => {
  try {
    // El middleware auth ya verificó el token
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    res.json({
      valid: true,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        company: user.company || null
      }
    });
  } catch (error) {
    console.error('Error verificando token:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

// Refrescar token (NUEVO)
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ error: 'Se requiere refresh token' });
    }
    
    // Verificar token
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    
    // Obtener usuario
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    // Generar nuevo token JWT
    const newToken = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        role: user.role,
        company: user.company
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      token: newToken,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        company: user.company || null
      }
    });
  } catch (error) {
    console.error('Error refrescando token:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Refresh token expirado', 
        code: 'REFRESH_TOKEN_EXPIRED'
      });
    }
    
    res.status(401).json({ error: 'Token inválido' });
  }
};

// Cerrar sesión (NUEVO)
exports.logout = async (req, res) => {
  // Nota: En el lado del servidor no hay mucho que hacer para cerrar sesión
  // ya que los tokens JWT son stateless. La principal acción debe ser
  // eliminar el token en el cliente.
  
  // Si quisiéramos invalidar tokens, necesitaríamos una estrategia como
  // lista negra de tokens o tokens de corta duración
  
  res.json({ success: true, message: 'Sesión cerrada correctamente' });
};
