const express = require('express');
const router = express.Router();
const {
  getOrCreateConversation,
  getMyConversations,
  getMessagesForConversation,
  sendMessage,
  editMessage,
  reactToMessage,
} = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getMyConversations);
router.route('/initiate').post(protect, getOrCreateConversation);

router
  .route('/:conversationId/messages')
  .get(protect, getMessagesForConversation)
  .post(protect, sendMessage);

router.route('/messages/:messageId').put(protect, editMessage);
router.route('/messages/:messageId/react').post(protect, reactToMessage);

module.exports = router;