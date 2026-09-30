import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGame } from "../App.jsx";
import { Logo, Panel, Avatar, PhaseBadge } from "./ui.jsx";
import { categoryMeta } from "../constants.js";
import EmoteBar from "./EmoteBar.jsx";

export default function CluePhase() {
  const { room, role, playerId, isHost, actions } = useGame();
  const [clue, setClue] = useState("");

  const isMyTurn = room.turnId === playerId;
  const voice = !!room.settings?.voiceMode;
  const currentPlayer = room.players.find((p) => p.id === room.turnId);
  const clueMap = Object.fromEntries(room.clues.map((c) => [c.playerId, c.text]));
  const skippedIds = new Set(room.skippedIds || []);
  const orderedPlayers = room.order
    .map((id) => room.players.find((p) => p.id === id))
    .filter(Boolean);

  const submit = () => {
    if (!voice && !clue.trim()) return;
    actions.clue(clue.trim());
    setClue("");
  };

  return (
    <div className="flex flex-1 flex-col gap-4 pt-12">
      <div className="flex items-center justify-between">
        <Logo small />
        <PhaseBadge phase="clue" round={room.round} />
      </div>

      <RoleCard role={role} />

      <Panel tab="Transcript" className="flex-1">
        <div className="mb-3 flex items-center justify-between">
          <span className="label">Statements</span>
          <span className="mono text-xs text-ink-faint">
            {room.clues.length} / {orderedPlayers.length}
          </span>
        </div>

        <div className="flex flex-col gap-1.5">
          {orderedPlayers.map((p, i) => {
            const has = clueMap[p.id] !== undefined;
            const active = room.turnId === p.id;
            return (
              <motion.div
                key={p.id}
                layout
                className={`flex items-center gap-3 border p-2.5 transition ${
                  active
                    ? "border-gold/60 bg-gold/[0.06]"
                    : "border-line bg-panel-2"
                }`}
              >
                <span className="mono w-5 text-center text-xs text-ink-faint">
                  {i + 1}
                </span>
                <Avatar emoji={p.avatar} size={34} dim={!p.connected} />
                <span className="truncate font-medium">
                  {p.name}
                  {p.id === playerId && (
                    <span className="label ml-1.5 !text-[0.6rem] !text-safe">you</span>
                  )}
                </span>
                <div className="ml-auto text-right">
                  <AnimatePresence mode="wait">
                    {has ? (
                      clueMap[p.id] ? (
                        <motion.span
                          key="clue"
                          initial={{ opacity: 0, x: 8 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="mono border border-line bg-bg px-2.5 py-1 text-sm text-ink"
                        >
                          {clueMap[p.id]}
                        </motion.span>
                      ) : (
                        <motion.span
                          key="spoke"
                          initial={{ opacity: 0, x: 8 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="label !text-safe"
                        >
                          🎙️ described
                        </motion.span>
                      )
                    ) : active ? (
                      <motion.span
                        key="thinking"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="label !text-gold"
                      >
                        {voice ? "speaking…" : "on record…"}
                      </motion.span>
                    ) : skippedIds.has(p.id) ? (
                      <span className="label !text-ink-faint">skipped</span>
                    ) : !p.connected ? (
                      <span className="label !text-danger">offline</span>
                    ) : (
                      <span className="label">pending</span>
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
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              className="card-raised flex gap-2 p-2"
            >
              <input
                autoFocus={!voice}
                className="input flex-1"
                placeholder={
                  voice ? "Add a note (optional)…" : "Give your one-word clue…"
                }
                value={clue}
                maxLength={40}
                onChange={(e) => setClue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
              />
              <button
                className="btn-primary"
                onClick={submit}
                disabled={!voice && !clue.trim()}
              >
                {voice ? "Done" : "Record"}
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="waiting"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              className="flex items-center justify-center gap-2 border border-line bg-panel py-3.5 text-ink-dim"
            >
              <span className="h-1.5 w-1.5 animate-blink rounded-full bg-gold" />
              <span className="label">
                {voice ? "listening to" : "questioning"} {currentPlayer?.name || "…"}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
        {isHost && (
          <button
            onClick={actions.skipTurn}
            className="btn-ghost mt-2 w-full !py-2 !text-xs"
          >
            Skip {currentPlayer?.name || "this player"}'s turn →
          </button>
        )}
      </div>

      <EmoteBar />
    </div>
  );
}

function RoleCard({ role }) {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    setRevealed(false);
  }, [role?.word, role?.round, role?.hint]);

  if (!role) return null;
  const imposter = role.isImposter;
  const noWord = role.mode === "noword" && imposter;
  const cat = categoryMeta(role.category);
  const accent = imposter ? "#ff4d4d" : "#38d996";

  return (
    <div className="[perspective:1600px]">
      <motion.div
        onClick={() => setRevealed((r) => !r)}
        className="relative h-52 w-full cursor-pointer select-none sm:h-56"
        style={{ transformStyle: "preserve-3d" }}
        animate={{ rotateY: revealed ? 180 : 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Front — sealed file */}
        <div
          className="card-raised absolute inset-0 flex flex-col items-center justify-center gap-3 overflow-hidden"
          style={{ backfaceVisibility: "hidden" }}
        >
          <span className="tab absolute left-4 top-3">Confidential</span>
          <div className="flex flex-col items-center gap-2">
            <span className="redacted h-4 w-40" />
            <span className="redacted h-4 w-52" />
            <span className="redacted h-4 w-32" />
          </div>
          <div className="label absolute bottom-4 flex items-center gap-2 !text-danger">
            <span className="h-1.5 w-1.5 animate-blink rounded-full bg-danger" />
            tap to unseal your file
          </div>
        </div>

        {/* Back — the reveal */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden px-4 text-center"
          style={{
            transform: "rotateY(180deg)",
            backfaceVisibility: "hidden",
            background: "#141417",
            border: `1px solid ${accent}`,
            borderRadius: 14,
            boxShadow: `inset 0 0 0 1px ${accent}22`,
          }}
        >
          <span
            className="absolute left-4 top-3 px-2.5 py-0.5 text-[0.62rem] font-bold uppercase tracking-[0.18em] text-bg"
            style={{ background: accent, fontFamily: '"JetBrains Mono", monospace' }}
          >
            {imposter ? "The Imposter" : "Cleared"}
          </span>

          {noWord ? (
            <>
              <div className="mt-4 text-3xl">{cat?.emoji || "🚫"}</div>
              <div className="font-display text-3xl uppercase text-ink">No word</div>
              {role.hint && (
                <div className="mono mt-1 border border-line bg-bg px-3 py-1 text-xs text-ink-dim">
                  {role.hint}
                </div>
              )}
            </>
          ) : (
            <div
              className="mt-3 font-display text-5xl uppercase sm:text-6xl"
              style={{ color: accent }}
            >
              {role.word}
            </div>
          )}

          <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
            {cat && (
              <span className="mono border border-line px-2 py-0.5 text-[0.65rem] text-ink-dim">
                {cat.emoji} {cat.label}
              </span>
            )}
            {imposter && role.allies?.length > 0 && (
              <span className="mono border border-danger/40 px-2 py-0.5 text-[0.65rem] text-danger">
                allies: {role.allies.join(", ")}
              </span>
            )}
          </div>
          <p className="label mt-2 !text-[0.6rem]">
            {imposter ? "blend in — don't get caught" : "describe it, spot the liar"}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
