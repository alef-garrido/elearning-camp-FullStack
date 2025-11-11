const path = require('path');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const geocoder = require('../utils/geocoder');
const Community = require('../models/Community');


// @desc      Get all communities
// @route     GET /api/v1/communities
// @access    Public
exports.getCommunities = asyncHandler(async (req, res, next) => {
   
    res
      .status(200)
      .json(res.advancedResults);
});


// @desc      Get single community
// @route     GET /api/v1/communities/:id
// @access    Public
exports.getCommunity = asyncHandler(async (req, res, next) => {
 
    const community = await Community.findById(req.params.id);

    if (!community) {
      return next(new ErrorResponse(`Community not found with id of ${req.params.id}`, 404));
    }
    
    res.status(200).json({ success: true, data: community });


})

// @desc      Create new community
// @route     POST /api/v1/communities
// @access    Private
exports.createCommunity = asyncHandler(async (req, res, next) => {
    // Add user to req.body
    req.body.user = req.user.id;

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

    // Make sure user is community owner
    if(community.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(new ErrorResponse(`User ${req.user.id} is not authorized to update this community`, 401));
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

    res.status(200).json({
      success: true,
      count: communities.length,
      data: communities
    });
  
});

//@desc   Upload photo for community
//@route  PUT /api/v1/communities/:id/photo
//@access Private
exports.communityPhotoUpload = asyncHandler(async (req, res, next) => {
  // Debug logging: capture request params and user
  console.log('[communityPhotoUpload] called with params:', req.params);
  try {
    console.log('[communityPhotoUpload] authenticated user id:', req.user && req.user.id);
  } catch (e) {
    console.log('[communityPhotoUpload] req.user not available');
  }

    const community = await Community.findById(req.params.id);

    if (!community) {
      console.log(`[communityPhotoUpload] community not found: ${req.params.id}`);
      return next(new ErrorResponse(`Community not found with id of ${req.params.id}`, 404));
    }

    // Make sure user is community owner
    if(community.user.toString() !== req.user.id && req.user.role !== 'admin') {
        console.log(`[communityPhotoUpload] unauthorized: user ${req.user.id} cannot update community ${community._id}`);
        return next(new ErrorResponse(`User ${req.user.id} is not authorized to update this community`, 401));
    }

    if (!req.files) {
      console.log('[communityPhotoUpload] no files found on request (req.files is falsy)');
      return next(new ErrorResponse(`Please upload a file`, 400));
    }

    const file = req.files.file;
    console.log('[communityPhotoUpload] received file field keys:', Object.keys(req.files || {}));

    // Make sure the image is a photo
    if (!file.mimetype.startsWith('image')) {
      console.log(`[communityPhotoUpload] invalid mimetype: ${file.mimetype}`);
      return next(new ErrorResponse(`Please upload an image file`, 400));
    }

    // Check filesize
    const maxUpload = process.env.MAX_FILE_UPLOAD || 'unknown';
    if (file.size > process.env.MAX_FILE_UPLOAD) {
      console.log(`[communityPhotoUpload] file too large: ${file.size} > ${process.env.MAX_FILE_UPLOAD}`);
      return next(new ErrorResponse(`Please upload an image less than ${process.env.MAX_FILE_UPLOAD}`, 400));
    }

    // Create custom filename
    const originalName = file.name;
    file.name = `photo_${community._id}${path.parse(originalName).ext}`;
    const destPath = `${process.env.FILE_UPLOAD_PATH}/${file.name}`;
    console.log(`[communityPhotoUpload] saving file. originalName=${originalName}, newName=${file.name}, dest=${destPath}`);

    try {
      // Move file to upload directory
      await file.mv(destPath);
      console.log(`[communityPhotoUpload] file.mv successful -> ${destPath}`);
      
      // Update community photo in database and get updated document
      community.photo = file.name;
      await community.save();

      // Return the full updated community document
      res.status(200).json({
        success: true,
        data: community
      });
    } catch (err) {
      console.error('[communityPhotoUpload] File upload error:', err && err.stack ? err.stack : err);
      return next(new ErrorResponse(`Problem with file upload`, 500));
    }
  
});