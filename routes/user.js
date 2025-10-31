const express = require('express');
const router = express.Router();
const {
  updateUserProfile,
  getUserProfile,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// protect middleware ensures only logged-in users can access these routes
router.route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

module.exports = router;