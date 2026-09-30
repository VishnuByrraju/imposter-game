import { AnimatePresence, motion } from "framer-motion";

export default function Toasts({ toasts }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-2">
      <AnimatePresence>
        {toasts.map((t) => {
          const tone =
            t.type === "error"
              ? "border-danger/60 text-danger"
              : t.type === "success"
              ? "border-safe/60 text-safe"
              : "border-line text-ink";
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
              className={`pointer-events-auto flex items-center gap-2 border bg-panel px-4 py-2.5 text-sm font-medium shadow-hard-sm ${tone}`}
            >
              <span className="mono text-xs opacity-60">›</span>
              {t.message}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
