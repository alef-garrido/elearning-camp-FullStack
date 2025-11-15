const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const  Course = require('../models/Course');
const  Community = require('../models/Community');
const Enrollment = require('../models/Enrollment');

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


// @desc      Enroll current user in a course
// @route     POST /api/v1/courses/:id/enroll
// @access    Private
exports.enrollCourse = asyncHandler(async (req, res, next) => {
    const courseId = req.params.id;

    const course = await Course.findById(courseId);
    if (!course) {
        return next(new ErrorResponse(`Course not found with id of ${courseId}`, 404));
    }

    // Ensure user is a member of the community that owns this course
    const community = await Community.findById(course.community);
    if (!community) {
        return next(new ErrorResponse(`Community for this course not found`, 500));
    }

    const isCommunityMember = await Enrollment.findOne({ user: req.user.id, community: community._id, status: 'active' });
    // Allow enrollment if user is community owner or admin as well
    if (!isCommunityMember && community.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(new ErrorResponse('You must be a member of the community to enroll in its courses', 403));
    }

    // Prevent duplicate active enrollment
    const existing = await Enrollment.findOne({ user: req.user.id, course: courseId, status: 'active' });
    if (existing) {
        return next(new ErrorResponse('User is already enrolled in this course', 409));
    }

    try {
        const enrollment = await Enrollment.create({
            user: req.user.id,
            course: courseId,
            status: 'active'
        });

        const count = await Enrollment.countDocuments({ course: courseId, status: 'active' });

        res.status(201).json({ success: true, data: enrollment, enrollmentCount: count });
    } catch (err) {
        // Duplicate enrollment -> unique index violation (race)
        if (err.code === 11000) {
            return next(new ErrorResponse('User is already enrolled in this course', 409));
        }
        return next(err);
    }
});


// @desc      Unenroll current user from a course (soft-cancel)
// @route     DELETE /api/v1/courses/:id/enroll
// @access    Private
exports.unenrollCourse = asyncHandler(async (req, res, next) => {
    const courseId = req.params.id;
    // Support admin/owner unenrolling other users via ?userId=<id>
    const targetUserId = req.query.userId || req.user.id;

    // If attempting to unenroll someone else, allow only course owner or admin
    if (targetUserId.toString() !== req.user.id.toString()) {
        const course = await Course.findById(courseId);
        if (!course) {
            return next(new ErrorResponse(`Course not found with id of ${courseId}`, 404));
        }
        if (course.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return next(new ErrorResponse('Not authorized to unenroll other users', 403));
        }
    }

    const enrollment = await Enrollment.findOne({ user: targetUserId, course: courseId, status: 'active' });
    if (!enrollment) {
        return next(new ErrorResponse('Enrollment not found', 404));
    }

    // Soft-cancel for history
    enrollment.status = 'cancelled';
    await enrollment.save();

    const count = await Enrollment.countDocuments({ course: courseId, status: 'active' });

    res.status(200).json({ success: true, data: {}, enrollmentCount: count });
});


