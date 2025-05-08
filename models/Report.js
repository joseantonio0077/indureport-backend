const mongoose = require('mongoose');

const AttachmentSchema = new mongoose.Schema({
  uri: {
    type: String,
    required: true
  },
  type: {
    type: String,
    default: 'image'
  }
});

const ReportSchema = new mongoose.Schema({
  localId: {
    type: String
  },
  type: {
    type: String,
    enum: ['incident', 'maintenance', 'improvement'],
    required: true
  },
  area: {
    type: String,
    enum: ['production', 'warehouse', 'laboratory', 'offices'],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  maintenanceType: {
    type: String,
    enum: ['corrective', 'preventive', 'predictive'],
    default: 'corrective'
  },
  shiftType: {
    type: String,
    enum: ['morning', 'afternoon', 'night'],
    required: true
  },
  attachments: [AttachmentSchema],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  syncStatus: {
    type: String,
    enum: ['pending', 'syncing', 'synced'],
    default: 'synced'
  },
  syncedAt: {
    type: Date
  }
});

module.exports = mongoose.model('Report', ReportSchema);