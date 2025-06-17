'use client'
import React, { useEffect } from 'react'
import { OrthographicCamera, Html } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { useAudioSettings } from '../store/useAudioSettings'
import { setMasterVolume } from '../lib/audio'
import ui from '../styles/ui.module.css'
import styles from '../styles/hud.module.css'

const KEYS = ['C','G','D','A','E','B','F#','Db','Ab','Eb','Bb','F']

const HUD: React.FC = () => {
  const { viewport } = useThree()
  const { key, scale, volume, bpm, setScale, setVolume, setBpm } = useAudioSettings()

  useEffect(() => {
    setMasterVolume(volume)
  }, [volume])

  const panelPos: [number, number, number] = [0, viewport.height / 2 - 0.8, 0]

  return (
    <>
      <OrthographicCamera
        left={-viewport.width / 2}
        right={viewport.width / 2}
        top={viewport.height / 2}
        bottom={-viewport.height / 2}
        near={0}
        far={100}
        position={[0, 0, 10]}
      />
      <mesh position={panelPos} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.4, 1.2]} />
        <meshBasicMaterial color="#222" transparent opacity={0.5} />
        <Html position={[0, 0, 0.01]} transform>
          <div className={`${styles.panel} ${ui.glass}`}>
            <div className={styles.row}>
              <label>Key</label>
              <select
                className={styles.select}
                value={key}
                onChange={(e) => setScale(e.target.value, scale)}
              >
                {KEYS.map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>
            <div className={styles.row}>
              <label>Volume</label>
              <input
                className={styles.slider}
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
              />
            </div>
            <div className={styles.row}>
              <label>Tempo</label>
              <input
                className={styles.slider}
                type="range"
                min={60}
                max={180}
                step={1}
                value={bpm}
                onChange={(e) => setBpm(parseInt(e.target.value, 10))}
              />
            </div>
          </div>
        </Html>
      </mesh>
    </>
  )
}

export default HUD
