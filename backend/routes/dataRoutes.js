const express = require('express');
const dataController = require('../controllers/dataController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes are protected
router.use(authenticate);

// Submit form data
router.post('/', dataController.submitFormData);

// Get user's data
router.get('/', dataController.getUserData);

module.exports = router;