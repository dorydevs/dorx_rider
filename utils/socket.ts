import { io } from "socket.io-client";

const socket = io("http://192.168.100.73:9001", {
  transports: ["websocket"],
  autoConnect: false,
});

export default socket;
