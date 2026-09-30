import { useState } from "react";
import { motion } from "framer-motion";
import { useGame } from "../App.jsx";
import { Logo, Panel, Avatar, PhaseBadge } from "./ui.jsx";

export default function WaitingRoom() {
  const { room, isHost, actions, pushToast } = useGame();
  const [copied, setCopied] = useState(false);
  const players = room.players;
  const canStart = players.filter((p) => p.connected).length >= 3;

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(room.code);
      setCopied(true);
      pushToast("Room code copied", "success");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      pushToast("Couldn't copy", "error");
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-6 pt-14">
      <div className="flex items-center justify-between">
        <Logo small />
        <PhaseBadge phase="lobby" round={0} />
      </div>

      <Panel strong className="flex flex-col items-center gap-4 text-center">
        <p className="text-xs font-semibold tracking-widest text-white/40">
          SHARE THIS CODE
        </p>
        <button
          onClick={copyCode}
          className="group flex items-center gap-4 rounded-2xl px-4 py-2 transition hover:bg-white/5"
        >
          <span className="font-display text-5xl font-bold tracking-[0.3em] text-gradient sm:text-6xl">
            {room.code}
          </span>
          <span className="text-xs text-white/40 group-hover:text-white/70">
            {copied ? "✓ copied" : "tap to copy"}
          </span>
        </button>
        <p className="text-sm text-white/50">
          {players.length} / {room.maxPlayers} players joined
          {!canStart && " · need at least 3"}
        </p>
      </Panel>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {players.map((p, i) => (
          <motion.div
            key={p.id}
            layout
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.04 }}
            className="glass flex items-center gap-3 rounded-2xl p-3"
          >
            <Avatar emoji={p.avatar} dim={!p.connected} />
            <div className="min-w-0">
              <div className="flex items-center gap-1 truncate font-semibold">
                {p.name}
              </div>
              <div className="text-xs text-white/40">
                {p.isHost ? "👑 host" : p.connected ? "ready" : "away"}
              </div>
            </div>
          </motion.div>
        ))}
        {Array.from({ length: Math.max(0, 3 - players.length) }).map((_, i) => (
          <div
            key={`empty-${i}`}
            className="flex items-center gap-3 rounded-2xl border border-dashed border-white/10 p-3 text-white/30"
          >
            <div className="grid h-11 w-11 place-items-center rounded-2xl border border-dashed border-white/10">
              ?
            </div>
            <span className="text-sm">waiting…</span>
          </div>
        ))}
      </div>

      <div className="mt-auto flex flex-col gap-3 pb-4 sm:flex-row">
        <button className="btn-ghost sm:w-40" onClick={actions.leave}>
          Leave
        </button>
        {isHost ? (
          <button
            className="btn-primary flex-1 text-lg"
            disabled={!canStart}
            onClick={actions.start}
          >
            🚀 Start round
          </button>
        ) : (
          <div className="btn-ghost flex-1 cursor-default text-white/60">
            Waiting for host to start…
          </div>
        )}
      </div>
    </div>
  );
}
