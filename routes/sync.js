// routes/sync.js
const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const User = require('../models/User');
const { authenticateJWT } = require('../middleware/auth');

// Obtener actualizaciones desde el servidor
router.get('/download', authenticateJWT, async (req, res) => {
  try {
    const { lastSync } = req.query;
    console.log('Solicitud de sincronización. Última sincronización:', lastSync);
    
    const lastSyncDate = lastSync ? new Date(lastSync) : new Date(0);
    
    // Buscar reportes nuevos o actualizados después de la última sincronización
    // Para un usuario normal, solo reportes propios o asignados
    // Para admin/supervisor, todos los reportes
    let reportQuery = {};
    
    if (req.user.role === 'admin' || req.user.role === 'supervisor') {
      reportQuery = {
        $or: [
          { createdAt: { $gt: lastSyncDate } },
          { updatedAt: { $gt: lastSyncDate } }
        ]
      };
    } else {
      reportQuery = {
        $or: [
          { createdAt: { $gt: lastSyncDate } },
          { updatedAt: { $gt: lastSyncDate } }
        ],
        $or: [
          { createdBy: req.user.id },
          { assignedTo: req.user.id }
        ]
      };
    }
    
    const reports = await Report.find(reportQuery)
      .populate('createdBy', 'name username')
      .populate('assignedTo', 'name username')
      .sort({ updatedAt: -1 });
    
    console.log(`Enviando ${reports.length} reportes actualizados`);
    
    res.json({
      success: true,
      timestamp: new Date(),
      reports
    });
  } catch (error) {
    console.error('Error en sincronización de actualizaciones:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Ruta para sincronizar múltiples reportes desde la aplicación móvil
router.post('/upload', authenticateJWT, async (req, res) => {
  try {
    const reports = req.body.reports || [req.body];
    console.log(`Recibidos ${reports.length} reportes para sincronizar`);
    
    const results = [];
    
    for (const reportData of reports) {
      // Si tiene ID local, buscar por ese ID o crear nuevo
      let report;
      if (reportData.localId) {
        // Intentar encontrar si ya existe un reporte con este ID local
        report = await Report.findOne({ localId: reportData.localId });
      }
      
      if (report) {
        // Actualizar el reporte existente
        Object.assign(report, reportData);
        report.synced = true;
        report.syncedAt = new Date();
        await report.save();
        
        results.push({
          success: true,
          id: report._id,
          localId: reportData.localId,
          message: 'Reporte actualizado correctamente'
        });
      } else {
        // Crear nuevo reporte
        const newReport = new Report({
          ...reportData,
          createdBy: req.user.id,
          synced: true,
          syncedAt: new Date()
        });
        
        await newReport.save();
        
        results.push({
          success: true,
          id: newReport._id,
          localId: reportData.localId,
          message: 'Reporte creado correctamente'
        });
      }
    }
    
    res.json({
      success: true,
      results
    });
  } catch (error) {
    console.error('Error sincronizando reportes:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Verificar estado de sincronización
router.get('/status', authenticateJWT, async (req, res) => {
  try {
    // Contar reportes pendientes de sincronización para el usuario
    const pendingCount = await Report.countDocuments({
      createdBy: req.user.id,
      synced: false
    });
    
    // Obtener última fecha de sincronización
    const lastSyncedReport = await Report.findOne({
      createdBy: req.user.id,
      synced: true
    }).sort({ syncedAt: -1 });
    
    res.json({
      pendingCount,
      lastSyncDate: lastSyncedReport?.syncedAt || null,
      canSync: true,
      status: 'ready'
    });
  } catch (error) {
    console.error('Error verificando estado de sincronización:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

module.exports = router;
