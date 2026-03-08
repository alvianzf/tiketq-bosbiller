const express = require("express");
const router = express.Router();
const UserDAO = require("../../../db/dao/UserDAO");
const authMiddleware = require("../../../middleware/authMiddleware");
const validate = require("../../../middleware/validate");
const { body } = require("express-validator");

const authValidation = [
  body("username").notEmpty().withMessage("Username is required"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  validate,
];

/**
 * Registers a new user.
 */
async function registerUser(req, res, isAdmin = false) {
  const { username, password } = req.body;
  try {
    const existing = await UserDAO.findByUsername(username);
    if (existing) {
      return res.status(400).json({ error: "Username already exists" });
    }
    await UserDAO.register(username, password, isAdmin);
    res.status(201).json({
      message: "User registered successfully. Please login to continue.",
    });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Registration failed. Please try again later." });
  }
}

/**
 * Logs in a user.
 */
async function loginUser(req, res, isAdminRequired = false) {
  const { username, password } = req.body;
  try {
    const user = await UserDAO.findByUsernameWithPassword(username);
    if (!user) {
      return res
        .status(404)
        .json({ error: "User not found. Please check your credentials." });
    }
    const isMatch = await UserDAO.comparePassword(password, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ error: "Invalid credentials. Please try again." });
    }
    if (isAdminRequired && !user.isAdmin) {
      return res.status(403).json({
        error: "Unauthorized access. You do not have admin privileges.",
      });
    }
    const token = UserDAO.generateJWT(user);
    res.json({
      token,
      message: "Login successful. You are now authenticated.",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Login failed. Please try again later." });
  }
}

router.post("/register", authValidation, (req, res) => registerUser(req, res));
router.post(
  "/admin-register",
  [authMiddleware, ...authValidation],
  (req, res) => registerUser(req, res, true),
);
router.post("/admin-login", authValidation, (req, res) =>
  loginUser(req, res, true),
);
router.post("/", authValidation, (req, res) => loginUser(req, res));

/**
 * Returns the current user's profile based on the JWT.
 */
router.get("/me", authMiddleware, (req, res) => {
  res.json({
    user: req.user,
    message: "User profile retrieved successfully.",
  });
});

module.exports = router;
