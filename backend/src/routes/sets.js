const express = require('express');
const router = express.Router();
const Set = require('../models/Set');

// GET all sets
router.get('/', async (req, res) => {
  try {
    console.log('Fetching sets...');
    const sets = await Set.find({});
    console.log('Found:', sets.length, 'sets');
    res.json({
      count: sets.length,
      sets: sets.slice(0, 10) // Show first 10
    });
  } catch (err) {
    console.error('Error finding sets:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET single set
router.get('/:setId', async (req, res) => {
  try {
    const set = await Set.findOne({ setId: req.params.setId });
    if (!set) return res.status(404).json({ error: 'Set not found' });
    res.json(set);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
