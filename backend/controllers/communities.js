const path = require('path');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const geocoder = require('../utils/geocoder');
const Community = require('../models/Community');
const Enrollment = require('../models/Enrollment');
const Topic = require('../models/Topic');
const { enhanceCommunityWithPhotoUrl } = require('../utils/supabasePhotoUrl');
const AuditLog = require('../models/AuditLog');


// @desc      Get all communities
// @route     GET /api/v1/communities
// @access    Public
exports.getCommunities = asyncHandler(async (req, res, next) => {
   
    // Enhance all communities with photoUrl
    if (res.advancedResults && res.advancedResults.data) {
      res.advancedResults.data = await enhanceCommunityWithPhotoUrl(res.advancedResults.data);
    }
    
    res
      .status(200)
      .json(res.advancedResults);
});


// @desc      Get single community
// @route     GET /api/v1/communities/:id
// @access    Public
exports.getCommunity = asyncHandler(async (req, res, next) => {
 
  // Include virtual enrollment count and populate topics
  const community = await Community.findById(req.params.id).populate('enrollmentCount').populate('topics');

    if (!community) {
      return next(new ErrorResponse(`Community not found with id of ${req.params.id}`, 404));
    }
    
    // Add signed URL for photo if it exists
    const enhancedCommunity = await enhanceCommunityWithPhotoUrl(community);
    
    res.status(200).json({ success: true, data: enhancedCommunity });


})

// @desc      Enroll current user in a community
// @route     POST /api/v1/communities/:id/enroll
// @access    Private
exports.enrollCommunity = asyncHandler(async (req, res, next) => {
  const communityId = req.params.id;

  const community = await Community.findById(communityId);
  if (!community) {
    return next(new ErrorResponse(`Community not found with id of ${communityId}`, 404));
  }

  // Prevent duplicate active enrollment
  const existing = await Enrollment.findOne({ user: req.user.id, community: communityId, status: 'active' });
  if (existing) {
    return next(new ErrorResponse('User is already enrolled in this community', 409));
  }

  try {
    const enrollment = await Enrollment.create({
      user: req.user.id,
      community: communityId,
      status: 'active'
    });

    const count = await Enrollment.countDocuments({ community: communityId, status: 'active' });

    res.status(201).json({ success: true, data: enrollment, enrollmentCount: count });
  } catch (err) {
    // Duplicate enrollment -> unique index violation (race)
    if (err.code === 11000) {
      return next(new ErrorResponse('User is already enrolled in this community', 409));
    }
    return next(err);
  }
});

// @desc      Unenroll current user from a community (soft-cancel)
// @route     DELETE /api/v1/communities/:id/enroll
// @access    Private
exports.unenrollCommunity = asyncHandler(async (req, res, next) => {
  const communityId = req.params.id;
  // Support admin/owner unenrolling other users via ?userId=<id>
  const targetUserId = req.query.userId || req.user.id;

  // If attempting to unenroll someone else, allow only community owner or admin
  if (targetUserId.toString() !== req.user.id.toString()) {
    const community = await Community.findById(communityId);
    if (!community) {
      return next(new ErrorResponse(`Community not found with id of ${communityId}`, 404));
    }
    if (community.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new ErrorResponse('Not authorized to unenroll other users', 403));
    }
  }

  const enrollment = await Enrollment.findOne({ user: targetUserId, community: communityId, status: 'active' });
  if (!enrollment) {
    return next(new ErrorResponse('Enrollment not found', 404));
  }

  // Soft-cancel for history
  enrollment.status = 'cancelled';
  await enrollment.save();

  const count = await Enrollment.countDocuments({ community: communityId, status: 'active' });

  res.status(200).json({ success: true, data: {}, enrollmentCount: count });
});

// @desc      Get enrolled users for a community (paginated)
// @route     GET /api/v1/communities/:id/enrolled
// @access    Private (only community owner or admin)
exports.getEnrolledUsers = asyncHandler(async (req, res, next) => {
  const communityId = req.params.id;

  const community = await Community.findById(communityId);
  if (!community) {
    return next(new ErrorResponse(`Community not found with id of ${communityId}`, 404));
  }

  // Only owner or admin may list enrolled users
  if (community.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to view enrolled users', 403));
  }

  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 25;
  const skip = (page - 1) * limit;

  const total = await Enrollment.countDocuments({ community: communityId, status: 'active' });
  const enrollments = await Enrollment.find({ community: communityId, status: 'active' })
    .populate('user', 'name email role createdAt')
    .skip(skip)
    .limit(limit)
    .sort({ enrolledAt: -1 });

  res.status(200).json({
    success: true,
    count: enrollments.length,
    pagination: {
      page,
      limit,
      total
    },
    data: enrollments
  });
});

