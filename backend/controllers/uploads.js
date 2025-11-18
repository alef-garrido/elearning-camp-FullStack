const path = require('path');
const { v4: uuidv4 } = require('uuid');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const supabase = require('../utils/supabaseClient');

const BUCKET_NAME = process.env.SUPABASE_STORAGE_BUCKET || 'uploads';
const EXPIRY_SECONDS = 365 * 24 * 60 * 60; // 1 year

// @desc    Upload a single file to Supabase Storage
// @route   POST /api/v1/uploads
// @access  Private (recommended)
exports.uploadFile = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next(new ErrorResponse('No file uploaded', 400));
  }

  const file = req.file;
  const fileId = uuidv4();
  const ext = path.extname(file.originalname).toLowerCase();
  const storagePath = `uploads/${fileId}${ext}`;

  try {
    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return next(new ErrorResponse(`Failed to upload file: ${error.message}`, 500));
    }

    // Generate a signed public URL (expires in 1 year)
    const { data: signedData, error: signedError } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(storagePath, EXPIRY_SECONDS);

    if (signedError) {
      console.error('Supabase signed URL error:', signedError);
      return next(new ErrorResponse('Failed to generate signed URL', 500));
    }

    res.status(201).json({
      success: true,
      data: {
        url: signedData.signedUrl,
        filename: `${fileId}${ext}`,
        storagePath,
        size: file.size,
        mimeType: file.mimetype,
      },
    });
  } catch (err) {
    console.error('Upload error:', err);
    return next(new ErrorResponse('Failed to upload file', 500));
  }
});

// @desc    Delete an uploaded file from Supabase Storage by filename
// @route   DELETE /api/v1/uploads/:filename
// @access  Private/Admin (recommended)
exports.deleteFile = asyncHandler(async (req, res, next) => {
  const filename = req.params.filename;

  if (!filename) {
    return next(new ErrorResponse('Filename is required', 400));
  }

  // Construct storage path inside the bucket
  const storagePath = `uploads/${filename}`;

  try {
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([storagePath]);

    if (error) {
      console.error('Supabase delete error:', error);
      if (error.message && error.message.includes('not found')) {
        return next(new ErrorResponse('File not found', 404));
      }
      return next(new ErrorResponse(`Failed to delete file: ${error.message || error}`, 500));
    }

    res.status(200).json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (err) {
    console.error('Delete error:', err);
    return next(new ErrorResponse('Failed to delete file', 500));
  }
});
