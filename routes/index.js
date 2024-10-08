/**
 * Importing the Express framework to create a new router instance.
 */
const express = require('express');
/**
 * Creating a new router instance.
 */
const router = express.Router();

/**
 * Defining a route for the root URL ('/').
 * 
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next middleware function in the application’s request-response cycle.
 */
router.get('/', (req, res, next) => {
  /**
   * Skipping to the next middleware function in the application’s request-response cycle.
   */
  next();

  /**
   * Sending a response with a status code of 401 and a JSON object indicating the access is restricted.
   * 
   * @returns {Response} - The response object.
   */
  return res.status(401).send({status: 401, msg: "Access to this resource is restricted. Please contact the administrator for more information."});
});

/**
 * Mounting the API routes at the '/api' path.
 */
router.use('/api', require('./api'));
router.use('/hooks', require('./webhooks'));

/**
 * Exporting the router instance to be used in the application.
 */
module.exports = router;
