const express = require('express');
const router = express.Router();
const {
  getOrCreateConversation,
  getMyConversations,
  getMessagesForConversation,
  sendMessage,
} = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getMyConversations);
router.route('/initiate').post(protect, getOrCreateConversation);

router
  .route('/:conversationId/messages')
  .get(protect, getMessagesForConversation)
  .post(protect, sendMessage);

module.exports = router;