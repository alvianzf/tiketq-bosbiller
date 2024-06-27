const { createClient } = require('redis');

const client = createClient();

client.on('error', (err) => {
  console.error('Redis client error', err);
});

(async () => {
  try {
    await client.connect();
  } catch (err) {
    console.error('Redis client connection error', err);
  }
})();

module.exports = client;
