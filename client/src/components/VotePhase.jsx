import { useState } from "react";
import { motion } from "framer-motion";
import { useGame } from "../App.jsx";
import { Logo, Panel, Avatar, PhaseBadge } from "./ui.jsx";

export default function VotePhase() {
  const { room, playerId, actions } = useGame();
  const [votedTarget, setVotedTarget] = useState(null);

  const clueMap = Object.fromEntries(room.clues.map((c) => [c.playerId, c.text]));
  const others = room.players.filter((p) => p.id !== playerId && p.connected);
  const votedCount = room.votesCount;
  const total = room.players.filter((p) => p.connected).length;

  const cast = (id) => {
    setVotedTarget(id);
    actions.vote(id);
  };

  return (
    <div className="flex flex-1 flex-col gap-5 pt-14">
      <div className="flex items-center justify-between">
        <Logo small />
        <PhaseBadge phase="vote" round={room.round} />
      </div>

      <Panel strong className="text-center">
        <h2 className="font-display text-2xl font-bold sm:text-3xl">
          Who is the <span className="text-neon-pink">imposter?</span>
        </h2>
        <p className="mt-1 text-sm text-white/50">
          Review the clues and cast your vote · {votedCount}/{total} voted
        </p>
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="h-full rounded-full"
            style={{ background: "linear-gradient(90deg,#a855f7,#ec4899)" }}
            animate={{ width: `${(votedCount / Math.max(1, total)) * 100}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
          />
        </div>
      </Panel>

      <div className="grid gap-3 sm:grid-cols-2">
        {others.map((p) => {
          const selected = votedTarget === p.id;
          return (
            <motion.button
              key={p.id}
              layout
              whileTap={{ scale: 0.97 }}
              onClick={() => cast(p.id)}
              className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition ${
                selected
                  ? "border-neon-pink bg-neon-pink/10 shadow-[0_0_30px_-8px_rgba(236,72,153,0.7)]"
                  : "border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.06]"
              }`}
            >
              <Avatar
                emoji={p.avatar}
                size={48}
                ring={selected ? "rgba(236,72,153,0.7)" : undefined}
              />
              <div className="min-w-0 flex-1">
                <div className="font-semibold">{p.name}</div>
                <div className="truncate text-sm text-white/50">
                  clue:{" "}
                  <span className="text-neon-lime">“{clueMap[p.id] || "—"}”</span>
                </div>
              </div>
              {selected && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-xl text-neon-pink"
                >
                  ✓
                </motion.span>
              )}
            </motion.button>
          );
        })}
      </div>

      <div className="mt-auto pb-3 text-center text-sm text-white/50">
        {votedTarget ? (
          <span className="text-neon-pink">
            You voted for{" "}
            <b>{room.players.find((p) => p.id === votedTarget)?.name}</b> · you can
            change it until everyone votes
          </span>
        ) : (
          "Tap a player to cast your vote"
        )}
      </div>
    </div>
  );
}
