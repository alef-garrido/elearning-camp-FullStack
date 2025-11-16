const express = require('express');
const router = express.Router();
const { uploadSingle } = require('../middleware/upload');
const { uploadFile, deleteFile } = require('../controllers/uploads');
const { protect, authorize } = require('../middleware/auth');

// Upload a single file (field name: 'file')
router.post('/', protect, uploadSingle('file'), uploadFile);

// Delete a file by filename (no slashes). The controller will map this to the
// storage path inside the bucket (e.g. `uploads/<filename>`).
router.delete('/:filename', protect, authorize('admin'), deleteFile);

module.exports = router;
