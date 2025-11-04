const express = require('express');
const router = express.Router();
const {
  createProperty,
  getMyProperties,
  updateProperty,
  deleteProperty,
  getAllProperties,
  getPropertyById,
} = require('../controllers/propertyController');
const { protect } = require('../middleware/authMiddleware');
const { isOwner } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, isOwner, createProperty)
  .get(protect, getAllProperties);

router.route('/my-properties')
  .get(protect, isOwner, getMyProperties);

router.route('/:id')
  .get(protect, getPropertyById)
  .put(protect, isOwner, updateProperty)
  .delete(protect, isOwner, deleteProperty);

module.exports = router;