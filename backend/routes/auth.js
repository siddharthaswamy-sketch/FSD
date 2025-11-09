const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Brand = require('../models/Brand');
const Influencer = require('../models/Influencer');
const BrandMatch = require('../models/BrandMatch');

// Brand Signup
router.post('/brand/signup', async (req, res) => {
  try {
    const { email, password, username, name, category, bio } = req.body;

    console.log('Signup attempt for username:', username);

    // Validate required fields
    if (!email || !password || !username || !name) {
      return res.status(400).json({ 
        message: 'Please provide all required fields: email, password, username, and name' 
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('Email already registered:', email);
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Check if brand username exists
    const existingBrand = await Brand.findOne({ username });
    if (existingBrand) {
      console.log('Brand username already taken:', username);
      return res.status(400).json({ message: 'Brand username already taken. Please login instead.' });
    }

    // Check if username exists in BrandMatch data (case-insensitive)
    console.log('Checking BrandMatch for username:', username);
    const brandInMatches = await BrandMatch.findOne({ 
      brand_username: new RegExp(`^${username}$`, 'i') 
    });
    
    if (!brandInMatches) {
      console.log('Brand username not found in BrandMatch data:', username);
      return res.status(400).json({ 
        message: 'Brand username not found in our system. Please use a registered brand username from our partner list.' 
      });
    }

    console.log('Brand found in matches, category:', brandInMatches.brand_category);

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = new User({
      email,
      password: hashedPassword,
      userType: 'brand'
    });
    await user.save();
    console.log('User created:', user._id);

    // Create brand profile - use provided name if brand_name is undefined
    const brand = new Brand({
      userId: user._id,
      username: brandInMatches.brand_username, // Use exact username from DB
      name: brandInMatches.brand_name || name, // Fallback to user-provided name
      category: brandInMatches.brand_category || category,
      bio: brandInMatches.brand_bio || bio,
      email
    });
    await brand.save();
    console.log('Brand profile created:', brand._id);

    // Generate token
    const token = jwt.sign(
      { userId: user._id, userType: 'brand', brandId: brand._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('Signup successful for:', username);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        userType: 'brand',
        brandId: brand._id,
        username: brand.username,
        name: brand.name
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error during signup', error: error.message });
  }
});

// Brand Login
router.post('/brand/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email, userType: 'brand' });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Get brand profile
    const brand = await Brand.findOne({ userId: user._id });

    // Generate token
    const token = jwt.sign(
      { userId: user._id, userType: 'brand', brandId: brand._id, brandUsername: brand.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        userType: 'brand',
        brandId: brand._id,
        username: brand.username,
        name: brand.name
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Get available brand usernames (for signup assistance)
router.get('/available-brands', async (req, res) => {
  try {
    const brands = await BrandMatch.aggregate([
      {
        $group: {
          _id: "$brand_username",
          brand_name: { $first: "$brand_name" },
          brand_category: { $first: "$brand_category" }
        }
      },
      {
        $project: {
          _id: 0,
          username: "$_id",
          name: "$brand_name",
          category: "$brand_category"
        }
      },
      { $sort: { name: 1 } }
    ]);

    res.json(brands);
  } catch (error) {
    console.error('Error fetching brands:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Influencer Login (for future use)
router.post('/influencer/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email, userType: 'influencer' });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const influencer = await Influencer.findOne({ userId: user._id });

    const token = jwt.sign(
      { userId: user._id, userType: 'influencer', influencerId: influencer._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        userType: 'influencer',
        influencerId: influencer._id,
        username: influencer.username,
        name: influencer.name
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

module.exports = router;