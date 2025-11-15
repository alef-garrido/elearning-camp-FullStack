const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load env vars
dotenv.config({ path: __dirname + '/config/config.env' });

// Load models
const Community = require('./models/Community');
const Course = require('./models/Course');
const User = require('./models/User');
const Review = require('./models/Review');
const Enrollment = require('./models/Enrollment');

// Connect to DB
mongoose.connect(process.env.MONGO_URI);

// Read JSON files
const communities = JSON.parse(
  fs.readFileSync(`${__dirname}/_data/communities.json`, 'utf-8')
);
const courses = JSON.parse(
  fs.readFileSync(`${__dirname}/_data/courses.json`, 'utf-8')
);
const users = JSON.parse(
  fs.readFileSync(`${__dirname}/_data/users.json`, 'utf-8')
);
const reviews = JSON.parse(
  fs.readFileSync(`${__dirname}/_data/reviews.json`, 'utf-8')
);
const enrollments = JSON.parse(
  fs.readFileSync(`${__dirname}/_data/enrollments.json`, 'utf-8')
);

// Import into DB
const importData = async () => {
  try {
    await Community.create(communities);
    await Course.create(courses);
    await User.create(users);
    await Review.create(reviews);
    await Enrollment.create(enrollments);
    console.log('Data Imported...');
    process.exit();
  } catch (err) {
    console.error(err);
  }
};

// Delete data
const deleteData = async () => {
  try {
    await Community.deleteMany({});
    await Course.deleteMany({});
    await User.deleteMany({});
    await Review.deleteMany({});
    await Enrollment.deleteMany({});
    
    // Drop indexes to clear old constraints
    await Enrollment.collection.dropIndexes().catch(() => {});
    
    console.log('Data Destroyed...');
    process.exit();
  } catch (err) {
    console.error(err);
  }
};

if (process.argv[2] === '-i') {
  importData();
} else if (process.argv[2] === '-d') {
  deleteData();
};