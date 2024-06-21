const express = require('express');
const router = express.Router();

// Define routes here
router.get('/', (req, res, next) => {
  res.render('index', { title: 'Express' });

  next();
});

router.use('/api', require('./api'));

module.exports = router;
