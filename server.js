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

// Configuración de CORS
const corsOptions = {
  origin: [
    'https://indureport-backend.onrender.com',
    'exp://54.191.253.12:19000',
    'exp://44.226.122.3:19006',
    'exp://52.41.36.82:19000',
    'exp://192.168.100.6:19000'
    'exp://192.168.100.6:8081'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400 // 24 horas
};

app.use(cors(corsOptions));

// Middleware
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Servir archivos estáticos (imágenes)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Importar rutas
const authRoutes = require('./routes/auth');
const reportRoutes = require('./routes/reports');
const syncRoutes = require('./routes/sync'); // Importar rutas de sincronización
const userRoutes = require('./routes/users'); // Importar rutas de usuarios
const statusRoutes = require('./routes/status');

// Middleware de debug para todas las peticiones
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  if (req.method !== 'GET') {
    console.log('Body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

// Configuración de rutas con y sin prefijo /api
const routeConfig = [
  { path: '/auth', router: authRoutes },
  { path: '/reports', router: reportRoutes },
  { path: '/sync', router: syncRoutes },
  { path: '/users', router: userRoutes },
  { path: '/status', router: statusRoutes }
];

// Aplicar rutas con y sin prefijo
routeConfig.forEach(({ path, router }) => {
  app.use(`/api${path}`, router);
  app.use(path, router);
});

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
  
  // Determinar el código de estado apropiado
  const statusCode = err.statusCode || 500;
  
  // Preparar respuesta de error
  const errorResponse = {
    success: false,
    error: 'Error en el servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Error interno del servidor'
  };

  // Agregar detalles adicionales en desarrollo
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
    errorResponse.details = err;
  }

  res.status(statusCode).json(errorResponse);
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
  console.log('- Status: /api/status/* y /status/*');
});
