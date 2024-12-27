const Router = express.Router();
const axios = require("axios");
const ensureToken = require("../../middleware/ensure-token");
require("dotenv").config();

const FERRY_URL = process.env.FERRY_URL;

router.get("/ports", ensureToken, async (req, res, next) => {
  const { id, name, countryId, countryName } = req.body;
  try {
    const response = await axios.get(
      `${FERRY_URL}/ports`,
      {
        id,
        name,
        countryId,
        countryName,
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

router.get("/sectors", ensureToken, async (req, res, next) => {
  const { id, name, portOrigin, portDestination } = req.body;
  try {
    const response = await axios.get(
      `${FERRY_URL}/sectors`,
      {
        id,
        name,
        portOrigin,
        portDestination,
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

router.post("/trips/search", ensureToken, async (req, res, next) => {
  try {
    const {
      departDate,
      departPortOriginId,
      departPortDestinationId,
      isRoundTrip = false,
      isReturnOpen = false,
      returnDate = null,
      returnPortOriginId = null,
      adultQty = 1,
      childQty = 0,
      infantQty = 0,
    } = req.body;

    if (!departDate || !departPortOriginId || !departPortDestinationId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const response = await axios.post(
      `${FERRY_URL}/trips/search`,
      {
        departDate,
        departPortOriginId,
        departPortDestinationId,
        isRoundTrip,
        isReturnOpen,
        returnDate,
        returnPortOriginId,
        adultQty,
        childQty,
        infantQty,
      },
      {
        headers: { Authorization: `Bearer ${req.token}` },
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.post("/booking/reserve", ensureToken, async (req, res, next) => {
  const {
    departTripId,
    departPortOriginId,
    departPortDestinationId,
    isRoundTrip = false,
    isReturnOpen = false,
    returnTripId = null,
    returnPortOriginId = null,
    returnPortDestinationId = null,
    adultQty = 1,
    childQty = 0,
    infantQty = 0,
    paxs,
  } = req.body;
  if (!departTripId || !paxs) {
    return res.status(400).json({ message: "Missing required fields" });
  }
  try {
    const response = await axios.post(
      `${FERRY_URL}/trips/book`,
      {
        departTripId,
        departPortOriginId,
        departPortDestinationId,
        isRoundTrip,
        isReturnOpen,
        returnTripId,
        returnPortOriginId,
        returnPortDestinationId,
        adultQty,
        childQty,
        infantQty,
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

router.post("/booking/confirm", ensureToken, async (req, res, next) => {
  const { bookingId, paymentRef } = req.body;
  if (!bookingId || !paymentRef) {
    return res.status(400).json({ message: "Missing required fields" });
  }
  try {
    const response = await axios.post(
      `${FERRY_URL}/booking/confirm`,
      {
        bookingId,
        paymentRef,
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

router.post("/booking/cancel", ensureToken, async (req, res, next) => {
  const { bookingId } = req.body;
  if (!bookingId) {
    return res.status(400).json({ message: "Missing required fields" });
  }
  try {
    const response = await axios.post(
      `${FERRY_URL}/booking/cancel`,
      {
        bookingId,
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

router.get("/booking/:id", ensureToken, async (req, res, next) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ message: "Missing required fields" });
  }
  try {
    const response = await axios.get(`${FERRY_URL}/booking/${id}`, {
      headers: { Authorization: `Bearer ${req.token}` },
    });
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

module.exports = Router;
