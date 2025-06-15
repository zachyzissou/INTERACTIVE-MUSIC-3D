// src/components/SpawnMenu.tsx
import React from 'react'
import styles from '../styles/spawnMenu.module.css'
import { useObjects } from '../store/useObjects'
import { objectConfigs, objectTypes } from '../config/objectTypes'

// Minimal flush UI menu to spawn new musical spheres
type SpawnMenuProps = {}

const SpawnMenu: React.FC<SpawnMenuProps> = () => {
  const spawn = useObjects((state) => state.spawn)
  return (
    <div className={styles.spawnMenu}>
      {objectTypes.map((t) => (
        <button key={t} className={styles.spawnButton} onClick={() => spawn(t)}>
          {objectConfigs[t].label}
        </button>
      ))}
    </div>
  )
}

export default SpawnMenu
