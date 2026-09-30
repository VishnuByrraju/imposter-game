import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Shows an "Install app" button when the browser fires beforeinstallprompt.
export default function InstallButton() {
  const [deferred, setDeferred] = useState(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const onPrompt = (e) => {
      e.preventDefault();
      setDeferred(e);
    };
    const onInstalled = () => {
      setHidden(true);
      setDeferred(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferred) return;
    deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  };

  return (
    <AnimatePresence>
      {deferred && !hidden && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          onClick={install}
          className="fixed right-4 top-4 z-40 flex items-center gap-2 border border-line bg-panel px-3 py-2 text-xs font-semibold text-ink-dim transition hover:border-ink-faint hover:text-ink"
        >
          <span className="label !text-[0.6rem]">install app</span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
