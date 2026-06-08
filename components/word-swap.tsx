"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

// Rotates "movie" and "series" in the hero headline every few seconds, now that
// Premise identifies both. Accent-colored so the eye lands on the changing word.
const WORDS = ["movie", "series"];

export function WordSwap() {
  const [i, setI] = useState(0);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      // Somewhere between 2 and 5 seconds, so it feels alive, not metronomic.
      const delay = 2000 + Math.random() * 3000;
      timer = setTimeout(() => {
        setI((p) => (p + 1) % WORDS.length);
        tick();
      }, delay);
    };
    tick();
    return () => clearTimeout(timer);
  }, []);

  return (
    <span className="relative inline-block align-baseline" style={{ minWidth: "3.2ch" }}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={WORDS[i]}
          className="inline-block text-accent"
          initial={{ opacity: 0, y: "0.35em" }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: "-0.35em" }}
          transition={{ type: "spring", stiffness: 320, damping: 26 }}
        >
          {WORDS[i]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
