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
          adult: { type: "integer", description: "Defaults to 1" }
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
          adult: { type: "integer" }
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
          adult: { type: "integer" }
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
                    passport_issue_date: { type: "string" },
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
  }
];

class ChatService {
  constructor() {
    this.sessions = new Map();
  }

  getSession(sessionId) {
    if (!this.sessions.has(sessionId)) {
      const today = new Date();
      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const dayName = days[today.getDay()];
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      this.sessions.set(sessionId, [
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
- Batam -> BTH
- Bali -> DPS
- Singapore -> SIN

You DO NOT need to ask for passenger details to search for flights. Assume 1 adult by default.
Execute flight/ferry searches and list the results nicely in chat. 
CRITICAL RULE: Always present flight and ferry search results using a clean Markdown table so it renders properly. You MUST include columns for Airline/Ferry, Depart Time, Arrive Time, Duration, and Price. 
Example format:
| Airline | Depart | Arrive | Duration | Price |
|---|---|---|---|---|
| Citilink | 10:00 | 11:30 | 1h 30m | Rp 900,000 |

CRITICAL RULE: If no flights are found for a search, you MUST explicitly state the origin, destination, and date in your response. Example: "There are no flights found for tomorrow from BTH to CGK. Would you like to try another date?"
CRITICAL RULE: When a user wants to proceed to booking, you MUST ask for their details conversationally first: Full Name, Email, Phone Number, Date of Birth (and Passport Details if booking a Ferry). Do NOT tell them to fill out a form; you must collect the data in the chat.
Once you have the passenger details, use 'execute_flight_booking' or 'execute_ferry_booking'. 
When user wants to pay, use 'generate_midtrans_payment' tool. Always be concise.`
        }
      ]);
    }
    return this.sessions.get(sessionId);
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
            return {
              searchId: f.searchId,
              airline: f.airlineName,
              departTime: f.departureDate,
              arriveTime: f.arrivalDate,
              price: price,
              isTransit: f.isTransit,
              duration: f.duration
            };
          }).filter(f => f.price !== null && !isNaN(f.price) && f.price > 0);
        }
        
        // Sort by price
        flights.sort((a, b) => a.price - b.price);
        
        if (flights.length === 0) {
          return JSON.stringify({ 
            message: `There are no flights found for ${args.departureDate} from ${args.departure} to ${args.arrival}. Would you like to try another date?` 
          });
        }
        return JSON.stringify(flights.slice(0, 10));
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
              return {
                searchId: f.searchId,
                airline: f.airlineName,
                departTime: f.departureDate,
                arriveTime: f.arrivalDate,
                price: price,
                isTransit: f.isTransit,
                duration: f.duration,
                date: f.departureDate ? f.departureDate.split(' ')[0] : ''
              };
            }).filter(f => f.price !== null && !isNaN(f.price) && f.price > 0);
            
            allFlights = allFlights.concat(mapped);
          }
        });
        
        // Sort by price and get top 5 cheapest
        allFlights.sort((a, b) => a.price - b.price);
        
        if (allFlights.length === 0) {
          return JSON.stringify({ 
            message: `There are no flights found between ${args.startDate} and ${args.endDate} from ${args.departure} to ${args.arrival}. Would you like to try another date?` 
          });
        }
        return JSON.stringify(allFlights.slice(0, 5));
      }
      else if (name === "search_ferry_trips") {
        const res = await axios.post(`${baseUrl}/api/ferry/trips`, {
          departDate: args.departureDate,
          originCode: args.origin,
          destinationCode: args.destination,
          paxInfo: { adult: args.adult || 1, child: 0 }
        });
        
        const trips = res.data?.data?.trips?.map(t => ({
          tripId: t.tripId, // crucial for booking
          ferryName: t.ferryName,
          departureTime: t.departureTime,
          arrivalTime: t.arrivalTime,
          seatAvailable: t.seatAvailable
        })) || [];
        
        return JSON.stringify(trips.slice(0, 10));
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
        const payload = {
          tripId: args.tripId,
          departDate: args.departDate,
          originCode: args.origin,
          destinationCode: args.destination,
          paxInfo: {
             adult: args.passengers.adults.length,
             child: 0
          },
          buyer: args.buyer,
          passengers: args.passengers
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
        messages: messages,
        tools: tools,
        tool_choice: "auto",
      });
      
      let responseMessage = response.choices[0].message;
      
      while (responseMessage.tool_calls) {
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
          messages: messages,
          tools: tools,
          tool_choice: "auto",
        });
        
        responseMessage = response.choices[0].message;
      }
      
      messages.push(responseMessage);
      
      socket.emit("chat:response_done", {
        content: responseMessage.content
      });
      
    } catch (err) {
      console.error("OpenAI API Error:", err);
      socket.emit("chat:error", { message: "Sorry, I encountered an error while processing your request." });
    }
  }
}

module.exports = new ChatService();
