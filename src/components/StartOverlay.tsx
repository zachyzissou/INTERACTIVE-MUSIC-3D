"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Particles from "@tsparticles/react";

interface StartOverlayProps {
  readonly onFinish: () => void;
}

export default function StartOverlay({ onFinish }: StartOverlayProps) {
  const [exiting, setExiting] = useState(false);

  const handleClick = React.useCallback(() => {
    setExiting(true);
    // Call onFinish immediately when user clicks
    setTimeout(() => {
      onFinish();
    }, 200);
  }, [onFinish]);

  const particlesOptions = {
    background: { color: { value: "transparent" } },
    fullScreen: { enable: false },
    fpsLimit: 60,
    particles: {
      number: { value: 60 },
      color: { value: "#4fa3ff" },
      size: { value: { min: 1, max: 3 } },
      move: { enable: true, speed: 1 },
      opacity: { value: 0.5 },
      links: { enable: true, color: "#4fa3ff", opacity: 0.2, distance: 120 },
    },
  };

  return (
    <AnimatePresence>
      {!exiting && (
        <motion.div
          key="overlay"
          data-testid="start-overlay"
          className="fixed inset-0 z-[60] flex items-center justify-center text-white select-none cursor-pointer"
          style={{
            background:
              "radial-gradient(circle at center, rgba(0,0,0,0.95), #000000 80%)",
          }}
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          onClick={handleClick}
        >
          <Particles
            id="start-particles"
            options={particlesOptions}
            className="absolute inset-0"
          />
          <motion.p
            className="z-10 text-xl md:text-3xl font-semibold"
            initial={{ opacity: 1 }}
            animate={{
              y: [0, -20, 0],
              transition: { repeat: Infinity, duration: 6, ease: "easeInOut" },
            }}
          >
            Let’s begin your sonic voyage…
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
