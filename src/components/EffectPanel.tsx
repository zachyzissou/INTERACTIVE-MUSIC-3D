"use client";
import React from "react";
import { motion } from "framer-motion";
import {
  useEffectSettings,
  defaultEffectParams,
} from "../store/useEffectSettings";
import styles from "../styles/effectPanel.module.css";
import ui from "../styles/ui.module.css";

interface EffectPanelProps {
  objectId: string;
}

const container = {
  initial: {},
  animate: { transition: { staggerChildren: 0.1 } },
};
const item = {
  initial: { y: 20, opacity: 0 },
  animate: { y: 0, opacity: 1 },
};

const EffectPanel: React.FC<EffectPanelProps> = ({ objectId }) => {
  const params = useEffectSettings(
    (s) => s.effects[objectId] || defaultEffectParams,
  );
  const setEffect = useEffectSettings((s) => s.setEffect);

  return (
    <motion.div
      className={`${styles.panel} ${ui.glass}`}
      variants={container}
      initial="initial"
      animate="animate"
    >
      <motion.div className={styles.row} variants={item}>
        <label>Reverb</label>
        <motion.input
          className={styles.slider}
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={params.reverb}
          style={{
            background: `linear-gradient(to right, var(--accent2) ${
              params.reverb * 100
            }%, rgba(255,255,255,0.2) ${params.reverb * 100}%)`,
          }}
          onChange={(e) =>
            setEffect(objectId, { reverb: parseFloat(e.target.value) })
          }
          whileTap={{ scale: 1.2 }}
        />
      </motion.div>
      <motion.div className={styles.row} variants={item}>
        <label>Delay</label>
        <motion.input
          className={styles.slider}
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={params.delay}
          style={{
            background: `linear-gradient(to right, var(--accent2) ${
              params.delay * 100
            }%, rgba(255,255,255,0.2) ${params.delay * 100}%)`,
          }}
          onChange={(e) =>
            setEffect(objectId, { delay: parseFloat(e.target.value) })
          }
          whileTap={{ scale: 1.2 }}
        />
      </motion.div>
      <motion.div className={styles.row} variants={item}>
        <label>Lowpass</label>
        <motion.input
          className={styles.slider}
          type="range"
          min={100}
          max={20000}
          step={100}
          value={params.lowpass}
          style={{
            background: `linear-gradient(to right, var(--accent2) ${
              (params.lowpass / 20000) * 100
            }%, rgba(255,255,255,0.2) ${(params.lowpass / 20000) * 100}%)`,
          }}
          onChange={(e) =>
            setEffect(objectId, { lowpass: parseFloat(e.target.value) })
          }
          whileTap={{ scale: 1.2 }}
        />
      </motion.div>
      <motion.div className={styles.row} variants={item}>
        <label>Highpass</label>
        <motion.input
          className={styles.slider}
          type="range"
          min={0}
          max={1000}
          step={10}
          value={params.highpass}
          style={{
            background: `linear-gradient(to right, var(--accent2) ${
              (params.highpass / 1000) * 100
            }%, rgba(255,255,255,0.2) ${(params.highpass / 1000) * 100}%)`,
          }}
          onChange={(e) =>
            setEffect(objectId, { highpass: parseFloat(e.target.value) })
          }
          whileTap={{ scale: 1.2 }}
        />
      </motion.div>
    </motion.div>
  );
};

export default EffectPanel;
