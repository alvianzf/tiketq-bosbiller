const express = require("express");
const router = express.Router();

router.use("/airports", require("../airports"));
router.use("/airlines", require("../airlines"));
router.use("/search", require("../search"));
router.use("/book", require("../book"));
router.use("/book-info", require("../bookinfo"));
router.use("/search-airport", require("../search-airport"));

module.exports = router;
