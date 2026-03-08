const express = require('express');
const router = express.Router();
const UserDAO = require('../../../db/dao/UserDAO');
const authMiddleware = require('../../../middleware/authMiddleware');

/**
 * Registers a new user in the system.
 * 
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @param {boolean} isAdmin - Flag to indicate if the user is an admin
 */
async function registerUser(req, res, isAdmin = false) {
  const { username, password } = req.body;
  try {
    await UserDAO.register(username, password, isAdmin);
    res.status(201).json({ message: 'User registered successfully. Please login to continue.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed. Please try again later.' });
  }
}

/**
 * Logs in a user and returns a JWT token for authentication.
 * 
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @param {boolean} isAdminRequired - Flag to indicate if admin access is required
 */
async function loginUser(req, res, isAdminRequired = false) {
  const { username, password } = req.body;
  try {
    const user = await UserDAO.findByUsername(username);
    if (!user) {
      return res.status(404).json({ error: 'User not found. Please check your credentials.' });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials. Please try again.' });
    }
    if (isAdminRequired && !user.isAdmin) {
      return res.status(403).json({ error: 'Unauthorized access. You do not have admin privileges.' });
    }
    const token = user.generateJWT();
    res.json({ token, message: 'Login successful. You are now authenticated.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed. Please try again later.' });
  }
}

router.post('/admin-register', authMiddleware, (req, res) => {
  registerUser(req, res, true);
});

router.post('/admin-login', (req, res) => {
  loginUser(req, res, true);
});

router.post('/register', (req, res) => {
  registerUser(req, res);
});

router.post('/', (req, res) => {
  loginUser(req, res);
});

module.exports = router;
