const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema(
  {
    rental: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Rental',
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Conversation', ConversationSchema);