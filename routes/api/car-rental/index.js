/* eslint-disable @typescript-eslint/no-explicit-any */
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const router = express.Router();

// --- Storage: save uploads to /uploads/car-rental ---
const uploadDir = path.join(__dirname, "../../../../uploads/car-rental");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed."));
    }
  },
});

// Car inventory (shared — in production move to DB / shared module)
const CAR_INVENTORY = [
  { id: "1", name: "Toyota Agya", type: "City Car", rows: 2, pricePerDay: 350000, transmission: "Manual / Matic", features: ["Driver included", "Fuel included", "Free pickup & dropoff"], available: true },
  { id: "2", name: "Honda Brio", type: "City Car", rows: 2, pricePerDay: 380000, transmission: "Manual / Matic", features: ["Driver included", "Fuel included", "Free pickup & dropoff"], available: true },
  { id: "3", name: "Toyota Camry", type: "Sedan", rows: 2, pricePerDay: 750000, transmission: "Matic", features: ["Driver included", "Fuel included", "Free pickup & dropoff", "Top condition"], available: true },
  { id: "4", name: "Honda Accord", type: "Sedan", rows: 2, pricePerDay: 700000, transmission: "Matic", features: ["Driver included", "Fuel included", "Free pickup & dropoff", "Top condition"], available: true },
  { id: "5", name: "Toyota Fortuner", type: "SUV", rows: 2, pricePerDay: 900000, transmission: "Manual / Matic", features: ["Driver included", "Fuel included", "Free pickup & dropoff", "Top condition"], available: true },
  { id: "6", name: "Honda CR-V", type: "SUV", rows: 2, pricePerDay: 850000, transmission: "Matic", features: ["Driver included", "Fuel included", "Free pickup & dropoff"], available: true },
  { id: "7", name: "Toyota Innova Zenix", type: "MPV", rows: 3, pricePerDay: 950000, transmission: "Manual / Matic", features: ["Driver included", "Fuel included", "Free pickup & dropoff", "Top condition", "Complimentary entrance tickets"], available: true },
  { id: "8", name: "Mitsubishi Xpander", type: "MPV", rows: 3, pricePerDay: 800000, transmission: "Manual / Matic", features: ["Driver included", "Fuel included", "Free pickup & dropoff"], available: true },
  { id: "9", name: "Daihatsu Luxio", type: "MPV", rows: 3, pricePerDay: 700000, transmission: "Manual", features: ["Driver included", "Fuel included", "Free pickup & dropoff"], available: true },
  { id: "10", name: "Toyota HiAce", type: "Minibus", rows: 3, pricePerDay: 1200000, transmission: "Manual", features: ["Driver included", "Fuel included", "Free pickup & dropoff", "Up to 15 passengers"], available: true },
  { id: "11", name: "Isuzu Elf", type: "Minibus", rows: 3, pricePerDay: 1100000, transmission: "Manual", features: ["Driver included", "Fuel included", "Free pickup & dropoff", "Up to 12 passengers"], available: true },
  { id: "12", name: "Toyota Hilux", type: "Pick-up", rows: 2, pricePerDay: 850000, transmission: "Manual / Matic", features: ["Driver included", "Fuel included", "Free pickup & dropoff"], available: true },
  { id: "13", name: "Mitsubishi Triton", type: "Double Cabin", rows: 2, pricePerDay: 950000, transmission: "Manual / Matic", features: ["Driver included", "Fuel included", "Free pickup & dropoff"], available: true },
  { id: "14", name: "Toyota Quantum Van", type: "Van", rows: 3, pricePerDay: 1000000, transmission: "Manual", features: ["Driver included", "Fuel included", "Free pickup & dropoff", "Large cargo space"], available: true },
];

/**
 * GET /api/car-rental/search
 */
router.get("/search", (req, res) => {
  const { type, rows } = req.query;
  let results = CAR_INVENTORY.filter((car) => car.available);
  if (type && type !== "all") results = results.filter((c) => c.type.toLowerCase() === type.toLowerCase());
  if (rows) {
    const r = parseInt(rows);
    if (!isNaN(r)) results = results.filter((c) => c.rows === r);
  }
  return res.json({ status: 200, data: results, total: results.length });
});

/**
 * GET /api/car-rental/types
 */
router.get("/types", (req, res) => {
  const types = [...new Set(CAR_INVENTORY.map((c) => c.type))];
  return res.json({ status: 200, data: types });
});

/**
 * POST /api/car-rental/rent
 * Body (multipart): carId, carName, date, fullName, phone, email, ktpImage (file), ktpSelfie (file)
 */
router.post(
  "/rent",
  upload.fields([
    { name: "ktpImage", maxCount: 1 },
    { name: "ktpSelfie", maxCount: 1 },
  ]),
  (req, res, next) => {
    try {
      const { carId, carName, date, fullName, phone, email } = req.body;
      const files = req.files;

      if (!carId || !fullName || !phone || !email) {
        return res.status(400).json({ status: 400, message: "Missing required fields." });
      }
      if (!files?.ktpImage || !files?.ktpSelfie) {
        return res.status(400).json({ status: 400, message: "Both KTP photo and selfie are required." });
      }

      // In production: save to DB, trigger notification, etc.
      const rentalRequest = {
        id: `RENT-${Date.now()}`,
        carId,
        carName,
        date,
        fullName,
        phone,
        email,
        ktpImage: files.ktpImage[0].filename,
        ktpSelfie: files.ktpSelfie[0].filename,
        status: "PENDING_REVIEW",
        createdAt: new Date().toISOString(),
      };

      return res.status(201).json({
        status: 201,
        message: "Rental request received. Our team will contact you shortly.",
        data: rentalRequest,
      });
    } catch (err) {
      next(err);
    }
  },
);

module.exports = router;
