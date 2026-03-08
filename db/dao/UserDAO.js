const { prisma } = require("../index");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

class UserDAO {
  async register(username, password, isAdmin = false) {
    const hashedPassword = await bcrypt.hash(
      password,
      await bcrypt.genSalt(10),
    );
    return await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        isAdmin,
      },
    });
  }

  async findByUsername(username) {
    return await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        isAdmin: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findByUsernameWithPassword(username) {
    return await prisma.user.findUnique({
      where: { username },
    });
  }

  async findById(id) {
    return await prisma.user.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        username: true,
        isAdmin: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findAllUsers() {
    return await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        isAdmin: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async updateUser(id, payload) {
    const updateData = { ...payload };
    if (updateData.password) {
      updateData.password = await bcrypt.hash(
        updateData.password,
        await bcrypt.genSalt(10),
      );
    }
    return await prisma.user.update({
      where: { id: parseInt(id) },
      data: updateData,
      select: {
        id: true,
        username: true,
        isAdmin: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async deleteUser(id) {
    return await prisma.user.delete({
      where: { id: parseInt(id) },
    });
  }

  async comparePassword(plain, hashed) {
    return await bcrypt.compare(plain, hashed);
  }

  generateJWT(user) {
    return jwt.sign(
      { id: user.id, username: user.username, isAdmin: user.isAdmin },
      process.env.JWT_SECRET,
      { expiresIn: "24h" },
    );
  }
}

module.exports = new UserDAO();
