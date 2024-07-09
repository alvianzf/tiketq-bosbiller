const express = require('express');
const router = express.Router();

// Define routes here
router.get('/', (req, res, next) => {
  next();

  return res.status(401).send({status: 401, msg: "restricted"})

});

router.use('/api', require('./api'));

module.exports = router;
