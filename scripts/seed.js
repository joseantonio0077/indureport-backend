const mongoose = require('mongoose');
const User = require('../models/User');
const connectDB = require('../config/db');
require('dotenv').config();

// Conectar a la base de datos
connectDB();

const seedUsers = async () => {
  try {
    // Limpiar usuarios existentes
    await User.deleteMany({});
    
    // Crear usuarios de prueba
    await User.create([
      {
        username: 'usuario',
        password: 'password',
        name: 'Usuario Demo',
        email: 'usuario@ejemplo.com',
        role: 'operator',
        status: 'active'
      },
      {
        username: 'admin',
        password: 'admin123',
        name: 'Administrador',
        email: 'admin@ejemplo.com',
        role: 'admin',
        status: 'active'
      },
      {
        username: 'supervisor',
        password: 'super123',
        name: 'Supervisor',
        email: 'supervisor@ejemplo.com',
        role: 'supervisor',
        status: 'active'
      }
    ]);
    
    console.log('Usuarios de prueba creados correctamente');
    process.exit();
  } catch (error) {
    console.error('Error creando usuarios de prueba:', error);
    process.exit(1);
  }
};

seedUsers();