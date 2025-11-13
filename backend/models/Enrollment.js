const mongoose = require('mongoose');

const EnrollmentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  // Either community or course will be set (or theoretically both, but typical use sets one)
  community: {
    type: mongoose.Schema.ObjectId,
    ref: 'Community'
  },
  course: {
    type: mongoose.Schema.ObjectId,
    ref: 'Course'
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

// Prevent duplicate enrollments for the same user/community (only when community is present)
EnrollmentSchema.index(
  { user: 1, community: 1 },
  { unique: true, partialFilterExpression: { community: { $exists: true } } }
);

// Prevent duplicate enrollments for the same user/course (only when course is present)
EnrollmentSchema.index(
  { user: 1, course: 1 },
  { unique: true, partialFilterExpression: { course: { $exists: true } } }
);

module.exports = mongoose.model('Enrollment', EnrollmentSchema);
