const express = require('express');
const router = express.Router();
const Influencer = require('../models/Influencer');
const auth = require('../middleware/auth');

// Get top influencers for dashboard
router.get('/top', auth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const influencers = await Influencer.find()
      .sort({ engagement_rate: -1, followers: -1 })
      .limit(limit)
      .select('-userId');

    res.json(influencers);
  } catch (error) {
    console.error('Error fetching influencers:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get influencer by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const influencer = await Influencer.findById(req.params.id).select('-userId');
    
    if (!influencer) {
      return res.status(404).json({ message: 'Influencer not found' });
    }

    res.json(influencer);
  } catch (error) {
    console.error('Error fetching influencer:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Search influencers by category
router.get('/search/category/:category', auth, async (req, res) => {
  try {
    const { category } = req.params;
    const limit = parseInt(req.query.limit) || 10;

    const influencers = await Influencer.find({
      category: new RegExp(category, 'i')
    })
      .sort({ engagement_rate: -1 })
      .limit(limit)
      .select('-userId');

    res.json(influencers);
  } catch (error) {
    console.error('Error searching influencers:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;