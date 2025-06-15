// src/components/SpawnMenu.tsx
import React from 'react'
import { motion } from 'framer-motion'
import styles from '../styles/spawnMenu.module.css'
import ui from '../styles/ui.module.css'
import { useObjects } from '../store/useObjects'
import { objectConfigs, objectTypes } from '../config/objectTypes'

// Minimal flush UI menu to spawn new musical spheres
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
          onClick={() => spawn(t)}
          whileHover={{ scale: 1.1, boxShadow: '0 0 8px rgba(0,255,255,0.6)' }}
          whileTap={{ scale: 0.95 }}
        >
          {objectConfigs[t].label}
        </motion.button>
      ))}
    </motion.div>
  )
}

export default SpawnMenu
