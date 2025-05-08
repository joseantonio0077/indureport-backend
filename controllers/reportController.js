const Report = require('../models/Report');
const fs = require('fs');
const path = require('path');

// Obtener todos los reportes
exports.getReports = async (req, res) => {
  try {
    // Filtrar reportes por usuario si no es admin
    let query = {};
    if (req.user.role !== 'admin') {
      query.createdBy = req.user.id;
    }
    
    const reports = await Report.find(query).sort({ createdAt: -1 });
    res.json(reports);
  } catch (error) {
    console.error('Error obteniendo reportes:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

// Obtener un reporte específico
exports.getReportById = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    
    if (!report) {
      return res.status(404).json({ error: 'Reporte no encontrado' });
    }
    
    // Verificar permisos si no es admin
    if (req.user.role !== 'admin' && report.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ error: 'No tienes permiso para ver este reporte' });
    }
    
    res.json(report);
  } catch (error) {
    console.error('Error obteniendo reporte:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

// Crear un nuevo reporte
exports.createReport = async (req, res) => {
  try {
    const reportData = req.body;
    
    // Procesar adjuntos
    let attachments = [];
    if (reportData.attachments) {
      // Si es string, parsearlo
      if (typeof reportData.attachments === 'string') {
        try {
          attachments = JSON.parse(reportData.attachments);
        } catch (e) {
          console.error('Error parseando adjuntos:', e);
        }
      } else {
        attachments = reportData.attachments;
      }
    }
    
    // Añadir archivos subidos a los adjuntos
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        attachments.push({
          uri: `/uploads/${file.filename}`,
          type: 'image'
        });
      });
    }
    
    const newReport = new Report({
      localId: reportData.localId,
      type: reportData.type,
      area: reportData.area,
      description: reportData.description,
      maintenanceType: reportData.maintenanceType,
      shiftType: reportData.shiftType,
      attachments: attachments,
      createdBy: req.user.id,
      createdAt: reportData.createdAt || new Date(),
      updatedAt: new Date(),
      syncStatus: 'synced',
      syncedAt: new Date()
    });
    
    await newReport.save();
    
    res.status(201).json(newReport);
  } catch (error) {
    console.error('Error creando reporte:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

// Actualizar un reporte existente
exports.updateReport = async (req, res) => {
  try {
    const reportData = req.body;
    
    let report = await Report.findById(req.params.id);
    
    if (!report) {
      return res.status(404).json({ error: 'Reporte no encontrado' });
    }
    
    // Verificar permisos si no es admin
    if (req.user.role !== 'admin' && report.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ error: 'No tienes permiso para editar este reporte' });
    }
    
    // Actualizar adjuntos si se proporcionan
    if (reportData.attachments) {
      let attachments = [];
      if (typeof reportData.attachments === 'string') {
        try {
          attachments = JSON.parse(reportData.attachments);
        } catch (e) {
          attachments = report.attachments;
        }
      } else {
        attachments = reportData.attachments;
      }
      
      reportData.attachments = attachments;
    }
    
    // Añadir archivos subidos a los adjuntos
    if (req.files && req.files.length > 0) {
      const attachments = reportData.attachments || report.attachments;
      req.files.forEach(file => {
        attachments.push({
          uri: `/uploads/${file.filename}`,
          type: 'image'
        });
      });
      reportData.attachments = attachments;
    }
    
    // Actualizar reporte
    reportData.updatedAt = new Date();
    
    report = await Report.findByIdAndUpdate(
      req.params.id,
      { $set: reportData },
      { new: true }
    );
    
    res.json(report);
  } catch (error) {
    console.error('Error actualizando reporte:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

// Eliminar un reporte
exports.deleteReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    
    if (!report) {
      return res.status(404).json({ error: 'Reporte no encontrado' });
    }
    
    // Verificar permisos si no es admin
    if (req.user.role !== 'admin' && report.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar este reporte' });
    }
    
    // Eliminar imágenes asociadas
    report.attachments.forEach(attachment => {
      if (attachment.uri.startsWith('/uploads/')) {
        const filePath = path.join(__dirname, '..', attachment.uri);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    });
    
    await report.remove();
    
    res.json({ message: 'Reporte eliminado correctamente' });
  } catch (error) {
    console.error('Error eliminando reporte:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};