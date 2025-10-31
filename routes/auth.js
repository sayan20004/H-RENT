const express = require('express');
const router = express.Router();
const {
  sendRegistrationOtp,
  verifyOtpAndRegister,
  registerOrLoginWithGoogle,
  sendLoginOtp,
  verifyLoginOtp,
} = require('../controllers/authController');

router.post('/register-send-otp', sendRegistrationOtp);
router.post('/register-verify-otp', verifyOtpAndRegister);



router.post('/login-send-otp', sendLoginOtp);
router.post('/login-verify-otp', verifyLoginOtp);

router.post('/google-auth', registerOrLoginWithGoogle);
module.exports = router;