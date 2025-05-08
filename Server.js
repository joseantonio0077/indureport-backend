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

// Usar rutas
app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('API de InduReport funcionando correctamente');
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});