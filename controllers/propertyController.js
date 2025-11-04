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
    });

    const createdProperty = await property.save();
    res.status(201).json({ success: true, property: createdProperty });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while creating property' });
  }
};

exports.getMyProperties = async (req, res) => {
  try {
    const properties = await Property.find({ owner: req.user._id });
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
    isAvailable,
  } = req.body;

  try {
    let property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    if (property.owner.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    property.title = title || property.title;
    property.description = description || property.description;
    property.address = address || property.address;
    property.images = images || property.images;
    property.price = price || property.price;
    property.pricingFrequency = pricingFrequency || property.pricingFrequency;
    
    if (allowBargaining !== undefined) {
      property.allowBargaining = allowBargaining;
    }
    if (isAvailable !== undefined) {
      property.isAvailable = isAvailable;
    }

    const updatedProperty = await property.save();
    res.status(200).json({ success: true, property: updatedProperty });
  } catch (error) {
    console.error(error);
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

    await property.deleteOne();
    res.status(200).json({ success: true, message: 'Property removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while deleting property' });
  }
};

exports.getAllProperties = async (req, res) => {
  try {
    const properties = await Property.find({ isAvailable: true }).populate(
      'owner',
      'firstName lastName email'
    );
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

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    res.status(200).json({ success: true, property });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while fetching property' });
  }
};