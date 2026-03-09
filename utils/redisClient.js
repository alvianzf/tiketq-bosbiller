const { createClient } = require("redis");

const createRedisClient = async () => {
  const client = createClient({
    url: process.env.REDIS_URL || "redis://localhost:6379",
  });

  client.on("error", (err) => {
    // Silence errors to prevent console noise if Redis is intentionally down
  });

  try {
    await client.connect();
    console.log("Redis client connected successfully");
    return client;
  } catch (err) {
    console.warn("Redis connection failed. Caching is currently disabled.");
    return null;
  }
};

let redisClient;

const getRedisClient = async () => {
  if (!redisClient) {
    redisClient = await createRedisClient();
    return redisClient;
  }

  // If we have a client but it's not open, try to re-connect
  if (!redisClient.isOpen) {
    try {
      await redisClient.connect();
      return redisClient;
    } catch (err) {
      return null;
    }
  }

  return redisClient;
};

module.exports = getRedisClient;
