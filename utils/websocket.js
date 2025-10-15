import { io } from "socket.io-client";

class WebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }

  connect(url = "http://localhost:3001") {
    return new Promise((resolve, reject) => {
      try {
        this.socket = io(url, {
          transports: ["websocket", "polling"],
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
        });

        this.socket.on("connect", () => {
          console.log("WebSocket connected");
          this.isConnected = true;
          resolve(this.socket);
        });

        this.socket.on("connect_error", (error) => {
          console.error("Connection error:", error);
          this.isConnected = false;
          reject(error);
        });

        this.socket.on("disconnect", () => {
          console.log("WebSocket disconnected");
          this.isConnected = false;
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  emit(event, data) {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    }
  }

  getSocket() {
    return this.socket;
  }
}

const websocketService = new WebSocketService();
export default websocketService;
