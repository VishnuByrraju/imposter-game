import { AnimatePresence, motion } from "framer-motion";

export default function Toasts({ toasts }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-2">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            className={`glass-strong pointer-events-auto rounded-2xl px-5 py-3 text-sm font-medium shadow-xl ${
              t.type === "error"
                ? "text-red-300"
                : t.type === "success"
                ? "text-neon-lime"
                : "text-white"
            }`}
          >
            {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
