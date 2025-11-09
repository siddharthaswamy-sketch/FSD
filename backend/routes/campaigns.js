const express = require('express');
const router = express.Router();
const Campaign = require('../models/Campaign');
const BrandMatch = require('../models/BrandMatch');
const Influencer = require('../models/Influencer');
const Brand = require('../models/Brand');
const auth = require('../middleware/auth');

// campaigns.js - FIXED VERSION
// Replace your campaigns.js POST route with this

router.post('/', auth, async (req, res) => {
  try {
    const { name, category, description, budget, targetAudience } = req.body;
    
    // Get brand info
    const brand = await Brand.findById(req.user.brandId);
    if (!brand) {
      return res.status(404).json({ message: 'Brand not found' });
    }

    console.log('Creating campaign for brand username:', brand.username);

    // Create campaign
    const campaign = new Campaign({
      brandId: req.user.brandId,
      name,
      category,
      description,
      budget,
      targetAudience,
      status: 'active'
    });

    await campaign.save();

    // ====== IMPROVED MATCHING ALGORITHM ======
    
    // Try exact match first
    let matches = await BrandMatch.find({
      brand_username: brand.username
    }).sort({ brand_match_score_scaled: -1 }).limit(10);

    // If no exact match, try case-insensitive
    if (matches.length === 0) {
      console.log('No exact match, trying case-insensitive...');
      matches = await BrandMatch.find({
        brand_username: new RegExp(`^${brand.username}$`, 'i')
      }).sort({ brand_match_score_scaled: -1 }).limit(10);
    }

    // If still no matches, try trimmed version (whitespace issues)
    if (matches.length === 0) {
      console.log('Trying trimmed username...');
      const trimmedUsername = brand.username.trim();
      matches = await BrandMatch.find({
        brand_username: new RegExp(`^${trimmedUsername}$`, 'i')
      }).sort({ brand_match_score_scaled: -1 }).limit(10);
    }

    // If still no matches, try partial match as last resort
    if (matches.length === 0) {
      console.log('Trying partial match...');
      matches = await BrandMatch.find({
        brand_username: new RegExp(brand.username, 'i')
      }).sort({ brand_match_score_scaled: -1 }).limit(10);
    }

    console.log(`Found ${matches.length} matches for brand: ${brand.username}`);

    if (matches.length === 0) {
      // Debug output
      const allBrands = await BrandMatch.distinct('brand_username');
      console.log('Available brand usernames in DB:', allBrands.slice(0, 10));
      
      return res.status(404).json({ 
        message: `No influencer matches found for brand username "${brand.username}". Please ensure your brand username matches the data in final_brand_top10.csv`,
        availableBrands: allBrands.slice(0, 10)
      });
    }

    // Get influencer usernames from matches
    const influencerUsernames = matches.map(m => m.influencer_username);
    console.log('Looking for influencers:', influencerUsernames);
    
    // Try to get influencers from Influencer collection
    let influencers = await Influencer.find({
      username: { $in: influencerUsernames }
    });

    // If not found in Influencer, try DashboardInfluencer
    if (influencers.length === 0) {
      console.log('No influencers in Influencer collection, checking DashboardInfluencer...');
      influencers = await DashboardInfluencer.find({
        username: { $in: influencerUsernames }
      });
    }

    console.log(`Found ${influencers.length} influencer profiles`);

    // Build topInfluencers array with match data
    const topInfluencers = [];
    
    for (const match of matches) {
      const inf = influencers.find(i => i.username === match.influencer_username);
      if (inf) {
        topInfluencers.push({
          influencerId: inf._id,
          brandMatchScore: match.brand_match_score_scaled,
          matchData: {
            engagement_rate_scaled: match.engagement_rate_scaled,
            pagerank: match.pagerank,
            bot_score: match.bot_score,
            sponsored_posts_scaled: match.sponsored_posts_scaled,
            category_relevance_score: match.category_relevance_score,
            sentiment_score: match.sentiment_score
          }
        });
      } else {
        console.log('⚠️ Profile not found for:', match.influencer_username);
      }
    }

    console.log(`✅ Successfully matched ${topInfluencers.length} influencers`);

    if (topInfluencers.length === 0) {
      return res.status(404).json({
        message: 'Found brand matches but influencer profiles are missing. Please run: node scripts/importCSV.js'
      });
    }

    // Save matched influencers to campaign
    campaign.topInfluencers = topInfluencers;
    await campaign.save();

    // Populate influencer details
    await campaign.populate('topInfluencers.influencerId');

    res.status(201).json(campaign);
  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get campaign by ID with influencer details
router.get('/:id', auth, async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id)
      .populate('brandId')
      .populate('topInfluencers.influencerId');

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    // Check if campaign belongs to user
    if (campaign.brandId._id.toString() !== req.user.brandId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(campaign);
  } catch (error) {
    console.error('Error fetching campaign:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all campaigns for a brand
router.get('/brand/all', auth, async (req, res) => {
  try {
    const campaigns = await Campaign.find({ brandId: req.user.brandId })
      .sort({ createdAt: -1 });

    res.json(campaigns);
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete campaign
router.delete('/:id', auth, async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    // Check ownership
    if (campaign.brandId.toString() !== req.user.brandId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Campaign.findByIdAndDelete(req.params.id);

    res.json({ message: 'Campaign deleted successfully' });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


module.exports = router;