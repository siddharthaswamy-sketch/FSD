const express = require('express');
const router = express.Router();
const Brand = require('../models/Brand');
const auth = require('../middleware/auth');

// Get brand profile
router.get('/profile', auth, async (req, res) => {
  try {
    const brand = await Brand.findById(req.user.brandId);
    
    if (!brand) {
      return res.status(404).json({ message: 'Brand not found' });
    }

    res.json(brand);
  } catch (error) {
    console.error('Error fetching brand profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update brand profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, bio, category } = req.body;
    
    const brand = await Brand.findByIdAndUpdate(
      req.user.brandId,
      { name, bio, category },
      { new: true }
    );

    if (!brand) {
      return res.status(404).json({ message: 'Brand not found' });
    }

    res.json(brand);
  } catch (error) {
    console.error('Error updating brand profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;