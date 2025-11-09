const mongoose = require('mongoose');

const brandMatchSchema = new mongoose.Schema({
  brand_username: String,
  brand_name: String,
  brand_bio: String,
  brand_category: String,
  email: String,
  influencer_username: String,
  influencer_category: String,
  engagement_rate_scaled: Number,
  pagerank: Number,
  bot_score: Number,
  sponsored_posts_scaled: Number,
  category_relevance_score: Number,
  sentiment_score: Number,
  brand_match_score_scaled: Number
});

module.exports = mongoose.models.BrandMatch || mongoose.model('BrandMatch', brandMatchSchema);