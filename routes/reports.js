// routes/reports.js
const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const { authenticateJWT } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuración de multer para subida de archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/reports';
    // Asegurarse de que el directorio existe
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB límite
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Solo se permiten imágenes'));
  }
});

// Obtener todos los reportes
router.get('/', authenticateJWT, async (req, res) => {
  try {
    // Filtrado opcional
    const filter = {};
    if (req.query.type) filter.type = req.query.type;
    if (req.query.status) filter.status = req.query.status;
    
    // Si no es admin, solo ver los reportes propios o asignados
    if (req.user.role !== 'admin' && req.user.role !== 'supervisor') {
      filter.createdBy = req.user.id;
    }
    
    const reports = await Report.find(filter)
      .populate('createdBy', 'name username')
      .populate('assignedTo', 'name username')
      .sort({ createdAt: -1 });
    
    res.json(reports);
  } catch (error) {
    console.error('Error obteniendo reportes:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

// Obtener un reporte específico
router.get('/:id', authenticateJWT, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('createdBy', 'name username')
      .populate('assignedTo', 'name username');
    
    if (!report) {
      return res.status(404).json({ message: 'Reporte no encontrado' });
    }
    
    // Verificar permisos si no es admin o supervisor
    if (req.user.role !== 'admin' && req.user.role !== 'supervisor' && 
        report.createdBy._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'No tienes permiso para ver este reporte' });
    }
    
    res.json(report);
  } catch (error) {
    console.error('Error obteniendo reporte:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

// Crear nuevo reporte
router.post('/', authenticateJWT, async (req, res) => {
  try {
    const newReport = new Report({
      ...req.body,
      createdBy: req.user.id,
      status: req.body.status || 'pending',
      synced: true
    });
    
    await newReport.save();
    
    res.status(201).json(newReport);
  } catch (error) {
    console.error('Error creando reporte:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

// Actualizar reporte existente
router.put('/:id', authenticateJWT, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    
    if (!report) {
      return res.status(404).json({ message: 'Reporte no encontrado' });
    }
    
    // Verificar permisos
    if (req.user.role !== 'admin' && req.user.role !== 'supervisor' && 
        report.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'No tienes permiso para actualizar este reporte' });
    }
    
    // Actualizar campos permitidos
    const fieldsToUpdate = { ...req.body };
    delete fieldsToUpdate.createdBy; // No permitir cambiar el creador
    
    const updatedReport = await Report.findByIdAndUpdate(
      req.params.id,
      fieldsToUpdate,
      { new: true }
    );
    
    res.json(updatedReport);
  } catch (error) {
    console.error('Error actualizando reporte:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

// Eliminar reporte
router.delete('/:id', authenticateJWT, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    
    if (!report) {
      return res.status(404).json({ message: 'Reporte no encontrado' });
    }
    
    // Verificar permisos
    if (req.user.role !== 'admin' && report.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'No tienes permiso para eliminar este reporte' });
    }
    
    // Eliminar imágenes asociadas
    if (report.images && report.images.length > 0) {
      report.images.forEach(async (imagePath) => {
        const fullPath = path.join(__dirname, '..', imagePath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      });
    }
    
    await Report.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Reporte eliminado correctamente' });
  } catch (error) {
    console.error('Error eliminando reporte:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

// Subir imagen para un reporte
router.post('/:id/upload', authenticateJWT, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No se ha subido ninguna imagen' });
    }
    
    const report = await Report.findById(req.params.id);
    
    if (!report) {
      // Eliminar el archivo si el reporte no existe
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: 'Reporte no encontrado' });
    }
    
    // Verificar permisos
    if (req.user.role !== 'admin' && req.user.role !== 'supervisor' && 
        report.createdBy.toString() !== req.user.id) {
      // Eliminar el archivo si no tiene permisos
      fs.unlinkSync(req.file.path);
      return res.status(403).json({ message: 'No tienes permiso para actualizar este reporte' });
    }
    
    // Ruta relativa para guardar en la base de datos
    const relativePath = req.file.path.replace(/\\/g, '/');
    
    // Añadir imagen al reporte
    if (!report.images) report.images = [];
    report.images.push(relativePath);
    
    await report.save();
    
    res.json({ 
      message: 'Imagen subida correctamente',
      imagePath: relativePath
    });
  } catch (error) {
    console.error('Error subiendo imagen:', error);
    // Eliminar el archivo en caso de error
    if (req.file && req.file.path) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

// Sincronizar reportes desde la app
router.post('/sync', authenticateJWT, async (req, res) => {
  try {
    const reportData = req.body;
    
    // Verificar si ya existe (por localId)
    let report;
    if (reportData.localId) {
      report = await Report.findOne({ localId: reportData.localId });
    }
    
    if (report) {
      // Actualizar reporte existente
      Object.assign(report, reportData);
      report.synced = true;
      report.syncedAt = new Date();
      
      await report.save();
      
      res.json({
        message: 'Reporte actualizado correctamente',
        id: report._id,
        report
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
      
      res.json({
        message: 'Reporte creado correctamente',
        id: newReport._id,
        report: newReport
      });
    }
  } catch (error) {
    console.error('Error sincronizando reporte:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

module.exports = router;
