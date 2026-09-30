import { AnimatePresence, motion } from "framer-motion";

// Floating reaction overlay. Emotes drift upward then fade.
export default function EmoteLayer({ emotes = [], players = [] }) {
  const nameFor = (id) => players?.find((p) => p.id === id)?.name;
  return (
    <div className="pointer-events-none fixed inset-0 z-30 overflow-hidden">
      <AnimatePresence>
        {emotes.map((e) => {
          const left = 8 + hash(e.id) * 84; // spread across width
          return (
            <motion.div
              key={e.id}
              initial={{ opacity: 0, y: 40, scale: 0.4 }}
              animate={{ opacity: 1, y: -160, scale: 1.15 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ duration: 2.4, ease: "easeOut" }}
              className="absolute bottom-24 flex flex-col items-center"
              style={{ left: `${left}%` }}
            >
              <span className="text-5xl drop-shadow-lg">{e.emote}</span>
              {nameFor(e.playerId) && (
                <span className="mono mt-1 border border-line bg-panel px-2 py-0.5 text-[10px] text-ink-dim">
                  {nameFor(e.playerId)}
                </span>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

// deterministic pseudo-position from id in [0,1)
function hash(n) {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}
