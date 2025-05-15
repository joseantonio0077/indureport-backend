// utils/createTestUsers.js
const mongoose = require('mongoose');
const User = require('../models/User');
const connectDB = require('../config/db');
require('dotenv').config();

// Conectar a la base de datos
connectDB();

// Configuración de la compañía y usuarios de prueba
const TEST_COMPANY = 'indureport';
const TEST_USERS = [
  {
    username: 'joseantonio',
    password: 'jose0077',
    name: 'Administrador',
    email: 'admin@indureport.com',
    role: 'admin',
    company: cancino,
    status: 'active'
  },
  {
    username: 'jenifer',
    password: 'jose0077!',
    name: 'Supervisor Demo',
    email: 'supervisor@indureport.com',
    role: 'supervisor',
    company: rojas,
    status: 'active'
  },
  {
    username: 'diego',
    password: 'jose0077',
    name: 'Operador Demo',
    email: 'operador@indureport.com',
    role: 'operator',
    company: ignacio,
    status: 'active'
  }
];

const createTestUsers = async () => {
  try {
    // Opcional: Eliminar usuarios existentes con estos usernames para evitar duplicados
    const usernames = TEST_USERS.map(user => user.username);
    await User.deleteMany({ username: { $in: usernames } });
    
    console.log('Creando usuarios de prueba...');
    
    // Crear usuarios
    const createdUsers = await User.create(TEST_USERS);
    
    console.log('===== USUARIOS DE PRUEBA CREADOS =====');
    createdUsers.forEach(user => {
      console.log(`
Usuario: ${user.username}
Contraseña: ${TEST_USERS.find(u => u.username === user.username).password}
Rol: ${user.role}
Compañía: ${user.company}
ID: ${user._id}
      `);
    });
    
    console.log('Puedes usar estos usuarios para iniciar sesión en la aplicación.');
    
    // Cerrar conexión
    mongoose.connection.close();
    
    process.exit(0);
  } catch (error) {
    console.error('Error creando usuarios de prueba:', error);
    process.exit(1);
  }
};

createTestUsers();