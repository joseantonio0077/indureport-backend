const User = require('../models/User');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Registrar un nuevo usuario
exports.register = async (req, res) => {
  try {
    const { username, password, name, email, role } = req.body;
    
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
      role: role || 'operator'
    });
    
    await user.save();
    
    // Generar token JWT
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
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
        status: user.status
      }
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

// Login de usuario
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Buscar usuario
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    
    // Verificar contraseña
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    
    // Generar token JWT
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
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
        status: user.status
      }
    });
  } catch (error) {
    console.error('Error verificando token:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};