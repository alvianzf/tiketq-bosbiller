let io;
let activeVisitors = 0;

module.exports = {
  init: (server) => {
    const { Server } = require("socket.io");
    const isProduction = process.env.ENVIRONMENT === "production";
    io = new Server(server, {
      cors: {
        origin: isProduction ? false : "*", // Nginx handles CORS headers on production — avoid duplicate headers
        methods: ["GET", "POST"]
      }
    });

    io.on("connection", (socket) => {
      console.log("Client connected:", socket.id);
      
      // When a visitor connects
      socket.on("visitor_connected", () => {
        activeVisitors++;
        io.emit("visitors_update", { activeVisitors });
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
