const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
    title: {
    type: String,
    required: [true, 'Please add a title for the review'],
    trim: true,
    maxlength: 100
    },
    text: {
    type: String,
    required: [true, 'Please add some text']
    },
    rating: {
    type: Number,
    min: 1,
    max: 10,
    required: [true, 'Please add a rating between 1 and 10']
    },
    createdAt: {
    type: Date,
    default: Date.now
    },
    community: {
    type: mongoose.Schema.ObjectId,
    ref: 'Community',
    required: true
    },
    user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
    }
});

// Prevent user from submitting more than one review per community
ReviewSchema.index({ community: 1, user: 1 }, { unique: true });

// Static method to get avg rating and save
ReviewSchema.statics.getAverageRating = async function(communityId) {
    const obj = await this.aggregate([
    {
        $match: { community: communityId }
    },
    {
        $group: {
        _id: '$community',
        averageRating: { $avg: '$rating' }
        }
    }
    ]);

    try {
    await this.model('Community').findByIdAndUpdate(communityId, {
        averageRating: obj[0] ? obj[0].averageRating : undefined
    });
    } catch (err) {
    console.error(err);
    }
};

// Call getAverageRating after save
ReviewSchema.post('save', async function() {
    await this.constructor.getAverageRating(this.community);
});

// Call getAverageRating after remove/delete
ReviewSchema.post('deleteOne', { document: true, query: false }, async function() {
  await this.constructor.getAverageRating(this.community);
});

// Middleware to trigger average rating calculation on findByIdAndUpdate
ReviewSchema.post('findOneAndUpdate', async function(doc) {
    if (doc) {
        await doc.constructor.getAverageRating(doc.community);
    }
});

module.exports = mongoose.model('Review', ReviewSchema);