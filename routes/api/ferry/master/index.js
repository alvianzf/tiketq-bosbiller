const express = require("express");
const router = express.Router();
const { makeRequest } = require("../utils");
const ferryCache = require("../../../../utils/ferryCache");

router.get("/sectors", async (req, res, next) => {
  try {
    const cacheKey = "ferry:sectors";
    let cached = ferryCache.get(cacheKey);
    if (cached) return res.json(cached);

    const response = await makeRequest("get", "/Agent/Booking/Sectors/Available", {}, req.token);
    const result = {
      message: response.data?.message || response.data?.msg || "Sectors fetched successfully",
      data: response.data?.data || response.data
    };
    ferryCache.set(cacheKey, result, 3600); // cache for 1 hour
    res.json(result);
  } catch (error) { next(error); }
});

router.get("/routes", async (req, res, next) => {
  const { searchString, sectorID, pageIndex = 0, pageSize = 0 } = req.query;
  try {
    const cacheKey = `ferry:routes:${searchString || ""}:${sectorID || ""}:${pageIndex}:${pageSize}`;
    let cached = ferryCache.get(cacheKey);
    if (cached) return res.json(cached);

    const queryParams = {
      filter: JSON.stringify({
        searchString: searchString || null,
        sectorID: sectorID || null,
      }),
      pagination: JSON.stringify({
        pageIndex: parseInt(pageIndex) || 0,
        pageSize: parseInt(pageSize) || 0,
      })
    };

    const response = await makeRequest("get", "/Agent/Master/Routes", queryParams, req.token);
    const result = {
      message: response.data?.message || response.data?.msg || "Routes fetched successfully",
      data: response.data?.data || response.data
    };
    ferryCache.set(cacheKey, result, 86400); // cache for 24 hours (86400 seconds)
    res.json(result);
  } catch (error) { next(error); }
});

router.get("/countries", async (req, res, next) => {
  const { searchString, sort, pageIndex = 0, pageSize = 0 } = req.query;
  try {
    const cacheKey = `ferry:countries:${searchString || ""}:${sort || ""}:${pageIndex}:${pageSize}`;
    let cached = ferryCache.get(cacheKey);
    if (cached) return res.json(cached);

    const queryParams = {
      filter: JSON.stringify({
        searchString: searchString || null,
        sort: parseInt(sort) || 0,
      }),
      pagination: JSON.stringify({
        pageIndex: parseInt(pageIndex) || 0,
        pageSize: parseInt(pageSize) || 0,
      })
    };

    const response = await makeRequest("get", "/Agent/Master/Countries", queryParams, req.token);
    const result = {
      message: response.data?.message || response.data?.msg || "Countries fetched successfully",
      data: response.data?.data || response.data
    };
    ferryCache.set(cacheKey, result, 86400); // countries rarely change, cache for 24 hours
    res.json(result);
  } catch (error) { next(error); }
});

module.exports = router;
