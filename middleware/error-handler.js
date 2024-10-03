/**
 * Importing the 'http-errors' module to create HTTP errors.
 */
const createError = require('http-errors');

/**
 * Middleware function to handle 404 Not Found errors.
 * 
 * @param {NextFunction} next - The next middleware function in the application’s request-response cycle.
 */
function notFoundHandler(req, res, next) {
  /**
   * Creating a new HTTP error with a status code of 404 and a custom message.
   * 
   * @type {Error} - The created HTTP error.
   */
  const error = createError(404, 'Resource not found; Please refer to the documentation provided');
  next(error); // Passing the error to the next middleware function.
}

/**
 * Middleware function to handle general errors.
 * 
 * @param {Error} err - The error to be handled.
 * @param {NextFunction} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next middleware function in the application’s request-response cycle.
 */
function errorHandler(err, req, res, next) {
  /**
   * Logging the error stack to the console for debugging purposes.
   */
  console.error(err.stack);

  /**
   * Setting the response status to the error status or 500 if not specified.
   */
  res.status(err.status || 500);

  /**
   * Sending a JSON response with the error message and details based on the environment.
   * 
   * @type {Object} - The response object.
   */
  res.json({
    message: err.message,
    error: req.app.get('env') === 'development' ? err : {} // Including the full error object in development mode.
  });
}

/**
 * Exporting the error handling middleware functions.
 */
module.exports = {
  notFoundHandler,
  errorHandler
};
