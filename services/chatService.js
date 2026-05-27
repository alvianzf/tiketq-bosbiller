const { OpenAI } = require("openai");
const axios = require("axios");

// Memoize instance
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
      description: "Search for available flights. Returns flight schedules and prices. Always confirm passenger counts before searching, default to 1 adult if unspecified.",
      parameters: {
        type: "object",
        properties: {
          departure: { type: "string", description: "Departure airport code (e.g. CGK)" },
          arrival: { type: "string", description: "Arrival airport code (e.g. DPS)" },
          departureDate: { type: "string", description: "Departure date in YYYY-MM-DD format" },
          returnDate: { type: "string", description: "Return date in YYYY-MM-DD format, leave empty for one-way" },
          adult: { type: "integer", description: "Number of adults (default 1)" },
          child: { type: "integer", description: "Number of children (default 0)" },
          infant: { type: "integer", description: "Number of infants (default 0)" }
        },
        required: ["departure", "arrival", "departureDate", "adult"]
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
          origin: { type: "string", description: "Origin port code (e.g. BTC for Batam Centre)" },
          destination: { type: "string", description: "Destination port code (e.g. HFC for HarbourFront)" },
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
      name: "get_booking_info",
      description: "Get information about an existing flight or ferry booking. Do this when user provides a booking code or asks for booking status.",
      parameters: {
        type: "object",
        properties: {
          bookingCode: { type: "string", description: "The booking code" }
        },
        required: ["bookingCode"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "request_booking_form",
      description: "Show a booking form to the user. Call this when the user says they want to book a specific flight or ferry.",
      parameters: {
        type: "object",
        properties: {
          serviceType: { type: "string", enum: ["FLIGHT", "FERRY"] },
          details: { type: "string", description: "Summary of what is being booked" },
          price: { type: "number", description: "The total price to display" }
        },
        required: ["serviceType", "details", "price"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "request_qris_payment",
      description: "Show a QRIS payment QR code to the user for a booking.",
      parameters: {
        type: "object",
        properties: {
          bookingCode: { type: "string" },
          amount: { type: "number" }
        },
        required: ["bookingCode", "amount"]
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
      this.sessions.set(sessionId, [
        { 
          role: "system", 
          content: `You are a helpful travel assistant for TiketQ. You can search flights, ferries, check bookings, and handle booking/payment requests. 
When user asks for flights/ferries, ask for missing details (origin, destination, date, passengers).
When presenting flights/ferries, present them nicely, focusing on airlines, times, and price. 
When user wants to book, use the request_booking_form tool. 
When user wants to pay via QRIS, use the request_qris_payment tool.
Keep responses friendly and concise.`
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
          returnDate: args.returnDate || "",
          adult: args.adult || 1,
          child: args.child || 0,
          infant: args.infant || 0
        };
        const res = await axios.post(`${baseUrl}/api/flight/search`, payload);
        
        // Summarize data to avoid blowing up the token context
        const flights = res.data?.data?.schedule?.depart?.map(f => ({
          airline: f.airline,
          flightNumber: f.flight_number,
          departTime: f.depart_time,
          arriveTime: f.arrive_time,
          price: f.price,
          currency: f.currency,
          duration: f.duration
        })) || [];
        
        return JSON.stringify(flights.slice(0, 10)); // return top 10
      }
      else if (name === "search_ferry_trips") {
        const res = await axios.post(`${baseUrl}/api/ferry/trips`, {
          departDate: args.departureDate,
          originCode: args.origin,
          destinationCode: args.destination,
          paxInfo: {
             adult: args.adult || 1,
             child: 0
          }
        });
        
        const trips = res.data?.data?.trips?.map(t => ({
          tripId: t.tripId,
          ferryName: t.ferryName,
          departureTime: t.departureTime,
          arrivalTime: t.arrivalTime,
          seatAvailable: t.seatAvailable
        })) || [];
        
        return JSON.stringify(trips.slice(0, 10));
      }
      else if (name === "get_booking_info") {
        const res = await axios.get(`${baseUrl}/api/flight/book-info/${args.bookingCode}`);
        // Also emit a tool_result to show a nice card to user
        socket.emit("chat:tool_result", {
          type: "booking_summary",
          data: res.data?.data || null
        });
        
        return JSON.stringify(res.data?.data || { error: "Booking not found" });
      }
      else if (name === "request_booking_form") {
        socket.emit("chat:tool_result", {
          type: "booking_form",
          data: {
            serviceType: args.serviceType,
            details: args.details,
            price: args.price
          }
        });
        return "Booking form presented to user.";
      }
      else if (name === "request_qris_payment") {
        socket.emit("chat:tool_result", {
          type: "qris_payment",
          data: {
            bookingCode: args.bookingCode,
            amount: args.amount,
            qrUrl: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=QRIS_DEMO_${args.bookingCode}_${args.amount}` // dummy QR for now, you could integrate real Midtrans here
          }
        });
        return "QRIS Payment QR presented to user.";
      }
    } catch (err) {
      console.error(`Error executing tool ${name}:`, err.message);
      return JSON.stringify({ error: err.message });
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
      
      // Handle tool calls
      while (responseMessage.tool_calls) {
        messages.push(responseMessage); // Add assistant's tool call message
        
        for (const toolCall of responseMessage.tool_calls) {
          const functionResult = await this.handleToolCall(toolCall, socket);
          
          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            name: toolCall.function.name,
            content: functionResult
          });
        }
        
        // Get the next response from the model
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
      
      // Just emit the final response for simplicity (could be streamed)
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
