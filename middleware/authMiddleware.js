const jwt = require("jsonwebtoken");
require("dotenv").config();

/**
 * Authentication middleware to verify JWT tokens.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */
const authMiddleware = (req, res, next) => {
  const authHeader = req.header("Authorization");

  if (!authHeader) {
    return res.status(401).json({ error: "Authorization header missing" });
  }

  const token = authHeader.replace(/^Bearer\s+/, "");

  if (!token) {
    return res
      .status(401)
      .json({ error: "Token missing from Authorization header" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.error("Token verification failed:", err.message);
    const message =
      err.name === "TokenExpiredError" ? "Token has expired" : "Invalid token";
    res.status(401).json({ error: message });
  }
};

module.exports = authMiddleware;
