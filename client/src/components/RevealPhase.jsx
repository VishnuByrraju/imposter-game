import { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { useGame } from "../App.jsx";
import { Logo, Panel, Avatar, PhaseBadge } from "./ui.jsx";

export default function RevealPhase() {
  const { room, isHost, playerId, actions } = useGame();
  const result = room.result;

  const imposter = room.players.find((p) => p.id === result?.imposterId);
  const votedOut = room.players.find((p) => p.id === result?.votedOutId);
  const iAmImposter = result?.imposterId === playerId;

  const votesByTarget = useMemo(() => {
    const map = {};
    for (const v of room.votes) {
      (map[v.targetId] ||= []).push(v.voterId);
    }
    return map;
  }, [room.votes]);

  const scoreboard = useMemo(
    () => [...room.players].sort((a, b) => b.score - a.score),
    [room.players]
  );

  // Celebration: crew wins -> greens/blues, imposter wins -> pinks/purples.
  useEffect(() => {
    if (!result) return;
    const crewWon = result.caught;
    const colors = crewWon
      ? ["#22d3ee", "#a3e635", "#ffffff"]
      : ["#ec4899", "#a855f7", "#fbbf24"];
    const end = Date.now() + 900;
    (function frame() {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 60,
        origin: { x: 0 },
        colors,
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 60,
        origin: { x: 1 },
        colors,
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  }, [result]);

  if (!result) return null;

  const crewWon = result.caught;
  const youWon = crewWon ? !iAmImposter : iAmImposter;

  return (
    <div className="flex flex-1 flex-col gap-5 pt-14">
      <div className="flex items-center justify-between">
        <Logo small />
        <PhaseBadge phase="reveal" round={room.round} />
      </div>

      {/* Verdict banner */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 16 }}
      >
        <Panel
          strong
          className="text-center"
        >
          <p className="text-xs font-bold tracking-[0.35em] text-white/40">
            {crewWon ? "IMPOSTER CAUGHT" : result.tie ? "TIE — IMPOSTER ESCAPED" : "IMPOSTER ESCAPED"}
          </p>
          <div className="my-4 flex items-center justify-center gap-4">
            <Avatar
              emoji={imposter?.avatar}
              size={72}
              ring="rgba(236,72,153,0.7)"
              glow="rgba(236,72,153,0.6)"
            />
            <div className="text-left">
              <div className="font-display text-3xl font-bold text-neon-pink">
                {imposter?.name}
              </div>
              <div className="text-sm text-white/50">was the imposter</div>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
            <span className="rounded-full bg-neon-cyan/15 px-4 py-1.5">
              real word · <b className="text-neon-cyan">{result.commonWord}</b>
            </span>
            <span className="rounded-full bg-neon-pink/15 px-4 py-1.5">
              imposter's word · <b className="text-neon-pink">{result.imposterWord}</b>
            </span>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={`mt-5 inline-block rounded-2xl px-6 py-2 font-display text-xl font-bold ${
              youWon ? "text-neon-lime" : "text-white/70"
            }`}
          >
            {youWon ? "🎉 You won this round!" : "💀 You lost this round"}
          </motion.div>
        </Panel>
      </motion.div>

      {/* Vote breakdown */}
      <Panel>
        <h3 className="mb-3 text-sm font-semibold tracking-widest text-white/40">
          VOTES
        </h3>
        <div className="flex flex-col gap-2">
          {room.players
            .filter((p) => (votesByTarget[p.id] || []).length > 0)
            .sort(
              (a, b) =>
                (votesByTarget[b.id]?.length || 0) -
                (votesByTarget[a.id]?.length || 0)
            )
            .map((p) => {
              const voters = votesByTarget[p.id] || [];
              const isImp = p.id === result.imposterId;
              return (
                <div
                  key={p.id}
                  className={`flex items-center gap-3 rounded-2xl border p-3 ${
                    isImp
                      ? "border-neon-pink/50 bg-neon-pink/5"
                      : "border-white/8 bg-white/[0.03]"
                  }`}
                >
                  <Avatar emoji={p.avatar} size={38} />
                  <span className="font-semibold">
                    {p.name}
                    {isImp && <span className="ml-2 text-xs text-neon-pink">imposter</span>}
                  </span>
                  <div className="ml-auto flex items-center gap-1">
                    {voters.map((vid) => {
                      const voter = room.players.find((x) => x.id === vid);
                      return (
                        <span key={vid} title={voter?.name} className="text-lg">
                          {voter?.avatar}
                        </span>
                      );
                    })}
                    <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-sm font-bold">
                      {voters.length}
                    </span>
                  </div>
                </div>
              );
            })}
        </div>
      </Panel>

      {/* Scoreboard */}
      <Panel>
        <h3 className="mb-3 text-sm font-semibold tracking-widest text-white/40">
          SCOREBOARD
        </h3>
        <div className="flex flex-col gap-1.5">
          {scoreboard.map((p, i) => (
            <motion.div
              key={p.id}
              layout
              className="flex items-center gap-3 rounded-xl px-3 py-2"
              style={{
                background:
                  i === 0 ? "rgba(251,191,36,0.1)" : "rgba(255,255,255,0.02)",
              }}
            >
              <span className="w-6 text-center font-bold text-white/40">
                {i === 0 ? "🏆" : i + 1}
              </span>
              <Avatar emoji={p.avatar} size={34} />
              <span className="font-semibold">
                {p.name}
                {p.id === playerId && (
                  <span className="ml-1 text-xs text-neon-cyan">(you)</span>
                )}
              </span>
              <span className="ml-auto font-display text-xl font-bold text-neon-amber">
                {p.score}
              </span>
            </motion.div>
          ))}
        </div>
      </Panel>

      <div className="mt-auto flex flex-col gap-3 pb-4 sm:flex-row">
        {isHost ? (
          <>
            <button className="btn-ghost sm:w-44" onClick={actions.toLobby}>
              Back to lobby
            </button>
            <button className="btn-primary flex-1 text-lg" onClick={actions.next}>
              ▶ Next round
            </button>
          </>
        ) : (
          <div className="btn-ghost flex-1 cursor-default text-white/60">
            Waiting for host to start the next round…
          </div>
        )}
      </div>
    </div>
  );
}
