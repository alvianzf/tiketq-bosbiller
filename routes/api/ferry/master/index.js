const express = require("express");
const router = express.Router();
const { makeRequest } = require("../utils");

router.get("/sectors", async (req, res, next) => {
  try {
    const response = await makeRequest("get", "/Agent/Booking/Sectors/Available", {}, req.token);
    res.json({
      message: response.data?.message || response.data?.msg || "Sectors fetched successfully",
      data: response.data?.data || response.data
    });
  } catch (error) { next(error); }
});

router.get("/routes", async (req, res, next) => {
  const { searchString, sectorID, pageIndex = 0, pageSize = 0 } = req.query;
  try {
    const response = await makeRequest("get", "/Agent/Master/Routes", {
      "filter.searchString": searchString || null,
      "filter.sectorID": sectorID || null,
      "pagination.pageIndex": pageIndex,
      "pagination.pageSize": pageSize,
    }, req.token);
    res.json({
      message: response.data?.message || response.data?.msg || "Routes fetched successfully",
      data: response.data?.data || response.data
    });
  } catch (error) { next(error); }
});

router.get("/countries", async (req, res, next) => {
  const { searchString, sort, pageIndex = 0, pageSize = 0 } = req.query;
  try {
    const response = await makeRequest("get", "/Agent/Master/Countries", {
      "filter.searchString": searchString || null,
      "filter.sort": sort || 0,
      "pagination.pageIndex": pageIndex,
      "pagination.pageSize": pageSize,
    }, req.token);
    res.json({
      message: response.data?.message || response.data?.msg || "Countries fetched successfully",
      data: response.data?.data || response.data
    });
  } catch (error) { next(error); }
});

module.exports = router;
