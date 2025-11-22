const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const errorHandler = require('./middleware/error');
const mongoSanitize = require('./middleware/mongoSanitize');
const helmet = require('helmet');
const { xss } = require('express-xss-sanitizer');
const hpp = require('hpp');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const connectDB = require('./config/db');

// Load env vars from file only when not running in production
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: './config/config.env' });
}

// Connect to database
connectDB();

// Route files
const communities = require('./routes/communities');
const courses = require('./routes/courses');
const auth = require('./routes/auth');
const users = require('./routes/users');
const auditLogs = require('./routes/auditLogs');
const reviews = require('./routes/reviews');
const enrollments = require('./routes/enrollments');
const uploads = require('./routes/uploads');
const topics = require('./routes/topics');

const app = express();


// Enable CORS
const allowedOrigins = [
    'http://localhost:3000', 
    'http://127.0.0.1:3000', 
    'http://localhost:5173', 
    'http://127.0.0.1:5173',
    'https://elearning-camp-full-stack-frontend.vercel.app'
];

app.use(cors({
    origin: function (origin, callback) {
        // allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true
}));

// Body parser with higher limit and strict mode
app.use(express.json({ 
  limit: '10mb',
  strict: true,
  verify: (req, res, buf) => {
    req.rawBody = buf.toString();
  }
}));

// URL-encoded parser
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser
app.use(cookieParser());

// dev logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Note: `express-fileupload` was removed because multer is used per-route.
// Keeping a global multipart body parser can consume the request stream and
// interfere with multer's ability to handle multipart/form-data. Multer is
// applied at the route level where needed (see `middleware/upload.js`).

// Sanitize data - after parsing but before route handling
app.use(mongoSanitize);

// Configure security headers based on environment
if (process.env.NODE_ENV === 'development') {
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          connectSrc: ["'self'", "http://localhost:*", "http://127.0.0.1:*"],
          imgSrc: ["'self'", "data:", "https:"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"],
          blockAllMixedContent: []
        }
      },
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: false,
      crossOriginOpenerPolicy: false
    })
  );
} else {
  // Production security configuration
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          connectSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"],
        },
      },
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: false // Disabled to prevent conflict with CORS
    })
  );
}

// Prevent XSS attacks
app.use(xss());

// Create separate rate limiters for auth and general routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 requests per windowMs for auth routes
  message: 'Too many authentication attempts, please try again later'
});

const apiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 mins
  max: 100 // 100 requests per windowMs for other routes
});

// Apply rate limiting - auth routes get a separate limit
app.use('/api/v1/auth', authLimiter);
app.use('/api/v1', apiLimiter);

// Prevent http param pollution
app.use(hpp());

// Serve API docs under /docs instead of the root
app.use('/docs', express.static(path.join(__dirname, 'public')));

// Mount routers - order matters for nested routes
// Expose auth routes at both `/api/v1/auth` and `/auth` so deployed
// frontends that were built with a slightly different base path still
// reach the auth endpoints. This avoids CORS/preflight failures when
// the frontend requests `/auth/*` directly.
app.use(['/api/v1/auth', '/auth'], auth);
app.use('/api/v1/users', users);
app.use('/api/v1/audit-logs', auditLogs);
app.use('/api/v1/communities', communities); // This should come before courses and reviews as they are nested
app.use('/api/v1/courses', courses);
app.use('/api/v1/reviews', reviews);
app.use('/api/v1/enrollments', enrollments);
app.use('/api/v1/uploads', uploads);
app.use('/api/v1/topics', topics);

// Error handler middleware - should be last
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

const server = app.listen(
  PORT,
  () => console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`)
);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', err);
  // Close server & exit process gracefully
  server.close(() => {
    console.log('Server closed due to unhandled promise rejection');
    process.exit(1);
  });
});