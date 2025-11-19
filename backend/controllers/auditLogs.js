const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const AuditLog = require('../models/AuditLog');
const User = require('../models/User');

// @desc    Get audit logs (filterable, paginated)
// @route   GET /api/v1/audit-logs
// @access  Private/Admin
exports.getAuditLogs = asyncHandler(async (req, res, next) => {
  const { action, resourceType, performedBy, page = 1, limit = 25 } = req.query;

  const filter = {};
  if (action) filter.action = action;
  if (resourceType) filter.resourceType = resourceType;
  if (performedBy) filter.performedBy = performedBy;

  const pageNum = parseInt(page, 10) || 1;
  const perPage = Math.min(100, parseInt(limit, 10) || 25);
  const skip = (pageNum - 1) * perPage;

  const total = await AuditLog.countDocuments(filter);

  const items = await AuditLog.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(perPage)
    .populate('performedBy', 'name email role');

  res.status(200).json({
    success: true,
    count: items.length,
    pagination: {
      page: pageNum,
      limit: perPage,
      total
    },
    data: items
  });
});
