const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    default: '',
  },
  language: {
    type: String,
    enum: ['en', 'hi'],
    default: 'en',
  },
  role: {
    type: String,
    enum: ['farmer', 'admin'],
    default: 'farmer',
  },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
