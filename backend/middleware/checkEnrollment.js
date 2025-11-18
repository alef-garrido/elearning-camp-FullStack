const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('./async');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');

// @desc    Check if user is enrolled in a course
// @route   middleware
// @access  Private
exports.checkEnrollment = asyncHandler(async (req, res, next) => {
    const courseId = req.params.courseId;
    const userId = req.user.id;

    // Find the course to make sure it exists
    const course = await Course.findById(courseId);
    if (!course) {
        return next(new ErrorResponse(`No course with the id of ${courseId}`, 404));
    }

    // Check if the user is enrolled in the course
    const enrollment = await Enrollment.findOne({
        course: courseId,
        user: userId,
        status: 'active'
    });

    if (!enrollment) {
        // If the course is not free and the user is not enrolled, deny access
        if (course.membership > 0) {
            return next(new ErrorResponse(`User is not enrolled in this course`, 403));
        }
    }

    // if user is enrolled, attach enrollment to request object
    req.enrollment = enrollment;

    next();
});