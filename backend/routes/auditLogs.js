const express = require('express');
const { getAuditLogs } = require('../controllers/auditLogs');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

router.route('/').get(getAuditLogs);

module.exports = router;
