const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const connectDB = require('./config/db');
require('dotenv').config();

//const helmet = require('helmet');
//const rateLimit = require('express-rate-limit');
// Conectar a la base de datos
connectDB();

// Inicializar la aplicación Express
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

//app.use(helmet());
//app.use('/api/', rateLimit({
 // windowMs: 15 * 60 * 1000, // 15 minutos
  //max: 100 // límite por IP
//}));

// Servir archivos estáticos (imágenes)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Importar rutas
const authRoutes = require('./routes/auth');
const reportRoutes = require('./routes/reports'); // Asegúrate de que esta línea exista

// Usar rutas
app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes); // Asegúrate de que esta línea exista

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ message: 'API de InduReport funcionando correctamente' });
});

// Middleware para manejar rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Middleware global para manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Error en el servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.post('/api/auth/login', (req, res, next) => {
  console.log('==== DEBUG LOGIN REQUEST (con /api) ====');
  console.log('Método:', req.method);
  console.log('URL:', req.originalUrl);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Body:', JSON.stringify(req.body, null, 2));
  console.log('============================');
  next(); // Continúa con el manejo normal del endpoint
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
  console.log(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
});
