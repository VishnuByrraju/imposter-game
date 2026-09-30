import { motion } from "framer-motion";

export function Logo({ small }) {
  return (
    <div className="flex items-center gap-3">
      <motion.div
        initial={{ rotate: -8 }}
        animate={{ rotate: [-8, 8, -8] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className={small ? "text-3xl" : "text-5xl"}
      >
        🕵️
      </motion.div>
      <div>
        <h1
          className={`font-display font-bold leading-none tracking-tight text-gradient ${
            small ? "text-2xl" : "text-4xl sm:text-5xl"
          }`}
        >
          IMPOSTER
        </h1>
        {!small && (
          <p className="mt-1 text-sm tracking-[0.35em] text-white/40">
            WORD · BLUFF · VOTE
          </p>
        )}
      </div>
    </div>
  );
}

export function Avatar({ emoji, size = 44, ring, dim, glow }) {
  return (
    <div
      className={`relative grid place-items-center rounded-2xl transition ${
        dim ? "opacity-40 grayscale" : ""
      }`}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.5,
        background: "rgba(255,255,255,0.06)",
        border: `1px solid ${ring || "rgba(255,255,255,0.12)"}`,
        boxShadow: glow ? `0 0 24px -2px ${glow}` : "none",
      }}
    >
      {emoji}
    </div>
  );
}

export function Panel({ children, className = "", strong }) {
  return (
    <div
      className={`rounded-3xl p-5 sm:p-7 ${
        strong ? "glass-strong" : "glass"
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function StatusDot({ active, done }) {
  return (
    <span
      className={`h-2.5 w-2.5 rounded-full ${
        done
          ? "bg-neon-lime"
          : active
          ? "bg-neon-amber animate-pulseGlow"
          : "bg-white/20"
      }`}
    />
  );
}

export function PhaseBadge({ phase, round }) {
  const map = {
    lobby: { t: "LOBBY", c: "text-neon-cyan" },
    clue: { t: "GIVING CLUES", c: "text-neon-amber" },
    vote: { t: "VOTING", c: "text-neon-pink" },
    reveal: { t: "REVEAL", c: "text-neon-lime" },
  };
  const m = map[phase] || map.lobby;
  return (
    <div className="flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs font-semibold">
      <span className={m.c}>{m.t}</span>
      {round > 0 && <span className="text-white/40">· ROUND {round}</span>}
    </div>
  );
}
