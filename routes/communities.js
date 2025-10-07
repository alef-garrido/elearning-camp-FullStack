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


const router = express.Router();

const { protect }  = require('../middleware/auth');

// Re-route into other resource routers
router.use('/:communityId/courses', courseRouter);

router
    .route('/:id/photo')
    .put(protect, communityPhotoUpload);

router
    .route('/radius/:zipcode/:distance')
    .get(getCommunitiesInRadius);


router
    .route('/')
    .get(advancedResults(Community, 'courses'), getCommunities)
    .post(protect, createCommunity);

router
    .route('/:id')
    .get(getCommunity)
    .put(protect, updateCommunity)
    .delete(protect, deleteCommunity);

module.exports = router;