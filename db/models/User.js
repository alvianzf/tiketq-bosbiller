// db/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isAdmin: { type: Boolean, default: false}
}, {timestamps: true});

UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  try {
    console.log(this.user)
    console.log(this.password)
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    console.error('Error hashing password:', err);
    next(err);
  }
});

UserSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    console.log({candidatePassword})
    console.log({password: this.password})
    return await bcrypt.compare(candidatePassword, this.password, (err, isMatch) => {
      if (err) throw err;
      console.log('Password Match:', isMatch);
    });
  } catch (err) {
    console.log(err)
    throw new Error(err);
  }
};

UserSchema.methods.generateJWT = function() {
  const payload = {
    id: this._id,
    username: this.username
  };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
};

module.exports = mongoose.model('User', UserSchema);
