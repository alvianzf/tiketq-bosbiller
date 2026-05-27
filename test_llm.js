require('dotenv').config();
const { OpenAI } = require('openai');

async function testLLM() {
  const openai = new OpenAI({
    apiKey: process.env.AI_API_KEY || process.env.OPENAI_API_KEY,
    baseURL: process.env.AI_BASE_URL || process.env.OPENAI_BASE_URL
  });

  try {
    const today = new Date();
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayName = days[today.getDay()];
    
    const response = await openai.chat.completions.create({
      model: process.env.AI_MODEL || "gemini/gemini-2.5-flash-lite",
      messages: [
        { 
          role: "system", 
          content: `You are an agentic travel assistant. 
CURRENT DATE CONTEXT: Today is ${dayName}, ${today.toDateString()}.
When the user says 'tomorrow', calculate the exact YYYY-MM-DD date relative to today's date.` 
        },
        { role: "user", content: "tomorrow" }
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "search_flights",
            description: "Search for flights between two cities.",
            parameters: {
              type: "object",
              properties: {
                departure: { type: "string" },
                arrival: { type: "string" },
                departureDate: { type: "string", description: "YYYY-MM-DD format" }
              },
              required: ["departure", "arrival", "departureDate"]
            }
          }
        }
      ]
    });

    console.log(JSON.stringify(response.choices[0].message, null, 2));
  } catch (e) {
    console.error(e);
  }
}

testLLM();
