// routes/sync.js (completado y optimizado)
const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const User = require('../models/User');
const { auth } = require('../middleware/auth'); // Usando auth del middleware unificado

// Ruta de prueba para verificar funcionamiento
router.get('/test', auth, (req, res) => {
  res.json({ 
    success: true, 
    message: 'API de sincronización funcionando correctamente',
    user: req.user.username
  });
});

// Endpoint para obtener actualizaciones (como intenta usar el cliente)
router.get('/updates', auth, async (req, res) => {
  try {
    const { lastSync } = req.query;
    const lastSyncDate = lastSync ? new Date(lastSync) : new Date(0);
    
    console.log(`Solicitud de sincronización de ${req.user.username}. Última sincronización: ${lastSyncDate}`);
    
    // Obtener reportes según permisos del usuario
    let query = {};
    
    // Si no es admin ni supervisor, solo ver reportes propios
    if (req.user.role !== 'admin' && req.user.role !== 'supervisor') {
      query.createdBy = req.user.id;
    }
    
    // Si es supervisor, ver reportes de su compañía
    if (req.user.role === 'supervisor' && req.user.company) {
      query.company = req.user.company;
    }
    
    // Filtrar por fecha de modificación posterior a la última sincronización
    query.$or = [
      { createdAt: { $gt: lastSyncDate } },
      { updatedAt: { $gt: lastSyncDate } }
    ];
    
    const reports = await Report.find(query)
      .populate('createdBy', 'username name')
      .sort({ updatedAt: -1 });
    
    console.log(`Encontrados ${reports.length} reportes para sincronizar`);
    
    // Actualizar timestamp de última sincronización del usuario
    await User.findByIdAndUpdate(req.user.id, { 
      lastSync: new Date() 
    });
    
    // Devolver resultados
    res.json({ 
      success: true, 
      timestamp: new Date(),
      reports,
      count: reports.length
    });
  } catch (error) {
    console.error('Error obteniendo actualizaciones:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Endpoint alternativo para descargas (compatibilidad)
router.get('/download', auth, async (req, res) => {
  try {
    // Redirigir a la función de updates
    const { lastSync } = req.query;
    const lastSyncDate = lastSync ? new Date(lastSync) : new Date(0);
    
    console.log(`Solicitud de descarga de ${req.user.username}. Última sincronización: ${lastSyncDate}`);
    
    // Misma lógica que en /updates
    let query = {};
    
    if (req.user.role !== 'admin' && req.user.role !== 'supervisor') {
      query.createdBy = req.user.id;
    }
    
    if (req.user.role === 'supervisor' && req.user.company) {
      query.company = req.user.company;
    }
    
    query.$or = [
      { createdAt: { $gt: lastSyncDate } },
      { updatedAt: { $gt: lastSyncDate } }
    ];
    
    const reports = await Report.find(query)
      .populate('createdBy', 'username name')
      .sort({ updatedAt: -1 });
    
    console.log(`Encontrados ${reports.length} reportes para descargar`);
    
    await User.findByIdAndUpdate(req.user.id, { 
      lastSync: new Date() 
    });
    
    res.json({ 
      success: true, 
      reports,
      count: reports.length
    });
  } catch (error) {
    console.error('Error descargando reportes:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Endpoint para sincronizar reportes desde cliente
router.post('/', auth, async (req, res) => {
  try {
    const reports = req.body.reports || [req.body];
    
    if (!Array.isArray(reports) && !reports.id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Formato inválido. Se espera un array de reportes o un objeto reporte' 
      });
    }
    
    const reportsArray = Array.isArray(reports) ? reports : [reports];
    console.log(`Recibidos ${reportsArray.length} reportes para sincronizar`);
    
    const results = await Promise.all(
      reportsArray.map(async (report) => {
        // Asignar ID del usuario si no viene
        if (!report.createdBy) {
          report.createdBy = req.user.id;
        }
        
        // Asignar compañía si el usuario tiene una asociada
        if (req.user.company && !report.company) {
          report.company = req.user.company;
        }
        
        const reportId = report.id || report._id || report.localId;
        
        try {
          // Verificar si ya existe (por ID o ID local)
          let existingReport = null;
          
          if (reportId) {
            existingReport = await Report.findOne({
              $or: [
                { _id: reportId },
                { localId: reportId }
              ]
            });
          }
          
          if (existingReport) {
            // Actualizar reporte existente
            console.log(`Actualizando reporte existente: ${existingReport._id}`);
            
            // Actualizar campos
            Object.keys(report).forEach(key => {
              if (key !== '_id' && key !== 'id' && key !== 'localId') {
                existingReport[key] = report[key];
              }
            });
            
            existingReport.updatedAt = new Date();
            existingReport.syncStatus = 'synced';
            existingReport.syncedAt = new Date();
            
            await existingReport.save();
            
            return {
              localId: report.localId || report.id,
              id: existingReport._id,
              status: 'updated',
              synced: true
            };
          } else {
            // Crear nuevo reporte
            console.log(`Creando nuevo reporte`);
            
            const newReport = new Report({
              ...report,
              localId: report.localId || report.id,
              createdBy: report.createdBy || req.user.id,
              company: report.company || req.user.company,
              createdAt: report.createdAt || new Date(),
              syncStatus: 'synced',
              syncedAt: new Date()
            });
            
            await newReport.save();
            
            return {
              localId: report.localId || report.id,
              id: newReport._id,
              status: 'created',
              synced: true
            };
          }
        } catch (error) {
          console.error(`Error procesando reporte ${reportId}:`, error);
          return {
            localId: reportId,
            status: 'error',
            error: error.message,
            synced: false
          };
        }
      })
    );
    
    // Actualizar timestamp de sincronización del usuario
    await User.findByIdAndUpdate(req.user.id, { 
      lastSync: new Date() 
    });
    
    res.json({ 
      success: true, 
      results,
      timestamp: new Date() 
    });
  } catch (error) {
    console.error('Error en sincronización:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router;
