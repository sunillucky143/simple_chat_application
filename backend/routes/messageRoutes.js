const express = require('express');
const messageController = require('../controllers/messageController');

const router = express.Router();

// Get all messages
router.get('/', messageController.getAllMessages);

// Get message by ID
router.get('/:id', messageController.getMessageById);

// Create a new message
router.post('/', messageController.createMessage);

module.exports = router;