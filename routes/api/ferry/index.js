const express = require("express");
const router = express.Router();

router.use("/agent", require("./agent"));
router.use("/booking", require("./booking"));
router.use("/master", require("./master"));
router.use("/order", require("./order"));
router.use("/credit", require("./credit"));
router.use("/trips", require("./trips"));

module.exports = router;
