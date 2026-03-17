const cloudinary = require('cloudinary').v2;
const multer = require('multer');

let CloudinaryStorage;
try {
  const storageModule = require('multer-storage-cloudinary');
  CloudinaryStorage =
    storageModule.CloudinaryStorage ||
    storageModule.default ||
    storageModule;
} catch (error) {
  console.error('[CLOUDINARY] Failed to load multer-storage-cloudinary:', error.message);
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = typeof CloudinaryStorage === 'function'
  ? new CloudinaryStorage({
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
    })
  : multer.memoryStorage();

const usingCloudinaryStorage = typeof CloudinaryStorage === 'function';

if (!usingCloudinaryStorage) {
  console.warn('[CLOUDINARY] CloudinaryStorage constructor not available; using in-memory upload storage.');
}

if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.warn('[CLOUDINARY] Missing Cloudinary env vars. Uploads may fail until credentials are configured.');
}

const upload = multer({ storage });

module.exports = { cloudinary, upload, usingCloudinaryStorage };
