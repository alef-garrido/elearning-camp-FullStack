const express = require('express');
const { 
    getCommunities, 
    getCommunity, 
    createCommunity, 
    updateCommunity, 
    deleteCommunity,
    getCommunitiesInRadius,
    communityPhotoUpload 
} = require('../controllers/communities');
const advancedResults = require('../middleware/advancedResults');
const Community = require('../models/Community');
// Include other resource routers
const courseRouter = require('./courses');
const reviewRouter = require('./reviews');


const router = express.Router();

const { protect, authorize}  = require('../middleware/auth');

// Re-route into other resource routers
router.use('/:communityId/courses', courseRouter);
router.use('/:communityId/reviews', reviewRouter);

router
    .route('/:id/photo')
    .put(protect, authorize('publisher', 'admin'), communityPhotoUpload);

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