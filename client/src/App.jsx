import { useEffect, useState, useCallback, createContext, useContext } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { socket, getPlayerId, getSavedName, saveName, emit, saveRoom, clearSavedRoom, getSavedRoom } from "./socket.js";
import Home from "./components/Home.jsx";
import WaitingRoom from "./components/WaitingRoom.jsx";
import CluePhase from "./components/CluePhase.jsx";
import VotePhase from "./components/VotePhase.jsx";
import RevealPhase from "./components/RevealPhase.jsx";
import Toasts from "./components/Toasts.jsx";
import EmoteLayer from "./components/EmoteLayer.jsx";

export const GameCtx = createContext(null);
export const useGame = () => useContext(GameCtx);

let toastId = 0;
let emoteId = 0;

export default function App() {
  const [connected, setConnected] = useState(socket.connected);
  const [room, setRoom] = useState(null); // public state
  const [role, setRole] = useState(null); // private word/role
  const [name, setName] = useState(getSavedName());
  const [toasts, setToasts] = useState([]);
  const [emotes, setEmotes] = useState([]); // floating reactions
  const [restoring, setRestoring] = useState(!!getSavedRoom());
  const [busy, setBusy] = useState(false); // guards double-tap create/join
  const playerId = getPlayerId();

  const pushToast = useCallback((message, type = "info") => {
    const id = ++toastId;
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  useEffect(() => {
    // Try to restore our seat after a refresh or a dropped connection.
    const attemptRejoin = async () => {
      const code = getSavedRoom();
      if (!code) return;
      const res = await emit("room:join", {
        code,
        name: getSavedName(),
        playerId,
      });
      if (res.error) {
        // Room is gone (e.g. everyone left) — forget the stale code.
        clearSavedRoom();
        setRoom(null);
        setRole(null);
      }
      setRestoring(false);
    };

    const onConnect = () => {
      setConnected(true);
      attemptRejoin();
    };
    const onDisconnect = () => setConnected(false);
    const onState = (s) => {
      setRoom(s);
      setRestoring(false);
    };
    const onRole = (r) => setRole(r);
    const onEmote = ({ playerId: pid, emote }) => {
      const id = ++emoteId;
      setEmotes((e) => [...e, { id, playerId: pid, emote }]);
      setTimeout(() => setEmotes((e) => e.filter((x) => x.id !== id)), 2600);
    };
    const onKicked = () => {
      clearSavedRoom();
      setRoom(null);
      setRole(null);
      pushToast("You were removed from the room", "error");
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("room:state", onState);
    socket.on("room:role", onRole);
    socket.on("room:emote", onEmote);
    socket.on("room:kicked", onKicked);

    // If the socket connected before this effect ran (autoConnect), rejoin now.
    if (socket.connected) attemptRejoin();

    // Safety net: never get stuck on the restoring screen.
    const t = setTimeout(() => setRestoring(false), 4500);

    return () => {
      clearTimeout(t);
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("room:state", onState);
      socket.off("room:role", onRole);
      socket.off("room:emote", onEmote);
      socket.off("room:kicked", onKicked);
    };
  }, [pushToast, playerId]);

  // Reset private role whenever we go back to lobby.
  useEffect(() => {
    if (room?.phase === "lobby") setRole(null);
  }, [room?.phase]);

  const me = room?.players.find((p) => p.id === playerId) || null;
  const isHost = me?.isHost;

  const actions = {
    async create() {
      if (busy) return;
      if (!name.trim()) return pushToast("Enter a name first", "error");
      setBusy(true);
      saveName(name.trim());
      const res = await emit("room:create", { name: name.trim(), playerId });
      setBusy(false);
      if (res.error) pushToast(res.error, "error");
      else saveRoom(res.code);
    },
    async join(code) {
      if (busy) return;
      if (!name.trim()) return pushToast("Enter a name first", "error");
      if (!code?.trim()) return pushToast("Enter a room code", "error");
      setBusy(true);
      saveName(name.trim());
      const res = await emit("room:join", {
        code: code.trim().toUpperCase(),
        name: name.trim(),
        playerId,
      });
      setBusy(false);
      if (res.error) pushToast(res.error, "error");
      else saveRoom(res.code);
    },
    async start() {
      const res = await emit("game:start");
      if (res.error) pushToast(res.error, "error");
    },
    async clue(text) {
      const res = await emit("game:clue", { text });
      if (res.error) pushToast(res.error, "error");
    },
    async vote(targetId) {
      const res = await emit("game:vote", { targetId });
      if (res.error) pushToast(res.error, "error");
    },
    async next() {
      const res = await emit("game:next");
      if (res.error) pushToast(res.error, "error");
    },
    async toLobby() {
      const res = await emit("game:lobby");
      if (res.error) pushToast(res.error, "error");
    },
    async settings(partial) {
      const res = await emit("room:settings", partial);
      if (res.error) pushToast(res.error, "error");
    },
    async kick(id) {
      const res = await emit("room:kick", { playerId: id });
      if (res.error) pushToast(res.error, "error");
    },
    async skipTurn() {
      const res = await emit("game:skipTurn");
      if (res.error) pushToast(res.error, "error");
    },
    emote(e) {
      socket.emit("game:emote", { emote: e });
    },
    leave() {
      socket.emit("room:leave");
      clearSavedRoom();
      setRoom(null);
      setRole(null);
    },
  };

  const ctx = {
    connected,
    room,
    role,
    me,
    isHost,
    playerId,
    name,
    setName,
    pushToast,
    actions,
    emotes,
    busy,
  };

  const screen = restoring && !room ? "restoring" : !room ? "home" : room.phase;

  return (
    <GameCtx.Provider value={ctx}>
      <div className="backdrop" />
      <div className="backdrop-glow" />
      <div className="backdrop-grid" />
      <div className="grain" />
      <ConnBadge connected={connected} />
      {room && room.phase !== "lobby" && <ExitControl />}
      <Toasts toasts={toasts} />
      <EmoteLayer emotes={emotes} players={room?.players} />

      <main className="relative mx-auto flex min-h-full w-full max-w-4xl flex-col px-4 py-6 sm:px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={screen}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-1 flex-col"
          >
            {screen === "restoring" && <Restoring />}
            {screen === "home" && <Home />}
            {screen === "lobby" && <WaitingRoom />}
            {screen === "clue" && <CluePhase />}
            {screen === "vote" && <VotePhase />}
            {screen === "reveal" && <RevealPhase />}
          </motion.div>
        </AnimatePresence>
      </main>
    </GameCtx.Provider>
  );
}

function Restoring() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-20 text-center">
      <div className="grid h-14 w-14 place-items-center border border-line bg-panel-2 text-2xl">
        🕵️
      </div>
      <div className="flex items-center gap-2">
        <span className="h-1.5 w-1.5 animate-blink rounded-full bg-gold" />
        <span className="label">restoring your session</span>
      </div>
    </div>
  );
}

function ConnBadge({ connected }) {
  return (
    <div className="fixed left-4 top-4 z-40 flex items-center gap-2 border border-line bg-panel px-2.5 py-1">
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          connected ? "bg-safe" : "animate-blink bg-danger"
        }`}
      />
      <span className="label !text-[0.6rem] !tracking-[0.2em]">
        {connected ? "secure line" : "reconnecting"}
      </span>
    </div>
  );
}

// Requires a second tap within 3s to actually leave — guards against
// accidentally ending your participation in a live round.
function ExitControl() {
  const { actions } = useGame();
  const [confirmArmed, setConfirmArmed] = useState(false);

  useEffect(() => {
    if (!confirmArmed) return;
    const t = setTimeout(() => setConfirmArmed(false), 3000);
    return () => clearTimeout(t);
  }, [confirmArmed]);

  return (
    <button
      onClick={() => (confirmArmed ? actions.leave() : setConfirmArmed(true))}
      className={`fixed right-4 top-4 z-40 border px-2.5 py-1 text-[0.6rem] font-mono uppercase tracking-[0.2em] transition ${
        confirmArmed
          ? "border-danger bg-danger/10 text-danger"
          : "border-line bg-panel text-ink-dim hover:text-ink"
      }`}
    >
      {confirmArmed ? "tap to confirm" : "leave"}
    </button>
  );
}
