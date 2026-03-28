const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const router = express.Router();
const CarDAO = require("../../../db/dao/CarDAO");

// ── File Upload Setup ─────────────────────────────────────────────────────────
const makeUploadDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
};

const carPhotoStorage = multer.diskStorage({
  destination: (_req, _file, cb) =>
    cb(null, makeUploadDir(path.join(__dirname, "../../../uploads/cars"))),
  filename: (_req, file, cb) =>
    cb(
      null,
      `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`,
    ),
});

const ktpStorage = multer.diskStorage({
  destination: (_req, _file, cb) =>
    cb(
      null,
      makeUploadDir(path.join(__dirname, "../../../uploads/car-rental")),
    ),
  filename: (_req, file, cb) =>
    cb(
      null,
      `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`,
    ),
});

const imageOnly = (_req, file, cb) =>
  file.mimetype.startsWith("image/")
    ? cb(null, true)
    : cb(new Error("Only image files are allowed."));

const uploadCarPhotos = multer({
  storage: carPhotoStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageOnly,
});
const uploadKtp = multer({
  storage: ktpStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageOnly,
});

// ── Helper ────────────────────────────────────────────────────────────────────
const getBaseUrl = (req) => {
  if (process.env.API_BASE_URL) return process.env.API_BASE_URL;
  const protocol = req.headers["x-forwarded-proto"] || req.protocol;
  const host = req.get("host");
  // If we're not on localhost, we should prefer https to avoid mixed content
  if (!host.includes("localhost") && !host.includes("127.0.0.1")) {
    return `https://${host}`;
  }
  return `${protocol}://${host}`;
};
const carPhotoUrl = (req, filename) => `${getBaseUrl(req)}/uploads/cars/${filename}`;
const ktpUrl = (req, filename) => `${getBaseUrl(req)}/uploads/car-rental/${filename}`;

// ── Car CRUD ──────────────────────────────────────────────────────────────────

// GET /api/car-rental/cars  — list all (supports ?type=SUV&rows=2&available=true)
router.get("/cars", async (req, res, next) => {
  try {
    const cars = await CarDAO.getAllCars(req.query);
    res.json({ message: "Cars fetched successfully", data: cars });
  } catch (err) {
    next(err);
  }
});

// GET /api/car-rental/cars/:id
router.get("/cars/:id", async (req, res, next) => {
  try {
    const car = await CarDAO.getCarById(req.params.id);
    if (!car) return res.status(404).json({ message: "Car not found." });
    res.json({ message: "Car fetched successfully", data: car });
  } catch (err) {
    next(err);
  }
});

// POST /api/car-rental/cars  — create car (JSON body)
router.post("/cars", async (req, res, next) => {
  try {
    const {
      name,
      type,
      rows,
      pricePerDay,
      transmission,
      description,
      features,
    } = req.body;
    if (!name || !type || !rows || !pricePerDay) {
      return res
        .status(400)
        .json({ message: "name, type, rows, and pricePerDay are required." });
    }
    const car = await CarDAO.createCar({
      name,
      type,
      rows,
      pricePerDay,
      transmission,
      description,
      features,
    });
    res.status(201).json({ message: "Car created successfully", data: car });
  } catch (err) {
    next(err);
  }
});

// PUT /api/car-rental/cars/:id  — partial update
router.put("/cars/:id", async (req, res, next) => {
  try {
    const car = await CarDAO.updateCar(req.params.id, req.body);
    res.json({ message: "Car updated successfully", data: car });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/car-rental/cars/:id
router.delete("/cars/:id", async (req, res, next) => {
  try {
    const carId = req.params.id;
    // Get all photos associated before deletion
    const photos = await CarDAO.getPhotos(carId);

    // Perform database deletion (cascades automatically for records)
    await CarDAO.deleteCar(carId);

    // Physically delete files from the disk
    for (const photo of photos) {
      const filepath = path.join(
        __dirname,
        "../../../../uploads/cars",
        photo.filename,
      );
      if (fs.existsSync(filepath)) {
        try {
          fs.unlinkSync(filepath);
        } catch (err) {
          console.error(`Failed to delete file: ${filepath}`, err);
        }
      }
    }

    res.json({ message: "Car and associated photos deleted successfully" });
  } catch (err) {
    next(err);
  }
});

// ── Car Photos ────────────────────────────────────────────────────────────────

// GET /api/car-rental/cars/:id/photos
router.get("/cars/:id/photos", async (req, res, next) => {
  try {
    const photos = await CarDAO.getPhotos(req.params.id);
    res.json({ status: 200, data: photos });
  } catch (err) {
    next(err);
  }
});

// POST /api/car-rental/cars/:id/photos  — upload 1–10 photos
router.post(
  "/cars/:id/photos",
  uploadCarPhotos.array("photos", 10),
  async (req, res, next) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res
          .status(400)
          .json({ status: 400, message: "No photos uploaded." });
      }

      // Check if car already has photos
      const existingPhotos = await CarDAO.getPhotos(req.params.id);
      const hasPrimary = existingPhotos.some((p) => p.isPrimary);

    const saved = await Promise.all(
      req.files.map((file, index) =>
        CarDAO.addPhoto(req.params.id, {
          filename: file.filename,
          url: carPhotoUrl(req, file.filename),
          // Set as primary if specifically requested OR if no primary exists yet (first photo of the batch)
          isPrimary:
            (req.body.isPrimary === "true" && index === 0) ||
            (!hasPrimary && index === 0),
        }),
      ),
    );
      res.status(201).json({ status: 201, data: saved });
    } catch (err) {
      next(err);
    }
  },
);

