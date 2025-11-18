const express = require('express');
const { getMyEnrollments } = require('../controllers/enrollments');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/my-enrollments', protect, getMyEnrollments);

module.exports = router;
