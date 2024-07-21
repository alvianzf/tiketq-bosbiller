const airlines = ['LIO', 'GAR', 'CIT', 'SRI', 'TRI', 'TRA', 'PLA'];

const ASSET_BASE_URL = 'https://api.tiketq.com/assets/maskapai';

const updateLogoURLs = (data) => {
  if (Array.isArray(data)) {
    return data.map(item => updateLogoURLs(item));
  } else if (data !== null && typeof data === 'object') {
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        if (typeof data[key] === 'string' && data[key].includes('117.102.64.238:1212/assets/maskapai')) {
          data[key] = data[key].replace('http://117.102.64.238:1212/assets/maskapai', ASSET_BASE_URL);
        } else if (typeof data[key] === 'object') {
          data[key] = updateLogoURLs(data[key]);
        }
      }
    }
  }
  return data;
};

module.exports = updateLogoURLs;