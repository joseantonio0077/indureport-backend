// models/Report.js
const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'El título es obligatorio']
  },
  description: {
    type: String,
    required: [true, 'La descripción es obligatoria']
  },
  type: {
    type: String,
    enum: ['maintenance', 'shift', 'finding', 'assessment', 'info', 'incident', 'survey'],
    required: [true, 'El tipo de reporte es obligatorio']
  },
  area: {
    type: String,
    required: [true, 'El área es obligatoria']
  },
  location: {
    type: String
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'rejected'],
    default: 'pending'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  images: [String],
  gpsLocation: {
    latitude: Number,
    longitude: Number,
    accuracy: Number
  },
  synced: {
    type: Boolean,
    default: false
  },
  syncedAt: {
    type: Date
  },
  localId: {
    type: String
  },
  // Campos específicos según tipo de reporte
  maintenanceType: {
    type: String,
    enum: ['preventive', 'corrective', 'predictive', 'improvement'],
    required: function() { return this.type === 'maintenance'; }
  },
  shiftType: {
    type: String,
    enum: ['morning', 'afternoon', 'night'],
    required: function() { return this.type === 'shift'; }
  },
  nextShiftType: {
    type: String,
    enum: ['morning', 'afternoon', 'night'],
    required: function() { return this.type === 'shift'; }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Report', ReportSchema);
