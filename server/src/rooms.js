import { customAlphabet } from "nanoid";
import { drawWords, isValidCategory, makeHint, pretty } from "./words.js";

const roomCode = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 5);

export const PHASES = {
  LOBBY: "lobby",
  CLUE: "clue",
  VOTE: "vote",
  REVEAL: "reveal",
};

export const MODES = { DIFFERENT: "different", NOWORD: "noword" };

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

/** Max imposters that still leaves a crew majority. */
export function maxImposters(playerCount) {
  if (playerCount < 3) return 1;
  return Math.max(1, Math.floor((playerCount - 1) / 2));
}

const DEFAULT_SETTINGS = {
  mode: MODES.DIFFERENT,
  category: "random",
  imposterCount: 1,
  revealCategory: false,
  voiceMode: false,
};

class Room {
  constructor(code) {
    this.code = code;
    this.phase = PHASES.LOBBY;
    /** @type {Map<string, Player>} playerId -> player */
    this.players = new Map();
    this.hostId = null;
    this.round = 0;
    this.settings = { ...DEFAULT_SETTINGS };

    // per-round state
    this.category = null;
    this.commonWord = null;
    this.imposterWord = null;
    this.hint = null;
    this.imposterIds = [];
    this.order = [];
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

  updateSettings(partial) {
    const s = this.settings;
    if (partial.mode && Object.values(MODES).includes(partial.mode))
      s.mode = partial.mode;
    if (partial.category !== undefined && isValidCategory(partial.category))
      s.category = partial.category;
    if (partial.imposterCount !== undefined) {
      const n = Number(partial.imposterCount);
      if (Number.isInteger(n) && n >= 1) s.imposterCount = n;
    }
    if (partial.revealCategory !== undefined)
      s.revealCategory = !!partial.revealCategory;
    if (partial.voiceMode !== undefined) s.voiceMode = !!partial.voiceMode;

    // keep imposterCount within a sane range for the current room size
    const cap = maxImposters(Math.max(3, this.activePlayers().length));
    s.imposterCount = Math.min(Math.max(1, s.imposterCount), cap);
    return { ok: true };
  }

  /** Sanitized state safe to broadcast to everyone (no secret words/roles). */
  publicState() {
    const revealing = this.phase === PHASES.REVEAL;
    const showCat =
      this.settings.revealCategory && this.phase !== PHASES.LOBBY;
    return {
      code: this.code,
      phase: this.phase,
      hostId: this.hostId,
      round: this.round,
      maxPlayers: MAX_PLAYERS,
      settings: this.settings,
      maxImposters: maxImposters(Math.max(3, this.activePlayers().length)),
      category: showCat || revealing ? this.category : null,
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

    // Words
    const { category, words } = drawWords(this.settings.category, 2);
    this.category = category;
    this.commonWord = pretty(words[0]);
    this.imposterWord =
      this.settings.mode === MODES.DIFFERENT ? pretty(words[1]) : null;
    this.hint =
      this.settings.mode === MODES.NOWORD ? makeHint(this.commonWord) : null;

    // Imposters
    const cap = maxImposters(active.length);
    const count = Math.min(Math.max(1, this.settings.imposterCount), cap);
    const ids = active.map((p) => p.id);
    this.imposterIds = shuffle(ids).slice(0, count);
    this.order = shuffle(ids);
    return { ok: true };
  }

  isImposter(playerId) {
    return this.imposterIds.includes(playerId);
  }

  /** Private per-player payload with their secret word/role. */
  roleFor(playerId) {
    if (this.phase === PHASES.LOBBY) return null;
    const imposter = this.isImposter(playerId);
    const allies = imposter
      ? this.imposterIds
          .filter((id) => id !== playerId)
          .map((id) => this.players.get(id)?.name)
          .filter(Boolean)
      : [];
    return {
      round: this.round,
      mode: this.settings.mode,
      isImposter: imposter,
      word: imposter ? this.imposterWord : this.commonWord, // null for noword imposter
      category:
        imposter || this.settings.revealCategory ? this.category : null,
      hint: imposter ? this.hint : null,
      imposterCount: this.imposterIds.length,
      allies,
    };
  }

  submitClue(playerId, text) {
    if (this.phase !== PHASES.CLUE) return { error: "Not the clue phase." };
    if (this.order[this.turnIndex] !== playerId)
      return { error: "It is not your turn." };
    const clean = String(text || "").trim().slice(0, 40);
    // In voice mode the typed note is optional (players describe aloud).
    if (!clean && !this.settings.voiceMode)
      return { error: "Clue cannot be empty." };
    this.clues.set(playerId, clean);
    this.turnIndex += 1;
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

    const votedOutImposter = !tie && this.isImposter(topId);
    const caught = votedOutImposter;

    if (caught) {
      for (const [voterId, targetId] of this.votes.entries()) {
        if (this.isImposter(targetId) && !this.isImposter(voterId)) {
          const p = this.players.get(voterId);
          if (p) p.score += 1;
        }
      }
    } else {
      for (const impId of this.imposterIds) {
        const imp = this.players.get(impId);
        if (imp) imp.score += 3;
      }
    }

    this.result = {
      mode: this.settings.mode,
      imposterIds: [...this.imposterIds],
      imposterWord: this.imposterWord,
      commonWord: this.commonWord,
      category: this.category,
      hint: this.hint,
      votedOutId: tie ? null : topId,
      tie,
      caught,
      tally: [...counts.entries()].map(([id, count]) => ({ id, count })),
    };
    this.phase = PHASES.REVEAL;
  }

  backToLobby() {
    this.phase = PHASES.LOBBY;
    this.category = null;
    this.commonWord = null;
    this.imposterWord = null;
    this.hint = null;
    this.imposterIds = [];
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
