const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const morgan = require('morgan');
const fileupload = require('express-fileupload');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/error');


// Load env vars
dotenv.config({ path: './config/config.env' });


// Connect to database
connectDB();

// Route files
const communities = require('./routes/communities');
const courses = require('./routes/courses');

const app = express();

// Body parser
app.use(express.json());

// dev logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// File uploading
app.use(fileupload());
// Set static folder
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Mount routers
app.use('/api/v1/communities', communities);
app.use('/api/v1/courses', courses);

// Error handler middleware
app.use(errorHandler);


const PORT = process.env.PORT || 5000;


const server = app.listen(
  PORT,
  () => console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`)
);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});