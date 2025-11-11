const mongoose = require('mongoose');

const EnrollmentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  community: {
    type: mongoose.Schema.ObjectId,
    ref: 'Community',
    required: true,
  },
  status: {
    type: String,
    enum: ['active', 'cancelled'],
    default: 'active',
  },
  enrolledAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Prevent duplicate enrollments for the same user/community
EnrollmentSchema.index({ user: 1, community: 1 }, { unique: true });

module.exports = mongoose.model('Enrollment', EnrollmentSchema);
