// db/models/User.js
/**
 * Importing required modules and utilities.
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

/**
 * Defining the schema for User model.
 * 
 * @type {mongoose.Schema} - The schema definition for User.
 */
const UserSchema = new mongoose.Schema({
  /**
   * Username of the user.
   * @type {String}
   * @required
   * @unique
   */
  username: { type: String, required: true, unique: true },
  /**
   * Password of the user.
   * @type {String}
   * @required
   */
  password: { type: String, required: true },
  /**
   * Indicates if the user is an administrator.
   * @type {Boolean}
   * @default {false}
   */
  isAdmin: { type: Boolean, default: false}
}, {timestamps: true});

/**
 * Middleware to hash the password before saving the user document.
 * 
 * @param {Function} next - The next middleware function in the application’s request-response cycle.
 */
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    console.error('Error hashing password:', err);
    next(err);
  }
});

/**
 * Method to compare a candidate password with the user's password.
 * 
 * @param {String} candidatePassword - The password to compare with the user's password.
 * @returns {Promise<Boolean>} - A promise that resolves to a boolean indicating if the passwords match.
 */
UserSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (err) {
    console.log(err)
    throw new Error(err);
  }
};

/**
 * Method to generate a JSON Web Token for the user.
 * 
 * @returns {String} - The generated JWT token.
 */
UserSchema.methods.generateJWT = function() {
  const payload = {
    id: this._id,
    username: this.username
  };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
};

/**
 * Exporting the User model.
 */
module.exports = mongoose.model('User', UserSchema);
