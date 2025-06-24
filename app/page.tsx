"use client";
import { Canvas } from "@react-three/fiber";
import { motion } from "@motionone/react";
import { AnimatePresence } from "framer-motion";
import { useShapesStore } from "@/store/useShapesStore";
import { EffectsPanel } from "../src/components/EffectsPanel";

const Home = () => {
  const shapes = useShapesStore((s) => s.shapes);
  const selectShape = useShapesStore((s) => s.selectShape);
  const selectedShape = useShapesStore((s) => s.selectedShape);

  return (
    <>
      <Canvas className="fixed inset-0" shadows>
        <ambientLight intensity={0.5} />
        {shapes.map((shape) => (
          <mesh
            key={shape.id}
            data-cy={`shape-${shape.id}`}
            position={shape.position}
            scale={[shape.scale, shape.scale, shape.scale]}
            onClick={() => selectShape(shape.id)}
          >
            <sphereGeometry args={[1, 32, 32]} />
            <meshStandardMaterial color="hotpink" />
          </mesh>
        ))}
      </Canvas>
      <button
        data-cy="add-button"
        className="add-sound fixed bottom-4 right-4 bg-white/80 text-black rounded-full w-12 h-12 md:w-14 md:h-14 flex items-center justify-center text-2xl"
        onClick={() =>
          useShapesStore.getState().addShape({
            id: Date.now().toString(),
            type: "sphere",
            position: [0, 0, 0],
            scale: 1,
          })
        }
      >
        +
      </button>
      <AnimatePresence>
        {selectedShape && (
          <motion.div
            key="effects"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2"
          >
            <EffectsPanel />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Home;
