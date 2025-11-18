const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Enrollment = require('../models/Enrollment');

// @desc    Get current user's enrollments
// @route   GET /api/v1/enrollments/my-enrollments
// @access  Private
exports.getMyEnrollments = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 25;
  const skip = (page - 1) * limit;

  const [total, enrollments] = await Promise.all([
    Enrollment.countDocuments({ user: req.user.id }),
    Enrollment.find({ user: req.user.id })
      .populate('course', 'title description')
      .populate('community', 'name description')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
  ]);

  res.status(200).json({
    success: true,
    pagination: {
      page,
      limit,
      total
    },
    data: enrollments
  });
});
