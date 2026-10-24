const mongoose = require('mongoose');

const cropSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  nameHi: { type: String, required: true },
  season: { type: String, enum: ['Kharif', 'Rabi', 'Zaid'], required: true },
  soilType: { type: String, required: true },
  soilTypeHi: { type: String, default: '' },
  sowingMonths: { type: String, required: true },
  sowingMonthsHi: { type: String, default: '' },
  harvestMonths: { type: String, required: true },
  harvestMonthsHi: { type: String, default: '' },
  durationDays: { type: Number, required: true },
  waterRequirement: { type: String, required: true },
  waterRequirementHi: { type: String, default: '' },
  fertilizer: { type: String, required: true },
  fertilizerHi: { type: String, default: '' },
  irrigationGuide: { type: String, required: true },
  irrigationGuideHi: { type: String, default: '' },
  description: { type: String, default: '' },
  descriptionHi: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Crop', cropSchema);
