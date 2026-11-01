const crypto = require("crypto");

/**
 * Shared-secret auth for the external DANA proxy (routes/api/dana-proxy).
 * Whoever holds DANA_PROXY_SHARED_SECRET can create DANA charges under this
 * merchant account — this is a stopgap for one trusted external product, not
 * a general-purpose auth scheme.
 */
const danaProxyAuth = (req, res, next) => {
  const expected = process.env.DANA_PROXY_SHARED_SECRET;
  if (!expected) {
    console.error("DANA_PROXY_SHARED_SECRET is not set; refusing all proxy requests");
    return res.status(503).json({ message: "DANA proxy is not configured" });
  }

  const provided = req.header("X-Service-Key") || "";
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return res.status(401).json({ message: "Invalid or missing X-Service-Key" });
  }

  next();
};

module.exports = danaProxyAuth;
