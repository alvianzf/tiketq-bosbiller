const User = require('../models/User');
const bcrypt = require('bcryptjs');

class UserDAO {
  async register(username, password, isAdmin = false) {
    const newUser = new User({ username, password, isAdmin });
    return await newUser.save();
  }

  async findByUsername(username) {
    return await User.findOne({ username });
  }

  async findAllUsers() {
    return await User.find();
  }

  async updateUser(id, payload) {
    if (payload.password) {
      const salt = await bcrypt.genSalt(10);
      payload.password = await bcrypt.hash(payload.password, salt);
    }
    return await User.findByIdAndUpdate(id, payload, { new: true });
  }

  async deleteUser(id) {
    return await User.findByIdAndDelete(id);
  }
}

module.exports = new UserDAO();
