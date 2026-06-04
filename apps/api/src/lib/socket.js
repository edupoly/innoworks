import { Server } from "socket.io";

let io = null;

export const initSocket = (httpServer, options) => {
  io = new Server(httpServer, options);
  return io;
};

export const getIO = () => {
  return io;
};
