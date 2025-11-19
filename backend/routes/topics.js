const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const topicsController = require('../controllers/topics');

router.route('/').get(topicsController.getTopics).post(protect, authorize('admin'), topicsController.createTopic);
router.route('/:id').get(topicsController.getTopic).put(protect, authorize('admin'), topicsController.updateTopic).delete(protect, authorize('admin'), topicsController.deleteTopic);

// Add replace/remove route (admin only)
router.post('/:id/replace', protect, authorize('admin'), topicsController.replaceOrRemoveReferences);

module.exports = router;
