const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const cors = require("cors");
const { notFoundHandler, errorHandler } = require("./middleware/error-handler");
const connectDB = require("./db");
const routes = require("./routes");
const protectedRoutes = require("./routes/protectedRoutes");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
const swaggerDocument = YAML.load("./swagger.yaml");
const getFerryToken = require("./utils/node-cache");

const app = express();

// Enable CORS - Moved to Top - DYNAMIC ORIGIN
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps)
      if (!origin) return callback(null, true);

      // Allow any subdomain of tiketq.com OR localhost
      const isTiketQ = /^https?:\/\/(?:[a-z0-9-]+\.)?tiketq\.com$/i.test(origin);
      const isLocal = /^https?:\/\/localhost(:\d+)?$/i.test(origin);

      if (isTiketQ || isLocal) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
    optionsSuccessStatus: 200,
  }),
);

// Middleware
app.use(logger("dev"));
app.use(express.json({ limit: "10mb" }));
app.use(
  express.urlencoded({ extended: true, limit: "10mb", parameterLimit: 10000 }),
);
app.use(cookieParser());

// Serve static files from 'public' and 'assets' directories
app.use(
  "/public",
  express.static(path.join(__dirname, "public"), { maxAge: 31557600000 }),
);
app.use(
  "/assets",
  express.static(path.join(__dirname, "assets"), { maxAge: 31557600000 }),
);
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"), { maxAge: 31557600000 }),
);

// Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Connect to Database
connectDB();

// Required for seed
const seedAdmin = require("./db/seeds/seedAdmin");
const UserDAO = require("./db/dao/UserDAO");
const getRedisClient = require("./utils/redisClient"); // Added Redis check

(async () => {
  await seedAdmin();

  // Automated Admin Login
  try {
    const admin = await UserDAO.findByUsername(
      process.env.DEFAULT_USER || "alvianzf",
    );
    if (admin) {
      const token = UserDAO.generateJWT(admin);
      console.log("--------------------------------------------------");
      console.log("Admin session initialized successfully");
      console.log("JWT Token:", token);
      console.log("--------------------------------------------------");
    }
  } catch (err) {
    console.error("Failed to initialize Admin session:", err.message);
  }

  // Initialize Redis
  try {
    await getRedisClient();
  } catch (err) {
    console.error("Failed to initialize Redis client:", err.message);
  }

  // Get Ferry Token
  try {
    await getFerryToken();
    console.log("Ferry client initialized successfully");
  } catch (err) {
    console.error("Failed to initialize Ferry Token:", err.message);
  }
})();

// Use routes
app.use("/", routes);
app.use("/", protectedRoutes);

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
