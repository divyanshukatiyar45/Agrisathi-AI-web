const mongoose = require('mongoose');

const mandiPriceSchema = new mongoose.Schema({
  commodity: { type: String, required: true, trim: true },
  commodityHi: { type: String, default: '', trim: true },
  market: { type: String, required: true, trim: true },
  district: { type: String, default: '', trim: true },
  state: { type: String, default: 'Uttar Pradesh', trim: true },
  minPrice: { type: Number, required: true, min: 0 },
  maxPrice: { type: Number, required: true, min: 0 },
  modalPrice: { type: Number, required: true, min: 0 },
  date: { type: String, required: true }, // YYYY-MM-DD
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('MandiPrice', mandiPriceSchema);