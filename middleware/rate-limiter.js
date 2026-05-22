const NodeCache = require("node-cache");

// Dedicated cache instance for rate limiting (1 minute default window)
const rateLimitCache = new NodeCache({ stdTTL: 60, checkperiod: 10 });

/**
 * Creates a highly performance-optimized rate limiting middleware using in-memory node-cache.
 * Excludes admin tokens or certain whitelist routes if required.
 * 
 * @param {Object} options - Configuration options.
 * @param {number} options.windowMs - Time frame for which requests are checked (in milliseconds). Defaults to 1 minute.
 * @param {number} options.max - Max number of requests during windowMs per IP. Defaults to 100.
 * @param {string} options.message - Error message sent when limit is exceeded.
 */
const rateLimiter = (options = {}) => {
  const windowMs = options.windowMs || 60000; // default 1 minute
  const max = options.max || 100; // default 100 requests per windowMs per IP
  const message = options.message || "Too many requests from this IP. To prevent scraping and bots, rate-limiting is active. Please try again in a minute.";

  return (req, res, next) => {
    // Determine client IP safely, accounting for proxies
    const ip = req.ip || req.headers["x-forwarded-for"] || req.connection.remoteAddress || "127.0.0.1";
    
    // Track requests per IP
    const cacheKey = `ratelimit:${ip}`;
    let requestCount = rateLimitCache.get(cacheKey) || 0;

    if (requestCount >= max) {
      return res.status(429).json({
        status: "error",
        code: "TOO_MANY_REQUESTS",
        message: message,
        limit: max,
        remaining: 0
      });
    }

    requestCount += 1;
    // Set cache TTL based on remaining time in window
    rateLimitCache.set(cacheKey, requestCount, Math.ceil(windowMs / 1000));

    // Standard rate limiting headers
    res.setHeader("X-RateLimit-Limit", max);
    res.setHeader("X-RateLimit-Remaining", Math.max(0, max - requestCount));

    next();
  };
};

module.exports = rateLimiter;
