const createError = require('http-errors');

const notFoundHandler = (req, res, next) => {
  next(createError(404));
};

const errorHandler = (err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);
  res.render('error');
};

module.exports = {
  notFoundHandler,
  errorHandler,
};
