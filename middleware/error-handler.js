/**
 * Importing the 'http-errors' module to create HTTP errors.
 */
const createError = require("http-errors");

/**
 * Middleware function to handle 404 Not Found errors.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function in the application’s request-response cycle.
 */
function notFoundHandler(req, res, next) {
  const error = createError(
    404,
    "Resource not found; Please refer to the documentation provided",
  );
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
  const status = err.status || 500;
  // Gate on an explicit NODE_ENV — Express's app.get("env") defaults to
  // "development" when NODE_ENV is unset, which would leak stack traces in prod.
  const isDev = process.env.NODE_ENV === "development";
  res.status(status);
  res.json({
    // Never surface internal error detail for server errors in production.
    message: status >= 500 && !isDev ? "Internal server error" : err.message,
    errors: err.errors || [],
    ...(isDev ? { error: err.stack } : {}),
  });
}

module.exports = { notFoundHandler, errorHandler };
