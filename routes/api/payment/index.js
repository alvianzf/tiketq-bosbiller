const express = require("express");
const router = express.Router();

router.use("/", require("./payment-handler"));
router.use("/midtrans", require("../midtrans"));

module.exports = router;
