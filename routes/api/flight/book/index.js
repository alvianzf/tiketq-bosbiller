const express = require("express");
const apiService = require("../../../../services/apiService");
const FlightBookingDAO = require("../../../../db/dao/FlightBookingDAO");
const router = express.Router();

router.post("/", async (req, res, next) => {
  const requestData = req.body;
  requestData.f = "book";

  // Fail-safe normalization for any client bundles sending 'childrens' instead of 'children' in passenger details
  if (requestData.passengers) {
    if (requestData.passengers.childrens && !requestData.passengers.children) {
      requestData.passengers.children = requestData.passengers.childrens;
      delete requestData.passengers.childrens;
    }
  }

  try {
    const result = await apiService.fetchData(requestData);

    const isSuccess = !!(result && result.data && result.data.bookingCode);

    // Store in DB if booking was successful and we have a booking code
    if (isSuccess) {
      const flightDetail = result.data.flightdetail?.[0] || {};
      const origin = flightDetail.origin;
      const destination = flightDetail.destination;
      const departureDate = flightDetail.departureDate;

      const buyer = result.data.buyer || {};
      const mobile_number = buyer.mobile_number || buyer.telp_number;
      const email = buyer.email;
      const name = buyer.name;

      const nominalVal = parseFloat(result.data.nominal) || 0;

      const passengersList = [];
      if (result.data.passengers) {
        const { adults = [], children = [], infants = [] } = result.data.passengers;
        const allPassengers = [...adults, ...children, ...infants];
        for (const p of allPassengers) {
          passengersList.push({
            title: p.title,
            firstName: p.first_name,
            lastName: p.last_name,
            dateOfBirth: p.date_of_birth,
            passportNumber: p.passport_number,
            nationality: p.nationality
          });
        }
      }

      await FlightBookingDAO.createBooking({
        bookingCode: result.data.bookingCode,
        nominal: result.data.nominal || "0",
        origin,
        destination,
        departureDate,
        mobile_number,
        name,
        email,
        basePrice: nominalVal,
        serviceFee: 0,
        totalSales: nominalVal,
        passengers: passengersList,
      });
    }

    const rc = isSuccess ? "00" : (result.data?.rc || "99");
    const msg = isSuccess ? (result.message || "sukses") : (result.data?.msg || result.message || "Failed to book flight");

    // Reconstruct the response with 'rc' and 'msg' as expected by the frontend
    const frontendResponse = {
      rc,
      msg,
      data: result.data
    };

    res.json(frontendResponse);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
