const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Community = require('../models/Community');


// @desc      Get all communities
// @route     GET /api/v1/communities
// @access    Public
exports.getCommunities = asyncHandler(async (req, res, next) => {

    const communities = await Community.find();
    res.status(200).json({ success: true, count: communities.length ,data: communities });
  
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

