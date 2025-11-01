const User = require('../models/User');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

exports.sendRegistrationOtp = async (req, res) => {
  // Add userType
  const { firstName, lastName, email, userType } = req.body;

  try {
    let user = await User.findOne({ email });
    if (user && user.isVerified) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
    const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    if (user) {
      user.firstName = firstName;
      user.lastName = lastName;
      user.userType = userType; // <-- ADD THIS
      user.otp = otp;
      user.otpExpires = otpExpires;
      await user.save();
    } else {
      user = await User.create({
        firstName,
        lastName,
        email,
        userType, // <-- ADD THIS
        otp,
        otpExpires,
      });
    }

    const message = `Your OTP for registration is: ${otp}\nThis code will expire in 10 minutes.`;
    await sendEmail({
      email: user.email,
      subject: 'Your Registration OTP',
      message,
    });

    res.status(200).json({
      success: true,
      message: `OTP sent to ${user.email}`,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while sending OTP' });
  }
};

exports.verifyOtpAndRegister = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }
    if (user.isVerified) {
      return res.status(400).json({ message: 'User already verified' });
    }
    if (user.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }
    if (user.otpExpires < Date.now()) {
      return res.status(400).json({ message: 'OTP has expired' });
    }

    user.isVerified = true;
    user.otp = undefined; // Clear OTP
    user.otpExpires = undefined; // Clear expiry
    await user.save();

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        isVerified: user.isVerified,
        userType: user.userType, // <-- ADD THIS
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during verification' });
  }
};

exports.registerOrLoginWithGoogle = async (req, res) => {
  // Add userType
  const { email, firstName, lastName, googleId, userType } = req.body;

  // Add userType to validation
  if (!email || !firstName || !lastName || !googleId || !userType) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    let user = await User.findOne({ googleId });

    if (user) {
      user.firstName = firstName;
      user.lastName = lastName;
      // Note: You might want to decide if a Google user can change their type
      // user.userType = userType; // <-- Optionally update type on login
      await user.save();
    } else {
      const userWithEmail = await User.findOne({ email });
      if (userWithEmail && !userWithEmail.googleId) {
        return res.status(400).json({
          message: 'Email already registered. Please log in with your email.',
        });
      }

      // Create new user
      user = await User.create({
        firstName,
        lastName,
        email,
        googleId,
        userType, // <-- ADD THIS
        isVerified: true, // Google handles email verification
      });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        isVerified: user.isVerified,
        userType: user.userType, // <-- ADD THIS
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during Google auth' });
  }
};

exports.sendLoginOtp = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user || !user.isVerified) {
      return res.status(404).json({
        message: 'No account found with this email. Please register instead.',
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
    const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    const message = `Your Login OTP is: ${otp}\nThis code will expire in 10 minutes.`;
    await sendEmail({
      email: user.email,
      subject: 'Your Login OTP',
      message,
    });

    res.status(200).json({
      success: true,
      message: `OTP sent to ${user.email}`,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while sending OTP' });
  }
};

exports.verifyLoginOtp = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }
    if (user.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }
    if (user.otpExpires < Date.now()) {
      return res.status(400).json({ message: 'OTP has expired' });
    }

    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        isVerified: user.isVerified,
        userType: user.userType, // <-- ADD THIS
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during verification' });
  }
};