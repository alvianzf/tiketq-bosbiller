const createError = require('http-errors');

function notFoundHandler(req, res, next) {
  next(createError(404, 'Resource not found; Please refer to the documentation provided'));
}

function errorHandler(err, req, res, next) {
  console.error(err.stack);

  res.status(err.status || 500);

  res.json({
    message: err.message,
    error: req.app.get('env') === 'development' ? err : {}
  });
}

module.exports = {
  notFoundHandler,
  errorHandler
};
