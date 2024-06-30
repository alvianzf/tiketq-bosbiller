const express = require('express');
const router = express.Router();
const UserDAO = require('../../../db/dao/UserDAO');
const authMiddleware = require('../../../middleware/authMiddleware');

router.post('/admin-register', authMiddleware, async (req, res) => {
  const { username, password, isAdmin = true } = req.body;
  try {
    await UserDAO.register(username, password, isAdmin);
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/admin-login', async (req, res) => {
    const { username, password } = req.body;
    try {
      const user = await UserDAO.findByUsername(username);
  
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      const isMatch = await user.comparePassword(password);
  
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
  
      if (user.isAdmin) {
        const token = user.generateJWT();
        return res.json({ token });
      } else {
        return res.status(403).json({ error: 'Unauthorized' });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Login failed' });
    }
  });

router.post('/register', async (req, res) => {
    const { username, password, isAdmin = false } = req.body;
    try {
      await UserDAO.register(username, password, isAdmin);
      res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Registration failed' });
    }
  });

router.post('/', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await UserDAO.findByUsername(username);
    console.log(user);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = user.generateJWT();

    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

module.exports = router;
