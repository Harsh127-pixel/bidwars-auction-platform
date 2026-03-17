const express = require('express');
const router = express.Router();
const { upload, cloudinary } = require('../services/cloudinary');
const { verifyToken } = require('../middleware/authMiddleware');

const uploadBufferToCloudinary = (file) =>
  new Promise((resolve, reject) => {
    const isPDF = file.mimetype === 'application/pdf';
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'bidwars',
        resource_type: isPDF ? 'raw' : 'auto',
        public_id: `${file.fieldname}_${Date.now()}_${Math.round(Math.random() * 1000)}`,
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

    const uploadResult = await uploadBufferToCloudinary(req.file);
    if (!uploadResult || !uploadResult.secure_url) {
      return res.status(500).json({ error: 'Cloudinary upload failed' });
    }

    res.json({ url: uploadResult.secure_url });
  } catch (error) {
    console.error('[UPLOAD ERROR]', error);
    res.status(500).json({ error: error.message || 'Server error during upload' });
  }
});

module.exports = router;
