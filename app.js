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
const getFerryToken = require('./utils/node-cache');

const app = express();

// Enable CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
}));

// Middleware
app.use(logger('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb', parameterLimit: 10000 }));
app.use(cookieParser());

// Serve static files from 'public' and 'assets' directories
app.use('/public', express.static(path.join(__dirname, 'public'), { maxAge: 31557600000 }));
app.use('/assets', express.static(path.join(__dirname, 'assets'), { maxAge: 31557600000 }));

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Connect to Database
connectDB();

// Required for seed
const seedAdmin = require('./db/seeds/seedAdmin');
const User = require('./db/models/User');
seedAdmin();

// Get Ferry Token
getFerryToken().catch(err => {
  console.error('Failed to initialize Ferry Token:', err.message);
});

// Use routes
app.use('/api', routes);
app.use('/api/protected', protectedRoutes);

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;