const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const geocoder = require('../utils/geocoder');
const Community = require('../models/Community');


// @desc      Get all communities
// @route     GET /api/v1/communities
// @access    Public
exports.getCommunities = asyncHandler(async (req, res, next) => {
    let query;

    // Copy req.query to not pollute the original
    const reqQuery = { ...req.query };

    // Fields to exclude from filtering (like select, sort, etc.)
    const removeFields = ['select', 'sort', 'page', 'limit'];

    // Loop over removeFields and delete them from reqQuery
    removeFields.forEach(param => delete reqQuery[param]);

    // Create query string
    let queryStr = JSON.stringify(reqQuery);

    // Create operators ($gt, $gte, etc) by adding a '$' prefix
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

    // Finding resource using the built query
    query = Community.find(JSON.parse(queryStr));

    // Select Fields
    if (req.query.select) {
        const fields = req.query.select.split(',').join(' ');
        query = query.select(fields);
    }
    
    // Sorting
    if (req.query.sort) {
        const sortBy = req.query.sort.split(',').join(' ');
        query = query.sort(sortBy);
    } else {
        query = query.sort('-createdAt');
    }

    

    //Execute query
    const communities = await query;
    res.status(200).json({ success: true, count: communities.length, data: communities });
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

    const community = await Community.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
  
    if (!community) {
      return next(new ErrorResponse(`Community not found with id of ${req.params.id}`, 404));
    }
    res.status(200).json({ success: true, data: community });

})


// @desc      Delete community
// @route     DELETE /api/v1/communities/:id
// @access    Private
exports.deleteCommunity = asyncHandler(async (req, res, next) => {

    const community = await Community.findByIdAndDelete(req.params.id);

    if (!community) {
      return next(new ErrorResponse(`Community not found with id of ${req.params.id}`, 404));
    }
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
