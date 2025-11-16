const express = require('express');
const { 
    getCommunities, 
    getCommunity, 
    createCommunity, 
    updateCommunity, 
    deleteCommunity,
    getCommunitiesInRadius,
    communityPhotoUpload,
    enrollCommunity,
    unenrollCommunity,
    getEnrolledUsers
} = require('../controllers/communities');
const advancedResults = require('../middleware/advancedResults');
const Community = require('../models/Community');
const { uploadSingle } = require('../middleware/upload');
// Include other resource routers
const courseRouter = require('./courses');
const reviewRouter = require('./reviews');
const postsRouter = require('./posts');


const router = express.Router();

const { protect, authorize}  = require('../middleware/auth');

// Photo upload route (should come before nested routes)
// Use multer middleware to handle file upload to memory
router
    .route('/:id/photo')
    .put(protect, authorize('publisher', 'admin'), uploadSingle('file'), communityPhotoUpload);

// Enrollment routes
router
    .route('/:id/enroll')
    .post(protect, enrollCommunity)
    .delete(protect, unenrollCommunity);

router
        .route('/:id/enrolled')
        .get(protect, getEnrolledUsers);

// Check current user's enrollment status
router
    .route('/:id/enrollment-status')
    .get(protect, require('../controllers/communities').getEnrollmentStatus);

// Re-route into other resource routers
router.use('/:communityId/courses', courseRouter);
router.use('/:communityId/reviews', reviewRouter);
router.use('/:communityId/posts', postsRouter);

router
    .route('/radius/:zipcode/:distance')
    .get(getCommunitiesInRadius);


router
    .route('/')
    .get(advancedResults(Community, 'courses'), getCommunities)
    .post(protect, authorize('publisher', 'admin'), createCommunity);

router
    .route('/:id')
    .get(getCommunity)
    .put(protect, authorize('publisher', 'admin'), updateCommunity)
    .delete(protect, authorize('publisher', 'admin'), deleteCommunity);

module.exports = router;