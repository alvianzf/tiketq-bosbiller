const express = require("express");
const router = express.Router();

router.use("/airports", require("./airports"));
router.use("/airlines", require("./airlines"));
router.use("/search", require("./search"));
router.use("/book", require("./book"));
router.use("/book-info", require("./bookinfo"));
router.use("/search-airport", require("./search-airport"));
router.use("/bookings", require("./flight-bookings"));
router.use("/booking-data", require("./booking-data"));
router.use("/payment", require("./payment"));

module.exports = router;
