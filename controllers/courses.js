const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const  Course = require('../models/Course');

// @desc    Get courses
// @route   GET /api/v1/courses
// @route   GET /api/v1/communities/:communityId/courses
// @access  Public
exports.getCourses = asyncHandler(async (req, res, next) => {
    let query;
    if(req.params.communityId) {
        query = Course.find({ community: req.params.communityId });
    } else {
        query = Course.find().populate({
            path: 'community',
            select: 'name description'
        });
    }
    
    const courses = await query;

    res.status(200).json({
        success: true,
        count: courses.length,
        data: courses
    });

});