// server.js (modificado para aceptar rutas con y sin prefijo /api)
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const connectDB = require('./config/db');
require('dotenv').config();

// Conectar a la base de datos
connectDB();

// Inicializar la aplicación Express
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Servir archivos estáticos (imágenes)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Importar rutas
const authRoutes = require('./routes/auth');
const reportRoutes = require('./routes/reports');
const syncRoutes = require('./routes/sync'); // Importar rutas de sincronización
const userRoutes = require('./routes/users'); // Importar rutas de usuarios

// Middleware de debug para todas las peticiones
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  if (req.method !== 'GET') {
    console.log('Body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

// Modificar rutas para aceptar con y sin prefijo
// Rutas con prefijo /api (original)
app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/users', userRoutes);

// Rutas sin prefijo /api (nuevo)
app.use('/auth', authRoutes);
app.use('/reports', reportRoutes);
app.use('/sync', syncRoutes);
app.use('/users', userRoutes);

// Ruta de prueba/verificación
app.get('/', (req, res) => {
  res.json({ 
    message: 'API de InduReport funcionando correctamente',
    timestamp: new Date().toISOString(),
    version: '1.1.0',
    health: 'ok'
  });
});

// Endpoint para verificación de salud del servidor
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Middleware para manejar rutas no encontradas
app.use('*', (req, res) => {
  console.log(`[404] Ruta no encontrada: ${req.originalUrl}`);
  res.status(404).json({ 
    error: 'Ruta no encontrada', 
    path: req.originalUrl,
    message: 'La ruta solicitada no existe en esta API'
  });
});

// Middleware global para manejo de errores
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.stack);
  res.status(500).json({ 
    error: 'Error en el servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Error interno del servidor'
  });
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
  console.log(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log('Rutas disponibles:');
  console.log('- Auth: /api/auth/* y /auth/*');
  console.log('- Reports: /api/reports/* y /reports/*');
  console.log('- Sync: /api/sync/* y /sync/*');
  console.log('- Users: /api/users/* y /users/*');
});
