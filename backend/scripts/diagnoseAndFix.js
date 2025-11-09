// scripts/diagnoseAndFix.js
// Run this to diagnose and fix your data issues
// Usage: node scripts/diagnoseAndFix.js

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Brand = require('../models/Brand');
const BrandMatch = require('../models/BrandMatch');
const Influencer = require('../models/Influencer');
const DashboardInfluencer = require('../models/DashboardInfluencer');

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

async function diagnose() {
  console.log('\n========================================');
  console.log('🔍 BRANDSCAPE DATA DIAGNOSTIC TOOL');
  console.log('========================================\n');

  try {
    // 1. Check Brands
    console.log('📊 CHECKING BRANDS...\n');
    const brands = await Brand.find().limit(5);
    console.log(`Total brands: ${await Brand.countDocuments()}`);
    
    if (brands.length > 0) {
      console.log('\nSample brand usernames:');
      brands.forEach(b => {
        console.log(`  - "${b.username}" (ID: ${b._id})`);
      });
    } else {
      console.log('⚠️  No brands found! Please signup a brand first.');
    }

    // 2. Check BrandMatch data
    console.log('\n📊 CHECKING BRANDMATCH DATA...\n');
    const matchCount = await BrandMatch.countDocuments();
    console.log(`Total brand matches: ${matchCount}`);
    
    if (matchCount === 0) {
      console.log('❌ No BrandMatch data! Run: node scripts/importCSV.js');
    } else {
      const uniqueBrands = await BrandMatch.distinct('brand_username');
      console.log(`\nUnique brand usernames in matches: ${uniqueBrands.length}`);
      console.log('Sample brand usernames from CSV:');
      uniqueBrands.slice(0, 10).forEach(username => {
        console.log(`  - "${username}"`);
      });
    }

    // 3. Test matching for each brand
    console.log('\n📊 TESTING BRAND MATCHING...\n');
    
    for (const brand of brands) {
      console.log(`\nTesting brand: "${brand.username}"`);
      
      // Exact match
      const exactMatch = await BrandMatch.findOne({ 
        brand_username: brand.username 
      });
      
      // Case-insensitive match
      const caseMatch = await BrandMatch.findOne({ 
        brand_username: new RegExp(`^${brand.username}$`, 'i') 
      });
      
      // Count all matches
      const matchCount = await BrandMatch.countDocuments({ 
        brand_username: new RegExp(`^${brand.username}$`, 'i') 
      });
      
      if (exactMatch) {
        console.log(`  ✅ Exact match found! (${matchCount} influencers)`);
      } else if (caseMatch) {
        console.log(`  ⚠️  Case-insensitive match found!`);
        console.log(`     DB has: "${caseMatch.brand_username}"`);
        console.log(`     Brand profile has: "${brand.username}"`);
        console.log(`     👉 FIX: Update brand.username to match exactly`);
        
        // Auto-fix option
        console.log(`\n     Run this to fix:`);
        console.log(`     db.brands.updateOne({_id: ObjectId("${brand._id}")}, {$set: {username: "${caseMatch.brand_username}"}})`);
      } else {
        console.log(`  ❌ No match found!`);
        console.log(`     Brand username "${brand.username}" not in final_brand_top10.csv`);
      }
    }

    // 4. Check Influencer data
    console.log('\n📊 CHECKING INFLUENCER DATA...\n');
    const influencerCount = await Influencer.countDocuments();
    const dashboardCount = await DashboardInfluencer.countDocuments();
    
    console.log(`Influencer collection: ${influencerCount} records`);
    console.log(`DashboardInfluencer collection: ${dashboardCount} records`);
    
    if (influencerCount === 0 && dashboardCount === 0) {
      console.log('❌ No influencer data! Run: node scripts/importCSV.js');
    } else {
      // Sample data from DashboardInfluencer
      const sampleDash = await DashboardInfluencer.findOne();
      if (sampleDash) {
        console.log('\n📋 DashboardInfluencer schema fields:');
        console.log(Object.keys(sampleDash.toObject()).join(', '));
        console.log(`\n✅ Has total_likes: ${sampleDash.total_likes !== undefined}`);
        console.log(`✅ Has likes: ${sampleDash.likes !== undefined}`);
        console.log(`✅ Has comments: ${sampleDash.comments !== undefined}`);
      }
      
      // Sample from Influencer
      const sampleInf = await Influencer.findOne();
      if (sampleInf) {
        console.log('\n📋 Influencer schema fields:');
        console.log(Object.keys(sampleInf.toObject()).join(', '));
        console.log(`\n✅ Has total_likes: ${sampleInf.total_likes !== undefined}`);
        console.log(`✅ Has likes: ${sampleInf.likes !== undefined}`);
        console.log(`✅ Has comments: ${sampleInf.comments !== undefined}`);
      }
    }

    // 5. Check CSV import consistency
    console.log('\n📊 CHECKING DATA CONSISTENCY...\n');
    
    const sampleMatch = await BrandMatch.findOne();
    if (sampleMatch) {
      const influencerUsername = sampleMatch.influencer_username;
      
      const inInfluencer = await Influencer.findOne({ username: influencerUsername });
      const inDashboard = await DashboardInfluencer.findOne({ username: influencerUsername });
      
      console.log(`Sample influencer: ${influencerUsername}`);
      console.log(`  In BrandMatch: ✅`);
      console.log(`  In Influencer: ${inInfluencer ? '✅' : '❌'}`);
      console.log(`  In DashboardInfluencer: ${inDashboard ? '✅' : '❌'}`);
      
      if (!inInfluencer && !inDashboard) {
        console.log('\n⚠️  WARNING: Influencers in BrandMatch but not in Influencer/DashboardInfluencer collections!');
        console.log('   This will cause "No influencer matches" errors.');
        console.log('   👉 FIX: Run node scripts/importCSV.js');
      }
    }

    console.log('\n========================================');
    console.log('🏁 DIAGNOSTIC COMPLETE');
    console.log('========================================\n');

    // Recommendations
    console.log('💡 RECOMMENDATIONS:\n');
    
    if (matchCount === 0) {
      console.log('1. ❌ Import CSV data first:');
      console.log('   node scripts/importCSV.js\n');
    }
    
    if (brands.length === 0) {
      console.log('2. ⚠️  No brands registered. Signup via:');
      console.log('   http://localhost:3000/brand_signup.html\n');
    }
    
    console.log('3. ✅ After fixes, test campaign creation:');
    console.log('   http://localhost:3000/create_campaign.html\n');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error during diagnosis:', error);
    process.exit(1);
  }
}

diagnose();