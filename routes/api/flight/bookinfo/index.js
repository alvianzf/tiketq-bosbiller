const express = require("express");
const apiService = require("../../../../services/apiService");
const FerryBookingDAO = require("../../../../db/dao/FerryBookingDAO");
const ferryPdfService = require("../../../../services/ferryPdfService");
const router = express.Router();

/**
 * Handles GET requests to fetch all booking information.
 *
 * @param {Request} req - The request object.
 * @param {Response} res - The response object to send the booking information back to the client.
 * @param {NextFunction} next - The next middleware function in the application's request-response cycle.
 */
router.get("/", async (req, res, next) => {
  try {
    const allBookingInfo = await apiService.fetchBookingInfo();
    res.json(allBookingInfo);
  } catch (error) {
    next(error);
  }
});

/**
 * Handles GET requests to fetch booking information by booking code.
 *
 * @param {string} req.params.id - The booking code to fetch information for.
 * @param {Response} res - The response object to send the booking information back to the client.
 * @param {NextFunction} next - The next middleware function in the application's request-response cycle.
 */
router.get("/:id", async (req, res, next) => {
  const bookingCode = req.params.id;

  try {
    // 1. Try to find Sindo Ferry Booking in our local DB first
    const dbBooking = await FerryBookingDAO.findBookingByNo(bookingCode);
    if (dbBooking) {
      let ticketPdfBase64 = "";
      if (dbBooking.status === "PAID" || dbBooking.payment_status === true) {
        try {
          const pdfBuffer = await ferryPdfService.generateFerryTicketPDF(dbBooking);
          ticketPdfBase64 = pdfBuffer.toString("base64");
        } catch (pdfErr) {
          console.error("Failed to generate on-the-fly Ferry E-Ticket base64:", pdfErr.message);
        }
      }

      // Map to flight adapter response schema so frontend renders correctly
      return res.json({
        rc: "00",
        message: "Ferry booking found successfully",
        data: {
          bookingCode: dbBooking.bookingNo,
          status: dbBooking.status === "PAID" ? "ISSUED" : "PENDING",
          tiket_pdf: ticketPdfBase64,
          serviceType: "FERRY",
          flightdetail: [
            {
              depart: dbBooking.passengers?.[0]?.departureTime || "08:30",
              origin: dbBooking.origin?.code || "BTC",
              arrival: dbBooking.passengers?.[0]?.arrivalTime || "09:30",
              destination: dbBooking.destination?.code || "HFC",
              originName: dbBooking.origin?.name || "Batam Centre",
              destinationName: dbBooking.destination?.name || "HarbourFront Centre",
              flightCode: "Sindo Ferry Express",
              durationDetail: "1 Hour"
            }
          ],
          passengers: {
            adults: dbBooking.passengers.map(p => ({
              title: p.title || "MR",
              first_name: p.firstName,
              last_name: p.lastName,
              date_of_birth: p.dateOfBirth ? p.dateOfBirth.toISOString() : new Date().toISOString()
            })),
            children: [],
            infants: []
          }
        }
      });
    }

    // 2. Query Flight Booking API
    const bookingInfo = await apiService.fetchBookingInfo(bookingCode);
    res.json(bookingInfo);
  } catch (error) {
    // 3. Fallback check: in case flight service returned an error, search local DB again
    try {
      const dbBooking = await FerryBookingDAO.findBookingByNo(bookingCode);
      if (dbBooking) {
        let ticketPdfBase64 = "";
        if (dbBooking.status === "PAID" || dbBooking.payment_status === true) {
          try {
            const pdfBuffer = await ferryPdfService.generateFerryTicketPDF(dbBooking);
            ticketPdfBase64 = pdfBuffer.toString("base64");
          } catch (pdfErr) {
            console.error("Failed to generate fallback Ferry E-Ticket base64:", pdfErr.message);
          }
        }

        return res.json({
          rc: "00",
          message: "Ferry booking found successfully",
          data: {
            bookingCode: dbBooking.bookingNo,
            status: dbBooking.status === "PAID" ? "ISSUED" : "PENDING",
            tiket_pdf: ticketPdfBase64,
            serviceType: "FERRY",
            flightdetail: [
              {
                depart: "08:30",
                origin: dbBooking.origin?.code || "BTC",
                arrival: "09:30",
                destination: dbBooking.destination?.code || "HFC",
                originName: dbBooking.origin?.name || "Batam Centre",
                destinationName: dbBooking.destination?.name || "HarbourFront Centre",
                flightCode: "Sindo Ferry Express",
                durationDetail: "1 Hour"
              }
            ],
            passengers: {
              adults: dbBooking.passengers.map(p => ({
                title: p.title || "MR",
                first_name: p.firstName,
                last_name: p.lastName,
                date_of_birth: p.dateOfBirth ? p.dateOfBirth.toISOString() : new Date().toISOString()
              })),
              children: [],
              infants: []
            }
          }
        });
      }
    } catch (innerErr) {
      console.error("Ferry booking fallback lookup failed:", innerErr.message);
    }
    next(error);
  }
});

module.exports = router;
