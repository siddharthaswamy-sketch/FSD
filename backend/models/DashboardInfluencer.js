const mongoose = require('mongoose');

const dashboardInfluencerSchema = new mongoose.Schema({
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
  total_posts: Number,
  total_likes: Number,
  comments: Number,
  engagement_rate: Number,
  bot_score: Number,
  authenticity: Number,
  pagerank: Number,
  positive_percentage: Number,
  negative_percentage: Number,
  neutral_percentage: Number,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.models.DashboardInfluencer || mongoose.model('DashboardInfluencer', dashboardInfluencerSchema);