// @desc      Get current user's enrollment status for a community
// @route     GET /api/v1/communities/:id/enrollment-status
// @access    Private
exports.getEnrollmentStatus = asyncHandler(async (req, res, next) => {
  const communityId = req.params.id;
  const enrollment = await Enrollment.findOne({ community: communityId, user: req.user.id, status: 'active' });
  res.status(200).json({ success: true, data: { enrolled: !!enrollment } });
});

// @desc      Create new community
// @route     POST /api/v1/communities
// @access    Private
exports.createCommunity = asyncHandler(async (req, res, next) => {
    // Add user to req.body
    req.body.user = req.user.id;

    // Resolve topic names/ids into ObjectIds
    if (req.body.topics && Array.isArray(req.body.topics)) {
      req.body.topics = await Promise.all(req.body.topics.map(async (t) => {
        // If already an ObjectId-like string, return as-is
        if (typeof t === 'string' && /^[0-9a-fA-F]{24}$/.test(t)) return t;
        // Otherwise treat as a name: find or create Topic
        const name = String(t).trim();
        if (!name) return null;
        let topic = await Topic.findOne({ name });
        if (!topic) topic = await Topic.create({ name });
        return topic._id;
      })).then(arr => arr.filter(Boolean));
    }

    // Check for published community
    const publishedCommunity = await Community.findOne({ user: req.user.id });

    // If the user is not an admin, they can only add one community
    if (publishedCommunity && req.user.role !== 'admin') {
      return next(new ErrorResponse(`The user with ID ${req.user.id} has already published a community`, 400));
    }

    const community = await Community.create(req.body);
  
    res.status(201).json({
      success: true,
      data: community
    });
    
})

// @desc      Update community
// @route     PUT /api/v1/communities/:id
// @access    Private
exports.updateCommunity = asyncHandler(async (req, res, next) => {

    let community = await Community.findById(req.params.id);
  
    if (!community) {
      return next(new ErrorResponse(`Community not found with id of ${req.params.id}`, 404));
    }

    // Make sure user is community owner (or site admin)
    if(community.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(new ErrorResponse(`User ${req.user.id} is not authorized to update this community`, 401));
    }

    // If a site admin is changing the owner (`user` field), record an audit log
    const isSiteAdmin = req.user.role === 'admin';
    if (isSiteAdmin && req.body && Object.prototype.hasOwnProperty.call(req.body, 'user')) {
      try {
        const previousOwner = community.user;
        const newOwner = req.body.user;
        if (String(previousOwner) !== String(newOwner)) {
          await AuditLog.create({
            action: 'transfer_ownership',
            resourceType: 'Community',
            resourceId: community._id,
            performedBy: req.user.id,
            previousValue: { user: previousOwner },
            newValue: { user: newOwner },
            metadata: {
              note: 'Admin initiated ownership transfer via admin UI'
            }
          });
        }
      } catch (auditErr) {
        // Do not block main flow if audit logging fails — log to console for diagnostics
        console.error('Failed to write audit log for community ownership transfer:', auditErr);
      }
    }

    // Resolve topics if provided on update
    if (req.body.topics && Array.isArray(req.body.topics)) {
      req.body.topics = await Promise.all(req.body.topics.map(async (t) => {
        if (typeof t === 'string' && /^[0-9a-fA-F]{24}$/.test(t)) return t;
        const name = String(t).trim();
        if (!name) return null;
        let topic = await Topic.findOne({ name });
        if (!topic) topic = await Topic.create({ name });
        return topic._id;
      })).then(arr => arr.filter(Boolean));
    }

    community = await Community.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });
    
    res.status(200).json({ success: true, data: community });

})


// @desc      Delete community
// @route     DELETE /api/v1/communities/:id
// @access    Private
exports.deleteCommunity = asyncHandler(async (req, res, next) => {

    const community = await Community.findById(req.params.id);

    if (!community) {
      return next(new ErrorResponse(`Community not found with id of ${req.params.id}`, 404));
    }

    // Make sure user is community owner
    if(community.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(new ErrorResponse(`User ${req.user.id} is not authorized to delete this community`, 401));
    }
    
    await community.deleteOne();
    
    res.status(200).json({ success: true, data: {} });
 
})

