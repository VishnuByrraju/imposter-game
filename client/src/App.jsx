import { useEffect, useState, useCallback, createContext, useContext } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { socket, getPlayerId, getSavedName, saveName, emit } from "./socket.js";
import Home from "./components/Home.jsx";
import WaitingRoom from "./components/WaitingRoom.jsx";
import CluePhase from "./components/CluePhase.jsx";
import VotePhase from "./components/VotePhase.jsx";
import RevealPhase from "./components/RevealPhase.jsx";
import Toasts from "./components/Toasts.jsx";

export const GameCtx = createContext(null);
export const useGame = () => useContext(GameCtx);

let toastId = 0;

export default function App() {
  const [connected, setConnected] = useState(socket.connected);
  const [room, setRoom] = useState(null); // public state
  const [role, setRole] = useState(null); // private word/role
  const [name, setName] = useState(getSavedName());
  const [toasts, setToasts] = useState([]);
  const playerId = getPlayerId();

  const pushToast = useCallback((message, type = "info") => {
    const id = ++toastId;
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  useEffect(() => {
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    const onState = (s) => setRoom(s);
    const onRole = (r) => setRole(r);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("room:state", onState);
    socket.on("room:role", onRole);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("room:state", onState);
      socket.off("room:role", onRole);
    };
  }, []);

  // Reset private role whenever we go back to lobby.
  useEffect(() => {
    if (room?.phase === "lobby") setRole(null);
  }, [room?.phase]);

  const me = room?.players.find((p) => p.id === playerId) || null;
  const isHost = me?.isHost;

  const actions = {
    async create() {
      if (!name.trim()) return pushToast("Enter a name first", "error");
      saveName(name.trim());
      const res = await emit("room:create", { name: name.trim(), playerId });
      if (res.error) pushToast(res.error, "error");
    },
    async join(code) {
      if (!name.trim()) return pushToast("Enter a name first", "error");
      if (!code?.trim()) return pushToast("Enter a room code", "error");
      saveName(name.trim());
      const res = await emit("room:join", {
        code: code.trim().toUpperCase(),
        name: name.trim(),
        playerId,
      });
      if (res.error) pushToast(res.error, "error");
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
    leave() {
      socket.emit("room:leave");
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
  };

  const screen = !room ? "home" : room.phase;

  return (
    <GameCtx.Provider value={ctx}>
      <div className="aurora" />
      <div className="grain" />
      <ConnBadge connected={connected} />
      <Toasts toasts={toasts} />

      <main className="relative mx-auto flex min-h-full w-full max-w-5xl flex-col px-4 py-6 sm:px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={screen}
            initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -24, filter: "blur(8px)" }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-1 flex-col"
          >
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

function ConnBadge({ connected }) {
  return (
    <div className="fixed left-4 top-4 z-40 flex items-center gap-2 rounded-full glass px-3 py-1.5 text-xs font-medium">
      <span
        className={`h-2 w-2 rounded-full ${
          connected ? "bg-neon-lime animate-pulseGlow" : "bg-red-500"
        }`}
      />
      {connected ? "connected" : "reconnecting…"}
    </div>
  );
}
