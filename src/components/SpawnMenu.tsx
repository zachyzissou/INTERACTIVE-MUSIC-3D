// src/components/SpawnMenu.tsx
import React from 'react'
import { motion } from 'framer-motion'
import styles from '../styles/spawnMenu.module.css'
import ui from '../styles/ui.module.css'
import { useObjects } from '../store/useObjects'
import { objectConfigs, objectTypes } from '../config/objectTypes'
import { playNote, playChord, playBeat } from '../lib/audio'

const SpawnMenu: React.FC = () => {
  const spawn = useObjects((state) => state.spawn)
  return (
    <motion.div
      className={`${styles.spawnMenu} ${ui.glass}`}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {objectTypes.map((t) => (
        <motion.button
          key={t}
          className={styles.spawnButton}
          onClick={() => {
            const id = spawn(t)
            if (t === 'note') playNote(id)
            else if (t === 'chord') playChord(id)
            else playBeat(id)
          }}
          whileHover={{ scale: 1.1, boxShadow: '0 0 8px var(--accent2)' }}
          whileTap={{ scale: 0.95, boxShadow: '0 0 12px var(--accent2)' }}
        >
          {objectConfigs[t].label}
        </motion.button>
      ))}
    </motion.div>
  )
}

export default SpawnMenu
