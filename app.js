const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
const indexRouter = require('./routes/index');
const { notFoundHandler, errorHandler } = require('./middleware/error-handler');
const connectDB = require('./utils/db');

// db connection;

const app = express();

// Enable CORS
app.use(cors('*'));

// middleware
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// connect to Database
connectDB();

app.use('/', indexRouter);

// Catch 404 and forward to error handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

module.exports = app;
