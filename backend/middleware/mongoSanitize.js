const sanitize = require('mongo-sanitize');

const mongoSanitize = (req, res, next) => {
  try {
    if (!req) {
      return next(new Error('Request object is undefined'));
    }

    // Sanitize request body
    if (req.body && typeof req.body === 'object') {
      req.body = sanitize(req.body);
    }

    // Sanitize query parameters
    if (req.query && typeof req.query === 'object') {
      req.query = sanitize(req.query);
    }

    // Sanitize path parameters
    if (req.params && typeof req.params === 'object') {
      req.params = sanitize(req.params);
    }

    next();
  } catch (error) {
    console.error('MongoDB Sanitize Error:', error);
    next(error);
  }
};

module.exports = mongoSanitize;
