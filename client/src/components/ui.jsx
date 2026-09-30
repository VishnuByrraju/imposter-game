import { motion } from "framer-motion";

// Wordmark: poster-condensed title with a "case file" subline.
export function Logo({ small }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`grid place-items-center border border-line bg-panel-2 ${
          small ? "h-9 w-9 text-lg" : "h-12 w-12 text-2xl"
        }`}
      >
        🕵️
      </div>
      <div className="leading-none">
        <h1
          className={`font-display uppercase tracking-tight text-ink ${
            small ? "text-2xl" : "text-4xl sm:text-5xl"
          }`}
        >
          Impost<span className="text-danger">e</span>r
        </h1>
        {!small && (
          <p className="label mt-1.5">Case file · describe · deceive · vote</p>
        )}
      </div>
    </div>
  );
}

// Base card. `tab` renders a dossier tab label on the top edge.
export function Panel({ children, className = "", raised, tab, tabTone = "gold" }) {
  const toneBg =
    tabTone === "danger" ? "#ff4d4d" : tabTone === "safe" ? "#38d996" : "#e8b64c";
  return (
    <div className={`relative ${raised ? "card-raised" : "card"} p-5 sm:p-6 ${className}`}>
      {tab && (
        <span
          className="absolute -top-2.5 left-4 px-2.5 py-0.5 text-[0.62rem] font-bold uppercase tracking-[0.18em] text-bg"
          style={{ background: toneBg, fontFamily: '"JetBrains Mono", monospace' }}
        >
          {tab}
        </span>
      )}
      {children}
    </div>
  );
}

// Square, ID-photo style avatar frame (not a rounded blob).
export function Avatar({ emoji, size = 44, tone, dim, corner }) {
  const border = tone || "#2b2b33";
  return (
    <div
      className={`relative grid shrink-0 place-items-center ${dim ? "opacity-40 grayscale" : ""}`}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.5,
        background: "#0e0e11",
        border: `1px solid ${border}`,
        borderRadius: 8,
      }}
    >
      {emoji}
      {corner && (
        <span
          className="absolute -right-1.5 -top-1.5 grid h-4 w-4 place-items-center rounded-full text-[9px]"
          style={{ background: border, color: "#0a0a0c" }}
        >
          {corner}
        </span>
      )}
    </div>
  );
}

const PHASE_MAP = {
  lobby: { t: "Briefing", tone: "text-ink-dim", dot: "bg-ink-dim" },
  clue: { t: "Interrogation", tone: "text-gold", dot: "bg-gold" },
  vote: { t: "The Vote", tone: "text-danger", dot: "bg-danger" },
  reveal: { t: "Case Closed", tone: "text-safe", dot: "bg-safe" },
};

export function PhaseBadge({ phase, round }) {
  const m = PHASE_MAP[phase] || PHASE_MAP.lobby;
  return (
    <div className="flex items-center gap-2 border border-line bg-panel px-3 py-1.5">
      <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} />
      <span className={`label !text-[0.62rem] ${m.tone}`}>{m.t}</span>
      {round > 0 && <span className="label !text-[0.62rem] !text-ink-faint">/ Rnd {round}</span>}
    </div>
  );
}

// Small monospace stat/chip with a hairline border.
export function Chip({ children, tone = "ink", className = "" }) {
  const map = {
    ink: "border-line text-ink-dim",
    danger: "border-danger/50 text-danger",
    safe: "border-safe/50 text-safe",
    gold: "border-gold/50 text-gold",
  };
  return (
    <span
      className={`mono inline-flex items-center gap-1.5 border px-2.5 py-1 text-xs ${map[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export { motion };
