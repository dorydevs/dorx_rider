// socket.js
import { io } from "socket.io-client";

const SOCKET_URL = "http://192.168.1.9:9001";

const deliveredSocket = io(SOCKET_URL, {
  query: {
    userType: "real", // Or "bot"
  },
  autoConnect: false,
  transports: ["websocket", "polling"], // fallback support
  reconnection: true,
  reconnectionAttempts: 100, // try 5 times before giving up
  reconnectionDelay: 1000, // wait 1s between retries
  timeout: 5000, // connection timeout
});

// === Connection Events ===
deliveredSocket.on("connect", () => {
  console.warn("🟢 socket server:", deliveredSocket.id);
});

deliveredSocket.on("disconnect", (reason) => {
  console.warn("🔴  from deliveredSocket:", reason);
  if (reason === "io server disconnect") {
    // Manually reconnect if server disconnects the client
    deliveredSocket.connect();
  }
});

deliveredSocket.on("connect_error", (error) => {
  console.error("❌ CHAT IO Connection Error:", error);
});

deliveredSocket.on("reconnect_attempt", (attempt) => {
  console.log(`♻️ CHAT IO Reconnect Attempt #${attempt}`);
});

deliveredSocket.on("reconnect_failed", () => {
  console.error("🚫 CHAT IO Reconnection failed after max attempts");
});

deliveredSocket.on("error", (err) => {
  console.error("⚠️ CHAT IO Socket Error:", err);
});

export default deliveredSocket;
