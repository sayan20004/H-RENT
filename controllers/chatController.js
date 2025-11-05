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
      .populate('sender', 'firstName lastName _id')
      .sort({ createdAt: 'asc' });

    res.status(200).json({ success: true, messages });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.sendMessage = async (req, res) => {
  const { conversationId } = req.params;
  const { text } = req.body;
  const senderId = req.user._id;

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
    });

    await message.save();

    await Conversation.findByIdAndUpdate(conversationId, {
      updatedAt: Date.now(),
    });
    
    const populatedMessage = await message.populate('sender', 'firstName lastName _id');

    res.status(201).json({ success: true, message: populatedMessage });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};