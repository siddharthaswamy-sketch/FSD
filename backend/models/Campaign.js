const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  brandId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brand',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  description: String,
  budget: Number,
  targetAudience: {
    ageGroups: [String],
    locations: [String],
    gender: String
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'completed'],
    default: 'draft'
  },
  topInfluencers: [{
    influencerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Influencer'
    },
    brandMatchScore: Number,
    matchData: {
      engagement_rate_scaled: Number,
      pagerank: Number,
      bot_score: Number,
      sponsored_posts_scaled: Number,
      category_relevance_score: Number,
      sentiment_score: Number
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.models.Campaign || mongoose.model('Campaign', campaignSchema);