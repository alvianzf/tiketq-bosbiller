const NodeCache = require("node-cache");

// Standard TTL of 5 minutes for trips search, 24 hours for master routes/countries
const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

module.exports = {
  get: (key) => cache.get(key),
  set: (key, val, ttl) => cache.set(key, val, ttl),
  del: (key) => cache.del(key),
  flush: () => cache.flushAll(),
};
