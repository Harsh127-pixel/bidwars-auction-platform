const express = require('express');
const router = express.Router();
const { upload, cloudinary, usingCloudinaryStorage } = require('../services/cloudinary');
const { verifyToken } = require('../middleware/authMiddleware');

const uploadBufferToCloudinary = (file) =>
  new Promise((resolve, reject) => {
    const isPDF = file.mimetype === 'application/pdf';
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'bidwars',
        resource_type: isPDF ? 'raw' : 'auto',
        public_id: `${file.fieldname}_${Date.now()}`,
        format: isPDF ? 'pdf' : undefined,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(file.buffer);
  });

router.post('/upload', verifyToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    let url = req.file.path || req.file.secure_url;

    if (!url && !usingCloudinaryStorage && req.file.buffer) {
      const uploadResult = await uploadBufferToCloudinary(req.file);
      url = uploadResult.secure_url;
    }

    if (!url) {
      return res.status(500).json({ error: 'Upload failed: no file URL returned' });
    }

    res.json({ url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
