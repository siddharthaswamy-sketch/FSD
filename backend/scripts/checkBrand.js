const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const BrandMatch = require('../models/BrandMatch');

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

async function checkBrand() {
  const brandUsername = process.argv[2];
  
  if (!brandUsername) {
    console.log('Usage: node scripts/checkBrand.js <brand_username>');
    process.exit(1);
  }

  try {
    console.log(`\nSearching for brand: ${brandUsername}\n`);
    
    // Exact match
    const exactMatch = await BrandMatch.findOne({ brand_username: brandUsername });
    if (exactMatch) {
      console.log('✅ Exact match found!');
      console.log('Brand Name:', exactMatch.brand_name);
      console.log('Category:', exactMatch.brand_category);
    } else {
      console.log('❌ No exact match found');
    }
    
    // Case-insensitive match
    const caseInsensitive = await BrandMatch.findOne({ 
      brand_username: new RegExp(`^${brandUsername}$`, 'i') 
    });
    
    if (caseInsensitive) {
      console.log('\n✅ Case-insensitive match found!');
      console.log('Actual username in DB:', caseInsensitive.brand_username);
      console.log('Brand Name:', caseInsensitive.brand_name);
    }
    
    // All matches for this brand
    const allMatches = await BrandMatch.find({ 
      brand_username: new RegExp(`^${brandUsername}$`, 'i') 
    });
    
    console.log(`\n📊 Total influencer matches: ${allMatches.length}`);
    
    if (allMatches.length > 0) {
      console.log('\nTop 5 matched influencers:');
      allMatches.slice(0, 5).forEach((match, i) => {
        console.log(`${i + 1}. ${match.influencer_username} (Score: ${(match.brand_match_score_scaled * 100).toFixed(1)}%)`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkBrand();