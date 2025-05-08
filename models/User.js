const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  role: {
    type: String,
    enum: ['operator', 'supervisor', 'admin'],
    default: 'operator'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'vacation'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash de la contraseña antes de guardar
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Método para verificar contraseña
UserSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', UserSchema);