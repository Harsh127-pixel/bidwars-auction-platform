const express = require('express');
const router = express.Router();
const { upload } = require('../services/cloudinary');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/upload', verifyToken, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    // cloudinary returns 'path' in some multer-storage configs or 'secure_url'
    const url = req.file.path || req.file.secure_url;
    res.json({ url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
