const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Community = require('../models/Community');
const Topic = require('../models/Topic');
const mongoose = require('mongoose');

// @desc    Get all topics
// @route   GET /api/v1/topics
// @access  Public
exports.getTopics = asyncHandler(async (req, res, next) => {
  const topics = await Topic.find().sort({ name: 1 });
  res.status(200).json({ success: true, count: topics.length, data: topics });
});

// @desc    Get single topic
// @route   GET /api/v1/topics/:id
// @access  Public
exports.getTopic = asyncHandler(async (req, res, next) => {
  const topic = await Topic.findById(req.params.id);
  if (!topic) return next(new ErrorResponse(`Topic not found with id of ${req.params.id}`, 404));
  res.status(200).json({ success: true, data: topic });
});

// @desc    Create topic
// @route   POST /api/v1/topics
// @access  Private/Admin
exports.createTopic = asyncHandler(async (req, res, next) => {
  const topic = await Topic.create(req.body);
  res.status(201).json({ success: true, data: topic });
});

// @desc    Update topic
// @route   PUT /api/v1/topics/:id
// @access  Private/Admin
exports.updateTopic = asyncHandler(async (req, res, next) => {
  let topic = await Topic.findById(req.params.id);
  if (!topic) return next(new ErrorResponse(`Topic not found with id of ${req.params.id}`, 404));

  topic = await Topic.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({ success: true, data: topic });
});

// @desc    Delete topic
// @route   DELETE /api/v1/topics/:id
// @access  Private/Admin
exports.deleteTopic = asyncHandler(async (req, res, next) => {
  const topic = await Topic.findById(req.params.id);
  if (!topic) return next(new ErrorResponse(`Topic not found with id of ${req.params.id}`, 404));

  await topic.deleteOne();

  res.status(200).json({ success: true, data: {} });
});

// Replace or remove topic references in communities
// POST /api/v1/topics/:id/replace
// body: { replaceWithId: "<topicId|null>" }
// If replaceWithId is provided -> replace occurrences of :id with replaceWithId (addToSet then pull old id).
// If replaceWithId is null or not provided -> remove occurrences of :id from communities.
exports.replaceOrRemoveReferences = asyncHandler(async (req, res, next) => {
  const oldId = req.params.id;
  const { replaceWithId } = req.body;

  // validate old topic exists
  const oldTopic = await Topic.findById(oldId);
  if (!oldTopic) return next(new ErrorResponse(`Topic not found with id of ${oldId}`, 404));

  if (replaceWithId) {
    if (!mongoose.Types.ObjectId.isValid(replaceWithId)) {
      return next(new ErrorResponse('replaceWithId is not a valid id', 400));
    }
    if (replaceWithId === oldId) {
      return next(new ErrorResponse('replaceWithId must be different', 400));
    }
    const newTopic = await Topic.findById(replaceWithId);
    if (!newTopic) return next(new ErrorResponse(`Replacement topic not found with id of ${replaceWithId}`, 404));

    // Add replaceWithId to any community that contains oldId (use addToSet), then pull oldId
    const addRes = await Community.updateMany(
      { topics: oldId },
      { $addToSet: { topics: replaceWithId } }
    );
    const pullRes = await Community.updateMany(
      { topics: oldId },
      { $pull: { topics: oldId } }
    );

    res.status(200).json({
      success: true,
      message: 'Replaced topic references in communities',
      matchedCount: addRes.matchedCount ?? addRes.n ?? 0,
      modifiedCount: pullRes.modifiedCount ?? pullRes.nModified ?? 0
    });
  } else {
    // Remove oldId from communities
    const pullRes = await Community.updateMany(
      { topics: oldId },
      { $pull: { topics: oldId } }
    );
    res.status(200).json({
      success: true,
      message: 'Removed topic references from communities',
      matchedCount: pullRes.matchedCount ?? pullRes.n ?? 0,
      modifiedCount: pullRes.modifiedCount ?? pullRes.nModified ?? 0
    });
  }
});
