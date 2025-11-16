const path = require('path');
const { v4: uuidv4 } = require('uuid');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const supabase = require('../utils/supabaseClient');
const User = require('../models/User');
const { getPhotoUrl } = require('../utils/supabasePhotoUrl');

const BUCKET_NAME = process.env.SUPABASE_STORAGE_BUCKET || 'uploads';
const EXPIRY_SECONDS = 365 * 24 * 60 * 60; // 1 year

// @desc    Upload user profile photo
// @route   POST /api/v1/users/photo
// @access  Private
exports.uploadUserPhoto = asyncHandler(async (req, res, next) => {
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

    // Update user model with photo filename
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { photo: `${fileId}${ext}` },
      { new: true, runValidators: true }
    );

    // Generate signed URL for photo
    const photoUrl = await getPhotoUrl(`${fileId}${ext}`);

    res.status(201).json({
      success: true,
      data: {
        photo: `${fileId}${ext}`,
        photoUrl,
      },
    });
  } catch (err) {
    console.error('Upload error:', err);
    return next(new ErrorResponse('Failed to upload file', 500));
  }
});

// @desc    Delete user profile photo
// @route   DELETE /api/v1/users/photo
// @access  Private
exports.deleteUserPhoto = asyncHandler(async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return next(new ErrorResponse('User not found', 404));
    }

    if (!user.photo) {
      // Nothing to delete; respond success for idempotency
      return res.status(200).json({ success: true, data: { photo: null, photoUrl: null } });
    }

    const storagePath = `uploads/${user.photo}`;

    // Remove file from Supabase storage
    const { error: removeError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([storagePath]);

    if (removeError) {
      console.error('Supabase remove error:', removeError);
      // proceed to clear user photo even if Supabase remove fails to avoid stuck state
    }

    // Clear user's photo field
    user.photo = '';
    await user.save();

    return res.status(200).json({ success: true, data: { photo: null, photoUrl: null } });
  } catch (err) {
    console.error('Delete user photo error:', err);
    return next(new ErrorResponse('Failed to delete user photo', 500));
  }
});