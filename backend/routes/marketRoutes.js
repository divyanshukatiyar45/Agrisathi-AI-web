const express = require('express');
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const MandiPrice = require('../models/MandiPrice');

const router = express.Router();

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isValidDate(str) {
  if (typeof str !== 'string' || !DATE_RE.test(str)) return false;
  const d = new Date(`${str}T00:00:00Z`);
  return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === str;
}

// Form se aaya data saaf karta hai aur jaanchta hai
function cleanBody(b) {
  const commodity = String(b.commodity || '').trim().slice(0, 60);
  const commodityHi = String(b.commodityHi || '').trim().slice(0, 60);
  const market = String(b.market || '').trim().slice(0, 80);
  const district = String(b.district || '').trim().slice(0, 60);
  const state = String(b.state || 'Uttar Pradesh').trim().slice(0, 40);
  const minPrice = Number(b.minPrice);
  const maxPrice = Number(b.maxPrice);
  const modalPrice = Number(b.modalPrice);
  const date = String(b.date || '');

  if (!commodity || !market) {
    return { error: 'Commodity and market are required' };
  }
  if (![minPrice, maxPrice, modalPrice].every((n) => Number.isFinite(n) && n >= 0)) {
    return { error: 'Prices must be valid numbers' };
  }
  if (minPrice > modalPrice || modalPrice > maxPrice) {
    return { error: 'Prices must follow: min <= modal <= max' };
  }
  if (!isValidDate(date)) {
    return { error: 'Valid date is required' };
  }

  return {
    data: { commodity, commodityHi, market, district, state, minPrice, maxPrice, modalPrice, date },
  };
}

// Sabke liye: GET /api/market
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.state) filter.state = String(req.query.state).slice(0, 40);

    const prices = await MandiPrice.find(filter)
      .sort({ date: -1, commodity: 1 })
      .limit(500);

    res.status(200).json(prices);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Sirf admin: naya bhaav jodna
router.post('/', auth, admin, async (req, res) => {
  try {
    const { data, error } = cleanBody(req.body);
    if (error) return res.status(400).json({ message: error });

    const price = await MandiPrice.create({ ...data, updatedBy: req.user.id });
    res.status(201).json(price);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Sirf admin: bhaav badalna
router.put('/:id', auth, admin, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid id' });
    }

    const { data, error } = cleanBody(req.body);
    if (error) return res.status(400).json({ message: error });

    const price = await MandiPrice.findByIdAndUpdate(
      req.params.id,
      { ...data, updatedBy: req.user.id },
      { new: true }
    );
    if (!price) return res.status(404).json({ message: 'Price not found' });

    res.status(200).json(price);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Sirf admin: bhaav hatana
router.delete('/:id', auth, admin, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid id' });
    }

    const result = await MandiPrice.deleteOne({ _id: req.params.id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Price not found' });
    }
    res.status(200).json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;