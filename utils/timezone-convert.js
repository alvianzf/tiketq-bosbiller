/**
 * Converts a given date to GMT+7 timezone.
 * 
 * @param {Date|string} date - The date to be converted. Can be a Date object or a string parseable by the Date constructor.
 * @returns {Date} - A new Date object representing the input date in GMT+7 timezone.
 */
function toGMT7(date) {
    if (!date) return date; // Return the original date if it's undefined or null
    const dateObject = new Date(date); // Create a Date object from the input date
    const localTimeOffset = dateObject.getTimezoneOffset(); // Get the local timezone offset in minutes
    const gmt7Offset = -7 * 60; // GMT+7 offset in minutes
    const adjustedTime = dateObject.getTime() + ((gmt7Offset - localTimeOffset) * 60 * 1000); // Calculate the adjusted time in milliseconds
    return new Date(adjustedTime); // Return a new Date object with the adjusted time
  }
  
  module.exports = toGMT7;