const express = require("express");
const apiService = require("../../../../services/apiService");
const FlightBookingDAO = require("../../../../db/dao/FlightBookingDAO");
const router = express.Router();

// Provider (Bosbiller "Pesawat" API) return codes worth translating into clear,
// action-oriented messages. Many raw messages are vague ("Booking Gagal") — the
// common cause is a stale/consumed searchId, so those steer the user to search
// again. Codes not listed here fall back to the provider's own message.
const BOOK_RC_MESSAGES = {
  "15": "Booking ini sudah pernah dibuat. Silakan cek pesanan Anda atau lakukan pencarian ulang.",
  "18": "Booking gagal. Silakan lakukan pencarian jadwal ulang dan coba lagi.",
  "23": "Data penerbangan sudah berubah. Silakan lakukan pencarian jadwal ulang.",
  "38": "Jadwal penerbangan sudah tidak tersedia. Silakan lakukan pencarian ulang.",
  "42": "Harga tiket telah berubah. Silakan lakukan pencarian ulang untuk melihat harga terbaru.",
  "43": "Sesi pemesanan telah kedaluwarsa. Silakan lakukan pencarian ulang.",
  "44": "Booking gagal — sesi pemesanan sudah tidak berlaku. Silakan lakukan pencarian jadwal ulang dan coba lagi.",
  "49": "Kursi tidak lagi tersedia untuk penerbangan ini. Silakan pilih penerbangan lain.",
  "65": "Booking gagal — kursi habis atau data tidak sesuai. Silakan lakukan pencarian ulang.",
  "69": "Sesi pemesanan telah kedaluwarsa. Silakan lakukan pencarian ulang.",
  "71": "Booking gagal. Silakan lakukan pencarian jadwal sekali lagi.",
  "87": "Email pemesan belum diisi atau tidak valid. Mohon periksa kembali.",
  "88": "Booking gagal. Silakan coba lagi atau hubungi customer service kami.",
  "99": "Layanan penerbangan sedang tidak dapat dihubungi. Silakan coba beberapa saat lagi.",
};

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
            nationality: p.nationality,
            cabinClass: p.cabin_class || p.cabinClass || 'economy',
            isLapInfant: Boolean(p.is_lap_infant ?? p.isLapInfant ?? false)
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
    const msg = isSuccess
      ? (result.message || "sukses")
      : (BOOK_RC_MESSAGES[rc] || result.data?.msg || result.message || "Booking gagal. Silakan coba lagi.");

    // Reconstruct the response with 'rc' and 'msg' as expected by the frontend
    const frontendResponse = {
      rc,
      msg,
      data: result.data
    };

    res.json(frontendResponse);
  } catch (error) {
    console.error("Flight booking request failed:", error.stack || error.message);
    
    // Gracefully handle any error/timeout by returning a clean 200 OK JSON error response to bypass Cloudflare CORS blocks
    res.json({
      rc: error.status === 504 ? "99" : (error.code || "99"),
      msg: error.message || "The Flight API service is taking too long to respond. Please try again in a few moments.",
      data: null
    });
  }
});

module.exports = router;
