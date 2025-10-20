const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema({
    title: {
        type: String,
        trim: true,
        required: [true, 'Please add a course title']
    },
    description: {
        type: String,
        required: [true, 'Please add a description']
    },
    weeks: {
        type: String,
        required: [true, 'Please add number of weeks']
    },
    membership: {
        type: Number,
        required: [true, 'Please add a tuition cost']
    },
    minimumSkill: {
        type: String,
        required: [true, 'Please add a minimum skill'],
        enum: ['beginner', 'intermediate', 'advanced']
    },
    scholarshipAvailable: {
        type: Boolean,
        default: false
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    // relationship between course and community
    community: {
        type: mongoose.Schema.ObjectId,
        ref: 'Community',
        required: true
    }
});

CourseSchema.statics.getAverageCost = async function(communityId) {
    const obj = await this.aggregate([
        {
            $match: { community: communityId }
        },
        {
            $group: {
                _id: '$community',
                averageCost: { $avg: '$membership' }
            }
        }
    ]);
    try {
        // In case a community is deleted which has courses
        const averageCost = obj[0] ? Math.ceil(obj[0].averageCost / 10) * 10 : undefined;

        await this.model('Community').findByIdAndUpdate(communityId, {
            averageCost: averageCost
        }, {
            new: true // Optional: returns the modified document
        }); 
    } catch (error) {
        console.error(error);
    }
};

//  Get average cost of courses after save
CourseSchema.post('save', async function() {
    await this.constructor.getAverageCost(this.community);
});

// Get average cost of courses after remove
CourseSchema.post('deleteOne', { document: true, query: false }, async function() {
    await this.constructor.getAverageCost(this.community);
});

module.exports = mongoose.model('Course', CourseSchema); 