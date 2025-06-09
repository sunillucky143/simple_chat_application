const express = require('express');
const messageRoutes = require('./messageRoutes');
const userRoutes = require('./userRoutes');
const dataRoutes = require('./dataRoutes');

const router = express.Router();

// Health check route
router.get('/', (req, res) => {
  res.json({ message: 'SimpleChat API is running' });
});

// Message routes
router.use('/messages', messageRoutes);

// User routes (auth, profile)
router.use('/', userRoutes);

// Data routes
router.use('/data', dataRoutes);

module.exports = router;