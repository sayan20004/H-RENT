const mongoose = require('mongoose');

const PropertySchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    title: {
      type: String,
      required: [true, 'Please add a title'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Please add a description'],
    },
    address: {
      type: String,
      required: [true, 'Please add an address'],
    },
    images: {
      type: [String],
      required: [true, 'Please add at least one image URL'],
    },
    price: {
      type: Number,
      required: [true, 'Please add a price'],
    },
    pricingFrequency: {
      type: String,
      required: true,
      enum: ['monthly', 'weekly', 'quarterly', 'yearly'],
      default: 'monthly',
    },
    allowBargaining: {
      type: Boolean,
      default: false,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Property', PropertySchema);