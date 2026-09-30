import { io } from "socket.io-client";

// In dev, Vite proxies /socket.io -> localhost:4000 (see vite.config.js).
// In prod, the server serves the client on the same origin.
const URL = import.meta.env.VITE_SERVER_URL || undefined;

export const socket = io(URL, {
  autoConnect: true,
  transports: ["websocket", "polling"],
});

// Persistent identity so a player can reconnect / rejoin the same seat.
export function getPlayerId() {
  let id = localStorage.getItem("imposter_pid");
  if (!id) {
    id =
      "p_" +
      Math.random().toString(36).slice(2, 10) +
      Date.now().toString(36).slice(-4);
    localStorage.setItem("imposter_pid", id);
  }
  return id;
}

export function getSavedName() {
  return localStorage.getItem("imposter_name") || "";
}

export function saveName(name) {
  localStorage.setItem("imposter_name", name);
}

// Remember which room we're in so we can auto-rejoin after a refresh / drop.
export function getSavedRoom() {
  return localStorage.getItem("imposter_room") || "";
}

export function saveRoom(code) {
  if (code) localStorage.setItem("imposter_room", code);
}

export function clearSavedRoom() {
  localStorage.removeItem("imposter_room");
}

// Promise wrapper around emit-with-ack. Times out so the UI never hangs
// silently if the server never acks (e.g. connection drops mid-request).
export function emit(event, payload, timeoutMs = 8000) {
  return new Promise((resolve) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      resolve({ error: "Request timed out. Check your connection and try again." });
    }, timeoutMs);
    socket.emit(event, payload, (res) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(res || {});
    });
  });
}
