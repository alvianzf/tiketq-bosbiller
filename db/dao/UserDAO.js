const User = require('../models/User');

class UserDAO {
  async register(username, password, isAdmin = false) {
    const newUser = new User({ username, password, isAdmin });
    return await newUser.save();
  }

  // Method to find a user by username
  async findByUsername(username) {
    return await User.findOne({ username });
  }
}

module.exports = new UserDAO();
