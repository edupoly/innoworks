import { Server } from "socket.io";

let io = null;

export const initSocket = (httpServer, options) => {
  io = new Server(httpServer, options);

  io.on("connection", (socket) => {
    // console.log("🔌 New socket connection:", socket.id);

    socket.on("join", (userId) => {
      if (userId) {
        socket.join(userId.toString());
        // console.log(`👤 User joined room: ${userId}`);
      }
    });

    socket.on("disconnect", () => {
      // console.log("🔌 Socket disconnected:", socket.id);
    });
  });

  return io;
};

export const getIO = () => {
  return io;
};

/**
 * Emit an event to a specific user's room
 */
export const emitToUser = (userId, event, data) => {
  if (io) {
    io.to(userId.toString()).emit(event, data);
  }
};

/**
 * Broadcast an event to all connected clients
 */
export const broadcast = (event, data) => {
  if (io) {
    io.emit(event, data);
  }
};
