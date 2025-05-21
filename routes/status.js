const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middleware/auth');

// Versión actual de la API
const API_VERSION = '1.1.0';

// Endpoint para verificar versión de la app
router.get('/app/version', (req, res) => {
  res.json({
    version: API_VERSION,
    minVersion: '1.0.0',
    requiresUpdate: false,
    maintenanceMode: false,
    lastChecked: new Date()
  });
});

// Endpoint para verificar estado del servidor
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    version: API_VERSION,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    maintenanceMode: false
  });
});

// Endpoint para verificar estado de mantenimiento
router.get('/maintenance', (req, res) => {
  res.json({
    maintenanceMode: false,
    message: 'El servidor está operativo',
    estimatedTime: null,
    lastUpdated: new Date().toISOString()
  });
});

// Endpoint para verificar estado general
router.get('/status', authenticateJWT, (req, res) => {
  res.json({
    status: 'ok',
    version: API_VERSION,
    maintenanceMode: false,
    lastSync: new Date().toISOString(),
    services: {
      database: 'connected',
      storage: 'available',
      auth: 'operational'
    }
  });
});

module.exports = router; 
