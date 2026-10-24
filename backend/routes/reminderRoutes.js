const express = require('express');
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const Reminder = require('../models/Reminder');

const router = express.Router();

const TYPES = ['irrigation', 'fertilizer', 'sowing', 'harvest', 'pest', 'other'];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isValidDate(str) {
  if (typeof str !== 'string' || !DATE_RE.test(str)) return false;
  const d = new Date(`${str}T00:00:00Z`);
  return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === str;
}

function addDays(str, n) {
  const d = new Date(`${str}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

// All reminders: GET /api/reminders
router.get('/', auth, async (req, res) => {
  try {
    const reminders = await Reminder.find({ user: req.user.id }).sort({ dueDate: 1 });
    res.status(200).json(reminders);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create: POST /api/reminders  { type, crop, dueDate, repeatEveryDays, note }
router.post('/', auth, async (req, res) => {
  try {
    const { type, dueDate } = req.body;
    const crop = String(req.body.crop || '').slice(0, 50);
    const note = String(req.body.note || '').trim().slice(0, 200);
    const repeat = Number(req.body.repeatEveryDays || 0);

    if (!TYPES.includes(type)) {
      return res.status(400).json({ message: 'Invalid reminder type' });
    }
    if (!isValidDate(dueDate)) {
      return res.status(400).json({ message: 'Valid date is required' });
    }
    if (!Number.isInteger(repeat) || repeat < 0 || repeat > 365) {
      return res.status(400).json({ message: 'Invalid repeat days' });
    }
    if (type === 'other' && !note) {
      return res.status(400).json({ message: 'Note is required for Other' });
    }

    const reminder = await Reminder.create({
      user: req.user.id,
      type,
      crop,
      dueDate,
      repeatEveryDays: repeat,
      note,
    });

    res.status(201).json(reminder);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Mark done: PATCH /api/reminders/:id/done  { today: 'YYYY-MM-DD' }
router.patch('/:id/done', auth, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid id' });
    }

    const reminder = await Reminder.findOne({ _id: req.params.id, user: req.user.id });
    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }

    const today = isValidDate(req.body.today)
      ? req.body.today
      : new Date().toISOString().slice(0, 10);

    reminder.lastDoneAt = new Date();

    if (reminder.repeatEveryDays > 0) {
      // Repeat wala reminder agli tareekh par chala jata hai (aaj ke baad wali)
      let next = reminder.dueDate;
      let guard = 0;
      while (next <= today && guard < 400) {
        next = addDays(next, reminder.repeatEveryDays);
        guard += 1;
      }
      reminder.dueDate = next;
    } else {
      reminder.done = true;
    }

    await reminder.save();
    res.status(200).json(reminder);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete: DELETE /api/reminders/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid id' });
    }

    const result = await Reminder.deleteOne({ _id: req.params.id, user: req.user.id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Reminder not found' });
    }
    res.status(200).json({ message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;