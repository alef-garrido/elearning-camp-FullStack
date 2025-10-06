const express = require('express');
const { 
    getCommunities, 
    getCommunity, 
    createCommunity, 
    updateCommunity, 
    deleteCommunity,
    getCommunitiesInRadius 
} = require('../controllers/communities');
// Include other resource routers
const courseRouter = require('./courses');


const router = express.Router();

// Re-route into other resource routers
router.use('/:communityId/courses', courseRouter);

router
    .route('/radius/:zipcode/:distance')
    .get(getCommunitiesInRadius);


router
    .route('/')
    .get(getCommunities)
    .post(createCommunity);

router
    .route('/:id')
    .get(getCommunity)
    .put(updateCommunity)
    .delete(deleteCommunity);

module.exports = router;