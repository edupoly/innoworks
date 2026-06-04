import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL || "https://innoworks-api.up.railway.app";

let socket = null;

export const initiateSocket = (userId) => {
  if (socket) return socket;

  const token = localStorage.getItem("token");

  socket = io(SOCKET_URL, {
    withCredentials: true,
    auth: { token },
    transports: ["websocket", "polling"]
  });

  console.log("🔌 Connecting to Socket.IO...");

  socket.on("connect", () => {
    console.log("✅ Socket connected!");
    if (userId) {
      socket.emit("join", userId);
    }
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    console.log("🔌 Disconnecting Socket...");
    socket.disconnect();
    socket = null;
  }
};

export const subscribeToNotifications = (callback) => {
  if (!socket) return;
  
  socket.on("notification", (data) => {
    console.log("📩 New real-time notification received:", data);
    callback(data);
  });
};

export const unsubscribeFromNotifications = () => {
  if (!socket) return;
  socket.off("notification");
};
