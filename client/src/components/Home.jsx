import { useState } from "react";
import { motion } from "framer-motion";
import { useGame } from "../App.jsx";
import { Logo, Panel } from "./ui.jsx";

export default function Home() {
  const { name, setName, actions, connected } = useGame();
  const [code, setCode] = useState("");
  const [mode, setMode] = useState("menu"); // menu | join

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-10 py-10">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 18 }}
      >
        <Logo />
      </motion.div>

      <Panel strong className="w-full max-w-md">
        <label className="mb-2 block text-xs font-semibold tracking-widest text-white/40">
          YOUR NAME
        </label>
        <input
          className="input mb-5"
          placeholder="e.g. Sherlock"
          value={name}
          maxLength={16}
          onChange={(e) => setName(e.target.value)}
        />

        {mode === "menu" ? (
          <div className="flex flex-col gap-3">
            <button
              className="btn-primary text-lg"
              disabled={!connected}
              onClick={actions.create}
            >
              ✦ Create a room
            </button>
            <button
              className="btn-ghost text-lg"
              disabled={!connected}
              onClick={() => setMode("join")}
            >
              Join with code
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <input
              className="input text-center text-2xl font-bold uppercase tracking-[0.5em]"
              placeholder="CODE"
              value={code}
              maxLength={5}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && actions.join(code)}
            />
            <div className="flex gap-3">
              <button
                className="btn-ghost flex-1"
                onClick={() => setMode("menu")}
              >
                ← Back
              </button>
              <button
                className="btn-primary flex-1"
                disabled={!connected}
                onClick={() => actions.join(code)}
              >
                Join
              </button>
            </div>
          </div>
        )}
      </Panel>

      <HowToPlay />
    </div>
  );
}

function HowToPlay() {
  const steps = [
    { icon: "🎴", t: "Everyone gets a secret word", d: "…except the imposter, who gets a similar one." },
    { icon: "💬", t: "Give a one-word clue", d: "Describe your word without being too obvious." },
    { icon: "🗳️", t: "Vote out the imposter", d: "Spot who doesn't quite fit in." },
  ];
  return (
    <div className="grid w-full max-w-3xl gap-3 sm:grid-cols-3">
      {steps.map((s, i) => (
        <motion.div
          key={s.t}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 + i * 0.1 }}
          className="glass rounded-2xl p-4"
        >
          <div className="mb-2 text-2xl">{s.icon}</div>
          <div className="font-semibold">{s.t}</div>
          <div className="mt-1 text-sm text-white/50">{s.d}</div>
        </motion.div>
      ))}
    </div>
  );
}
