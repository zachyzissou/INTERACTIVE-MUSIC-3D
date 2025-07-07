'use client'
import React from 'react'
import { motion } from '@motionone/react'
import { useAudioSettings, ScaleType } from '../store/useAudioSettings'
import { setMasterVolume } from '../lib/audio'
import styles from '../styles/audioSettingsPanel.module.css'

const KEYS = ['C','G','D','A','E','B','F#','Db','Ab','Eb','Bb','F']

const AudioSettingsPanel = () => {
  const { key, scale, volume, setScale, setVolume } = useAudioSettings()

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value)
    setVolume(val)
    setMasterVolume(val)
  }

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      transition={{ duration: 0.4 }}
      className={styles.panel}
    >
      <div className={styles.row}>
        <label htmlFor="key-select">Key</label>
        <select
          id="key-select"
          className={styles.select}
          value={key}
          onChange={(e) => setScale(e.target.value, scale)}
          aria-label="Musical key"
          title="Select musical key"
        >
          {KEYS.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
        <label htmlFor="scale-select">Scale</label>
        <select
          id="scale-select"
          className={styles.select}
          value={scale}
          onChange={(e) => setScale(key, e.target.value as ScaleType)}
          aria-label="Musical scale"
          title="Select musical scale"
        >
          <option value="major">Major</option>
          <option value="minor">Minor</option>
        </select>
      </div>
      <div className={styles.row}>
        <label htmlFor="volume-slider">Volume</label>
        <input
          id="volume-slider"
          className={styles.slider}
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={handleVolume}
          aria-label="Audio volume"
          title={`Volume: ${Math.round(volume * 100)}%`}
        />
      </div>
      <div className={styles.row}>
        <label htmlFor="synth-preset">Synth Preset</label>
        <select
          id="synth-preset"
          className={styles.select}
          value="lead"
          onChange={() => {}}
          aria-label="Synthesizer preset"
          title="Select synthesizer preset"
        >
          <option value="lead">Lead</option>
          <option value="pad">Pad</option>
          <option value="bass">Bass</option>
          <option value="pluck">Pluck</option>
        </select>
      </div>
    </motion.div>
  )
}

export default AudioSettingsPanel
