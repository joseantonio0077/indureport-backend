const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const User = require('../models/User');
const { authenticateJWT } = require('../middleware/auth');
const { isOperator } = require('../middleware/roles');

// Endpoint para enviar reportes pendientes desde la app móvil
router.post('/upload', authenticateJWT, isOperator, async (req, res) => {
  try {
    const { reports } = req.body;
    
    if (!reports || !Array.isArray(reports)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Formato inválido. Se espera un array de reportes' 
      });
    }
    
    // Procesar cada reporte
    const results = await Promise.all(
      reports.map(async (report) => {
        // Verificar si el reporte ya existe
        const existingReport = await Report.findOne({ localId: report.localId });
        
        if (existingReport) {
          return {
            localId: report.localId,
            status: 'already_synced',
            _id: existingReport._id
          };
        }
        
        // Crear nuevo reporte
        const newReport = new Report({
          type: report.type,
          area: report.area,
          description: report.description,
          maintenanceType: report.maintenanceType,
          shiftType: report.shiftType,
          attachments: report.attachments || [],
          createdBy: req.user.id,
          createdAt: report.createdAt || new Date(),
          localId: report.localId,
          syncStatus: 'synced',
          syncedAt: new Date()
        });
        
        await newReport.save();
        
        return {
          localId: report.localId,
          status: 'synced',
          _id: newReport._id
        };
      })
    );
    
    // Actualizar último momento de sincronización del usuario
    await User.findByIdAndUpdate(req.user.id, { lastSync: new Date() });
    
    res.json({ success: true, results });
  } catch (error) {
    console.error('Error en sincronización:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint para obtener reportes nuevos o actualizados 
router.get('/download', authenticateJWT, isOperator, async (req, res) => {
  try {
    const { lastSync } = req.query;
    const lastSyncDate = lastSync ? new Date(lastSync) : new Date(0);
    
    // Buscar reportes creados o actualizados después de la última sincronización
    const reports = await Report.find({
      $or: [
        { createdAt: { $gt: lastSyncDate } },
        { syncedAt: { $gt: lastSyncDate } }
      ],
      createdBy: req.user.id
    });
    
    res.json({ success: true, reports });
  } catch (error) {
    console.error('Error en descarga de sincronización:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;