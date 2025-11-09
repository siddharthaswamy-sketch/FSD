const express = require('express');
const router = express.Router();
const DashboardInfluencer = require('../models/DashboardInfluencer');
const auth = require('../middleware/auth');

// Get influencers for dashboard with pagination
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 30;
    const skip = (page - 1) * limit;
    
    const influencers = await DashboardInfluencer.find()
      .sort({ engagement_rate: -1, followers: -1 })
      .skip(skip)
      .limit(limit);

    const total = await DashboardInfluencer.countDocuments();

    res.json({
      influencers,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalInfluencers: total
    });
  } catch (error) {
    console.error('Error fetching dashboard influencers:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Search dashboard influencers
router.get('/search', auth, async (req, res) => {
  try {
    const { query } = req.query;
    const limit = parseInt(req.query.limit) || 30;

    const searchRegex = new RegExp(query, 'i');
    
    const influencers = await DashboardInfluencer.find({
      $or: [
        { name: searchRegex },
        { username: searchRegex },
        { category: searchRegex }
      ]
    })
      .sort({ engagement_rate: -1 })
      .limit(limit);

    res.json(influencers);
  } catch (error) {
    console.error('Error searching influencers:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
// Get influencer by username - ENSURE IT RETURNS ALL FIELDS
router.get('/username/:username', auth, async (req, res) => {
  try {
    const influencer = await DashboardInfluencer.findOne({ 
      username: req.params.username 
    });
    
    if (!influencer) {
      return res.status(404).json({ message: 'Influencer not found' });
    }

    // DEBUG: Log what we're sending
    console.log('=== SENDING INFLUENCER DATA ===');
    console.log('Username:', influencer.username);
    console.log('total_likes:', influencer.total_likes);
    console.log('comments:', influencer.comments);
    console.log('positive_percentage:', influencer.positive_percentage);
    console.log('neutral_percentage:', influencer.neutral_percentage);
    console.log('negative_percentage:', influencer.negative_percentage);
    console.log('================================');

    res.json(influencer);
  } catch (error) {
    console.error('Error fetching influencer:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;