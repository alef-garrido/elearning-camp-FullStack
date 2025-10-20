const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const  Course = require('../models/Course');
const  Community = require('../models/Community');

// @desc    Get courses
// @route   GET /api/v1/courses
// @route   GET /api/v1/communities/:communityId/courses
// @access  Public
exports.getCourses = asyncHandler(async (req, res, next) => {
   
    if(req.params.communityId) {
        const courses = await Course.find({ community: req.params.communityId });

        return res.status(200).json({
            success: true,
            count: courses.length,
            data: courses
        });

    } else {
        res.status(200).json(res.advancedResults);
    }

});

// @desc    Get single course
// @route   GET /api/v1/courses/:id
// @access  Public
exports.getCourse = asyncHandler(async (req, res, next) => {
    const course = await Course.findById(req.params.id).populate({
        path: 'community',
        select: 'name description'
    });

    if (!course) {
        return next(new ErrorResponse(`No course with the id of ${req.params.id}`, 404));
    }

    res.status(200).json({
        success: true,
        data: course
    });

});

//@desc    Add course
//@route   POST /api/v1/communities/:communityId/courses
//@access  Private
exports.addCourse = asyncHandler(async (req, res, next) => {
    req.body.community = req.params.communityId;
    req.body.user = req.user.id;


    const community = await Community.findById(req.params.communityId);
    
    if (!community) {
        return next(new ErrorResponse(`No community with the id of ${req.params.communityId}`, 404));
    }

    // Make sure user is community owner
    if(community.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(new ErrorResponse(`User ${req.user.id} is not authorized to add a course to community ${community._id}`, 401));
    }

    const course = await Course.create(req.body);

    res.status(201).json({
        success: true,
        data: course
    });
});

//@desc    Update course
//@route   PUT /api/v1/courses/:id
//@access  Private
exports.updateCourse = asyncHandler(async (req, res, next) => {
    let course = await Course.findById(req.params.id);
    
    if (!course) {
        return next(new ErrorResponse(`No course with the id of ${req.params.id}`, 404));
    }
   
   // Make sure user is course owner
   if (course.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(new ErrorResponse(`User ${req.user.id} is not authorized to update course ${course._id}`, 401));
    }

    course = await Course.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });


    res.status(200).json({
        success: true,
        data: course
    });
});

//@desc    Delete course
//@route   DELETE /api/v1/courses/:id
//@access  Private
exports.deleteCourse = asyncHandler(async (req, res, next) => {
    const course = await Course.findById(req.params.id);

    if (!course) {
        return next(new ErrorResponse(`No course with the id of ${req.params.id}`, 404));
    }

    // Make sure user is course owner
    if (course.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(new ErrorResponse(`User ${req.user.id} is not authorized to delete course ${course._id}`, 401));
    }

    await course.deleteOne();

    res.status(200).json({
        success: true,
        data: {}
    });
});