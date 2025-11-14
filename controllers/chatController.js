const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Rental = require('../models/Rental');
const User = require('../models/User');

const populateConversation = [
  {
    path: 'rental',
    select: 'property',
    populate: {
      path: 'property',
      select: 'title images price pricingFrequency _id',
    },
  },
  {
    path: 'participants',
    select: 'firstName lastName _id',
  },
];

const populateMessage = [
  {
    path: 'sender',
    select: 'firstName lastName _id',
  },
  {
    path: 'reactions.user',
    select: 'firstName lastName _id',
  },
];

exports.getOrCreateConversation = async (req, res) => {
  const { rentalId } = req.body;
  const myId = req.user._id;

  try {
    const rental = await Rental.findById(rentalId);
    if (!rental) {
      return res.status(404).json({ message: 'Rental not found' });
    }

    if (
      rental.tenant.toString() !== myId.toString() &&
      rental.owner.toString() !== myId.toString()
    ) {
      return res.status(401).json({ message: 'Not authorized for this rental' });
    }

    let conversation = await Conversation.findOne({ rental: rentalId });

    if (!conversation) {
      conversation = new Conversation({
        rental: rentalId,
        participants: [rental.tenant, rental.owner],
      });
      await conversation.save();
    }
    
    conversation = await conversation.populate(populateConversation);

    res.status(200).json({ success: true, conversation });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getMyConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
    })
      .populate(populateConversation)
      .sort({ updatedAt: -1 });

    res.status(200).json({ success: true, conversations });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getMessagesForConversation = async (req, res) => {
  const { conversationId } = req.params;

  try {
    const messages = await Message.find({ conversation: conversationId })
      .populate(populateMessage)
      .sort({ createdAt: 'asc' });

    res.status(200).json({ success: true, messages });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.sendMessage = async (req, res) => {
  const { conversationId } = req.params;
  const { text, imageUrl } = req.body;
  const senderId = req.user._id;

  if (!text && !imageUrl) {
    return res.status(400).json({ message: 'Message must include text or an image' });
  }

  try {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    const receiverId = conversation.participants.find(
      (p) => p.toString() !== senderId.toString()
    );

    const message = new Message({
      conversation: conversationId,
      sender: senderId,
      receiver: receiverId,
      text: text,
      imageUrl: imageUrl,
    });

    await message.save();

    await Conversation.findByIdAndUpdate(conversationId, {
      updatedAt: Date.now(),
    });
    
    const populatedMessage = await message.populate(populateMessage);

    res.status(201).json({ success: true, message: populatedMessage });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.editMessage = async (req, res) => {
  const { messageId } = req.params;
  const { text } = req.body;
  const userId = req.user._id;

  try {
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }
    if (message.sender.toString() !== userId.toString()) {
      return res.status(401).json({ message: 'Not authorized to edit' });
    }
    
    if (message.imageUrl) {
      return res.status(400).json({ message: 'Cannot edit messages with images' });
    }

    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    if (message.createdAt < twoMinutesAgo) {
      return res.status(400).json({ message: 'Edit time limit (2 min) exceeded' });
    }

    message.text = text;
    message.isEdited = true;
    await message.save();
    
    const populatedMessage = await message.populate(populateMessage);
    res.status(200).json({ success: true, message: populatedMessage });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.reactToMessage = async (req, res) => {
  const { messageId } = req.params;
  const { emoji } = req.body;
  const userId = req.user._id;

  try {
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(4404).json({ message: 'Message not found' });
    }

    const existingReactionIndex = message.reactions.findIndex(
      (r) => r.user.toString() === userId.toString()
    );

    if (existingReactionIndex > -1) {
      if (message.reactions[existingReactionIndex].emoji === emoji) {
        message.reactions.splice(existingReactionIndex, 1);
      } else {
        message.reactions[existingReactionIndex].emoji = emoji;
      }
    } else {
      message.reactions.push({ user: userId, emoji: emoji });
    }

    await message.save();
    const populatedMessage = await message.populate(populateMessage);
    res.status(200).json({ success: true, message: populatedMessage });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};