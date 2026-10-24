const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: {
    type: String,
    enum: ['irrigation', 'fertilizer', 'sowing', 'harvest', 'pest', 'other'],
    required: true,
  },
  crop: { type: String, default: '' },
  dueDate: { type: String, required: true }, // YYYY-MM-DD
  repeatEveryDays: { type: Number, default: 0 },
  note: { type: String, default: '' },
  done: { type: Boolean, default: false },
  lastDoneAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Reminder', reminderSchema);