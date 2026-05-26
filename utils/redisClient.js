const { createClient } = require("redis");

const createRedisClient = async () => {
  const url = process.env.REDIS_URL || "redis://localhost:6379";
  const client = createClient({
    url,
    socket: {
      reconnectStrategy: () => {
        // Disable automatic reconnect retries to prevent background thread console flooding and CPU waste
        return false;
      }
    }
  });

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

let redisClient = undefined;

/**
 * Returns a singleton instance of the Redis client.
 * Lazy-loads on first call and attempts re-connection if disconnected.
 */
const getRedisClient = async () => {
  if (redisClient === undefined) {
    redisClient = await createRedisClient();
    if (!redisClient) {
      redisClient = { isDummy: true, isOpen: false };
    }
  }

  if (redisClient.isDummy) {
    return null;
  }

  // If we have a client reference but it's not connected, try to reconnect
  if (!redisClient.isOpen) {
    try {
      console.log("Redis client disconnected. Attempting to reconnect...");
      await redisClient.connect();
      return redisClient;
    } catch (err) {
      // Reconnection failed, return null
      return null;
    }
  }

  return redisClient;
};

module.exports = getRedisClient;
