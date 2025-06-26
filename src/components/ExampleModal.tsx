"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import scenes from "@/config/exampleScenes.json";
import { useObjects } from "@/store/useObjects";
import type { ObjectType } from "@/store/useObjects";

const ExampleModal: React.FC = () => {
  const [open, setOpen] = useState(true);
  const spawn = useObjects((s) => s.spawn);

  const load = (scene: (typeof scenes)[0]) => {
    scene.objects.forEach(obj =>
      spawn(obj.type as ObjectType, obj.position as [number, number, number])
    );
    setOpen(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div className="bg-white p-4 rounded" initial={{ scale: 0.8 }} animate={{ scale: 1 }}>
            <h2 className="mb-2 font-bold">Load Example Scene</h2>
            {scenes.map(scene => (
              <button key={scene.name} className="block w-full text-left mb-1 p-1 bg-gray-200" onClick={() => load(scene)}>
                {scene.name}
              </button>
            ))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ExampleModal;
