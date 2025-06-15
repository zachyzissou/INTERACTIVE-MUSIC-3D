"use client";
import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { useAudioSettings, ScaleType } from "../store/useAudioSettings";
import { setMasterVolume } from "../lib/audio";
import styles from "../styles/audioSettingsPanel.module.css";
import ui from "../styles/ui.module.css";

const KEYS = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];

const AudioSettingsPanel: React.FC = () => {
  const { key, scale, volume, setScale, setVolume } = useAudioSettings();

  useEffect(() => {
    setMasterVolume(volume);
  }, [volume]);

  return (
    <motion.div
      className={`${styles.panel} ${ui.glass}`}
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -40, opacity: 0 }}
      transition={{ type: "spring", stiffness: 120, damping: 16 }}
    >
      <div className={styles.row}>
        <label>Key:</label>
        <select
          className={styles.select}
          value={key}
          onChange={(e) => setScale(e.target.value, scale)}
        >
          {KEYS.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
        <select
          className={styles.select}
          value={scale}
          onChange={(e) => setScale(key, e.target.value as ScaleType)}
        >
          <option value="major">Major</option>
          <option value="minor">Minor</option>
        </select>
      </div>
      <div className={styles.row}>
        <label>Volume:</label>
        <motion.input
          className={styles.slider}
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          style={{
            background: `linear-gradient(to right, var(--accent2) ${
              volume * 100
            }%, rgba(255,255,255,0.2) ${volume * 100}%)`,
          }}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          whileTap={{ scale: 1.2 }}
        />
      </div>
    </motion.div>
  );
};

export default AudioSettingsPanel;
