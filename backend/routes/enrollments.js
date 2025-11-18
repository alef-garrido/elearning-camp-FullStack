const express = require('express');
const { getMyEnrollments } = require('../controllers/communities');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.route('/my-enrollments').get(protect, getMyEnrollments);

module.exports = router;
