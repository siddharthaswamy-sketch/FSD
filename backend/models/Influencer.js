const mongoose = require('mongoose');

const influencerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  username: {
    type: String,
    required: true,
    unique: true
  },
  name: String,
  followers: Number,
  followees: Number,
  posts: Number,
  category: String,
  email: String,
  bio: String,
  num_posts: Number,
  likes: Number,
  comments: Number,
  engagement_rate: Number,
  engagement_log: Number,
  engagement_rate_scaled: Number,
  bot_score: Number,
  authenticity: Number,
  pagerank: Number,
  positive_percentage: Number,
  neutral_percentage: Number,
  negative_percentage: Number,
  sentiment_score: Number,
  dominant_sentiment: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.models.Influencer || mongoose.model('Influencer', influencerSchema);