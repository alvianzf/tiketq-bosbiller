const express = require("express");
const router = express.Router();
const { makeRequest } = require("../utils");

router.get("/vouchers", async (req, res, next) => {
  const { searchString, pageIndex = 0, pageSize = 0 } = req.query;
  try {
    const response = await makeRequest("get", "/agent/Order/AgentVoucherTypes", {
      "filter.searchString": searchString || null,
      "pagination.pageIndex": pageIndex,
      "pagination.pageSize": pageSize,
    }, req.token);
    res.json({
      message: response.data?.message || response.data?.msg || "Vouchers fetched successfully",
      data: response.data?.data || response.data
    });
  } catch (error) { next(error); }
});

router.get("/vouchers/:id", async (req, res, next) => {
  const { id } = req.params;
  try {
    const response = await makeRequest("get", `/agent/Order/VoucherTypes/${id}`, {}, req.token);
    res.json({
      message: response.data?.message || response.data?.msg || "Voucher details fetched successfully",
      data: response.data?.data || response.data
    });
  } catch (error) { next(error); }
});

router.get("/:id/print", async (req, res, next) => {
  const { id } = req.params;
  try {
    const response = await makeRequest("get", `/Agent/Order/Orders/${id}/PrintOut`, {}, req.token);
    res.json({
      message: response.data?.message || response.data?.msg || "Print out generated successfully",
      data: response.data?.data || response.data
    });
  } catch (error) { next(error); }
});

router.post("/:id/whatsapp", async (req, res, next) => {
  const { id } = req.params;
  try {
    const response = await makeRequest("post", `/Agent/Order/Orders/${id}/SendToMessenger`, req.body, req.token);
    res.json({
      message: response.data?.message || response.data?.msg || "Voucher sent to WhatsApp",
      data: response.data?.data || response.data
    });
  } catch (error) { next(error); }
});

router.post("/:id/email", async (req, res, next) => {
  const { id } = req.params;
  try {
    const response = await makeRequest("post", `/Agent/Order/Orders/${id}/SendToEmail`, req.body, req.token);
    res.json({
      message: response.data?.message || response.data?.msg || "Voucher sent to Email",
      data: response.data?.data || response.data
    });
  } catch (error) { next(error); }
});

module.exports = router;
