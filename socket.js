require("dotenv").config();
let io;
let activeVisitors = 0;

module.exports = {
  init: (server) => {
    const { Server } = require("socket.io");
    io = new Server(server, {
      cors: {
        origin: function (origin, callback) {
          // Allow connection from localhost/127.0.0.1, production domains, or when in production env
          if (
            !origin || 
            origin.includes("localhost") || 
            origin.includes("127.0.0.1") || 
            origin.includes("tiketq.com") ||
            process.env.ENVIRONMENT === "production" || 
            process.env.NODE_ENV === "production"
          ) {
            callback(null, true);
          } else {
            callback(null, false);
          }
        },
        methods: ["GET", "POST"],
        credentials: true
      }
    });

    const chatService = require('./services/chatService');

    io.on("connection", (socket) => {
      console.log("Client connected:", socket.id);
      
      // When a visitor connects
      socket.on("visitor_connected", () => {
        activeVisitors++;
        io.emit("visitors_update", { activeVisitors });
      });

      // Chat events
      socket.on("chat:message", async (data) => {
        const { sessionId, text } = data;
        if (!sessionId || !text) return;
        
        await chatService.processMessage(sessionId, text, socket);
      });

      socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
        // We decrement activeVisitors when a client disconnects, assuming they were a visitor
        // In a real app we'd track session IDs
        if (activeVisitors > 0) activeVisitors--;
        io.emit("visitors_update", { activeVisitors });
      });
    });

    return io;
  },
  getIo: () => {
    if (!io) {
      throw new Error("Socket.io not initialized!");
    }
    return io;
  },
  getActiveVisitors: () => activeVisitors
};
