const Report = require('../models/Report');

// Obtener todos los reportes
exports.getReports = async (req, res) => {
  try {
    let query = {};
    
    // Si no es admin, solo ver los reportes creados por el usuario
    if (req.user.role !== 'admin') {
      query.createdBy = req.user.id;
    }
    
    const reports = await Report.find(query)
      .populate('createdBy', 'username name')
      .populate('assignedTo', 'username name')
      .sort({ createdAt: -1 });
    
    res.json(reports);
  } catch (error) {
    console.error('Error al obtener reportes:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

// Obtener un reporte específico
exports.getReportById = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('createdBy', 'username name')
      .populate('assignedTo', 'username name');
    
    if (!report) {
      return res.status(404).json({ error: 'Reporte no encontrado' });
    }
    
    // Verificar permisos (solo admin o el creador pueden ver)
    if (req.user.role !== 'admin' && report.createdBy._id.toString() !== req.user.id) {
      return res.status(403).json({ error: 'No tienes permiso para ver este reporte' });
    }
    
    res.json(report);
  } catch (error) {
    console.error('Error al obtener reporte:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

// Crear un nuevo reporte
exports.createReport = async (req, res) => {
  try {
    const { type, area, description, shiftType } = req.body;
    
    // Verificar campos requeridos
    if (!type || !area || !description || !shiftType) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }
    
    // Crear el reporte
    const report = new Report({
      type,
      area,
      description,
      shiftType,
      createdBy: req.user.id,
      images: req.files ? req.files.map(file => file.filename) : []
    });
    
    await report.save();
    
    res.status(201).json(report);
  } catch (error) {
    console.error('Error al crear reporte:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

// Actualizar un reporte
exports.updateReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    
    if (!report) {
      return res.status(404).json({ error: 'Reporte no encontrado' });
    }
    
    // Verificar permisos (solo admin o el creador pueden editar)
    if (req.user.role !== 'admin' && report.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ error: 'No tienes permiso para editar este reporte' });
    }
    
    // Actualizar campos
    const { type, area, description, shiftType, status, assignedTo } = req.body;
    
    if (type) report.type = type;
    if (area) report.area = area;
    if (description) report.description = description;
    if (shiftType) report.shiftType = shiftType;
    
    // Solo admin puede cambiar estos campos
    if (req.user.role === 'admin') {
      if (status) report.status = status;
      if (assignedTo) report.assignedTo = assignedTo;
    }
    
    report.updatedAt = Date.now();
    
    await report.save();
    
    res.json(report);
  } catch (error) {
    console.error('Error al actualizar reporte:', error);
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
    
    // Solo admin o el creador pueden eliminar
    if (req.user.role !== 'admin' && report.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar este reporte' });
    }
    
    await Report.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Reporte eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar reporte:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};