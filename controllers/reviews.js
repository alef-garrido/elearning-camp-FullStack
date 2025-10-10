const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Review = require('../models/Review');
const Community = require('../models/Community');

// @desc    Get reviews
// @route   GET /api/v1/reviews
// @route   GET /api/v1/communities/:communityId/reviews
// @access  Public
exports.getReviews = asyncHandler(async (req, res, next) => {
  if (req.params.communityId) {
    const reviews = await Review.find({ community: req.params.communityId });

    return res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews
    });
  } else {
    res.status(200).json(res.advancedResults);
  }
});

// @desc    Get single review
// @route   GET /api/v1/reviews/:id
// @access  Public
exports.getReview = asyncHandler(async (req, res, next) => {
  const review = await Review.findById(req.params.id).populate({
    path: 'community',
    select: 'name description'
  });
    if (!review) {
      return next(new ErrorResponse(`No review found with the id of ${req.params.id}`, 404));
    }
  
    res.status(200).json({
      success: true,
      data: review
    });
});

// @desc    Add review
// @route   POST /api/v1/communities/:communityId/reviews
// @access  Private
exports.addReview = asyncHandler(async (req, res, next) => {
  req.body.community = req.params.communityId;
  req.body.user = req.user.id;

  const community = await Community.findById(req.params.communityId);

  if (!community) {
    return next(
      new ErrorResponse(
        `No community with the id of ${req.params.communityId}`,
        404
      )
    );
  }

  // Check if user has already reviewed this community
  const existingReview = await Review.findOne({
    community: req.params.communityId,
    user: req.user.id
  });

  if (existingReview) {
    return next(
      new ErrorResponse(`You have already submitted a review for this community`, 400)
    );
  }

  const review = await Review.create(req.body);

  res.status(201).json({
    success: true,
    data: review
  });
});

// @desc    Update review
// @route   PUT /api/v1/reviews/:id
// @access  Private
exports.updateReview = asyncHandler(async (req, res, next) => {
  let review = await Review.findById(req.params.id);

  if (!review) {
    return next(
      new ErrorResponse(`No review with the id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is review owner
  if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse(`Not authorized to update review`, 401));
  }

  review = await Review.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: review
  });
});

// @desc    Delete review
// @route   DELETE /api/v1/reviews/:id
// @access  Private
exports.deleteReview = asyncHandler(async (req, res, next) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    return next(
      new ErrorResponse(`No review with the id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is review owner
  if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse(`Not authorized to delete review`, 401));
  }

  await review.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});