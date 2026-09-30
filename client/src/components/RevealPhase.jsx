import { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { useGame } from "../App.jsx";
import { Logo, Panel, Avatar, PhaseBadge } from "./ui.jsx";
import { categoryMeta } from "../constants.js";

export default function RevealPhase() {
  const { room, isHost, playerId, actions } = useGame();
  const result = room.result;

  const imposterIds = result?.imposterIds || [];
  const imposters = imposterIds
    .map((id) => room.players.find((p) => p.id === id))
    .filter(Boolean);
  const iAmImposter = imposterIds.includes(playerId);
  const cat = categoryMeta(result?.category);

  const votesByTarget = useMemo(() => {
    const map = {};
    for (const v of room.votes) (map[v.targetId] ||= []).push(v.voterId);
    return map;
  }, [room.votes]);

  const scoreboard = useMemo(
    () => [...room.players].sort((a, b) => b.score - a.score),
    [room.players]
  );

  useEffect(() => {
    if (!result) return;
    const colors = result.caught
      ? ["#38d996", "#e8b64c", "#f3f0e8"]
      : ["#ff4d4d", "#e8b64c", "#f3f0e8"];
    const end = Date.now() + 800;
    (function frame() {
      confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 }, colors, scalar: 0.9 });
      confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 }, colors, scalar: 0.9 });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  }, [result]);

  if (!result) return null;

  const crewWon = result.caught;
  const youWon = crewWon ? !iAmImposter : iAmImposter;
  const verdict = crewWon ? "CAUGHT" : result.tie ? "STALEMATE" : "ESCAPED";
  const verdictTone = crewWon ? "#38d996" : "#ff4d4d";

  return (
    <div className="flex flex-1 flex-col gap-4 pt-12">
      <div className="flex items-center justify-between">
        <Logo small />
        <PhaseBadge phase="reveal" round={room.round} />
      </div>

      {/* Verdict */}
      <Panel raised tab="Verdict" tabTone={crewWon ? "safe" : "danger"} className="text-center">
        <motion.div
          initial={{ scale: 1.5, rotate: -12, opacity: 0 }}
          animate={{ scale: 1, rotate: -6, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 12 }}
          className="mx-auto inline-block border-4 px-6 py-1"
          style={{ borderColor: verdictTone, color: verdictTone }}
        >
          <span className="font-display text-4xl uppercase tracking-wide sm:text-5xl">
            {verdict}
          </span>
        </motion.div>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-4">
          {imposters.map((imp) => (
            <div key={imp.id} className="flex items-center gap-3">
              <Avatar emoji={imp.avatar} size={56} tone="#ff4d4d" />
              <div className="text-left">
                <div className="font-display text-2xl uppercase text-danger">
                  {imp.name}
                </div>
                <div className="label !text-[0.6rem]">
                  {imp.id === playerId ? "that was you" : "was an imposter"}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5">
          {cat && (
            <span className="mono border border-line px-2.5 py-1 text-xs text-ink-dim">
              {cat.emoji} {cat.label}
            </span>
          )}
          <span className="mono border border-safe/40 px-2.5 py-1 text-xs text-safe">
            word · {result.commonWord}
          </span>
          {result.imposterWord ? (
            <span className="mono border border-danger/40 px-2.5 py-1 text-xs text-danger">
              decoy · {result.imposterWord}
            </span>
          ) : (
            <span className="mono border border-danger/40 px-2.5 py-1 text-xs text-danger">
              imposter had no word
            </span>
          )}
        </div>

        <div
          className="mt-5 inline-block font-display text-2xl uppercase"
          style={{ color: youWon ? "#38d996" : "#9a9aa4" }}
        >
          {youWon ? "You win this round" : "You lose this round"}
        </div>
      </Panel>

      {/* Votes */}
      <Panel tab="Tally">
        <div className="flex flex-col gap-1.5">
          {room.players
            .filter((p) => (votesByTarget[p.id] || []).length > 0)
            .sort(
              (a, b) =>
                (votesByTarget[b.id]?.length || 0) -
                (votesByTarget[a.id]?.length || 0)
            )
            .map((p) => {
              const voters = votesByTarget[p.id] || [];
              const isImp = imposterIds.includes(p.id);
              return (
                <div
                  key={p.id}
                  className={`flex items-center gap-3 border p-2.5 ${
                    isImp ? "border-danger/50 bg-danger/[0.06]" : "border-line bg-panel-2"
                  }`}
                >
                  <Avatar emoji={p.avatar} size={34} />
                  <span className="font-medium">
                    {p.name}
                    {isImp && (
                      <span className="label ml-2 !text-[0.6rem] !text-danger">imposter</span>
                    )}
                  </span>
                  <div className="ml-auto flex items-center gap-1">
                    {voters.map((vid) => (
                      <span
                        key={vid}
                        title={room.players.find((x) => x.id === vid)?.name}
                        className="text-base"
                      >
                        {room.players.find((x) => x.id === vid)?.avatar}
                      </span>
                    ))}
                    <span className="mono ml-2 border border-line px-2 py-0.5 text-sm">
                      {voters.length}
                    </span>
                  </div>
                </div>
              );
            })}
        </div>
      </Panel>

      {/* Scoreboard */}
      <Panel tab="Standings" tabTone="gold">
        <div className="flex flex-col gap-1">
          {scoreboard.map((p, i) => (
            <motion.div
              key={p.id}
              layout
              className={`flex items-center gap-3 border px-3 py-2 ${
                i === 0 ? "border-gold/50 bg-gold/[0.06]" : "border-transparent"
              }`}
            >
              <span className="mono w-6 text-center text-sm text-ink-faint">
                {i === 0 ? "01" : String(i + 1).padStart(2, "0")}
              </span>
              <Avatar emoji={p.avatar} size={32} corner={i === 0 ? "★" : null} />
              <span className="font-medium">
                {p.name}
                {p.id === playerId && (
                  <span className="label ml-1.5 !text-[0.6rem] !text-safe">you</span>
                )}
              </span>
              <span className="ml-auto font-display text-2xl text-gold">
                {p.score}
              </span>
            </motion.div>
          ))}
        </div>
      </Panel>

      <div className="mt-auto flex flex-col gap-3 pb-4 sm:flex-row">
        {isHost ? (
          <>
            <button className="btn-ghost sm:w-40" onClick={actions.toLobby}>
              Close case
            </button>
            <button className="btn-primary flex-1 text-lg" onClick={actions.next}>
              Next round
            </button>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center gap-2 border border-line py-3 text-ink-dim">
            <span className="h-1.5 w-1.5 animate-blink rounded-full bg-gold" />
            <span className="label">waiting for next round</span>
          </div>
        )}
      </div>
    </div>
  );
}
