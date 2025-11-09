const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const BrandMatch = require('../models/BrandMatch');
const Influencer = require('../models/Influencer');

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

async function checkInfluencers() {
  const brandUsername = process.argv[2] || '_makeupbygoddess';

  try {
    console.log(`\nChecking influencers for brand: ${brandUsername}\n`);
    
    // Get matches from BrandMatch
    const matches = await BrandMatch.find({ 
      brand_username: brandUsername 
    }).limit(10);

    console.log(`Found ${matches.length} matches in BrandMatch collection\n`);

    if (matches.length === 0) {
      console.log('No matches found');
      process.exit(0);
    }

    // Check if influencer profiles exist
    const influencerUsernames = matches.map(m => m.influencer_username);
    
    console.log('Checking for influencer profiles...\n');
    
    for (const match of matches) {
      const influencer = await Influencer.findOne({ username: match.influencer_username });
      
      if (influencer) {
        console.log(`✅ ${match.influencer_username}`);
        console.log(`   Name: ${influencer.name || 'N/A'}`);
        console.log(`   Followers: ${influencer.followers || 0}`);
        console.log(`   Likes: ${influencer.likes || 0}`);
        console.log(`   Comments: ${influencer.comments || 0}`);
        console.log(`   Match Score: ${(match.brand_match_score_scaled * 100).toFixed(1)}%\n`);
      } else {
        console.log(`❌ ${match.influencer_username} - PROFILE NOT FOUND IN INFLUENCER COLLECTION\n`);
      }
    }
    
    const foundProfiles = await Influencer.find({
      username: { $in: influencerUsernames }
    });

    console.log(`\n📊 Summary:`);
    console.log(`   Matches in BrandMatch: ${matches.length}`);
    console.log(`   Profiles in Influencer collection: ${foundProfiles.length}`);
    console.log(`   Missing profiles: ${matches.length - foundProfiles.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkInfluencers();