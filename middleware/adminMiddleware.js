/**
 * Middleware to restrict access to admin users only.
 * Must be used after authMiddleware.
 */
const adminMiddleware = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({
      error: "Access denied. Admin privileges required.",
    });
  }
  next();
};

module.exports = adminMiddleware;
