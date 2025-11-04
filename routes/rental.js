const express = require('express');
const router = express.Router();
const {
  createRentalRequest,
  getMyRentalRequests,
  getIncomingRentalRequests,
  updateRentalStatus,
} = require('../controllers/rentalController');
const { protect, isOwner } = require('../middleware/authMiddleware');

router.route('/').post(protect, createRentalRequest);
router.route('/my-requests').get(protect, getMyRentalRequests);
router
  .route('/incoming-requests')
  .get(protect, isOwner, getIncomingRentalRequests);
router.route('/:id/status').put(protect, updateRentalStatus);

module.exports = router;