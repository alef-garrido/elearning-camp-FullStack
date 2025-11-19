const mongoose = require('mongoose');
const slugify = require('slugify');

const TopicSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A topic must have a name'],
    unique: true,
    trim: true,
    maxlength: [100, 'Topic name must have less or equal than 100 characters']
  },
  slug: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

TopicSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = slugify(this.name, { lower: true });
  }
  next();
});

module.exports = mongoose.model('Topic', TopicSchema);
