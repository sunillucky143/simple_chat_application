const express = require('express');
const messageRoutes = require('./messageRoutes');

const router = express.Router();

// Health check route
router.get('/', (req, res) => {
  res.json({ message: 'SimpleChat API is running' });
});

// Message routes
router.use('/messages', messageRoutes);

module.exports = router;