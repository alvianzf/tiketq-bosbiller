require("dotenv").config();
const axios = require("axios");

// Load environment variables
const username = process.env.API_KEY;
const password = process.env.SECRET_KEY;
const FLIGHT_API_URL = process.env.FLIGHT_API_URL;

if (!FLIGHT_API_URL) {
  console.error(
    "CRITICAL: FLIGHT_API_URL is not defined in environment variables.",
  );
}

// Base64 encode the credentials for Basic Authentication
const auth = Buffer.from(`${username}:${password}`).toString("base64");

// Create an Axios instance with Basic Authentication headers
const axiosInstance = axios.create({
  headers: {
    Authorization: `Basic ${auth}`,
  },
  timeout: 30000, // Added default timeout for safety
});

/**
 * Makes a POST request to the specified FLIGHT_API_URL with the provided data.
 * This function is designed to handle errors gracefully and return a promise.
 *
 * @param {Object} [data] - The data to be sent as the request body.
 * @returns {Promise} - The Axios response promise.
 */
// In-memory store for mock bookings to allow stateful search/book/payment simulation
const mockBookings = new Map();

// Helper to generate random booking code
const generateMockCode = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "MOCK";
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Makes a POST request to the specified FLIGHT_API_URL with the provided data.
 * This function is designed to handle errors gracefully and return a promise.
 *
 * @param {Object} [data] - The data to be sent as the request body.
 * @returns {Promise} - The Axios response promise.
 */
