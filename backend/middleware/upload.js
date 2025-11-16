const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

// Use memory storage to hold file buffers in memory before uploading to Supabase
const storage = multer.memoryStorage();

function fileFilter(req, file, cb) {
  // Allow common image types and PDF by default. Adjust as needed.
  const allowed = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf'
  ];

  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'), false);
  }
}

const limits = {
  // 10 MB
  fileSize: 10 * 1024 * 1024
};

const upload = multer({ storage, fileFilter, limits });

module.exports = {
  uploadSingle: (fieldName) => upload.single(fieldName),
  uploadArray: (fieldName, maxCount = 5) => upload.array(fieldName, maxCount),
  upload,
};
