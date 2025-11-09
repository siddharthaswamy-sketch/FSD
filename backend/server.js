const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const brandRoutes = require('./routes/brands');
const influencerRoutes = require('./routes/influencers');
const campaignRoutes = require('./routes/campaigns');
const dashboardInfluencerRoutes = require('./routes/dashboardInfluencers');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/influencers', influencerRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/dashboard-influencers', dashboardInfluencerRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'BrandScape API is running' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});