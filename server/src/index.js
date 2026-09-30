import express from "express";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import cors from "cors";
import { Server } from "socket.io";
import {
  createRoom,
  getRoom,
  deleteRoom,
  makePlayer,
  MAX_PLAYERS,
  PHASES,
} from "./rooms.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 4000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || true; // reflect origin in dev

const app = express();
app.use(cors());
app.get("/health", (_req, res) => res.json({ ok: true }));

// Serve the built client (npm run build) in production, if present.
const clientDist = path.resolve(__dirname, "../../client/dist");
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get("*", (_req, res) => res.sendFile(path.join(clientDist, "index.html")));
}

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: CLIENT_ORIGIN, methods: ["GET", "POST"] },
});

const AVATARS = ["🦊", "🐼", "🐸", "🦁", "🐵", "🐙", "🦉", "🐯", "🐨", "🦄", "🐷", "🐢"];

function pickAvatar(room) {
  const used = new Set(room.playerList.map((p) => p.avatar));
  const free = AVATARS.filter((a) => !used.has(a));
  const pool = free.length ? free : AVATARS;
  return pool[Math.floor(Math.random() * pool.length)];
}

/** Broadcast public state + deliver private roles to each connected player. */
function sync(room) {
  const state = room.publicState();
  io.to(room.code).emit("room:state", state);
  if (room.phase !== PHASES.LOBBY) {
    for (const p of room.playerList) {
      if (p.socketId) {
        io.to(p.socketId).emit("room:role", room.roleFor(p.id));
      }
    }
  }
}

