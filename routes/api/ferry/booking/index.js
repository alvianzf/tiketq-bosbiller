const express = require("express");
const router = express.Router();
const FerryBookingDAO = require("../../../../db/dao/FerryBookingDAO");
const { makeRequest, validateFields } = require("../utils");
const ensureToken = require("../../../../middleware/ensure-token");
const ferryCache = require("../../../../utils/ferryCache");

// Helper: Fetch Sindo Ferry Route GUID List with 1h cache
const getRoutesList = async (token) => {
  const cacheKey = "ferry:all_routes";
  let cached = ferryCache.get(cacheKey);
  if (cached) return cached;

  const queryParams = {
    filter: JSON.stringify({ searchString: null, sectorID: null }),
    pagination: JSON.stringify({ pageIndex: 0, pageSize: 0 })
  };
  const response = await makeRequest("get", "/Agent/Master/Routes", queryParams, token);
  const list = response.data?.data || response.data || [];
  ferryCache.set(cacheKey, list, 86400); // 24 hours
  return list;
};

// Helper: Fetch Sindo Ferry Country GUID List with 24h cache
const getCountriesList = async (token) => {
  const cacheKey = "ferry:all_countries";
  let cached = ferryCache.get(cacheKey);
  if (cached) return cached;

  const queryParams = {
    filter: JSON.stringify({ searchString: null, sort: 0 }),
    pagination: JSON.stringify({ pageIndex: 0, pageSize: 0 })
  };
  const response = await makeRequest("get", "/Agent/Master/Countries", queryParams, token);
  const list = response.data?.data || response.data || [];
  ferryCache.set(cacheKey, list, 86400); // 24 hours
  return list;
};

// Helper: Fuzzy Country GUID Matcher
const findCountryGuid = (countriesList, searchStr) => {
  const cleanStr = (searchStr || "").trim().toLowerCase();

  if (cleanStr) {
    let match = countriesList.find(c => c.name?.toLowerCase() === cleanStr);
    if (match) return match.id;

    match = countriesList.find(c => c.code?.toLowerCase() === cleanStr);
    if (match) return match.id;

    match = countriesList.find(c => c.name?.toLowerCase().includes(cleanStr) || cleanStr.includes(c.name?.toLowerCase()));
    if (match) return match.id;
  }

  // Only fall back to Indonesia for empty/missing nationality (domestic passengers)
  if (!cleanStr) {
    const indonesianMatch = countriesList.find(c => c.name?.toLowerCase() === "indonesia");
    if (indonesianMatch) return indonesianMatch.id;
    return countriesList[0]?.id || "2e8c602d-710a-4764-ff91-08d7934c8bf2";
  }

  throw new Error(`Nationality not recognized: "${searchStr}". Please provide a valid country name.`);
};

// Helper: Format Date to YYYY-MM-DD
const formatDate = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Helper: Format passport issue date — returns null if not provided so callers can error early
const getPassportIssueDate = (issueDateStr) => {
  if (!issueDateStr) return null;
  return formatDate(issueDateStr);
};

// Helper: Map Title to Gender Index (0 = Male, 1 = Female)
const getGenderValue = (title) => {
  if (!title) return 0;
  const cleanTitle = title.trim().toLowerCase();
  if (["mr", "mister", "male", "m"].includes(cleanTitle)) {
    return 0;
  }
  return 1;
};