// DELETE /api/car-rental/photos/:photoId
router.delete("/photos/:photoId", async (req, res, next) => {
  try {
    console.log(`[DELETE] Single photo request: ${req.params.photoId}`);
    const photo = await CarDAO.deletePhoto(req.params.photoId);
    console.log(`[DELETE] Database record removed:`, photo);
    // Remove file from disk
    const filepath = path.join(
      __dirname,
      "../../../uploads/cars",
      photo.filename,
    );
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
      console.log(`[DELETE] Physical file removed: ${filepath}`);
    }
    res.json({ status: 200, message: "Photo deleted." });
  } catch (err) {
    console.error(`[DELETE] Error deleting photo:`, err.message);
    next(err);
  }
});

// POST /api/car-rental/photos/bulk-delete
router.post("/photos/bulk-delete", async (req, res, next) => {
  try {
    const { ids } = req.body;
    console.log(`[POST_BULK_DELETE] IDs received:`, ids);
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ status: 400, message: "No valid photo IDs provided." });
    }

    // Ensure all IDs are valid numbers
    const validIds = ids.map(id => parseInt(id)).filter(id => !isNaN(id));
    if (validIds.length === 0) {
      return res.status(400).json({ status: 400, message: "No valid numeric photo IDs provided." });
    }

    const photos = await CarDAO.getPhotosByIds(validIds);
    console.log(`[POST_BULK_DELETE] Found ${photos.length} photos in DB to delete:`, photos.map(p => p.id));
    
    const deleteResult = await CarDAO.deletePhotosByIds(validIds);
    console.log(`[POST_BULK_DELETE] Prisma delete count:`, deleteResult.count);

    // Physically delete files from the disk
    for (const photo of photos) {
      const filepath = path.join(__dirname, "../../../uploads/cars", photo.filename);
      if (fs.existsSync(filepath)) {
        try {
          fs.unlinkSync(filepath);
          console.log(`[POST_BULK_DELETE] Physical file removed: ${filepath}`);
        } catch (err) {
          console.error(`[POST_BULK_DELETE] Failed to delete file ${filepath}:`, err.message);
        }
      }
    }

    res.json({ status: 200, message: `${photos.length} photos deleted successfully.` });
  } catch (err) {
    console.error(`[POST_BULK_DELETE] Error:`, err.message);
    next(err);
  }
});

// ── Search / Types (public-facing) ────────────────────────────────────────────

// GET /api/car-rental/search
router.get("/search", async (req, res, next) => {
  try {
    const cars = await CarDAO.getAllCars({ ...req.query, available: true });
    res.json({ status: 200, data: cars, total: cars.length });
  } catch (err) {
    next(err);
  }
});

// GET /api/car-rental/types
router.get("/types", async (req, res, next) => {
  try {
    const cars = await CarDAO.getAllCars();
    const types = [...new Set(cars.map((c) => c.type))];
    res.json({ message: "Car types fetched successfully", data: types });
  } catch (err) {
    next(err);
  }
});

// ── Rental Requests ────────────────────────────────────────────────────────────

// POST /api/car-rental/rent
router.post(
  "/rent",
  uploadKtp.fields([
    { name: "ktpImage", maxCount: 1 },
    { name: "ktpSelfie", maxCount: 1 },
  ]),
  async (req, res, next) => {
    try {
      const { carId, date, fullName, phone, email } = req.body;
      const files = req.files;
      if (!carId || !fullName || !phone || !email) {
        return res
          .status(400)
          .json({ status: 400, message: "Missing required fields." });
      }
      if (!files?.ktpImage || !files?.ktpSelfie) {
        return res
          .status(400)
          .json({
            status: 400,
            message: "Both KTP photo and selfie are required.",
          });
      }
      const rental = await CarDAO.createRentalRequest({
        carId,
        date,
        fullName,
        phone,
        email,
        ktpImage: ktpUrl(req, files.ktpImage[0].filename),
        ktpSelfie: ktpUrl(req, files.ktpSelfie[0].filename),
      });
      res.status(201).json({
        status: 201,
        message: "Rental request received. Our team will contact you shortly.",
        data: rental,
      });
    } catch (err) {
      next(err);
    }
  },
);

// GET /api/car-rental/rent  — admin: list all requests
router.get("/rent", async (req, res, next) => {
  try {
    const requests = await CarDAO.getAllRentalRequests();
    res.json({ status: 200, data: requests });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/car-rental/rent/:id/status
router.patch("/rent/:id/status", async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!status)
      return res
        .status(400)
        .json({ status: 400, message: "status is required." });
    const updated = await CarDAO.updateRentalStatus(req.params.id, status);
    res.json({ status: 200, data: updated });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
