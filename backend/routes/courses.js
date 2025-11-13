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
    getEnrollmentStatus
} = require('../controllers/courses');
const Course = require('../models/Course');
const advancedResults = require('../middleware/advancedResults');


const router = express.Router({ mergeParams: true });

const { protect, authorize}  = require('../middleware/auth');

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


module.exports = router;