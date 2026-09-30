import { customAlphabet } from "nanoid";
import { randomWordPair } from "./words.js";

const roomCode = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 5);

export const PHASES = {
  LOBBY: "lobby",
  CLUE: "clue",
  VOTE: "vote",
  REVEAL: "reveal",
};

const MAX_PLAYERS = 12;

/** @type {Map<string, Room>} */
const rooms = new Map();

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

class Room {
  constructor(code) {
    this.code = code;
    this.phase = PHASES.LOBBY;
    /** @type {Map<string, Player>} playerId -> player */
    this.players = new Map();
    this.hostId = null;
    this.round = 0;

    // per-round state
    this.commonWord = null;
    this.imposterWord = null;
    this.imposterId = null;
    this.order = []; // playerIds in clue order
    this.turnIndex = 0;
    this.clues = new Map(); // playerId -> clue string
    this.votes = new Map(); // voterId -> targetId
    this.result = null;
  }

  get playerList() {
    return [...this.players.values()];
  }

  activePlayers() {
    return this.playerList.filter((p) => p.connected);
  }

  addPlayer(player) {
    if (this.players.size === 0) this.hostId = player.id;
    this.players.set(player.id, player);
  }

  removePlayer(id) {
    this.players.delete(id);
    if (this.hostId === id) {
      const next = this.activePlayers()[0] || this.playerList[0];
      this.hostId = next ? next.id : null;
    }
  }

  /** Sanitized state safe to broadcast to everyone (no secret words/roles). */
  publicState() {
    const revealing = this.phase === PHASES.REVEAL;
    return {
      code: this.code,
      phase: this.phase,
      hostId: this.hostId,
      round: this.round,
      maxPlayers: MAX_PLAYERS,
      players: this.playerList.map((p) => ({
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        connected: p.connected,
        score: p.score,
        isHost: p.id === this.hostId,
        hasClued: this.clues.has(p.id),
        hasVoted: this.votes.has(p.id),
      })),
      order: this.order,
      turnId: this.order[this.turnIndex] || null,
      clues: [...this.clues.entries()].map(([playerId, text]) => ({
        playerId,
        text,
      })),
      votesCount: this.votes.size,
      // Only expose vote targets + roles during reveal.
      votes: revealing
        ? [...this.votes.entries()].map(([voterId, targetId]) => ({
            voterId,
            targetId,
          }))
        : [],
      result: revealing ? this.result : null,
    };
  }

  startRound() {
    const active = this.activePlayers();
    if (active.length < 3) {
      return { error: "Need at least 3 players to start." };
    }
    this.round += 1;
    this.phase = PHASES.CLUE;
    this.clues = new Map();
    this.votes = new Map();
    this.result = null;
    this.turnIndex = 0;

    const pair = randomWordPair();
    this.commonWord = pair.common;
    this.imposterWord = pair.imposter;

    const ids = active.map((p) => p.id);
    this.imposterId = ids[Math.floor(Math.random() * ids.length)];
    this.order = shuffle(ids);
    return { ok: true };
  }

  /** Private per-player payload with their secret word/role. */
  roleFor(playerId) {
    if (this.phase === PHASES.LOBBY) return null;
    const isImposter = playerId === this.imposterId;
    return {
      round: this.round,
      isImposter,
      word: isImposter ? this.imposterWord : this.commonWord,
    };
  }

  submitClue(playerId, text) {
    if (this.phase !== PHASES.CLUE) return { error: "Not the clue phase." };
    if (this.order[this.turnIndex] !== playerId)
      return { error: "It is not your turn." };
    const clean = String(text || "").trim().slice(0, 40);
    if (!clean) return { error: "Clue cannot be empty." };
    this.clues.set(playerId, clean);
    this.turnIndex += 1;
    // Advance past disconnected players
    while (
      this.turnIndex < this.order.length &&
      !this.players.get(this.order[this.turnIndex])?.connected
    ) {
      this.turnIndex += 1;
    }
    if (this.turnIndex >= this.order.length) {
      this.phase = PHASES.VOTE;
    }
    return { ok: true };
  }

  submitVote(voterId, targetId) {
    if (this.phase !== PHASES.VOTE) return { error: "Not the voting phase." };
    if (!this.players.has(targetId)) return { error: "Invalid vote target." };
    if (targetId === voterId) return { error: "You cannot vote for yourself." };
    this.votes.set(voterId, targetId);

    const voters = this.activePlayers().map((p) => p.id);
    const allVoted = voters.every((id) => this.votes.has(id));
    if (allVoted) this.tally();
    return { ok: true };
  }

  tally() {
    const counts = new Map();
    for (const targetId of this.votes.values()) {
      counts.set(targetId, (counts.get(targetId) || 0) + 1);
    }
    let topId = null;
    let topCount = -1;
    let tie = false;
    for (const [id, c] of counts.entries()) {
      if (c > topCount) {
        topCount = c;
        topId = id;
        tie = false;
      } else if (c === topCount) {
        tie = true;
      }
    }

    const caught = !tie && topId === this.imposterId;

    // Scoring
    if (caught) {
      for (const [voterId, targetId] of this.votes.entries()) {
        if (targetId === this.imposterId && voterId !== this.imposterId) {
          const p = this.players.get(voterId);
          if (p) p.score += 1;
        }
      }
    } else {
      const imp = this.players.get(this.imposterId);
      if (imp) imp.score += 3;
    }

    this.result = {
      imposterId: this.imposterId,
      imposterWord: this.imposterWord,
      commonWord: this.commonWord,
      votedOutId: tie ? null : topId,
      tie,
      caught,
      tally: [...counts.entries()].map(([id, count]) => ({ id, count })),
    };
    this.phase = PHASES.REVEAL;
  }

  backToLobby() {
    this.phase = PHASES.LOBBY;
    this.commonWord = null;
    this.imposterWord = null;
    this.imposterId = null;
    this.order = [];
    this.turnIndex = 0;
    this.clues = new Map();
    this.votes = new Map();
    this.result = null;
  }
}

class Player {
  constructor(id, name, avatar) {
    this.id = id;
    this.name = name;
    this.avatar = avatar;
    this.connected = true;
    this.score = 0;
    this.socketId = null;
  }
}

export function createRoom() {
  let code = roomCode();
  while (rooms.has(code)) code = roomCode();
  const room = new Room(code);
  rooms.set(code, room);
  return room;
}

export function getRoom(code) {
  return rooms.get(String(code || "").toUpperCase());
}

export function deleteRoom(code) {
  rooms.delete(code);
}

export function makePlayer(id, name, avatar) {
  return new Player(id, name, avatar);
}

export { MAX_PLAYERS };
