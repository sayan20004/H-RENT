const express = require('express');
const router = express.Router();
const { parser } = require('../config/cloudinary');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, parser.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  
  res.status(201).json({
    success: true,
    imageUrl: req.file.path,
  });
});

module.exports = router;