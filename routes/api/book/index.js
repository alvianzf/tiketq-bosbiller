const express = require('express');
const apiService = require('../../../services/apiService');
const router = express.Router();

router.post('/', async (req, res, next) => {
  const requestData = req.body;
  requestData.f = "book";

  try {
    const result = await apiService.postData(requestData);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