io.on("connection", (socket) => {
  // Track which room/player this socket belongs to.
  socket.data.roomCode = null;
  socket.data.playerId = null;

  function currentRoom() {
    return socket.data.roomCode ? getRoom(socket.data.roomCode) : null;
  }

  function attach(room, player) {
    socket.data.roomCode = room.code;
    socket.data.playerId = player.id;
    player.socketId = socket.id;
    player.connected = true;
    socket.join(room.code);
  }

  socket.on("room:create", ({ name, playerId }, cb) => {
    const cleanName = String(name || "").trim().slice(0, 16);
    if (!cleanName) return cb?.({ error: "Please enter a name." });
    const room = createRoom();
    const player = makePlayer(playerId, cleanName, pickAvatar(room));
    room.addPlayer(player);
    attach(room, player);
    cb?.({ ok: true, code: room.code });
    sync(room);
  });

  socket.on("room:join", ({ code, name, playerId }, cb) => {
    const room = getRoom(code);
    if (!room) return cb?.({ error: "Room not found." });

    const existing = room.players.get(playerId);
    if (existing) {
      // Reconnect / rejoin same identity.
      existing.name = String(name || existing.name).trim().slice(0, 16) || existing.name;
      attach(room, existing);
      cb?.({ ok: true, code: room.code });
      return sync(room);
    }

    if (room.phase !== PHASES.LOBBY)
      return cb?.({ error: "Game already in progress." });
    if (room.players.size >= MAX_PLAYERS)
      return cb?.({ error: "Room is full." });

    const cleanName = String(name || "").trim().slice(0, 16);
    if (!cleanName) return cb?.({ error: "Please enter a name." });
    const player = makePlayer(playerId, cleanName, pickAvatar(room));
    room.addPlayer(player);
    attach(room, player);
    cb?.({ ok: true, code: room.code });
    sync(room);
  });

  socket.on("game:start", (_p, cb) => {
    const room = currentRoom();
    if (!room) return cb?.({ error: "Not in a room." });
    if (room.hostId !== socket.data.playerId)
      return cb?.({ error: "Only the host can start." });
    const res = room.startRound();
    if (res.error) return cb?.(res);
    cb?.({ ok: true });
    sync(room);
  });

  socket.on("room:settings", (settings, cb) => {
    const room = currentRoom();
    if (!room) return cb?.({ error: "Not in a room." });
    if (room.hostId !== socket.data.playerId)
      return cb?.({ error: "Only the host can change settings." });
    if (room.phase !== "lobby")
      return cb?.({ error: "Settings can only change in the lobby." });
    room.updateSettings(settings || {});
    cb?.({ ok: true });
    sync(room);
  });

  socket.on("room:kick", ({ playerId }, cb) => {
    const room = currentRoom();
    if (!room) return cb?.({ error: "Not in a room." });
    if (room.hostId !== socket.data.playerId)
      return cb?.({ error: "Only the host can kick players." });
    if (playerId === socket.data.playerId)
      return cb?.({ error: "You can't kick yourself." });
    const target = room.players.get(playerId);
    if (!target) return cb?.({ error: "Player not found." });
    if (target.socketId) {
      io.to(target.socketId).emit("room:kicked");
      const s = io.sockets.sockets.get(target.socketId);
      if (s) {
        s.leave(room.code);
        s.data.roomCode = null;
        s.data.playerId = null;
      }
    }
    room.removePlayer(playerId);
    cb?.({ ok: true });
    if (room.players.size === 0) deleteRoom(room.code);
    else sync(room);
  });

  socket.on("game:emote", ({ emote }, cb) => {
    const room = currentRoom();
    if (!room) return cb?.({ error: "Not in a room." });
    const allowed = ["👍", "😂", "🤔", "😱", "🔥", "❤️", "🤨", "🎉"];
    if (!allowed.includes(emote)) return cb?.({ error: "Unknown emote." });
    io.to(room.code).emit("room:emote", {
      playerId: socket.data.playerId,
      emote,
      at: Date.now(),
    });
    cb?.({ ok: true });
  });

  socket.on("game:clue", ({ text }, cb) => {
    const room = currentRoom();
    if (!room) return cb?.({ error: "Not in a room." });
    const res = room.submitClue(socket.data.playerId, text);
    if (res.error) return cb?.(res);
    cb?.({ ok: true });
    sync(room);
  });

  socket.on("game:vote", ({ targetId }, cb) => {
    const room = currentRoom();
    if (!room) return cb?.({ error: "Not in a room." });
    const res = room.submitVote(socket.data.playerId, targetId);
    if (res.error) return cb?.(res);
    cb?.({ ok: true });
    sync(room);
  });

  socket.on("game:next", (_p, cb) => {
    const room = currentRoom();
    if (!room) return cb?.({ error: "Not in a room." });
    if (room.hostId !== socket.data.playerId)
      return cb?.({ error: "Only the host can continue." });
    const res = room.startRound();
    if (res.error) return cb?.(res);
    cb?.({ ok: true });
    sync(room);
  });

  socket.on("game:lobby", (_p, cb) => {
    const room = currentRoom();
    if (!room) return cb?.({ error: "Not in a room." });
    if (room.hostId !== socket.data.playerId)
      return cb?.({ error: "Only the host can do that." });
    room.backToLobby();
    cb?.({ ok: true });
    sync(room);
  });

  socket.on("room:leave", () => {
    const room = currentRoom();
    if (!room) return;
    room.removePlayer(socket.data.playerId);
    socket.leave(room.code);
    socket.data.roomCode = null;
    socket.data.playerId = null;
    if (room.players.size === 0) deleteRoom(room.code);
    else sync(room);
  });

  socket.on("disconnect", () => {
    const room = currentRoom();
    if (!room) return;
    const player = room.players.get(socket.data.playerId);
    if (player) player.connected = false;

    // If nobody is connected, clean up after a grace period.
    if (room.activePlayers().length === 0) {
      setTimeout(() => {
        const r = getRoom(room.code);
        if (r && r.activePlayers().length === 0) deleteRoom(room.code);
      }, 60_000);
    }
    sync(room);
  });
});

server.listen(PORT, () => {
  console.log(`⚡ Imposter server listening on http://localhost:${PORT}`);
});
