import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGame } from "../App.jsx";

const EMOTES = ["👍", "😂", "🤔", "😱", "🔥", "❤️", "🤨", "🎉"];

// A compact floating reaction button that expands into an emote picker.
export default function EmoteBar() {
  const { actions } = useGame();
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 8 }}
            className="grid grid-cols-4 gap-1 border border-line bg-panel p-1.5 shadow-hard-sm"
          >
            {EMOTES.map((e) => (
              <button
                key={e}
                onClick={() => {
                  actions.emote(e);
                  setOpen(false);
                }}
                className="grid h-10 w-10 place-items-center text-2xl transition hover:bg-panel-3 active:scale-90"
              >
                {e}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      <button
        onClick={() => setOpen((o) => !o)}
        className="grid h-12 w-12 place-items-center border border-line bg-panel text-xl shadow-hard-sm transition hover:border-ink-faint active:scale-90"
        aria-label="React"
      >
        {open ? "✕" : "😊"}
      </button>
    </div>
  );
}
