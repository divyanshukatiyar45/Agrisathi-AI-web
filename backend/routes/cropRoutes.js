const express = require('express');
const Crop = require('../models/Crop');

const router = express.Router();

// All crops: GET /api/crops?season=Rabi
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.season) {
      filter.season = req.query.season;
    }
    const crops = await Crop.find(filter).sort({ name: 1 });
    res.status(200).json(crops);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Single crop: GET /api/crops/:id
router.get('/:id', async (req, res) => {
  try {
    const crop = await Crop.findById(req.params.id);
    if (!crop) {
      return res.status(404).json({ message: 'Crop not found' });
    }
    res.status(200).json(crop);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
