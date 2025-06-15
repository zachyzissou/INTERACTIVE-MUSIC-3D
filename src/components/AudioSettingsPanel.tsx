import React, { useEffect } from 'react'
import { useAudioSettings, ScaleType } from '../store/useAudioSettings'
import styles from '../styles/audioSettingsPanel.module.css'
import { setMasterVolume } from '../lib/audio'

const KEYS = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']

const AudioSettingsPanel: React.FC = () => {
  const { key, scale, volume, setScale, setVolume } = useAudioSettings()

  useEffect(() => {
    setMasterVolume(volume)
  }, [volume])

  return (
    <div className={styles.panel}>
      <div className={styles.row}>
        <label>Key:</label>
        <select value={key} onChange={(e) => setScale(e.target.value, scale)}>
          {KEYS.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
        <select
          value={scale}
          onChange={(e) => setScale(key, e.target.value as ScaleType)}
        >
          <option value="major">Major</option>
          <option value="minor">Minor</option>
        </select>
      </div>
      <div className={styles.row}>
        <label>Volume:</label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
        />
      </div>
    </div>
  )
}

export default AudioSettingsPanel
