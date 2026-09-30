import { useState } from "react";
import { motion } from "framer-motion";
import { useGame } from "../App.jsx";
import { Logo, Panel } from "./ui.jsx";
import InstallButton from "./InstallButton.jsx";

export default function Home() {
  const { name, setName, actions, connected, busy } = useGame();
  const [code, setCode] = useState("");
  const [mode, setMode] = useState("menu"); // menu | join

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 py-8">
      <InstallButton />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-4 text-center"
      >
        <span className="label border border-line px-3 py-1 !text-danger">
          ● Live · Social Deduction
        </span>
        <h1 className="font-display text-6xl uppercase leading-[0.9] sm:text-8xl">
          Impost<span className="text-danger">e</span>r
        </h1>
        <p className="max-w-sm text-sm text-ink-dim">
          One of you is lying. Everyone gets the secret word — except the
          imposter. Give a clue, read the room, and vote them out.
        </p>
      </motion.div>

      <Panel raised tab="Agent ID" className="w-full max-w-md">
        <label className="label mb-2 block">Codename</label>
        <input
          className="input mb-5"
          placeholder="Enter your name"
          value={name}
          maxLength={16}
          onChange={(e) => setName(e.target.value)}
        />

        {mode === "menu" ? (
          <div className="flex flex-col gap-3">
            <button
              className="btn-primary text-lg"
              disabled={!connected || busy}
              onClick={actions.create}
            >
              {busy ? "Opening…" : "Open a new case"}
            </button>
            <button
              className="btn-ghost"
              disabled={!connected || busy}
              onClick={() => setMode("join")}
            >
              Join with a case code
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <label className="label block">Case code</label>
            <input
              className="input mono text-center text-2xl font-bold uppercase tracking-[0.5em]"
              placeholder="•••••"
              value={code}
              maxLength={5}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && actions.join(code)}
            />
            <div className="flex gap-3">
              <button className="btn-ghost flex-1" onClick={() => setMode("menu")}>
                Back
              </button>
              <button
                className="btn-primary flex-1"
                disabled={!connected || busy}
                onClick={() => actions.join(code)}
              >
                {busy ? "Joining…" : "Join"}
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
    {
      n: "01",
      t: "Get your word",
      d: "Everyone sees the same secret word — the imposter doesn't.",
    },
    {
      n: "02",
      t: "Give one clue",
      d: "Describe the word. Too obvious and the imposter copies you.",
    },
    {
      n: "03",
      t: "Vote the liar",
      d: "Whoever fits in the least gets voted out. Were you right?",
    },
  ];
  return (
    <div className="grid w-full max-w-2xl gap-2 sm:grid-cols-3">
      {steps.map((s, i) => (
        <motion.div
          key={s.n}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 + i * 0.08 }}
          className="card p-4"
        >
          <div className="mono mb-2 text-2xl font-bold text-danger">{s.n}</div>
          <div className="font-semibold">{s.t}</div>
          <div className="mt-1 text-sm text-ink-dim">{s.d}</div>
        </motion.div>
      ))}
    </div>
  );
}
