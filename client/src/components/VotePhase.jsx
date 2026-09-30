import { useState } from "react";
import { motion } from "framer-motion";
import { useGame } from "../App.jsx";
import { Logo, Panel, Avatar, PhaseBadge, Chip } from "./ui.jsx";
import { categoryMeta } from "../constants.js";
import EmoteBar from "./EmoteBar.jsx";

export default function VotePhase() {
  const { room, playerId, actions } = useGame();
  const [votedTarget, setVotedTarget] = useState(null);

  const clueMap = Object.fromEntries(room.clues.map((c) => [c.playerId, c.text]));
  const cluedIds = new Set(room.clues.map((c) => c.playerId));
  const skippedIds = new Set(room.skippedIds || []);
  const others = room.players.filter((p) => p.id !== playerId && p.connected);
  const total = room.players.filter((p) => p.connected).length;
  // A voter who already cast a ballot and then disconnected can leave the
  // count above the current active total — clamp so the UI never shows
  // something like "4/3 voted".
  const votedCount = Math.min(room.votesCount, total);
  const cat = categoryMeta(room.category);

  const cast = (id) => {
    setVotedTarget(id);
    actions.vote(id);
  };

  return (
    <div className="flex flex-1 flex-col gap-4 pt-12">
      <div className="flex items-center justify-between">
        <Logo small />
        <PhaseBadge phase="vote" round={room.round} />
      </div>

      <Panel raised tab="Accusation" tabTone="danger">
        <h2 className="font-display text-3xl uppercase leading-none sm:text-4xl">
          Name the imposter
        </h2>
        <p className="mt-2 text-sm text-ink-dim">
          Weigh the statements. Point your finger. You can change your call until
          everyone has voted.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <Chip tone="danger">
            {room.settings?.imposterCount > 1
              ? `${room.settings.imposterCount} imposters`
              : "1 imposter"}
          </Chip>
          {cat && <Chip>{cat.emoji} {cat.label}</Chip>}
          <Chip tone="gold">
            {votedCount}/{total} voted
          </Chip>
        </div>
        <div className="mt-3 h-1 w-full bg-panel-2">
          <motion.div
            className="h-full bg-danger"
            animate={{
              width: `${Math.min(100, (votedCount / Math.max(1, total)) * 100)}%`,
            }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
          />
        </div>
      </Panel>

      <div className="grid gap-2 sm:grid-cols-2">
        {others.map((p) => {
          const selected = votedTarget === p.id;
          return (
            <motion.button
              key={p.id}
              layout
              whileTap={{ scale: 0.98 }}
              onClick={() => cast(p.id)}
              className={`flex items-center gap-3 border p-3 text-left transition ${
                selected
                  ? "border-danger bg-danger/10"
                  : "border-line bg-panel hover:border-ink-faint"
              }`}
            >
              <Avatar
                emoji={p.avatar}
                size={46}
                tone={selected ? "#ff4d4d" : undefined}
              />
              <div className="min-w-0 flex-1">
                <div className="font-semibold">{p.name}</div>
                <div className="mono mt-0.5 truncate text-sm text-ink-dim">
                  {cluedIds.has(p.id)
                    ? clueMap[p.id]
                      ? `“${clueMap[p.id]}”`
                      : "🎙️ described aloud"
                    : skippedIds.has(p.id)
                    ? "— turn skipped —"
                    : "— no statement —"}
                </div>
              </div>
              <span
                className={`grid h-7 w-7 place-items-center border text-sm ${
                  selected
                    ? "border-danger bg-danger text-bg"
                    : "border-line text-ink-faint"
                }`}
              >
                {selected ? "✓" : "?"}
              </span>
            </motion.button>
          );
        })}
      </div>

      <div className="mt-auto pb-3 text-center">
        {votedTarget ? (
          <p className="label !text-danger">
            accusing {room.players.find((p) => p.id === votedTarget)?.name} · tap
            another to change
          </p>
        ) : (
          <p className="label">select a suspect to cast your vote</p>
        )}
      </div>

      <EmoteBar />
    </div>
  );
}