//@desc   Get communities within a radius
//@route  GET /api/v1/communities/radius/:zipcode/:distance
//@access Private
exports.getCommunitiesInRadius = asyncHandler(async (req, res, next) => {
  
    const { zipcode, distance } = req.params;

    // Get lat/lng from geocoder
    const loc = await geocoder.geocode(zipcode);
    if (!loc || loc.length === 0) {
      return next(new ErrorResponse(`Could not find location for zipcode ${zipcode}`, 400));
    }

    const lat = loc[0].latitude;
    const lng = loc[0].longitude;

    // Calc radius using radians
    // Divide distance by radius of Earth
    // Earth Radius = 3,963 mi / 6,378 km
    const radius = distance / 6378;

    const communities = await Community.find({
      location: { $geoWithin: { $centerSphere: [ [ lng, lat ], radius ] } }
    });

    // Enhance communities with photoUrl
    const enhancedCommunities = await enhanceCommunityWithPhotoUrl(communities);

    res.status(200).json({
      success: true,
      count: enhancedCommunities.length,
      data: enhancedCommunities
    });
  
});

//@desc   Upload photo for community (uses Supabase Storage via multer middleware)
//@route  PUT /api/v1/communities/:id/photo
//@access Private
exports.communityPhotoUpload = asyncHandler(async (req, res, next) => {
  console.log('[communityPhotoUpload] called with params:', req.params);
  
  if (!req.file) {
    console.log('[communityPhotoUpload] no file in req.file (multer)');
    return next(new ErrorResponse('Please upload a file', 400));
  }

  const community = await Community.findById(req.params.id);

  if (!community) {
    console.log(`[communityPhotoUpload] community not found: ${req.params.id}`);
    return next(new ErrorResponse(`Community not found with id of ${req.params.id}`, 404));
  }

  // Make sure user is community owner
  if (community.user.toString() !== req.user.id && req.user.role !== 'admin') {
    console.log(`[communityPhotoUpload] unauthorized: user ${req.user.id} cannot update community ${community._id}`);
    return next(new ErrorResponse(`User ${req.user.id} is not authorized to update this community`, 401));
  }

  // Use the generic upload helper from uploads controller
  const uploadsController = require('./uploads');
  const supabase = require('../utils/supabaseClient');
  const { v4: uuidv4 } = require('uuid');

  const BUCKET_NAME = process.env.SUPABASE_STORAGE_BUCKET || 'uploads';
  const EXPIRY_SECONDS = 365 * 24 * 60 * 60; // 1 year

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

    // Generate a signed public URL
    const { data: signedData, error: signedError } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(storagePath, EXPIRY_SECONDS);

    if (signedError) {
      console.error('Supabase signed URL error:', signedError);
      return next(new ErrorResponse('Failed to generate signed URL', 500));
    }

    // Store the filename (not full URL) in the database
    // The frontend or gallery will construct the URL if needed
    const filename = `${fileId}${ext}`;
    community.photo = filename;
    await community.save();

    console.log(`[communityPhotoUpload] photo updated for community ${community._id}`);

    // Return updated community with photo URL
    res.status(200).json({
      success: true,
      data: {
        ...community.toObject(),
        photo: filename,
        photoUrl: signedData.signedUrl // Include the signed URL for frontend convenience
      }
    });
  } catch (err) {
    console.error('[communityPhotoUpload] File upload error:', err);
    return next(new ErrorResponse('Problem with file upload', 500));
  }
});

// @desc      Get all communities a user is enrolled in
// @route     GET /api/v1/enrollments/my-enrollments
// @access    Private
exports.getMyEnrollments = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const total = await Enrollment.countDocuments({ user: req.user.id, status: 'active' });
  const enrollments = await Enrollment.find({ user: req.user.id, status: 'active' })
    .populate({
      path: 'community',
      populate: {
        path: 'enrollmentCount' // Populate the virtual field
      }
    })
    .populate({
      path: 'course'
    })
    .skip(skip)
    .limit(limit)
    .sort({ enrolledAt: -1 });

  res.status(200).json({
    success: true,
    count: enrollments.length,
    pagination: {
      page,
      limit,
      total
    },
    data: enrollments
  });
});