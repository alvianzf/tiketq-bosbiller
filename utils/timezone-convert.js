function toGMT7(date) {
    if (!date) return date;
    const dateObject = new Date(date);
    const localTimeOffset = dateObject.getTimezoneOffset(); // in minutes
    const gmt7Offset = -7 * 60; // GMT+7 in minutes
    const adjustedTime = dateObject.getTime() + ((gmt7Offset - localTimeOffset) * 60 * 1000);
    return new Date(adjustedTime);
  }
  
  module.exports = toGMT7;
  