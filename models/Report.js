const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['incident', 'maintenance', 'production', 'safety']
  },
  area: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  shiftType: {
    type: String,
    required: true,
    enum: ['morning', 'afternoon', 'night']
  },
  images: [{
    type: String
  }],
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'rejected'],
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
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Report', ReportSchema);
