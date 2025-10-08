const mongoose = require('mongoose');
const slugify = require('slugify');
const geocoder = require('../utils/geocoder');

const CommunitySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'A community must have a name'],
        unique: true,
        trim: true,
        maxlength: [50, 'A community name must have less or equal than 50 characters'],
    },
    slug: String,
    description: {
        type: String,
        required: [true, 'A community must have a description'],
        maxlength: [500, 'Description must have less or equal than 500 characters']
    },
    website: {
        type: String,
        match: [
            /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/,
            'Please use a valid URL with HTTP or HTTPS'
        ]
    },
    phone: {
        type: String,
        maxlength: [20, 'Phone number must have less or equal than 20 characters']
    },
    email: {
        type: String,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email'
        ]
    },
    address: {
        type: String,
        required: false
    },
    location: {
        // GeoJSON Point
        type: {
            type: String,
            enum: ['Point'],
            // required: true
        },
        coordinates: {
            type: [Number],
            // required: true,
            index: '2dsphere'
        },
        formattedAddress: String,
        street: String,
        city: String,
        state: String,
        zipcode: String,
        country: String
    },
    topics: {
        type: [String],
        required: true,
        enum: [
            "Web Development",
            "Career Growth",
            "System Design",
            "Tech Interviews",
            "Career Advancement",
            "Leadership",
            "HTML/CSS",
            "JavaScript Basics",
            "Git & GitHub",
            "Learning How to Learn",
            "Creative Coding",
            "Generative Art",
            "UI Animation",
            "Portfolio Building"
        ]
    },
    averageRating: {
        type: Number,
        min: [1, 'Rating must be at least 1'],
        max: [10, 'Rating must can not be more than 10']

    },
    averageCost: Number,
    photo: {
        type: String,
        default: 'no-photo.jpg'
    },
    hasMentorship: {
        type: Boolean,
        default: false
    },
    hasLiveEvents: {
        type: Boolean,
        default: false
    },
    isPaid: {
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
    }
},{
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Create community slug from the name
CommunitySchema.pre('save', function(next) {
    this.slug = slugify(this.name, { lower: true });
    next();
});


// Geocode & create location field
CommunitySchema.pre('save', async function(next) {
    // Only run if address is provided and has been modified
    if (!this.isModified('address') || !this.address) {
        return next();
    }

    const loc = await geocoder.geocode(this.address);
    if(loc && loc.length > 0) {
        this.location = {
            type: 'Point',
            coordinates: [loc[0].longitude, loc[0].latitude],
            formattedAddress: loc[0].formattedAddress,
            street: loc[0].streetName,
            city: loc[0].city,
            state: loc[0].stateCode,
            zipcode: loc[0].zipcode,
            country: loc[0].countryCode
        }
    
        // Do not save address in DB
        this.address = undefined;
    }
    next();
});

// Cascade delete courses when a community is deleted
CommunitySchema.pre('deleteOne', { document: true, query: false }, async function(next) {
    console.log(`Courses being removed from community ${this._id}`);
    await this.model('Course').deleteMany({ community: this._id });
    next();
});

// Reverse populate with virtuals
CommunitySchema.virtual('courses', {
    ref: 'Course',
    localField: '_id',
    foreignField: 'community',
    justOne: false
});


module.exports = mongoose.model('Community', CommunitySchema);