// POST /: Unified Multi-Step Booking Adapter
router.post("/", ensureToken, async (req, res, next) => {
  const {
    tripID,
    contactEmail,
    contactMobileNumber,
    departureDate,
    returnDate,
    originTerminalCode,
    destinationTerminalCode,
    passengers = []
  } = req.body;

  const requiredFields = [
    "tripID",
    "contactEmail",
    "contactMobileNumber",
    "departureDate",
    "originTerminalCode",
    "destinationTerminalCode"
  ];
  if (!validateFields(requiredFields, req.body, res)) return;

  try {
    // 1. Fetch and Locate Sindo Route GUID & Countries List concurrently
    const [routesList, countriesList] = await Promise.all([
      getRoutesList(req.token),
      getCountriesList(req.token)
    ]);

    const route = routesList.find(r =>
      r.embarkationPort?.code === originTerminalCode &&
      r.destinationPort?.code === destinationTerminalCode
    );

    if (!route) {
      return res.status(400).json({
        message: `Could not find a valid Sindo Ferry route from ${originTerminalCode} to ${destinationTerminalCode}.`
      });
    }

    // 2. Fetch Sindo Trip Details with Cache Lookup
    const normalizedDate = departureDate.replace(/-/g, "");
    const tripCacheKey = `trips:${originTerminalCode}:${destinationTerminalCode}:${normalizedDate}`;
    let trips = ferryCache.get(tripCacheKey);

    if (!trips) {
      const tripsRes = await makeRequest("get", "/Trips/GetTripWeb", {
        embarkation: originTerminalCode,
        destination: destinationTerminalCode,
        tripdate: normalizedDate
      }, null, "core");
      trips = tripsRes.data?.data || tripsRes.data || [];
      ferryCache.set(tripCacheKey, trips, 300); // 5-minute cache
    }

    const trip = trips.find(t => t.tripID === tripID);

    if (!trip) {
      return res.status(404).json({
        message: `Could not find the trip ${tripID} on Sindo Ferry.`
      });
    }

    // Clean times (strip colons)
    const time = trip.departureTime.replace(/:/g, "");
    const gateOpen = trip.gateOpen ? trip.gateOpen.replace(/:/g, "") : null;
    const gateClose = trip.gateClose ? trip.gateClose.replace(/:/g, "") : null;
    const formattedDate = `${normalizedDate.substring(0, 4)}-${normalizedDate.substring(4, 6)}-${normalizedDate.substring(6, 8)}`;

    // 3. Initialize Booking on Sindo Ferry
    const initBookingPayload = {
      isRoundTrip: false,
      isReturnTripOpen: false,
      departureCoreApiTrip: {
        date: formattedDate,
        routeID: route.id,
        id: tripID,
        time: time,
        gateOpen: gateOpen,
        gateClose: gateClose
      },
      returnCoreApiTrip: null
    };

    const bookingResponse = await makeRequest("post", "/Agent/Booking/Bookings", initBookingPayload, req.token);
    let bookingGuid = bookingResponse.data?.data;
    if (typeof bookingGuid === "object" && bookingGuid !== null) {
      bookingGuid = bookingGuid.id || bookingGuid.bookingGuid;
    }
    if (!bookingGuid && typeof bookingResponse.data === "string") {
      bookingGuid = bookingResponse.data;
    }

    if (!bookingGuid) {
      console.error("Invalid booking initialization response:", bookingResponse.data);
      return res.status(502).json({
        message: "Failed to initialize booking on Sindo Ferry. Invalid response format.",
        details: bookingResponse.data
      });
    }

    // 4. Add Passengers to Booking in parallel
    const passengerPromises = passengers.map(async (p) => {
      const issueDate = getPassportIssueDate(p.passportIssueDate);
      if (!issueDate) {
        throw new Error(`Passport issue date is required for passenger ${p.firstName} ${p.lastName}.`);
      }

      const nationalityGuid = findCountryGuid(countriesList, p.nationality);
      const issuingCountryGuid = findCountryGuid(countriesList, p.issuingCountry);

      const passengerPayload = {
        identification: {
          type: 0,
          no: p.passportNumber,
          fullName: `${p.firstName} ${p.lastName}`.toUpperCase(),
          gender: getGenderValue(p.title),
          dateOfBirth: formatDate(p.dateOfBirth),
          placeOfBirth: null,
          issueDate,
          expiryDate: formatDate(p.passportExpiry),
          nationalityID: nationalityGuid,
          issuanceCountryID: issuingCountryGuid
        }
      };

      return makeRequest("post", `/Agent/Booking/Bookings/${bookingGuid}/Details`, passengerPayload, req.token);
    });

    await Promise.all(passengerPromises);

    // 5. Query pricing and save in DB
    const pricingParams = {
      filter: JSON.stringify({ searchString: null }),
      pagination: JSON.stringify({ pageIndex: 0, pageSize: 0 })
    };

    let livePrice = 0;
    try {
      const pricingResponse = await makeRequest("get", `/Agent/Booking/Bookings/${bookingGuid}/Details/WithPricing`, pricingParams, req.token);
      const pricingData = pricingResponse.data?.data || pricingResponse.data || {};
      livePrice = Number(pricingData.totalSales || pricingData.totalPrice || pricingData.nominal || 0);
    } catch (err) {
      console.warn("Failed to retrieve live pricing from Sindo Ferry:", err.message);
    }

    if (!livePrice) {
      // Never fall back to a client-supplied price — that would allow
      // underpriced paid bookings. If authoritative Sindo pricing is
      // unavailable, fail the booking rather than trust req.body.price.
      return res.status(502).json({
        message: "Unable to confirm the ferry price right now. Please try again shortly.",
      });
    }

    // Find or create terminals locally (independent upserts, run in parallel)
    const [originTerminal, destTerminal] = await Promise.all([
      FerryBookingDAO.findOrCreateTerminal(
        originTerminalCode,
        req.body.originTerminalName || originTerminalCode
      ),
      FerryBookingDAO.findOrCreateTerminal(
        destinationTerminalCode,
        req.body.destinationTerminalName || destinationTerminalCode
      ),
    ]);

    // Save locally using our GUID as bookingNo
    await FerryBookingDAO.createBooking({
      bookingNo: bookingGuid,
      nominal: livePrice.toString(),
      basePrice: livePrice,
      serviceFee: 0,
      totalSales: livePrice,
      departureDate: formattedDate,
      returnDate: returnDate ? new Date(returnDate) : null,
      originId: originTerminal.id,
      destinationId: destTerminal.id,
      email: contactEmail,
      mobile_number: contactMobileNumber,
      passengers: passengers
    });

    res.json({
      message: "Booking created successfully",
      bookingNo: bookingGuid,
      id: bookingGuid,
      data: {
        bookingNo: bookingGuid,
        id: bookingGuid,
        totalPrice: livePrice
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post("/:id/details", ensureToken, async (req, res, next) => {
  const { id } = req.params;
  try {
    const response = await makeRequest("post", `/Agent/Booking/Bookings/${id}/Details`, req.body, req.token);
    res.json({
      message: response.data?.message || response.data?.msg || "Passenger added successfully",
      data: response.data?.data || response.data
    });
  } catch (error) { next(error); }
});

router.post("/submit", ensureToken, async (req, res, next) => {
  const requiredFields = ["id", "emailConfirmation"];
  if (!validateFields(requiredFields, req.body, res)) return;

  try {
    const response = await makeRequest("post", "/Agent/Booking/Bookings/Submit", req.body, req.token);
    res.json({
      message: response.data?.message || response.data?.msg || "Booking submitted successfully",
      data: response.data?.data || response.data
    });
  } catch (error) { next(error); }
});

// GET /:id: Intercept with Local DB first
router.get("/:id", ensureToken, async (req, res, next) => {
  const { id } = req.params;
  try {
    const dbBooking = await FerryBookingDAO.findBookingByNo(id);
    if (dbBooking) {
      return res.json({
        message: "Booking details fetched successfully",
        data: {
          bookingNo: dbBooking.bookingNo,
          id: dbBooking.bookingNo,
          totalPrice: Number(dbBooking.totalSales || dbBooking.nominal || 0),
          contactName: dbBooking.passengers && dbBooking.passengers.length > 0
            ? `${dbBooking.passengers[0].firstName} ${dbBooking.passengers[0].lastName}`
            : dbBooking.email,
          contactMobileNumber: dbBooking.mobile_number,
          email: dbBooking.email,
          passengers: dbBooking.passengers,
          origin: dbBooking.origin,
          destination: dbBooking.destination,
          status: dbBooking.status,
          payment_status: dbBooking.payment_status
        }
      });
    }

    const response = await makeRequest("get", `/Agent/Booking/Bookings/${id}`, {}, req.token);
    res.json({
      message: response.data?.message || response.data?.msg || "Booking details fetched successfully",
      data: response.data?.data || response.data
    });
  } catch (error) { next(error); }
});

router.get("/:id/pricing", ensureToken, async (req, res, next) => {
  const { id } = req.params;
  const { searchString, pageIndex = 0, pageSize = 0 } = req.query;
  try {
    const queryParams = {
      filter: JSON.stringify({
        searchString: searchString || null,
      }),
      pagination: JSON.stringify({
        pageIndex: parseInt(pageIndex) || 0,
        pageSize: parseInt(pageSize) || 0,
      })
    };

    const response = await makeRequest("get", `/Agent/Booking/Bookings/${id}/Details/WithPricing`, queryParams, req.token);
    res.json({
      message: response.data?.message || response.data?.msg || "Booking pricing fetched successfully",
      data: response.data?.data || response.data
    });
  } catch (error) { next(error); }
});

router.post("/transfer", ensureToken, async (req, res, next) => {
  try {
    const response = await makeRequest("post", "/Agent/Booking/BookingTransfers", req.body, req.token);
    res.json({
      message: response.data?.message || response.data?.msg || "Booking transfer initiated successfully",
      data: response.data?.data || response.data
    });
  } catch (error) { next(error); }
});

router.get("/transfer/:id", ensureToken, async (req, res, next) => {
  const { id } = req.params;
  try {
    const response = await makeRequest("get", `/Agent/Booking/BookingTransfers/${id}`, {}, req.token);
    res.json({
      message: response.data?.message || response.data?.msg || "Booking transfer details fetched successfully",
      data: response.data?.data || response.data
    });
  } catch (error) { next(error); }
});

module.exports = router;
