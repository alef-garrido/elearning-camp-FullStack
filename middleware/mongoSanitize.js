const sanitize = require('mongo-sanitize');

const mongoSanitize = (req, res, next) => {
  // Sanitize request body
  if (req.body) {
    req.body = sanitize(req.body);
  }

  // Sanitize query parameters
  if (req.query) {
    req.query = sanitize(req.query);
  }

  // Sanitize path parameters
  if (req.params) {
    req.params = sanitize(req.params);
  }

  next();
};

module.exports = mongoSanitize;
