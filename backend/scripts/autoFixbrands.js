// scripts/autoFixBrands.js
// This script automatically fixes brand username mismatches
// Usage: node scripts/autoFixBrands.js

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Brand = require('../models/Brand');
const BrandMatch = require('../models/BrandMatch');

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

async function autoFix() {
  console.log('\n========================================');
  console.log('🔧 AUTO-FIX BRAND USERNAMES');
  console.log('========================================\n');

  try {
    const brands = await Brand.find();
    let fixedCount = 0;
    let alreadyCorrect = 0;
    let noMatchFound = 0;

    for (const brand of brands) {
      console.log(`\nChecking: "${brand.username}"`);
      
      // Try exact match first
      const exactMatch = await BrandMatch.findOne({ 
        brand_username: brand.username 
      });
      
      if (exactMatch) {
        console.log('  ✅ Already correct!');
        alreadyCorrect++;
        continue;
      }
      
      // Try case-insensitive
      const caseMatch = await BrandMatch.findOne({ 
        brand_username: new RegExp(`^${brand.username}$`, 'i') 
      });
      
      if (caseMatch) {
        const correctUsername = caseMatch.brand_username;
        console.log(`  🔧 Fixing: "${brand.username}" → "${correctUsername}"`);
        
        brand.username = correctUsername;
        await brand.save();
        
        fixedCount++;
        console.log('  ✅ Fixed!');
      } else {
        console.log(`  ❌ No match in CSV data for "${brand.username}"`);
        noMatchFound++;
        
        // Show available similar usernames
        const similar = await BrandMatch.find({
          brand_username: new RegExp(brand.username.substring(0, 3), 'i')
        }).limit(5);
        
        if (similar.length > 0) {
          console.log('     Did you mean one of these?');
          similar.forEach(s => console.log(`     - ${s.brand_username}`));
        }
      }
    }

    console.log('\n========================================');
    console.log('📊 SUMMARY');
    console.log('========================================');
    console.log(`✅ Already correct: ${alreadyCorrect}`);
    console.log(`🔧 Fixed: ${fixedCount}`);
    console.log(`❌ No match found: ${noMatchFound}`);
    console.log('========================================\n');

    if (fixedCount > 0) {
      console.log('✨ Brands fixed! You can now create campaigns.\n');
    }
    
    if (noMatchFound > 0) {
      console.log('⚠️  Some brands have no matching data in CSV.');
      console.log('   These brands need to use usernames from final_brand_top10.csv\n');
    }

    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error during auto-fix:', error);
    process.exit(1);
  }
}

autoFix();