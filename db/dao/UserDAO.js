const User = require('../models/User');
const bcrypt = require('bcryptjs');

class UserDAO {
  async register(username, password, isAdmin = false) {
    const hashedPassword = await bcrypt.hash(password, await bcrypt.genSalt(10));
    const newUser = new User({ username, password: hashedPassword, isAdmin });
    return await newUser.save();
  }

  async findByUsername(username) {
    return await User.findOne({ username }).select('-password');
  }

  async findAllUsers() {
    return await User.find().select('-password');
  }

  async updateUser(id, payload) {
    if (payload.password) {
      const hashedPassword = await bcrypt.hash(payload.password, await bcrypt.genSalt(10));
      payload.password = hashedPassword;
    }
    return await User.findByIdAndUpdate(id, payload, { new: true, select: '-password' });
  }

  async deleteUser(id) {
    return await User.findByIdAndDelete(id);
  }
}

module.exports = new UserDAO();