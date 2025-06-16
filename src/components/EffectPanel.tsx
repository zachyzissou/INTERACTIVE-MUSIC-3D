"use client";
import React from "react";
import { Html } from "@react-three/drei";
import { motion } from "framer-motion";
import {
  useEffectSettings,
  defaultEffectParams,
} from "../store/useEffectSettings";
import styles from "../styles/effectPanel.module.css";
import ui from "../styles/ui.module.css";

interface EffectPanelProps {
  objectId: string
  position?: [number, number, number]
}

const container = {
  initial: { y: 10, opacity: 0 },
  animate: { y: 0, opacity: 1, transition: { staggerChildren: 0.1 } },
  exit: { y: 10, opacity: 0 },
}
const item = {
  initial: { y: 20, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  exit: { y: 20, opacity: 0 },
}

const EffectPanel: React.FC<EffectPanelProps> = ({ objectId, position = [0, 1, 0] }) => {
  const params = useEffectSettings(
    (s) => s.effects[objectId] || defaultEffectParams,
  );
  const setEffect = useEffectSettings((s) => s.setEffect);

  return (
    <Html position={position} transform>
      <motion.div
        className={`${styles.panel} ${ui.glass}`}
        variants={container}
        initial="initial"
        animate="animate"
        exit="exit"
      >
      <motion.div className={styles.row} variants={item}>
        <label>Reverb</label>
        <motion.input
          className={styles.knob}
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={params.reverb}
          onChange={(e) =>
            setEffect(objectId, { reverb: parseFloat(e.target.value) })
          }
          whileTap={{ scale: 1.1 }}
        />
      </motion.div>
      <motion.div className={styles.row} variants={item}>
        <label>Delay</label>
        <motion.input
          className={styles.knob}
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={params.delay}
          onChange={(e) =>
            setEffect(objectId, { delay: parseFloat(e.target.value) })
          }
          whileTap={{ scale: 1.1 }}
        />
      </motion.div>
      <motion.div className={styles.row} variants={item}>
        <label>Lowpass</label>
        <motion.input
          className={styles.knob}
          type="range"
          min={100}
          max={20000}
          step={100}
          value={params.lowpass}
          onChange={(e) =>
            setEffect(objectId, { lowpass: parseFloat(e.target.value) })
          }
          whileTap={{ scale: 1.1 }}
        />
      </motion.div>
      <motion.div className={styles.row} variants={item}>
        <label>Highpass</label>
        <motion.input
          className={styles.knob}
          type="range"
          min={0}
          max={1000}
          step={10}
          value={params.highpass}
          onChange={(e) =>
            setEffect(objectId, { highpass: parseFloat(e.target.value) })
          }
          whileTap={{ scale: 1.1 }}
        />
      </motion.div>
      </motion.div>
    </Html>
  )
};

export default EffectPanel;
