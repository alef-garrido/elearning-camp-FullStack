const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Community = require('../models/Community');
const Post = require('../models/Post');


// @desc    Get posts for a community (paginated)
// @route   GET /api/v1/communities/:communityId/posts
// @access  Public
exports.getPosts = asyncHandler(async (req, res, next) => {
  const communityId = req.params.communityId;

  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const total = await Post.countDocuments({ community: communityId });
  const posts = await Post.find({ community: communityId })
    .populate('user', 'name photo')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.status(200).json({
    success: true,
    count: posts.length,
    pagination: { page, limit, total },
    data: posts,
  });
});


// @desc    Create a post in a community
// @route   POST /api/v1/communities/:communityId/posts
// @access  Private
exports.createPost = asyncHandler(async (req, res, next) => {
  const communityId = req.params.communityId;

  const community = await Community.findById(communityId);
  if (!community) {
    return next(new ErrorResponse(`Community not found with id of ${communityId}`, 404));
  }

  const post = await Post.create({
    community: communityId,
    user: req.user.id,
    content: req.body.content,
    attachments: req.body.attachments || []
  });

  // Populate user fields (name, photo) so the client receives display-ready data
  await post.populate('user', 'name photo');

  res.status(201).json({ success: true, data: post });
});


// @desc    Update a post
// @route   PUT /api/v1/communities/:communityId/posts/:postId
// @access  Private (author or community owner or admin)
exports.updatePost = asyncHandler(async (req, res, next) => {
  const post = await Post.findById(req.params.postId);
  if (!post) return next(new ErrorResponse('Post not found', 404));

  const community = await Community.findById(post.community);
  if (!community) return next(new ErrorResponse('Community not found', 404));

  // Allow author, community owner or admin
  if (post.user.toString() !== req.user.id && community.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to update this post', 403));
  }

  post.content = req.body.content ?? post.content;
  post.attachments = req.body.attachments ?? post.attachments;
  await post.save();

  res.status(200).json({ success: true, data: post });
});


// @desc    Delete a post
// @route   DELETE /api/v1/communities/:communityId/posts/:postId
// @access  Private (author or community owner or admin)
exports.deletePost = asyncHandler(async (req, res, next) => {
  const post = await Post.findById(req.params.postId);
  if (!post) return next(new ErrorResponse('Post not found', 404));

  const community = await Community.findById(post.community);
  if (!community) return next(new ErrorResponse('Community not found', 404));

  if (post.user.toString() !== req.user.id && community.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to delete this post', 403));
  }

  await post.deleteOne();

  res.status(200).json({ success: true, data: {} });
});
