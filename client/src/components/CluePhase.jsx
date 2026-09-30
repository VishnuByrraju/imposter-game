import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGame } from "../App.jsx";
import { Logo, Panel, Avatar, PhaseBadge } from "./ui.jsx";

export default function CluePhase() {
  const { room, role, me, playerId, actions } = useGame();
  const [clue, setClue] = useState("");

  const isMyTurn = room.turnId === playerId;
  const currentPlayer = room.players.find((p) => p.id === room.turnId);
  const clueMap = Object.fromEntries(room.clues.map((c) => [c.playerId, c.text]));
  const orderedPlayers = room.order
    .map((id) => room.players.find((p) => p.id === id))
    .filter(Boolean);

  const submit = () => {
    if (!clue.trim()) return;
    actions.clue(clue.trim());
    setClue("");
  };

  return (
    <div className="flex flex-1 flex-col gap-5 pt-14">
      <div className="flex items-center justify-between">
        <Logo small />
        <PhaseBadge phase="clue" round={room.round} />
      </div>

      <RoleCard role={role} />

      <Panel className="flex-1">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold tracking-widest text-white/40">
            CLUE ORDER
          </h3>
          <span className="text-xs text-white/40">
            {room.clues.length}/{orderedPlayers.length} given
          </span>
        </div>

        <div className="flex flex-col gap-2">
          {orderedPlayers.map((p, i) => {
            const has = clueMap[p.id] !== undefined;
            const active = room.turnId === p.id;
            return (
              <motion.div
                key={p.id}
                layout
                className={`flex items-center gap-3 rounded-2xl border p-3 transition ${
                  active
                    ? "border-neon-amber/60 bg-neon-amber/5"
                    : "border-white/8 bg-white/[0.03]"
                }`}
              >
                <span className="w-5 text-center text-sm font-bold text-white/30">
                  {i + 1}
                </span>
                <Avatar emoji={p.avatar} size={38} dim={!p.connected} />
                <span className="font-semibold">
                  {p.name}
                  {p.id === playerId && (
                    <span className="ml-1 text-xs text-neon-cyan">(you)</span>
                  )}
                </span>
                <div className="ml-auto text-right">
                  <AnimatePresence mode="wait">
                    {has ? (
                      <motion.span
                        key="clue"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="rounded-xl bg-white/10 px-3 py-1 font-semibold text-neon-lime"
                      >
                        “{clueMap[p.id]}”
                      </motion.span>
                    ) : active ? (
                      <motion.span
                        key="thinking"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-sm text-neon-amber"
                      >
                        thinking…
                      </motion.span>
                    ) : (
                      <span className="text-sm text-white/25">waiting</span>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </div>
      </Panel>

      <div className="sticky bottom-0 pb-3">
        <AnimatePresence mode="wait">
          {isMyTurn ? (
            <motion.div
              key="myturn"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="glass-strong flex gap-2 rounded-2xl p-2"
            >
              <input
                autoFocus
                className="input flex-1"
                placeholder="Your one-word clue…"
                value={clue}
                maxLength={40}
                onChange={(e) => setClue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
              />
              <button className="btn-primary" onClick={submit} disabled={!clue.trim()}>
                Send
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="waiting"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="glass flex items-center justify-center gap-2 rounded-2xl p-4 text-white/60"
            >
              <span className="h-2 w-2 animate-pulseGlow rounded-full bg-neon-amber" />
              Waiting for <b className="text-white">{currentPlayer?.name || "…"}</b> to give a clue
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function RoleCard({ role }) {
  const [revealed, setRevealed] = useState(false);

  // Auto-reset when the word changes between rounds.
  useEffect(() => {
    setRevealed(false);
  }, [role?.word, role?.round]);

  if (!role) return null;
  const imposter = role.isImposter;

  return (
    <div className="[perspective:1400px]">
      <motion.div
        onClick={() => setRevealed((r) => !r)}
        className="relative h-44 w-full cursor-pointer sm:h-52"
        style={{ transformStyle: "preserve-3d" }}
        animate={{ rotateY: revealed ? 180 : 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Front */}
        <div
          className="glass-strong absolute inset-0 grid place-items-center rounded-3xl"
          style={{ backfaceVisibility: "hidden" }}
        >
          <div className="text-center">
            <div className="text-4xl">🎴</div>
            <p className="mt-2 font-semibold">Tap to reveal your word</p>
            <p className="text-xs text-white/40">keep it hidden from others</p>
          </div>
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 grid place-items-center overflow-hidden rounded-3xl"
          style={{
            transform: "rotateY(180deg)",
            backfaceVisibility: "hidden",
            background: imposter
              ? "linear-gradient(140deg, rgba(236,72,153,0.25), rgba(168,85,247,0.15))"
              : "linear-gradient(140deg, rgba(34,211,238,0.2), rgba(163,230,53,0.12))",
            border: `1px solid ${imposter ? "rgba(236,72,153,0.5)" : "rgba(34,211,238,0.45)"}`,
          }}
        >
          <div className="text-center">
            <p
              className={`text-xs font-bold tracking-[0.35em] ${
                imposter ? "text-neon-pink" : "text-neon-cyan"
              }`}
            >
              {imposter ? "YOU ARE THE IMPOSTER" : "YOUR SECRET WORD"}
            </p>
            <p className="mt-2 font-display text-5xl font-bold text-white sm:text-6xl">
              {role.word}
            </p>
            <p className="mt-2 text-xs text-white/50">
              {imposter
                ? "Blend in — don't get caught!"
                : "Describe it subtly to spot the imposter"}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
