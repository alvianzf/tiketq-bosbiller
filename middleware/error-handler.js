/**
 * Importing the 'http-errors' module to create HTTP errors.
 */
const { createError } = require('http-errors');

/**
 * Middleware function to handle 404 Not Found errors.
 * 
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function in the application’s request-response cycle.
 */
function notFoundHandler(req, res, next) {
  const error = createError(404, 'Resource not found; Please refer to the documentation provided');
  next(error);
}

/**
 * Middleware function to handle general errors.
 * 
 * @param {Error} err - The error to be handled.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function in the application’s request-response cycle.
 */
function errorHandler(err, req, res, next) {
  console.error(err.stack);
  res.status(err.status || 500);
  res.json({
    message: err.message,
    error: req.app.get('env') === 'development' ? err : {}
  });
}

module.exports = { notFoundHandler, errorHandler };