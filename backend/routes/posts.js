const express = require('express');
const {
  getPosts,
  createPost,
  updatePost,
  deletePost
} = require('../controllers/posts');

const router = express.Router({ mergeParams: true });
const { protect } = require('../middleware/auth');

// GET /api/v1/communities/:communityId/posts
router.route('/').get(getPosts).post(protect, createPost);

// Single post actions
router.route('/:postId').put(protect, updatePost).delete(protect, deletePost);

module.exports = router;
