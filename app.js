const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
const { notFoundHandler, errorHandler } = require('./middleware/error-handler');
const connectDB = require('./db');
const routes = require('./routes');
const protectedRoutes = require('./routes/protectedRoutes');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const swaggerDocument = YAML.load('./swagger.yaml');

const app = express();

// Enable CORS
app.use(cors('*'));

// Middleware
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Serve static files from 'public' and 'assets' directories
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));


// Connect to Database
connectDB();

// Required for seed
const seedAdmin = require('./db/seeds/seedAdmin');
const User = require('./db/models/User');
seedAdmin();

// Use routes
app.use(routes);
app.use(protectedRoutes);

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;