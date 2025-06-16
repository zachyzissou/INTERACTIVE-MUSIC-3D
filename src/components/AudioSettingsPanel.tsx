"use client";
import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { useAudioSettings, ScaleType } from "../store/useAudioSettings";
import { setMasterVolume } from "../lib/audio";
import * as Tone from "tone";
import { usePerformance } from "../store/usePerformance";
import styles from "../styles/audioSettingsPanel.module.css";
import ui from "../styles/ui.module.css";

const KEYS = ["C", "G", "D", "A", "E", "B", "F#", "Db", "Ab", "Eb", "Bb", "F"];

const AudioSettingsPanel: React.FC = () => {
  const { key, scale, volume, bpm, setScale, setVolume, setBpm } = useAudioSettings();
  const { instanced, toggleInstanced } = usePerformance();
  const dialRef = useRef<HTMLDivElement>(null);
  const [angle, setAngle] = useState(0);

  useEffect(() => {
    setMasterVolume(volume);
  }, [volume]);

  useEffect(() => {
    Tone.Transport.bpm.value = bpm;
  }, [bpm]);

  const handleDrag = (_: any, info: any) => {
    const rect = dialRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = info.point.x - cx;
    const dy = info.point.y - cy;
    const ang = (Math.atan2(dy, dx) * 180) / Math.PI + 180;
    setAngle(ang);
    const index = Math.round(ang / 30) % 12;
    setScale(KEYS[index], scale);
  };

  const [open, setOpen] = useState(false);
  return (
    <motion.div
      className={`${styles.panel} ${ui.glass}`}
      initial={false}
      animate={{ x: open ? 0 : -180 }}
      transition={{ type: "spring", stiffness: 120, damping: 16 }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <div className={styles.row} style={{ justifyContent: "space-between" }}>
        <motion.div
          ref={dialRef}
          className={styles.dial}
          drag
          dragMomentum={false}
          onDrag={handleDrag}
          style={{ rotate: angle }}
        >
          <span className={ui.neonText}>{key}</span>
        </motion.div>
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
          onChange={(e) => {
            const val = parseFloat(e.target.value)
            setVolume(val)
            setMasterVolume(val)
          }}
          whileTap={{ scale: 1.2 }}
        />
      </div>
      <div className={styles.row}>
        <label>Tempo:</label>
        <motion.input
          className={styles.slider}
          type="range"
          min={60}
          max={180}
          step={1}
          value={bpm}
          onChange={(e) => setBpm(parseFloat(e.target.value))}
          whileTap={{ scale: 1.2 }}
        />
      </div>
      <div className={styles.row}>
        <label>Instancing</label>
        <input type="checkbox" checked={instanced} onChange={toggleInstanced} />
      </div>
    </motion.div>
  );
};

export default AudioSettingsPanel;
