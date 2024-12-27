const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });

async function ensureToken(req, res, next) {
  const token = cache.get('ferryToken');
  
  if(!token) {
    try {
      const response = await axios.post(OAUT2_TOKEN_PATH, {
        name: FERRY_USERNAME,
        password: FERRY_PASSWORD
      });

      cache.set('ferryToken', response.data, 3600);
      next();
    } catch (error) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
  }

  req.token = token;
  next();
}


module.exports = ensureToken;