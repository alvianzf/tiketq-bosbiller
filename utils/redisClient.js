const { createClient } = require('redis');

const createRedisClient = async () => {
  const client = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  });

  client.on('error', (err) => {
    console.error('Redis client error:', err);
  });

  try {
    await client.connect();
    console.log('Redis client connected successfully');
  } catch (err) {
    console.error('Redis client connection error:', err);
    throw err;
  }

  return client;
};

let redisClient; 

const getRedisClient = async () => {
  if (!redisClient) {
    redisClient = await createRedisClient();
  }
  // Ensure the client is connected before returning
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
  return redisClient;
};

module.exports = getRedisClient;
