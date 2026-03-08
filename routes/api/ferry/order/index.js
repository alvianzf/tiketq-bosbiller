const express = require("express");
const router = express.Router();
const ensureToken = require("../../../middleware/ensure-token");
const { makeRequest } = require("../utils");

router.get("/vouchers", ensureToken, async (req, res, next) => {
  const { searchString, pageIndex = 0, pageSize = 0 } = req.query;
  try {
    const response = await makeRequest(
      "get",
      "/agent/Order/AgentVoucherTypes",
      {
        "filter.searchString": searchString || null,
        "pagination.pageIndex": pageIndex,
        "pagination.pageSize": pageSize,
      },
      req.token,
    );
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

router.get("/vouchers/:id", ensureToken, async (req, res, next) => {
  const { id } = req.params;
  try {
    const response = await makeRequest(
      "get",
      `/agent/Order/VoucherTypes/${id}`,
      {},
      req.token,
    );
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

router.get("/:id/print", ensureToken, async (req, res, next) => {
  const { id } = req.params;
  try {
    const response = await makeRequest(
      "get",
      `/Agent/Order/Orders/${id}/PrintOut`,
      {},
      req.token,
    );
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

router.post("/:id/whatsapp", ensureToken, async (req, res, next) => {
  const { id } = req.params;
  try {
    const response = await makeRequest(
      "post",
      `/Agent/Order/Orders/${id}/SendToMessenger`,
      req.body,
      req.token,
    );
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

router.post("/:id/email", ensureToken, async (req, res, next) => {
  const { id } = req.params;
  try {
    const response = await makeRequest(
      "post",
      `/Agent/Order/Orders/${id}/SendToEmail`,
      req.body,
      req.token,
    );
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