const makeRequest = (data = {}) => {
  let logData = data;
  try {
    if (typeof data === 'string') logData = JSON.parse(data);
  } catch (e) {
    // Keep as string if not JSON
  }

  // If MOCK_FLIGHT_API is active, return a simulated response
  if (process.env.MOCK_FLIGHT_API === "true") {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [MOCK] Intercepted Outbound Flight API Request:`, JSON.stringify(logData, null, 2));

    const func = logData.f;
    let mockResponseData = { rc: "99", msg: "Unknown mock function" };

    if (func === "mitraInfo") {
      mockResponseData = {
        rc: "00",
        msg: "Sukses",
        data: {
          quota: "498432290",
          description: "Mock Sandbox Development Account"
        }
      };
    } else if (func === "airlines") {
      mockResponseData = {
        rc: "00",
        msg: "sukses",
        data: [
          { airlineCode: "LIO", airlineName: "Lion Air" },
          { airlineCode: "GAR", airlineName: "Garuda Indonesia" },
          { airlineCode: "CIT", airlineName: "Citilink" }
        ]
      };
    } else if (func === "airports") {
      mockResponseData = {
        rc: "00",
        msg: "sukses",
        data: [
          { code: "CGK", name: "Jakarta (CGK)", bandara: "Soekarno - Hatta", group: "Domestik" },
          { code: "DPS", name: "Denpasar (DPS)", bandara: "Ngurah Rai", group: "Domestik" },
          { code: "SUB", name: "Surabaya (SUB)", bandara: "Juanda", group: "Domestik" },
          { code: "KNO", name: "Medan (KNO)", bandara: "Kualanamu", group: "Domestik" }
        ]
      };
    } else if (func === "travellerMandatory") {
      mockResponseData = {
        rc: "00",
        msg: "sukses",
        airline: logData.airline || "LIO",
        isDomestic: true,
        adult: { title: 1, first_name: 1, last_name: 1, date_of_birth: 1, passport_number: 0 },
        child: { title: 1, first_name: 1, last_name: 1, date_of_birth: 1 },
        infant: { title: 1, first_name: 1, last_name: 1, date_of_birth: 1 }
      };
    } else if (func === "search") {
      const depDate = logData.departureDate || new Date().toISOString().split('T')[0];
      mockResponseData = {
        rc: "00",
        msg: "Sukses",
        data: [
          {
            classes: [
              [
                {
                  availability: 9,
                  class: "Y",
                  price: 1250000,
                  departureTime: "08:00",
                  depatureTime: "08:00",
                  arrivalTime: "10:50",
                  flightCode: "JT565",
                  departure: logData.departure || "CGK",
                  departureName: logData.departure === "CGK" ? "Soekarno - Hatta" : "Airport A",
                  arrival: logData.arrival || "DPS",
                  arrivalName: logData.arrival === "DPS" ? "Ngurah Rai" : "Airport B",
                  isInternational: 0,
                  departureTimeZone: "7.00",
                  arrivalTimeZone: "8.00",
                  departureTimeZoneText: "WIB",
                  arrivalTimeZoneText: "WITA",
                  duration: "1 jam 50 menit",
                  departureDate: depDate,
                  arrivalDate: depDate
                }
              ]
            ],
            title: `JT565 ${logData.departure || "CGK"} ${logData.arrival || "DPS"} 08:00-10:50`,
            isTransit: false,
            detailTitle: [
              {
                flightIcon: "http://117.102.64.238:1212/assets/maskapai/TPJT.png",
                flightName: "Lion Air",
                transitTime: "0j0m",
                flightCode: "JT565",
                origin: logData.departure || "CGK",
                originName: logData.departure === "CGK" ? "Soekarno - Hatta" : "Airport A",
                destination: logData.arrival || "DPS",
                destinationName: logData.arrival === "DPS" ? "Ngurah Rai" : "Airport B",
                depart: "08:00",
                arrival: "10:50",
                departureDate: depDate,
                durationDetail: "1 jam 50 menit",
                arrivalDate: depDate,
                departureTimeZoneText: "WIB",
                arrivalTimeZoneText: "WITA"
              }
            ],
            searchId: "MOCK_SEARCH_ID_" + Math.random().toString(36).substring(2, 10),
            airline: "Lion Air",
            airlineCode: "LIO",
            image: "http://117.102.64.238:1212/assets/maskapai/TPJT.png",
            sumPrice: 1250000
          }
        ]
      };
    } else if (func === "book") {
      const code = generateMockCode();
      const adultsList = logData.passengers?.adults || [];
      const childrenList = logData.passengers?.childrens || logData.passengers?.children || [];
      const infantsList = logData.passengers?.infants || [];
      const buyer = logData.buyer || { email: "buyer@gmail.com", telp_number: "+628123456789" };

      const bookingInfo = {
        flightdetail: [
          {
            flightIcon: "http://117.102.64.238:1212/assets/maskapai/TPJT.png",
            flightName: "Lion Air",
            transitTime: "0j0m",
            flightCode: "JT565",
            origin: "CGK",
            originName: "Soekarno - Hatta",
            destination: "DPS",
            destinationName: "Ngurah Rai",
            depart: "08:00",
            arrival: "10:50",
            departureDate: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0],
            durationDetail: "1 jam 50 menit",
            arrivalDate: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0],
            departureTimeZoneText: "WIB",
            arrivalTimeZoneText: "WITA"
          }
        ],
        passengers: {
          adults: adultsList.map(a => ({ title: a.title, first_name: a.first_name, last_name: a.last_name })),
          children: childrenList.map(c => ({ title: c.title, first_name: c.first_name, last_name: c.last_name, date_of_birth: c.date_of_birth })),
          infants: infantsList.map(i => ({ title: i.title, first_name: i.first_name, last_name: i.last_name, date_of_birth: i.date_of_birth }))
        },
        buyer: {
          name: buyer.name || (adultsList[0] ? `${adultsList[0].first_name} ${adultsList[0].last_name}` : "John Doe"),
          email: buyer.email,
          mobile_number: buyer.mobile_number || buyer.telp_number
        },
        bookingCode: code,
        reservationDate: new Date().toISOString().replace('T', ' ').substring(0, 19),
        nominal: "1250000",
        status: "HOLD"
      };

      mockBookings.set(code, bookingInfo);

      mockResponseData = {
        rc: "00",
        msg: "Sukses",
        data: bookingInfo
      };
    } else if (func === "bookInfo") {
      const code = logData.bookingCode || "FAKEBJSGP";
      const cached = mockBookings.get(code);
      if (cached) {
        mockResponseData = {
          rc: "00",
          msg: "Sukses",
          data: cached
        };
      } else {
        mockResponseData = {
          rc: "00",
          msg: "Sukses",
          data: {
            flightdetail: [
              {
                flightIcon: "http://117.102.64.238:1212/assets/maskapai/TPJT.png",
                flightName: "Lion Air",
                transitTime: "0j0m",
                flightCode: "JT565",
                origin: "CGK",
                originName: "Soekarno - Hatta",
                destination: "DPS",
                destinationName: "Ngurah Rai",
                depart: "08:00",
                arrival: "10:50",
                departureDate: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0],
                durationDetail: "1 jam 50 menit",
                arrivalDate: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0],
                departureTimeZoneText: "WIB",
                arrivalTimeZoneText: "WITA"
              }
            ],
            passengers: {
              adults: [{ title: "Mr", first_name: "John", last_name: "Doe" }],
              children: [],
              infants: []
            },
            buyer: {
              name: "John Doe",
              email: "test_passenger@gmail.com",
              mobile_number: "+628123456789"
            },
            bookingCode: code,
            reservationDate: new Date().toISOString().replace('T', ' ').substring(0, 19),
            nominal: "1250000",
            status: "HOLD"
          }
        };
      }
    } else if (func === "payment") {
      const code = logData.bookingCode || "FAKEBJSGP";
      const cached = mockBookings.get(code);
      if (cached) {
        cached.status = "PAID";
        mockBookings.set(code, cached);
      }
      mockResponseData = {
        rc: "00",
        msg: "Sukses",
        data: {
          bookingCode: code,
          reservationDate: new Date().toISOString().replace('T', ' ').substring(0, 19),
          nominal: logData.nominal || "1250000",
          comission: "5000",
          status: "PAID"
        }
      };
    }

    console.log(`[${new Date().toISOString()}] [MOCK] Intercepted Flight API Response Status: 200`);
    console.log(`[${new Date().toISOString()}] [MOCK] Intercepted Response Payload Snippet:`, JSON.stringify(mockResponseData).substring(0, 500));
    return Promise.resolve({
      status: 200,
      data: mockResponseData
    });
  }

  if (!FLIGHT_API_URL) {
    return Promise.reject(
      new Error(
        "Flight API URL is not configured. Please check your .env file.",
      ),
    );
  }

  // Ensure we are working with a valid URL
  try {
    new URL(FLIGHT_API_URL);
  } catch (e) {
    return Promise.reject(
      new Error(`Invalid FLIGHT_API_URL configuration: ${FLIGHT_API_URL}`),
    );
  }

  const timestamp = new Date().toISOString();
  
  console.log(`[${timestamp}] >>> Outbound Flight API Request [${FLIGHT_API_URL}]:`, JSON.stringify(logData, null, 2));

  return axiosInstance.post(FLIGHT_API_URL, data)
    .then(response => {
      console.log(`[${new Date().toISOString()}] <<< Inbound Flight API Response [${FLIGHT_API_URL}] Status: ${response.status}`);
      const responseSnippet = JSON.stringify(response.data).substring(0, 500);
      console.log(`[${new Date().toISOString()}] Result Data Snippet: ${responseSnippet}${JSON.stringify(response.data).length > 500 ? '...' : ''}`);
      return response;
    })
    .catch((err) => {
      let errorMessage = "Internal Server Error";

      if (err.code === "ECONNABORTED") {
        errorMessage = "The Flight API service is taking too long to respond. Please try again in a few moments.";
      } else if (err.response) {
        const status = err.response.status;
        if (status === 403) {
          errorMessage = "Access to the Flight API was denied. This is usually due to an IP whitelisting restriction on the server. Please contact support.";
        } else if (status === 401) {
          errorMessage = "The Flight API credentials appear to be invalid. This is a configuration issue on our end.";
        } else if (status === 404) {
          errorMessage = "The Flight API endpoint was not found. The service provider may have changed their API structure.";
        } else {
          errorMessage = err.response.data?.message || err.message || `The Flight API service responded with an error (Status: ${status}).`;
        }
      } else if (err.request) {
        errorMessage = "No response was received from the Flight API. The service may be temporarily down or our server IP might be blocked.";
      } else {
        errorMessage = err.message;
      }

      console.error(`[${new Date().toISOString()}] !!! Flight API Error [${FLIGHT_API_URL}]:`, errorMessage);
      if (err.response?.data) {
        console.error("Error Response Data:", JSON.stringify(err.response.data, null, 2));
      }

      const error = new Error(errorMessage);
      error.status = err.response ? (err.response.status >= 500 ? 502 : err.response.status) : 504;
      error.source = "FlightAPI";
      error.errors = [errorMessage];
      
      if (err.response && err.response.data) {
        error.details = err.response.data;
      }

      return Promise.reject(error);
    });
};

module.exports = makeRequest;
