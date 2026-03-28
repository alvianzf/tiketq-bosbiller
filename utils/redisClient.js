const { createClient } = require("redis");

const createRedisClient = async () => {
  const url = process.env.REDIS_URL || "redis://localhost:6379";
  const client = createClient({ url });

  client.on("error", (err) => {
    // Log the error but don't crash; caching will just be bypassed
    console.error(`[Redis Error] at ${url}:`, err.message);
  });

  try {
    await client.connect();
    console.log(`Redis client connected successfully to ${url}`);
    return client;
  } catch (err) {
    console.warn(`Redis connection failed at ${url}. Caching is currently disabled.`);
    return null;
  }
};

let redisClient;

/**
 * Returns a singleton instance of the Redis client.
 * Lazy-loads on first call and attempts re-connection if disconnected.
 */
const getRedisClient = async () => {
  if (!redisClient) {
    redisClient = await createRedisClient();
    return redisClient;
  }

  // If we have a client reference but it's not connected, try to reconnect
  if (!redisClient.isOpen) {
    try {
      console.log("Redis client disconnected. Attempting to reconnect...");
      await redisClient.connect();
      return redisClient;
    } catch (err) {
      // Reconnection failed, stay null / disconnected
      return null;
    }
  }

  return redisClient;
};

module.exports = getRedisClient;
