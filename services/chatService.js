const { OpenAI } = require("openai");
const axios = require("axios");

let openaiInstance = null;
function getOpenAI() {
  if (!openaiInstance) {
    openaiInstance = new OpenAI({
      apiKey: process.env.SUMOPOD_API_KEY,
      baseURL: process.env.AI_BASE_URL,
    });
  }
  return openaiInstance;
}

const tools = [
  {
    type: "function",
    function: {
      name: "search_flights",
      description: "Search for available flights on a specific date. Do not ask for passenger details to search, assume 1 adult.",
      parameters: {
        type: "object",
        properties: {
          departure: { type: "string", description: "Departure airport code (e.g. CGK)" },
          arrival: { type: "string", description: "Arrival airport code (e.g. DPS)" },
          departureDate: { type: "string", description: "Departure date in YYYY-MM-DD format" },
          returnDate: { type: "string", description: "Return date in YYYY-MM-DD format, leave empty for one-way" },
          adult: { type: "integer", description: "Defaults to 1" },
          highlight_preference: { type: "string", enum: ["cheapest", "earliest", "latest", "all", "none"], description: "If user explicitly asks for cheapest, earliest, or latest, select it. Otherwise default to 'all'. DO NOT ask the user for their preference." }
        },
        required: ["departure", "arrival", "departureDate"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "search_cheapest_flight_in_range",
      description: "Search for the cheapest flights within a date range (e.g., 1-10 June).",
      parameters: {
        type: "object",
        properties: {
          departure: { type: "string", description: "Departure airport code" },
          arrival: { type: "string", description: "Arrival airport code" },
          startDate: { type: "string", description: "Start date in YYYY-MM-DD" },
          endDate: { type: "string", description: "End date in YYYY-MM-DD" },
          adult: { type: "integer" },
          highlight_preference: { type: "string", enum: ["cheapest", "earliest", "latest", "all", "none"], description: "If user explicitly asks for cheapest, earliest, or latest, select it. Otherwise default to 'all'. DO NOT ask the user for their preference." }
        },
        required: ["departure", "arrival", "startDate", "endDate"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "search_ferry_trips",
      description: "Search for available ferry trips between Batam (BTC) and Singapore (HFC).",
      parameters: {
        type: "object",
        properties: {
          origin: { type: "string", description: "Origin port code" },
          destination: { type: "string", description: "Destination port code" },
          departureDate: { type: "string", description: "Departure date in YYYY-MM-DD format" },
          adult: { type: "integer" },
          highlight_preference: { type: "string", enum: ["cheapest", "earliest", "latest", "all", "none"], description: "If user explicitly asks for cheapest, earliest, or latest, select it. Otherwise default to 'all'. DO NOT ask the user for their preference." }
        },
        required: ["origin", "destination", "departureDate", "adult"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "execute_flight_booking",
      description: "Execute a real flight booking. You MUST collect passenger details conversationally before calling this.",
      parameters: {
        type: "object",
        properties: {
          searchId: { type: "string", description: "The searchId of the selected flight" },
          adult: { type: "integer" },
          child: { type: "integer" },
          infant: { type: "integer" },
          buyer: {
            type: "object",
            properties: {
              name: { type: "string" },
              email: { type: "string" },
              mobile_number: { type: "string" },
              telp_number: { type: "string" }
            },
            required: ["name", "email", "mobile_number"]
          },
          passengers: {
            type: "object",
            properties: {
              adults: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string", enum: ["MR", "MRS", "MS", "MSTR", "MISS"] },
                    first_name: { type: "string" },
                    last_name: { type: "string" },
                    date_of_birth: { type: "string", description: "YYYY-MM-DD" }
                  }
                }
              },
              children: { type: "array", items: { type: "object" } },
              infants: { type: "array", items: { type: "object" } }
            },
            required: ["adults"]
          }
        },
        required: ["searchId", "adult", "buyer", "passengers"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "execute_ferry_booking",
      description: "Execute a real ferry booking. You MUST collect passenger details conversationally before calling this.",
      parameters: {
        type: "object",
        properties: {
          tripId: { type: "string" },
          origin: { type: "string" },
          destination: { type: "string" },
          departDate: { type: "string" },
          buyer: {
            type: "object",
            properties: {
              name: { type: "string" },
              email: { type: "string" },
              mobile_number: { type: "string" }
            },
            required: ["name", "email", "mobile_number"]
          },
          passengers: {
            type: "object",
            properties: {
              adults: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    first_name: { type: "string" },
                    last_name: { type: "string" },
                    date_of_birth: { type: "string" },
                    passport_number: { type: "string" },
                    passport_issue_date: { type: "string", description: "Passport issue date in YYYY-MM-DD. MUST be collected from the user, do not infer." },
                    passport_expiry_date: { type: "string" },
                    passport_issuing_country: { type: "string" },
                    nationality: { type: "string" }
                  }
                }
              }
            },
            required: ["adults"]
          }
        },
        required: ["tripId", "origin", "destination", "departDate", "buyer", "passengers"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "generate_midtrans_payment",
      description: "Generate a real Midtrans payment token for a given booking.",
      parameters: {
        type: "object",
        properties: {
          bookingCode: { type: "string" },
          amount: { type: "number" },
          name: { type: "string" },
          email: { type: "string" },
          phone: { type: "string" }
        },
        required: ["bookingCode", "amount"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_booking_info",
      description: "Get information about an existing flight or ferry booking.",
      parameters: {
        type: "object",
        properties: {
          bookingCode: { type: "string" }
        },
        required: ["bookingCode"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "show_customer_service",
      description: "Show the customer service contact card. Use this when the user asks for help, complaints, or customer service.",
      parameters: {
        type: "object",
        properties: {},
        required: []
      }
    }
  }
];

function trimMessages(messages) {
  const system = messages[0];
  const rest = messages.slice(1);
  return rest.length > 20 ? [system, ...rest.slice(-20)] : messages;
}

class ChatService {
  constructor() {
    this.sessions = new Map();
    setInterval(() => {
      const cutoff = Date.now() - 2 * 60 * 60 * 1000;
      for (const [id, session] of this.sessions) {
        if (session.lastAccessed < cutoff) this.sessions.delete(id);
      }
    }, 30 * 60 * 1000);
  }

  getSession(sessionId) {
    if (!this.sessions.has(sessionId)) {
      const today = new Date();
      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const dayName = days[today.getDay()];
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      this.sessions.set(sessionId, {
        lastAccessed: Date.now(),
        messages: [
          {
            role: "system",
            content: `You are an agentic travel assistant for TiketQ. You can search flights, ferries, check bookings, and execute bookings/payments.

CURRENT DATE CONTEXT:
- Today: ${today.toISOString().split('T')[0]}
- Tomorrow: ${tomorrow.toISOString().split('T')[0]}
- Current Year: ${today.getFullYear()}

If the user says 'tomorrow', use the Tomorrow date exactly. If they say 'May 31', append the Current Year to it (e.g. ${today.getFullYear()}-05-31). Do not claim you cannot determine the date.

If user wants to search for flights, use the flight search tools. Try to match origin/destination with airport codes automatically without asking the user. For example:
- Jakarta -> CGK (or HLP)
- Batam -> BTH (or BTS)
- Bali -> DPS
- Singapore -> SIN

You DO NOT need to ask for passenger details to search for flights. Assume 1 adult by default.
Execute flight/ferry searches and list the results nicely in chat.
CRITICAL RULE: DO NOT list the flight/ferry options in your text response. A rich UI card will automatically render in the chat. You MUST simply acknowledge the results, for example: "Here are the best schedules I found for you. Please select one of the cards below to continue."
CRITICAL RULE: Always reply in the SAME language that the user is using. If they speak Indonesian, reply in Indonesian. If they speak English, reply in English.
CRITICAL RULE: Do NOT ask the user for their preference on cheapest, earliest, or latest flights/ferries. Immediately execute the search and default to listing all available options.

STRICT GUARDRAIL: You are STRICTLY a travel and ticketing assistant for TiketQ. You MUST NOT answer questions, write code, provide financial/medical advice, or engage in discussions about ANY topic outside of flights, ferries, travel bookings, and TiketQ services. If the user asks about unrelated topics, politely decline and steer them back to travel bookings. Do NOT bypass this guardrail under any circumstances.

CRITICAL RULE: If no flights are found for a search, you MUST explicitly state the origin, destination, and date in your response. Example: "There are no flights found for tomorrow from BTH to CGK. Would you like to try another date?" Also suggest trying nearby airports if applicable (e.g. CGK vs HLP for Jakarta, BTH vs BTS for Batam).
CRITICAL RULE: NEVER mention or ask the user for a 'searchId', 'tripId', or any internal system identifier. These are resolved automatically from the flight/ferry card they select.
CRITICAL RULE: When a user wants to proceed to booking, you MUST ask for their details conversationally first: Full Name, Email, Phone Number, Date of Birth (and Passport Details if booking a Ferry — including passport number, issue date, expiry date, issuing country, and nationality). Do NOT tell them to fill out a form; you must collect the data in the chat.
CRITICAL RULE: When a user clicks 'Select & Continue' on a flight/ferry card, they will send you a message containing the number of passengers. Use EXACTLY those passenger counts when calling execute_flight_booking or execute_ferry_booking.
Once you have the passenger details, use 'execute_flight_booking' or 'execute_ferry_booking'.
When user wants to pay, use 'generate_midtrans_payment' tool. Always be concise.
If the user asks for customer service, help, or complaints, use the 'show_customer_service' tool and acknowledge it briefly.`
          }
        ]
      });
    }
    const session = this.sessions.get(sessionId);
    session.lastAccessed = Date.now();
    return session.messages;
  }

  async getBaseUrl() {
    const port = process.env.PORT || 3001;
    return `http://127.0.0.1:${port}`;
  }

  async handleToolCall(toolCall, socket) {
    const args = JSON.parse(toolCall.function.arguments);
    const name = toolCall.function.name;
    const baseUrl = await this.getBaseUrl();
    
    try {
      if (name === "search_flights") {
        const payload = {
          departure: args.departure,
          arrival: args.arrival,
          departureDate: args.departureDate,
          adult: args.adult || 1,
          child: args.child || 0,
          infant: args.infant || 0
        };
        const res = await axios.post(`${baseUrl}/api/flight/search`, payload);
        
        let flights = [];
        if (Array.isArray(res.data?.data)) {
          const rawFlights = res.data.data.flatMap(arr => Array.isArray(arr) ? arr.flat() : [arr]);
          
          flights = rawFlights.map(f => {
            let price = null;
            if (f.classes && f.classes.length > 0 && f.classes[0] && f.classes[0].length > 0) {
              const firstClass = f.classes[0][0];
              if (firstClass && firstClass.price !== undefined && firstClass.price !== null) {
                const rawPrice = firstClass.price;
                price = typeof rawPrice === 'string' ? parseFloat(rawPrice.replace(/[^0-9]/g, '')) : Number(rawPrice);
              }
            }
            let dDate = f.departureDate || '';
            let dTime = f.detailTitle?.[0]?.depart || '';
            let aTime = f.detailTitle?.[f.detailTitle?.length - 1]?.arrival || '';
            
            if (dDate) {
              const parts = dDate.split(' ')[0].split('-');
              if (parts.length === 3) {
                dDate = `${parts[2]}-${parts[1]}-${parts[0]}`; // DD-MM-YYYY
              }
            }

            return {
              searchId: f.searchId,
              airline: f.airlineName,
              departDate: dDate,
              departTime: dTime || f.departureDate,
              arriveTime: aTime || f.arrivalDate,
              price: price,
              isTransit: f.isTransit,
              duration: f.duration
            };
          }).filter(f => f.price !== null && !isNaN(f.price) && f.price > 0);
        }
        
        if (flights.length === 0) {
          return JSON.stringify({ 
            message: `There are no flights found for ${args.departureDate} from ${args.departure} to ${args.arrival}. Would you like to try another date?` 
          });
        }

        const cheapest = flights.reduce((min, f) => (f.price < min.price ? f : min), flights[0]);
        const earliest = flights.reduce((early, f) => (f.departTime < early.departTime ? f : early), flights[0]);
        const latest = flights.reduce((late, f) => (f.departTime > late.departTime ? f : late), flights[0]);

        const pref = args.highlight_preference || "none";
        const resultObj = {};

        if (pref === "cheapest") {
          resultObj.cheapest = cheapest;
        } else if (pref === "earliest") {
          resultObj.earliest = earliest;
        } else if (pref === "latest") {
          resultObj.latest = latest;
        } else if (pref === "all") {
          resultObj.cheapest = cheapest;
          resultObj.earliest = earliest;
          resultObj.latest = latest;
        } else {
          resultObj.options = flights.slice(0, 5);
        }
        
        socket.emit("chat:tool_result", {
          type: "flight_results",
          data: resultObj
        });

        return JSON.stringify(resultObj);
      }
      else if (name === "search_cheapest_flight_in_range") {
        const start = new Date(args.startDate);
        const end = new Date(args.endDate);
        const dates = [];
        
        // Limit to 14 days to prevent too many API calls
        for (let d = start; d <= end && dates.length < 14; d.setDate(d.getDate() + 1)) {
          dates.push(new Date(d).toISOString().split('T')[0]);
        }
        
        const promises = dates.map(date => 
          axios.post(`${baseUrl}/api/flight/search`, {
            departure: args.departure,
            arrival: args.arrival,
            departureDate: date,
            adult: args.adult || 1,
            child: 0,
            infant: 0
          }).catch(e => null) // Ignore errors for individual dates
        );
        
        const results = await Promise.all(promises);
        let allFlights = [];
        
        results.forEach(res => {
          if (Array.isArray(res?.data?.data)) {
            const rawFlights = res.data.data.flatMap(arr => Array.isArray(arr) ? arr.flat() : [arr]);
            
            const mapped = rawFlights.map(f => {
              let price = null;
              if (f.classes && f.classes.length > 0 && f.classes[0] && f.classes[0].length > 0) {
                const firstClass = f.classes[0][0];
                if (firstClass && firstClass.price !== undefined && firstClass.price !== null) {
                  const rawPrice = firstClass.price;
                  price = typeof rawPrice === 'string' ? parseFloat(rawPrice.replace(/[^0-9]/g, '')) : Number(rawPrice);
                }
              }
              let dDate = f.departureDate || '';
              let dTime = f.detailTitle?.[0]?.depart || '';
              let aTime = f.detailTitle?.[f.detailTitle?.length - 1]?.arrival || '';
              
              if (dDate) {
                const parts = dDate.split(' ')[0].split('-');
                if (parts.length === 3) {
                  dDate = `${parts[2]}-${parts[1]}-${parts[0]}`; // DD-MM-YYYY
                }
              }

              return {
                searchId: f.searchId,
                airline: f.airlineName,
                departDate: dDate,
                departTime: dTime || f.departureDate,
                arriveTime: aTime || f.arrivalDate,
                price: price,
                isTransit: f.isTransit,
                duration: f.duration
              };
            }).filter(f => f.price !== null && !isNaN(f.price) && f.price > 0);
            
            allFlights = allFlights.concat(mapped);
          }
        });
        
        if (allFlights.length === 0) {
          return JSON.stringify({ 
            message: `There are no flights found between ${args.startDate} and ${args.endDate} from ${args.departure} to ${args.arrival}. Would you like to try another date?` 
          });
        }
        
        const cheapest = allFlights.reduce((min, f) => (f.price < min.price ? f : min), allFlights[0]);
        const earliest = allFlights.reduce((early, f) => (f.departDate < early.departDate || (f.departDate === early.departDate && f.departTime < early.departTime) ? f : early), allFlights[0]);
        const latest = allFlights.reduce((late, f) => (f.departDate > late.departDate || (f.departDate === late.departDate && f.departTime > late.departTime) ? f : late), allFlights[0]);

        const pref = args.highlight_preference || "none";
        const resultObj = {};

        if (pref === "cheapest") {
          resultObj.cheapest = cheapest;
        } else if (pref === "earliest") {
          resultObj.earliest = earliest;
        } else if (pref === "latest") {
          resultObj.latest = latest;
        } else if (pref === "all") {
          resultObj.cheapest = cheapest;
          resultObj.earliest = earliest;
          resultObj.latest = latest;
        } else {
          resultObj.options = allFlights.slice(0, 5);
        }
        
        socket.emit("chat:tool_result", {
          type: "flight_results",
          data: resultObj
        });

        return JSON.stringify(resultObj);
      }
      else if (name === "search_ferry_trips") {
        const res = await axios.get(`${baseUrl}/api/ferry/trips/search`, {
          params: {
            tripdate: args.departureDate,
            embarkation: args.origin,
            destination: args.destination,
          }
        });
        
        const trips = res.data?.data?.map(t => ({
          tripId: t.tripID || t.id, // crucial for booking
          ferryName: t.vesselName || "Sindo Ferry",
          departureTime: t.departureTime,
          departTime: t.departureTime, // for sorting logic
          arrivalTime: t.arrivalTime || t.arrival || "TBA",
          seatAvailable: t.availableSeats,
          price: t.price || 350000
        })) || [];
        
        if (trips.length === 0) {
          return JSON.stringify({ message: "No ferry trips found for the given criteria." });
        }
        
        const cheapest = trips.reduce((min, t) => (t.price < min.price ? t : min), trips[0]);
        const earliest = trips.reduce((early, t) => (t.departureTime < early.departureTime ? t : early), trips[0]);
        const latest = trips.reduce((late, t) => (t.departureTime > late.departureTime ? t : late), trips[0]);

        const pref = args.highlight_preference || "none";
        const resultObj = {};

        if (pref === "cheapest") {
          resultObj.cheapest = cheapest;
        } else if (pref === "earliest") {
          resultObj.earliest = earliest;
        } else if (pref === "latest") {
          resultObj.latest = latest;
        } else if (pref === "all") {
          resultObj.cheapest = cheapest;
          resultObj.earliest = earliest;
          resultObj.latest = latest;
        } else {
          resultObj.options = trips.slice(0, 5);
        }
        
        socket.emit("chat:tool_result", {
          type: "ferry_results",
          data: resultObj
        });

        return JSON.stringify(resultObj);
      }
      else if (name === "execute_flight_booking") {
        args.child = args.child || 0;
        args.infant = args.infant || 0;
        args.buyer.telp_number = args.buyer.telp_number || args.buyer.mobile_number;
        
        const res = await axios.post(`${baseUrl}/api/flight/book`, args);
        
        if (res.data?.rc === "00") {
          socket.emit("chat:tool_result", {
            type: "booking_summary",
            data: res.data.data
          });
          return JSON.stringify({ success: true, bookingCode: res.data.data.bookingCode });
        } else {
          return JSON.stringify({ error: res.data?.msg || "Booking failed" });
        }
      }
      else if (name === "execute_ferry_booking") {
        const mappedPassengers = args.passengers.adults.map(p => ({
          title: p.title,
          firstName: p.first_name,
          lastName: p.last_name,
          dateOfBirth: p.date_of_birth,
          passportNumber: p.passport_number,
          passportIssueDate: p.passport_issue_date,
          passportExpiry: p.passport_expiry_date,
          issuingCountry: p.passport_issuing_country,
          nationality: p.nationality
        }));

        const payload = {
          tripID: args.tripId,
          departureDate: args.departDate,
          originTerminalCode: args.origin,
          destinationTerminalCode: args.destination,
          contactEmail: args.buyer.email,
          contactMobileNumber: args.buyer.mobile_number,
          passengers: mappedPassengers
        };
        const res = await axios.post(`${baseUrl}/api/ferry/booking`, payload);
        
        if (res.data?.rc === "00") {
          socket.emit("chat:tool_result", {
            type: "booking_summary",
            data: res.data.data
          });
          return JSON.stringify({ success: true, bookingCode: res.data.data.bookingCode });
        } else {
          return JSON.stringify({ error: res.data?.message || "Booking failed" });
        }
      }
      else if (name === "generate_midtrans_payment") {
        const orderId = `ORDER-${args.bookingCode}-${Math.round((new Date()).getTime() / 1000)}`;
        const payload = {
          transaction_details: {
            order_id: orderId,
            gross_amount: parseInt(args.amount)
          },
          customer_details: {
            name: args.name || "Customer",
            email: args.email || "test@tiketq.com",
            phone: args.phone || "08123456789"
          },
          item_details: [
            {
              id: args.bookingCode,
              price: parseInt(args.amount),
              quantity: 1,
              name: "TiketQ Booking"
            }
          ]
        };
        const res = await axios.post(`${baseUrl}/api/flight/payment/midtrans`, payload);
        
        if (res.data?.token) {
          socket.emit("chat:tool_result", {
            type: "qris_payment",
            data: {
              bookingCode: args.bookingCode,
              amount: args.amount,
              token: res.data.token
            }
          });
          return JSON.stringify({ success: true, message: "Payment UI presented to user" });
        } else {
          return JSON.stringify({ error: "Failed to generate payment token" });
        }
      }
      else if (name === "get_booking_info") {
        const res = await axios.get(`${baseUrl}/api/flight/book-info/${args.bookingCode}`);
        socket.emit("chat:tool_result", {
          type: "booking_summary",
          data: res.data?.data || null
        });
        
        return JSON.stringify(res.data?.data || { error: "Booking not found" });
      }
      else if (name === "show_customer_service") {
        socket.emit("chat:tool_result", {
          type: "customer_service_card",
          data: {}
        });
        
        return JSON.stringify({ success: true, message: "Customer service card displayed." });
      }
    } catch (err) {
      console.error(`Error executing tool ${name}:`, err.response?.data || err.message);
      return JSON.stringify({ error: err.response?.data?.msg || err.message });
    }
  }

  async processMessage(sessionId, messageText, socket) {
    const openai = getOpenAI();
    const messages = this.getSession(sessionId);

    messages.push({ role: "user", content: messageText });

    try {
      socket.emit("chat:typing");

      let response = await openai.chat.completions.create({
        model: process.env.AI_MODEL || "gemini/gemini-2.5-flash-lite",
        messages: trimMessages(messages),
        tools: tools,
        tool_choice: "auto",
      });

      let responseMessage = response.choices[0].message;

      let iterations = 0;
      const MAX_ITERATIONS = 10;

      while (responseMessage.tool_calls) {
        if (++iterations > MAX_ITERATIONS) {
          console.error(`Chat loop exceeded ${MAX_ITERATIONS} iterations for session ${sessionId}`);
          socket.emit("chat:error", { message: "Maaf, terjadi kesalahan. Silakan coba lagi." });
          break;
        }

        messages.push(responseMessage);

        for (const toolCall of responseMessage.tool_calls) {
          const functionResult = await this.handleToolCall(toolCall, socket);

          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            name: toolCall.function.name,
            content: functionResult
          });
        }

        socket.emit("chat:typing");
        response = await openai.chat.completions.create({
          model: process.env.AI_MODEL || "gemini/gemini-2.5-flash-lite",
          messages: trimMessages(messages),
          tools: tools,
          tool_choice: "auto",
        });

        responseMessage = response.choices[0].message;
      }

      if (iterations <= MAX_ITERATIONS) {
        messages.push(responseMessage);
        socket.emit("chat:response_done", {
          content: responseMessage.content
        });
      }

    } catch (err) {
      console.error("OpenAI API Error:", err);
      socket.emit("chat:error", { message: "Sorry, I encountered an error while processing your request." });
    }
  }
}

module.exports = new ChatService();
