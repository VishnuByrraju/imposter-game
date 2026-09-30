import { useState } from "react";
import { motion } from "framer-motion";
import { useGame } from "../App.jsx";
import { Logo, Panel, Avatar, PhaseBadge } from "./ui.jsx";
import { CATEGORIES, MODES } from "../constants.js";

export default function WaitingRoom() {
  const { room, isHost, playerId, actions, pushToast } = useGame();
  const [copied, setCopied] = useState(false);
  const players = room.players;
  const connectedCount = players.filter((p) => p.connected).length;
  const canStart = connectedCount >= 3;
  const s = room.settings;

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(room.code);
      setCopied(true);
      pushToast("Case code copied", "success");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      pushToast("Couldn't copy", "error");
    }
  };

  const set = (partial) => actions.settings(partial);

  return (
    <div className="flex flex-1 flex-col gap-4 pt-12">
      <div className="flex items-center justify-between">
        <Logo small />
        <PhaseBadge phase="lobby" round={0} />
      </div>

      {/* Case code */}
      <Panel raised tab="Case #" className="flex items-center justify-between gap-4">
        <div>
          <button onClick={copyCode} className="group block text-left">
            <div className="font-display text-5xl leading-none tracking-[0.2em] sm:text-6xl">
              {room.code}
            </div>
            <div className="label mt-2 group-hover:text-ink-dim">
              {copied ? "✓ copied to clipboard" : "tap to copy · share with players"}
            </div>
          </button>
        </div>
        <div className="text-right">
          <div className="font-display text-4xl leading-none text-ink-dim">
            {players.length}
            <span className="text-ink-faint">/{room.maxPlayers}</span>
          </div>
          <div className="label mt-1">{canStart ? "ready" : "min 3"}</div>
        </div>
      </Panel>

      <Settings s={s} isHost={isHost} set={set} maxImposters={room.maxImposters} />

      {/* Suspects */}
      <div>
        <div className="mb-2 flex items-center gap-3">
          <span className="label">Suspects on file</span>
          <span className="perf flex-1" />
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {players.map((p, i) => (
            <motion.div
              key={p.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="card group flex items-center gap-3 p-3"
            >
              <span className="mono w-6 text-center text-sm text-ink-faint">
                {String(i + 1).padStart(2, "0")}
              </span>
              <Avatar emoji={p.avatar} dim={!p.connected} corner={p.isHost ? "★" : null} />
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold">{p.name}</div>
                <div className="label !tracking-[0.15em]">
                  {p.isHost ? "case officer" : p.connected ? "present" : "away"}
                </div>
              </div>
              {isHost && p.id !== playerId && (
                <button
                  onClick={() => actions.kick(p.id)}
                  title="Remove player"
                  className="border border-line px-2 py-1 text-xs text-ink-faint opacity-0 transition hover:border-danger/60 hover:text-danger group-hover:opacity-100"
                >
                  eject
                </button>
              )}
            </motion.div>
          ))}
          {Array.from({ length: Math.max(0, 3 - players.length) }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="flex items-center gap-3 border border-dashed border-line/60 p-3 text-ink-faint"
            >
              <span className="mono w-6 text-center text-sm">
                {String(players.length + i + 1).padStart(2, "0")}
              </span>
              <div className="grid h-11 w-11 place-items-center border border-dashed border-line/60">
                ?
              </div>
              <span className="label">awaiting suspect</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-auto flex flex-col gap-3 pb-4 sm:flex-row">
        <button className="btn-ghost sm:w-36" onClick={actions.leave}>
          Leave
        </button>
        {isHost ? (
          <button
            className="btn-primary flex-1 text-lg"
            disabled={!canStart}
            onClick={actions.start}
          >
            Begin interrogation
          </button>
        ) : (
          <div className="flex flex-1 items-center justify-center gap-2 border border-line py-3 text-ink-dim">
            <span className="h-1.5 w-1.5 animate-blink rounded-full bg-gold" />
            <span className="label">waiting for case officer</span>
          </div>
        )}
      </div>
    </div>
  );
}

function Settings({ s, isHost, set, maxImposters }) {
  return (
    <Panel tab="Parameters" tabTone="gold">
      {!isHost && (
        <p className="label mb-3">Set by the case officer</p>
      )}

      {/* Mode */}
      <div className="mb-4 grid grid-cols-2 gap-2">
        {Object.values(MODES).map((m) => {
          const active = s.mode === m.id;
          return (
            <button
              key={m.id}
              disabled={!isHost}
              onClick={() => set({ mode: m.id })}
              className={`border p-3 text-left transition ${
                active
                  ? "border-danger bg-danger/10"
                  : "border-line bg-panel-2 hover:border-line"
              } ${!isHost && "cursor-default"}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold">{m.label}</span>
                <span
                  className={`h-2.5 w-2.5 rounded-full border ${
                    active ? "border-danger bg-danger" : "border-ink-faint"
                  }`}
                />
              </div>
              <div className="mt-1 text-xs text-ink-dim">{m.desc}</div>
            </button>
          );
        })}
      </div>

      {/* Category */}
      <label className="label mb-2 block">Category</label>
      <div className="mb-4 flex flex-wrap gap-1.5">
        {CATEGORIES.map((c) => {
          const active = s.category === c.id;
          return (
            <button
              key={c.id}
              disabled={!isHost}
              onClick={() => set({ category: c.id })}
              className={`flex items-center gap-1.5 border px-2.5 py-1.5 text-sm transition ${
                active
                  ? "border-gold bg-gold/10 text-ink"
                  : "border-line text-ink-dim hover:border-ink-faint"
              } ${!isHost && "cursor-default"}`}
            >
              <span>{c.emoji}</span>
              {c.label}
            </button>
          );
        })}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {/* Imposter count */}
        <div className="border border-line bg-panel-2 p-3">
          <div className="label mb-2">Imposters</div>
          <div className="flex items-center gap-3">
            <Stepper
              value={s.imposterCount}
              min={1}
              max={maxImposters}
              disabled={!isHost}
              onChange={(v) => set({ imposterCount: v })}
            />
            <span className="label">max {maxImposters}</span>
          </div>
        </div>

        {/* Reveal category */}
        <button
          disabled={!isHost}
          onClick={() => set({ revealCategory: !s.revealCategory })}
          className={`flex items-center justify-between border p-3 text-left transition ${
            s.revealCategory ? "border-safe/50 bg-safe/5" : "border-line bg-panel-2"
          } ${!isHost && "cursor-default"}`}
        >
          <div>
            <div className="label">Show category</div>
            <div className="mt-1 text-sm text-ink-dim">Reveal to everyone</div>
          </div>
          <Toggle on={s.revealCategory} />
        </button>
      </div>
    </Panel>
  );
}

function Stepper({ value, min, max, onChange, disabled }) {
  const clamp = (v) => Math.min(max, Math.max(min, v));
  return (
    <div className="flex items-center gap-2">
      <button
        disabled={disabled || value <= min}
        onClick={() => onChange(clamp(value - 1))}
        className="grid h-9 w-9 place-items-center border border-line text-lg font-bold text-ink-dim disabled:opacity-30 hover:border-ink-faint"
      >
        −
      </button>
      <span className="w-8 text-center font-display text-3xl">{value}</span>
      <button
        disabled={disabled || value >= max}
        onClick={() => onChange(clamp(value + 1))}
        className="grid h-9 w-9 place-items-center border border-line text-lg font-bold text-ink-dim disabled:opacity-30 hover:border-ink-faint"
      >
        +
      </button>
    </div>
  );
}

function Toggle({ on }) {
  return (
    <div
      className={`relative h-7 w-12 border transition ${
        on ? "border-safe bg-safe/30" : "border-line bg-panel"
      }`}
    >
      <motion.div
        className="absolute top-0.5 h-5 w-5"
        style={{ background: on ? "#38d996" : "#63636d" }}
        animate={{ left: on ? 24 : 3 }}
        transition={{ type: "spring", stiffness: 500, damping: 32 }}
      />
    </div>
  );
}
