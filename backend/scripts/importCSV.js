const mongoose = require('mongoose');
const fs = require('fs');
const csv = require('csv-parser');
const Influencer = require('../models/Influencer');
const BrandMatch = require('../models/BrandMatch');
const Brand = require('../models/Brand');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI);

// Import Influencers
async function importInfluencers() {
  const influencers = [];
  
  fs.createReadStream('../data/final_filtered_influencer.csv')
    .pipe(csv())
    .on('data', (row) => {
      influencers.push({
        username: row.username,
        name: row.name,
        email: row.email,
        followers: parseInt(row.followers) || 0,
        followees: parseInt(row.followees) || 0,
        posts: parseInt(row.posts) || 0,
        category: row.category,
        bio: row.bio,
        engagement_rate: parseFloat(row.engagement_rate) || 0,
        engagement_rate_scaled: parseFloat(row.engagement_rate_scaled) || 0,
        bot_score: parseFloat(row.bot_score) || 0,
        authenticity: parseFloat(row.authenticity) || 0,
        pagerank: parseFloat(row.pagerank) || 0,
        positive_percentage: parseFloat(row.positive_percentage) || 0,
        neutral_percentage: parseFloat(row.neutral_percentage) || 0,
        negative_percentage: parseFloat(row.negative_percentage) || 0,
        sentiment_score: parseFloat(row.sentiment_score) || 0,
        dominant_sentiment: row.dominant_sentiment
      });
    })
    .on('end', async () => {
      await Influencer.deleteMany({});
      await Influencer.insertMany(influencers);
      console.log(`✅ ${influencers.length} Influencers imported successfully!`);
      importBrandMatches();
    });
}

// Import Brand Matches
async function importBrandMatches() {
  const matches = [];
  const uniqueBrands = new Set();
  
  fs.createReadStream('../data/final_brand_top10.csv')
    .pipe(csv())
    .on('data', (row) => {
      uniqueBrands.add(row.brand_username);
      
      matches.push({
        brand_username: row.brand_username,
        brand_name: row['brand name'] || row.brand_name,
        brand_category: row.brand_category,
        brand_bio: row.brand_bio,
        brand_email: row.email,
        influencer_username: row.influencer_username,
        influencer_category: row.influencer_category,
        engagement_rate_scaled: parseFloat(row.engagement_rate_scaled) || 0,
        pagerank: parseFloat(row.pagerank) || 0,
        bot_score: parseFloat(row.bot_score) || 0,
        sponsored_posts_scaled: parseFloat(row.sponsored_posts_scaled) || 0,
        category_relevance_score: parseFloat(row.category_relevance_score) || 0,
        sentiment_score: parseFloat(row.sentiment_score) || 0,
        brand_match_score_scaled: parseFloat(row.brand_match_score_scaled) || 0
      });
    })
    .on('end', async () => {
      await BrandMatch.deleteMany({});
      await BrandMatch.insertMany(matches);
      console.log(`✅ ${matches.length} Brand matches imported successfully!`);
      console.log(`✅ Found ${uniqueBrands.size} unique brands with pre-matched influencers`);
      mongoose.connection.close();
    });
}

importInfluencers();