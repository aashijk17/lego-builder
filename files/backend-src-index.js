/**
 * LEGO Builder Backend API
 * 
 * Serves set data and runs matching algorithm
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:password@mongodb:27017/lego_builder';

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000'
}));
app.use(express.json());

// Connect to MongoDB
console.log('🔗 Connecting to MongoDB...');
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// Import routes (we'll create these next)
// const setRoutes = require('./routes/sets');
// const builderRoutes = require('./routes/builder');

// Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Placeholder route
app.get('/api/sets', (req, res) => {
  res.json({ 
    message: 'Sets endpoint coming soon',
    status: 'in development'
  });
});

// app.use('/api/sets', setRoutes);
// app.use('/api/builder', builderRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🟧 LEGO Builder Backend`);
  console.log(`📍 Listening on http://localhost:${PORT}`);
  console.log(`🔄 API ready for requests\n`);
});

module.exports = app;
