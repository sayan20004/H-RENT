const User = require('../models/User');

// @desc    Update user profile
// @route   PUT /api/user/profile
// @access  Private
exports.updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      // Update fields
      user.firstName = req.body.firstName || user.firstName;
      user.lastName = req.body.lastName || user.lastName;
      
      // Note: Add any other fields from your User model you want to be editable
      // Example: user.someOtherField = req.body.someOtherField || user.someOtherField;

      const updatedUser = await user.save();

      res.status(200).json({
        success: true,
        user: {
          _id: updatedUser._id,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          email: updatedUser.email,
          isVerified: updatedUser.isVerified,
        },
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during profile update' });
  }
};

// @desc    Get user profile
// @route   GET /api/user/profile
// @access  Private
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-otp -otpExpires');

     if (user) {
         res.status(200).json({
            success: true,
            user: {
              _id: user._id,
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
              isVerified: user.isVerified,
            },
         });
     } else {
        res.status(404).json({ message: 'User not found' });
     }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error getting profile' });
  }
};