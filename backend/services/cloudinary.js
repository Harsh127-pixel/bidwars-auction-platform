const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'root',
  api_key:    process.env.CLOUDINARY_API_KEY    || '257478342649472',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'LoCBphMIdwlrH3y_hDcIzwDC77g'
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const isPDF = file.mimetype === 'application/pdf';
    return {
      folder: 'bidwars',
      resource_type: isPDF ? 'raw' : 'auto',
      public_id: file.fieldname + '_' + Date.now(),
      format: isPDF ? 'pdf' : undefined,
    };
  },
});

const upload = multer({ storage });

module.exports = { cloudinary, upload };
