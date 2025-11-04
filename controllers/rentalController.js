const Rental = require('../models/Rental');
const Property = require('../models/Property');

const populateRental = [
  {
    path: 'property',
    select: 'title images price pricingFrequency _id',
  },
  {
    path: 'tenant',
    select: 'firstName lastName email _id',
  },
  {
    path: 'owner',
    select: 'firstName lastName email _id',
  },
];

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

    let createdRental = await rental.save();
    
    createdRental = await createdRental.populate(populateRental);

    res.status(201).json({ success: true, rental: createdRental });
  } catch (error)
 {
    console.error(error);
    res.status(500).json({ message: 'Server error while creating rental request' });
  }
};

exports.getMyRentalRequests = async (req, res) => {
  try {
    const rentals = await Rental.find({ tenant: req.user._id })
      .populate(populateRental)
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
      .populate(populateRental)
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
      if (rental.status === 'pending') {
        if (status === 'accepted' || status === 'denied') {
          rental.status = status;
          if (status === 'accepted') {
            await Property.findByIdAndUpdate(rental.property, { isAvailable: false });
          }
        } else {
          return res.status(400).json({ message: 'Invalid status update for owner' });
        }
      } else if (rental.status === 'cancellationRequested') {
         if (status === 'cancelled') {
            rental.status = 'cancelled';
            await Property.findByIdAndUpdate(rental.property, { isAvailable: true });
         } else if (status === 'accepted') {
            rental.status = 'accepted';
         } else {
            return res.status(400).json({ message: 'Invalid status update for cancellation' });
         }
      } else {
        return res.status(400).json({ message: 'No action available for this rental state' });
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

    let updatedRental = await rental.save();
    updatedRental = await updatedRental.populate(populateRental);
    
    res.status(200).json({ success: true, rental: updatedRental });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while updating rental status' });
  }
};