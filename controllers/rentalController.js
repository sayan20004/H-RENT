const Rental = require('../models/Rental');
const Property = require('../models/Property');

exports.createRentalRequest = async (req, res) => {
  const { propertyId } = req.body;

  try {
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    if (!property.isAvailable) {
      return res.status(400).json({ message: 'Property is not available' });
    }

    const existingRequest = await Rental.findOne({
      property: propertyId,
      tenant: req.user._id,
      status: { $in: ['pending', 'accepted'] },
    });

    if (existingRequest) {
      return res
        .status(400)
        .json({ message: 'You already have an active request for this property' });
    }

    const rental = new Rental({
      property: propertyId,
      tenant: req.user._id,
      owner: property.owner,
    });

    const createdRental = await rental.save();
    res.status(201).json({ success: true, rental: createdRental });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while creating rental request' });
  }
};

exports.getMyRentalRequests = async (req, res) => {
  try {
    const rentals = await Rental.find({ tenant: req.user._id })
      .populate({
        path: 'property',
        select: 'title images price pricingFrequency',
      })
      .populate('owner', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, rentals });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while fetching rental requests' });
  }
};

exports.getIncomingRentalRequests = async (req, res) => {
  try {
    const rentals = await Rental.find({ owner: req.user._id })
      .populate({
        path: 'property',
        select: 'title images price pricingFrequency',
      })
      .populate('tenant', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, rentals });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while fetching incoming requests' });
  }
};

exports.updateRentalStatus = async (req, res) => {
  const { status } = req.body;
  const { id } = req.params;

  try {
    let rental = await Rental.findById(id);
    if (!rental) {
      return res.status(404).json({ message: 'Rental request not found' });
    }

    const isOwner = rental.owner.toString() === req.user._id.toString();
    const isTenant = rental.tenant.toString() === req.user._id.toString();

    if (!isOwner && !isTenant) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    if (isOwner) {
      if (status === 'accepted' || status === 'denied') {
        rental.status = status;
        if (status === 'accepted') {
          await Property.findByIdAndUpdate(rental.property, { isAvailable: false });
        }
      } else {
        return res.status(400).json({ message: 'Invalid status update for owner' });
      }
    }

    if (isTenant) {
      if (status === 'cancelled' && rental.status === 'pending') {
        rental.status = 'cancelled';
      } else if (
        status === 'cancellationRequested' &&
        rental.status === 'accepted'
      ) {
        rental.status = 'cancellationRequested';
      } else {
        return res.status(400).json({ message: 'Invalid status update for tenant' });
      }
    }

    const updatedRental = await rental.save();
    res.status(200).json({ success: true, rental: updatedRental });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while updating rental status' });
  }
};