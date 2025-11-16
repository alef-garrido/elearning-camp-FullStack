const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
  community: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Community',
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  content: {
    type: String,
    required: [true, 'Please add post content'],
  },
  attachments: [
    {
      type: String,
    }
  ],
}, { timestamps: true });

module.exports = mongoose.model('Post', PostSchema);
