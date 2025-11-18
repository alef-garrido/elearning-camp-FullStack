const express = require('express');
const {
    getCourses,
    getCourse,
    addCourse,
    updateCourse,
    deleteCourse,
    enrollCourse,
    unenrollCourse,
    getEnrolledUsers,
    getEnrollmentStatus,
    getCourseContent,
    getLesson,
    updateLessonProgress,
    completeCourse,
    getCourseProgress
} = require('../controllers/courses');
const Course = require('../models/Course');
const advancedResults = require('../middleware/advancedResults');


const router = express.Router({ mergeParams: true });

const { protect, authorize}  = require('../middleware/auth');
const { checkEnrollment } = require('../middleware/checkEnrollment');

router
    .route('/')
    .get(advancedResults(Course, {
        path: 'community',
        select: 'name description'
    }), getCourses)
    .post(protect, authorize('publisher', 'admin'), addCourse);

router
    .route('/:id')
    .get(getCourse)
        .put(protect, authorize('publisher', 'admin'), updateCourse)
        .delete(protect, authorize('publisher', 'admin'), deleteCourse);

// Enrollment routes for courses
router
    .route('/:id/enroll')
    .post(protect, enrollCourse)
    .delete(protect, unenrollCourse);

router
    .route('/:id/enrolled')
    .get(protect, getEnrolledUsers);

router
    .route('/:id/enrollment-status')
    .get(protect, getEnrollmentStatus);

// Course content routes
router
    .route('/:courseId/content')
    .get(protect, checkEnrollment, getCourseContent);

router
    .route('/:courseId/lessons/:lessonId')
    .get(protect, checkEnrollment, getLesson);

router
    .route('/:courseId/lessons/:lessonId/progress')
    .post(protect, checkEnrollment, updateLessonProgress);

router
    .route('/:courseId/complete')
    .post(protect, checkEnrollment, completeCourse);

router
    .route('/:courseId/progress')
    .get(protect, checkEnrollment, getCourseProgress);


module.exports = router;