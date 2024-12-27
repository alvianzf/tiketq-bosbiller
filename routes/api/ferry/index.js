const Router = express.Router();
const axios = require("axios");
const ensureToken = require("../../middleware/ensure-token");
require("dotenv").config();

const FERRY_URL = process.env.FERRY_URL;

router.get("/ports", ensureToken, async (req, res, next) => {
  try {
    const response = await axios.get(`${FERRY_URL}/ports`, {
      headers: { Authorization: `Bearer ${req.token}` },
    });
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

router.get("/sectors", ensureToken, async (req, res, next) => {
  try {
    const response = await axios.get(`${FERRY_URL}/sectors`, {
      headers: { Authorization: `Bearer ${req.token}` },
    });
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

router.post("/trips/search", ensureToken, async (req, res, next) => {
  try {
    const { departDate, departPortOriginId, departPortDestinationId } =
      req.body;
    if (!departDate || !departPortOriginId || !departPortDestinationId) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    const response = await axios.post(
      `${FERRY_URL}/trips/search`,
      {
        departDate,
        departPortOriginId,
        departPortDestinationId,
      },
      {
        headers: { Authorization: `Bearer ${req.token}` },
      }
    );
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

router.post("/trips/book", ensureToken, async (req, res, next) => {
  const { departTripId, paxs } = req.body;
  if (!departTripId || !paxs) {
    return res.status(400).json({ message: "Missing required fields" });
  }
  try {
    const response = await axios.post(
      `${FERRY_URL}/trips/book`,
      {
        departTripId,
        paxs,
      },
      {
        headers: { Authorization: `Bearer ${req.token}` },
      }
    );
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

module.exports = Router;
