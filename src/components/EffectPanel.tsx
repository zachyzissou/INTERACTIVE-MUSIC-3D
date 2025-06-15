"use client"
import React from 'react'
import { useEffectSettings, defaultEffectParams } from '../store/useEffectSettings'
import styles from '../styles/effectPanel.module.css'

interface EffectPanelProps {
  objectId: string
}

const EffectPanel: React.FC<EffectPanelProps> = ({ objectId }) => {
  const params = useEffectSettings((s) => s.effects[objectId] || defaultEffectParams)
  const setEffect = useEffectSettings((s) => s.setEffect)

  return (
    <div className={styles.panel}>
      <div className={styles.row}>
        <label>Reverb</label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={params.reverb}
          onChange={(e) => setEffect(objectId, { reverb: parseFloat(e.target.value) })}
        />
      </div>
      <div className={styles.row}>
        <label>Delay</label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={params.delay}
          onChange={(e) => setEffect(objectId, { delay: parseFloat(e.target.value) })}
        />
      </div>
      <div className={styles.row}>
        <label>Lowpass</label>
        <input
          type="range"
          min={100}
          max={20000}
          step={100}
          value={params.lowpass}
          onChange={(e) => setEffect(objectId, { lowpass: parseFloat(e.target.value) })}
        />
      </div>
      <div className={styles.row}>
        <label>Highpass</label>
        <input
          type="range"
          min={0}
          max={1000}
          step={10}
          value={params.highpass}
          onChange={(e) => setEffect(objectId, { highpass: parseFloat(e.target.value) })}
        />
      </div>
    </div>
  )
}

export default EffectPanel
