const express = require('express');
const { 
    getCommunities, 
    getCommunity, 
    createCommunity, 
    updateCommunity, 
    deleteCommunity,
    getCommunitiesInRadius 
} = require('../controllers/communities');


const router = express.Router();

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