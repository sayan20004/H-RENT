const Property = require('../models/Property');
const User = require('../models/User');

exports.createProperty = async (req, res) => {
  const {
    title,
    description,
    address,
    images,
    price,
    pricingFrequency,
    allowBargaining,
  } = req.body;

  if (!images || images.length === 0 || images[0] === "") {
     return res.status(400).json({ message: 'Please add at least one image URL' });
  }

  try {
    const property = new Property({
      owner: req.user._id,
      title,
      description,
      address,
      images,
      price,
      pricingFrequency,
      allowBargaining,
      status: 'active',
    });

    let createdProperty = await property.save();

    createdProperty = await createdProperty.populate(
      'owner',
      'firstName lastName email'
    );

    res.status(201).json({ success: true, property: createdProperty });
  } catch (error) {
    console.error(error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: 'Server error while creating property' });
  }
};

exports.getMyProperties = async (req, res) => {
  try {
    const properties = await Property.find({
      owner: req.user._id,
    })
      .populate('owner', 'firstName lastName email')
      .sort({ createdAt: -1 });
      
    res.status(200).json({ success: true, properties });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while fetching properties' });
  }
};

exports.updateProperty = async (req, res) => {
  const {
    title,
    description,
    address,
    images,
    price,
    pricingFrequency,
    allowBargaining,
    status,
  } = req.body;

  try {
    let property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    if (property.owner.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    if (property.status === 'deleted') {
      return res.status(400).json({ message: 'Cannot update a deleted property' });
    }

    property.title = title || property.title;
    property.description = description || property.description;
    property.address = address || property.address;
    
    if (images && images.length > 0 && images[0] !== "") {
       property.images = images;
    }

    property.price = price || property.price;
    property.pricingFrequency = pricingFrequency || property.pricingFrequency;
    property.status = status || property.status;
    
    if (allowBargaining !== undefined) {
      property.allowBargaining = allowBargaining;
    }

    let updatedProperty = await property.save();

    updatedProperty = await updatedProperty.populate(
      'owner',
      'firstName lastName email'
    );

    res.status(200).json({ success: true, property: updatedProperty });
  } catch (error) {
    console.error(error);
     if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: 'Server error while updating property' });
  }
};

exports.deleteProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    if (property.owner.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    if (property.status === 'deleted') {
      return res.status(400).json({ message: 'Property already deleted' });
    }

    property.status = 'deleted';
    await property.save();
    
    res.status(200).json({ success: true, message: 'Property deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while deleting property' });
  }
};

exports.getAllProperties = async (req, res) => {
  const { sortBy } = req.query;

  let sortOptions = {};
  if (sortBy === 'priceAsc') {
    sortOptions = { price: 1 };
  } else if (sortBy === 'priceDesc') {
    sortOptions = { price: -1 };
  } else {
    sortOptions = { createdAt: -1 };
  }

  try {
    const properties = await Property.find({ status: { $ne: 'deleted' } })
      .populate('owner', 'firstName lastName email')
      .sort(sortOptions);
      
    res.status(200).json({ success: true, properties });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while fetching properties' });
  }
};

exports.getPropertyById = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id).populate(
      'owner',
      'firstName lastName email'
    );

    if (!property || property.status === 'deleted') {
      return res.status(404).json({ message: 'Property not found' });
    }

    res.status(200).json({ success: true, property });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while fetching property' });
  }
};