// @desc      Get enrolled users for a course (paginated)
// @route     GET /api/v1/courses/:id/enrolled
// @access    Private (only course owner or admin)
exports.getEnrolledUsers = asyncHandler(async (req, res, next) => {
    const courseId = req.params.id;

    const course = await Course.findById(courseId);
    if (!course) {
        return next(new ErrorResponse(`Course not found with id of ${courseId}`, 404));
    }

    // Only owner or admin may list enrolled users
    if (course.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(new ErrorResponse('Not authorized to view enrolled users', 403));
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 25;
    const skip = (page - 1) * limit;

    const total = await Enrollment.countDocuments({ course: courseId, status: 'active' });
    const enrollments = await Enrollment.find({ course: courseId, status: 'active' })
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


// @desc      Get current user's enrollment status for a course
// @route     GET /api/v1/courses/:id/enrollment-status
// @access    Private
exports.getEnrollmentStatus = asyncHandler(async (req, res, next) => {
    const courseId = req.params.id;
    const enrollment = await Enrollment.findOne({ course: courseId, user: req.user.id, status: 'active' });
    res.status(200).json({ success: true, data: { enrolled: !!enrollment } });
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

    // Preserve lesson _id values where possible to avoid breaking student progress
    // when publishers edit lessons. If the incoming payload includes lessons,
    // try to match them to existing lessons by title/url/type and reuse the
    // existing subdocument _id when a match is found.
    const updatePayload = { ...req.body };
    if (Array.isArray(req.body.lessons) && course.lessons && course.lessons.length > 0) {
        const existingLessons = course.lessons;
                const matched = [];
                const created = [];
                updatePayload.lessons = req.body.lessons.map((incoming) => {
                        // If the client provided an _id for the lesson, keep it as-is and mark as matched
                        if (incoming._id) {
                                matched.push({ incoming, matchedId: incoming._id });
                                return incoming;
                        }

                        // Try to find a reasonable match in existing lessons
                        const match = existingLessons.find((el) => (
                                el.title === incoming.title &&
                                ( (!incoming.url && !el.url) || el.url === incoming.url ) &&
                                el.type === incoming.type
                        ));

                        if (match) {
                                matched.push({ incoming, matchedId: match._id });
                                return { ...incoming, _id: match._id };
                        }

                        // No match — return incoming as new lesson
                        created.push(incoming);
                        return incoming;
                });

                // Optional debug logging controlled via environment variable
                try {
                    const shouldLog = process.env.LOG_LESSON_MATCHING === 'true';
                    if (shouldLog) {
                        console.log(`Lesson matching summary for course ${course._id}: matched=${matched.length}, created=${created.length}`);
                        if (matched.length > 0) {
                            matched.forEach(m => console.log(`  Matched incoming title='${m.incoming.title}' -> existingId=${m.matchedId}`));
                        }
                        if (created.length > 0) {
                            created.forEach(c => console.log(`  New lesson incoming title='${c.title}' type='${c.type}' url='${c.url || ''}'`));
                        }
                    }
                } catch (e) {
                    // swallow logging errors
                }
    }

    course = await Course.findByIdAndUpdate(req.params.id, updatePayload, {
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

// @desc    Get course content (lessons) for an enrolled user
// @route   GET /api/v1/courses/:courseId/content
// @access  Private
exports.getCourseContent = asyncHandler(async (req, res, next) => {
    // checkEnrollment middleware already ran, so we have req.enrollment
    const course = await Course.findById(req.params.courseId).select('+lessons');
  
    if (!course) {
      return next(new ErrorResponse(`Course not found with id of ${req.params.courseId}`, 404));
    }
  
    // Return course with lessons
    res.status(200).json({
      success: true,
      data: course,
    });
});

// @desc    Get a single lesson for an enrolled user
// @route   GET /api/v1/courses/:courseId/lessons/:lessonId
// @access  Private
exports.getLesson = asyncHandler(async (req, res, next) => {
    const { courseId, lessonId } = req.params;
  
    const course = await Course.findById(courseId).select('+lessons');
  
    if (!course) {
      return next(new ErrorResponse(`Course not found with id of ${courseId}`, 404));
    }
  
    const lesson = course.lessons.id(lessonId);
  
    if (!lesson) {
      return next(new ErrorResponse(`Lesson not found with id of ${lessonId}`, 404));
    }
  
    // Here you would generate a signed URL for lesson.url if it's a private asset
    // For now, we'll just return the lesson as is.
  
    res.status(200).json({
      success: true,
      data: lesson,
    });
});

// @desc    Update user's progress on a lesson
// @route   POST /api/v1/courses/:courseId/lessons/:lessonId/progress
// @access  Private
exports.updateLessonProgress = asyncHandler(async (req, res, next) => {
        const { lessonId } = req.params;
        const { lastPositionSeconds, completed } = req.body;

        // checkEnrollment middleware provides the enrollment
        const enrollment = req.enrollment;
        const enrollmentId = enrollment._id;

        // If no meaningful payload provided, return current progress
        if (lastPositionSeconds === undefined && completed === undefined) {
            return res.status(200).json({ success: true, data: enrollment.progress });
        }

        // Attempt to atomically update an existing progress entry for this lesson
        const setOps = {};
        if (lastPositionSeconds !== undefined) setOps['progress.$.lastPositionSeconds'] = lastPositionSeconds;
        if (completed !== undefined) setOps['progress.$.completed'] = completed;
        setOps['progress.$.updatedAt'] = Date.now();

        let updatedEnrollment = null;

        // Try to update array element in place
        if (Object.keys(setOps).length > 0) {
            updatedEnrollment = await Enrollment.findOneAndUpdate(
                { _id: enrollmentId, 'progress.lesson': lessonId },
                { $set: setOps },
                { new: true }
            );
        }

        // If no existing progress entry was updated, push a new entry atomically
        if (!updatedEnrollment) {
            const newEntry = {
                lesson: lessonId,
                lastPositionSeconds: lastPositionSeconds !== undefined ? lastPositionSeconds : 0,
                completed: completed !== undefined ? completed : false,
                updatedAt: Date.now(),
            };

            updatedEnrollment = await Enrollment.findByIdAndUpdate(
                enrollmentId,
                { $push: { progress: newEntry } },
                { new: true }
            );
        }

        if (!updatedEnrollment) {
            return next(new ErrorResponse('Failed to update enrollment progress', 500));
        }

        res.status(200).json({
            success: true,
            data: updatedEnrollment.progress,
        });
});

// @desc    Mark a course as complete for the user
// @route   POST /api/v1/courses/:courseId/complete
// @access  Private
exports.completeCourse = asyncHandler(async (req, res, next) => {
    const enrollment = req.enrollment;
  
    // You might want to add logic here to verify all lessons are completed
    // For now, we'll just update the enrollment status or a new field.
    // Let's add a `completedAt` field to the enrollment schema.
  
    enrollment.status = 'completed'; // Or a new status
    // enrollment.completedAt = Date.now(); // If you add this field to the schema
  
    await enrollment.save();
  
    res.status(200).json({
      success: true,
      data: enrollment,
    });
});

// @desc    Get user's progress for a course
// @route   GET /api/v1/courses/:courseId/progress
// @access  Private
exports.getCourseProgress = asyncHandler(async (req, res, next) => {
    // The checkEnrollment middleware provides the enrollment object
    res.status(200).json({
      success: true,
      data: req.enrollment.progress,
    });
});