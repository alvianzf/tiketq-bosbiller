const redis = require('redis');
const { promisify } = require('util');

const client = redis.createClient();

const getAsync = promisify(client.get).bind(client);
const setAsync = promisify(client.set).bind(client);

module.exports = {
  getAsync,
  setAsync
};
